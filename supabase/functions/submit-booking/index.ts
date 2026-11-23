import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metodo non consentito." }, 405);

  try {
    const body = await req.json();
    const contactName = String(body.contact_name ?? "").trim();
    const contact = String(body.contact ?? "").trim();
    const groupSize = Number(body.group_size);
    const participants = body.participants;
    const consent = body.privacy_consent === true;

    if (!contactName || !contact || !consent) {
      return json({ error: "Compila il referente e conferma l'informativa privacy." }, 400);
    }
    if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 40 ||
        !Array.isArray(participants) || participants.length !== groupSize) {
      return json({ error: "Numero di partecipanti non valido." }, 400);
    }

    const cleaned = participants.map((p: Record<string, unknown>) => {
      const fullName = String(p.full_name ?? "").trim();
      const instagram = String(p.instagram ?? "").trim();
      const age = Number(p.age);
      if (!fullName || !Number.isInteger(age) || age < 1 || age > 110) {
        throw new Error("Ogni partecipante deve avere nome ed età validi.");
      }
      const safeList = (value: unknown) =>
        Array.isArray(value) ? value.map((v) => String(v).slice(0, 80)).slice(0, 20) : [];
      return {
        full_name: fullName.slice(0, 120),
        instagram: instagram.slice(0, 80),
        age,
        soft_drinks: safeList(p.soft_drinks),
        other_soft_drinks: safeList(p.other_soft_drinks),
      };
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Configurazione server incompleta." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("booking_requests")
      .insert({
        contact_name: contactName.slice(0, 120),
        contact: contact.slice(0, 160),
        group_size: groupSize,
        participants: cleaned,
        privacy_consent: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Database insert failed:", error.message);
      return json({ error: "Non è stato possibile registrare la richiesta." }, 500);
    }

    // Notifica Discord privata. Il webhook resta nei Secrets Supabase, mai nel browser/GitHub.
    const discordWebhook = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (discordWebhook) {
      try {
        const discordResponse = await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "New Year's Eve • Prenotazioni",
            allowed_mentions: { parse: [] },
            embeds: [{
              title: "🎉 Nuova richiesta ricevuta",
              color: 0xC18B3B,
              fields: [
                { name: "Codice richiesta", value: String(data.id), inline: false },
                { name: "Referente", value: contactName.slice(0, 120), inline: true },
                { name: "Contatto", value: contact.slice(0, 160), inline: true },
                { name: "Partecipanti", value: String(groupSize), inline: true },
              ],
              description: "La richiesta completa è disponibile nella tabella privata `booking_requests` su Supabase.",
              footer: { text: "New Year's Eve 2027 • Notifica automatica" },
              timestamp: new Date().toISOString(),
            }],
          }),
        });
        if (!discordResponse.ok) {
          console.error("Discord notification failed:", discordResponse.status, await discordResponse.text());
        }
      } catch (notificationError) {
        console.error("Discord notification failed:", notificationError);
      }
    }

    return json({ ok: true, booking_id: data.id }, 201);
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "Richiesta non valida.",
    }, 400);
  }
});
