# New Year's Eve — sito inviti

## Cosa contiene
- `index.html`: sito statico pronto per GitHub Pages.
- `supabase/schema.sql`: tabella privata per le richieste.
- `supabase/functions/submit-booking/index.ts`: endpoint server-side che valida e salva le richieste.
- `supabase/config.toml`: configurazione della Edge Function.

## 1. Crea il database Supabase
1. Crea un progetto su Supabase.
2. Apri **SQL Editor** e incolla il contenuto di `supabase/schema.sql`.
3. In **Project Settings → API** copia l'URL del progetto.
4. In **Edge Functions → Secrets** imposta `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
   - La `service_role` key deve restare SOLO nei secrets Supabase: non inserirla mai in `index.html` o GitHub.

## 2. Pubblica la Edge Function
Con Supabase CLI installata e autenticata:
```bash
supabase login
supabase link --project-ref TUO_PROJECT_REF
supabase functions deploy submit-booking --no-verify-jwt
```
La funzione usa i secrets configurati nel progetto.

## 3. Collega il sito alla funzione
Apri `index.html` e cerca:
```js
const SUBMIT_ENDPOINT = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-booking';
```
Sostituisci `YOUR_PROJECT_REF` con il project ref reale. Poi salva.

## 4. Pubblica con GitHub Pages
1. Crea un repository GitHub, ad esempio `new-years-eve-invito`.
2. Carica `index.html` nella cartella principale del repository.
3. Vai su **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**.
5. Seleziona `main` e `/ (root)`, poi salva.
6. Attendi il link pubblico generato da GitHub Pages.

Puoi anche caricare l'intera cartella del progetto nel repository; non pubblicare mai file con chiavi segrete.

## 5. Controlla le richieste
Le richieste vengono salvate nella tabella `booking_requests` di Supabase.
La tabella non ha policy di lettura pubblica: i visitatori non possono vedere le richieste degli altri. Gli organizzatori le consultano dalla dashboard Supabase, dopo aver effettuato l'accesso al progetto.

## Notifiche Discord (facoltative)
1. Nel progetto Supabase apri **Edge Functions → Secrets**.
2. Aggiungi un secret chiamato `DISCORD_WEBHOOK_URL`.
3. Come valore incolla l'URL del webhook del canale Discord privato `#prenotazioni`.
4. Salva il secret e ridistribuisci la Edge Function se necessario.

Il webhook non deve mai essere inserito in `index.html`, nel repository GitHub o condiviso in chat. La notifica Discord contiene solo codice richiesta, referente, contatto e numero di partecipanti. I dettagli completi restano nella tabella privata `booking_requests` su Supabase. Se il secret non è configurato, le richieste vengono comunque salvate ma non arriva la notifica Discord.

## Prima di pubblicare
- Sostituisci l'URL placeholder della funzione.
- Invia una richiesta di prova e verifica che compaia in `booking_requests`.
- Condividi il link solo dopo aver verificato l'invio.
- Raccogli solo i dati necessari, informa tutti i partecipanti e definisci per quanto tempo conserverai le richieste.
