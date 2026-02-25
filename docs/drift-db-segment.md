# Drift: Database I Sikret Segment

## Mål
Databasen skal ligge i eget segment og kun være tilgjengelig for applikasjonsserveren.

## Faktisk oppsett som er laget

### Segmenter og VM-er
- `DNS-segment`: `dns@10.12.13.10` (BIND9)
- `App-segment`: `quotesfe@10.12.13.30` (Node.js/Express)
- `DB-segment`: `quotesmongo@10.12.13.40` (MongoDB)

### DNS som er konfigurert
- Egen sone for intern app-trafikk (`eksamen.local`) satt opp i BIND9.
- Oppslag som fungerer:
  - `app.eksamen.local -> 10.12.13.30`
  - `db.eksamen.local -> 10.12.13.40`
- Alias-domene for app er satt:
  - `terminator.ikt-fag.no -> 10.12.13.30`

Eksempler som er verifisert:
- `dig @10.12.13.10 app.eksamen.local +short` returnerer `10.12.13.30`
- `dig @10.12.13.10 db.eksamen.local +short` returnerer `10.12.13.40`

### App mot database
- Appen bruker `MONGO_URI` fra `.env`.
- I app-VM er DB-tilkoblingen satt til:
  - `MONGO_URI=mongodb://10.12.13.40:27017/eksamenDB`
- Dette ble valgt fordi navneoppslag til `db.eksamen.local` ga `EAI_AGAIN` under test.
- Oppstart viser:
  - `Server kjører på http://localhost:3000`
  - `MongoDB connected`

### Brannmur og porter
- DNS-port er tillatt pa DNS-VM:
  - `53/tcp`, `53/udp`
- App-port er tillatt pa app-VM:
  - `3000/tcp`
- MongoDB lytter pa DB-VM:
  - `0.0.0.0:27017` (bekreftet med `ss -tulpen | grep 27017`)

## Driftstiltak som er gjort for stabil levering

### Problem som ble løst
- Kjøring med `npm run dev` i SSH-terminal stoppet når sesjonen døde (`Broken pipe`), som ga `ERR_CONNECTION_REFUSED` i nettleser.

### Løsning
- `pm2` installert pa app-VM.
- App startet som prosess:
  - `pm2 start app.js --name eksamen-app`
- Prosessliste lagret:
  - `pm2 save`
- Autostart ved reboot aktivert med systemd:
  - `pm2 startup ...`
- Reboot testet (`sudo reboot`) og appen kom opp igjen automatisk.

Verifisert etter reboot:
- `pm2 status` viser `eksamen-app online`
- `curl -I http://localhost:3000/` gir `HTTP/1.1 200 OK`
- `curl -I http://terminator.ikt-fag.no:3000/` gir `HTTP/1.1 200 OK`

## Sikkerhetsvurdering opp mot oppgaven
- Databasen kjører i separat DB-VM/segment (`10.12.13.40`), ikke pa app-VM.
- Appen i eget segment (`10.12.13.30`) er eneste planlagte klient mot DB.
- DNS er skilt ut i egen VM (`10.12.13.10`) og brukes til intern navneoppslag.
- Løsningen demonstrerer segmentering og kontrollert flyt mellom tjenestene.

## Kjent forbedringspunkt (kan nevnes muntlig)
- MongoDB varslet at access control ikke var aktivert i en tidligere test.
- Neste sikkerhetssteg er a slå pa autentisering i MongoDB (`authorization: enabled`) og bruke dedikert DB-bruker med minst mulig rettigheter.
