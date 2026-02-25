# Eksamensprosjekt 2026 - WCAG Vurderingssystem

## Om prosjektet
Dette er en webapplikasjon der brukere kan registrere seg, logge inn, legge inn vurderinger av nettsider, kommentere, stemme (tommel opp/ned), rapportere innhold og se vurderinger fra andre brukere.  
Løsningen er laget med Node.js, Express, EJS og MongoDB.

## Hovedfunksjoner
- Autentisering (registrer / logg inn / logg ut)
- Roller (`user` og `admin`)
- Autorisering av beskyttede ruter
- Opprette, vise og slette vurderinger
- Kommentarer og svar på kommentarer
- Like/dislike på vurderinger og kommentarer (toggle, maks 1 per retning)
- Rapporteringssystem med kommentar
- Admin-panel for rapporter
- Admin kan markere rapport som håndtert og slette rapportert post
- FAQ-side

## Teknologistack
- Node.js + Express
- EJS (server-side rendering)
- MongoDB + Mongoose
- express-session
- PM2 (drift/produksjonskjøring)

## Nettverk og segmentering (drift)
Løsningen er satt opp med segmentering mellom tjenester:

- DNS-VM: `10.12.13.10` (BIND9)
- App-VM: `10.12.13.30` (Node/Express)
- DB-VM: `10.12.13.40` (MongoDB)

### DNS-oppslag
- `app.eksamen.local -> 10.12.13.30`
- `db.eksamen.local -> 10.12.13.40`
- `terminator.ikt-fag.no -> 10.12.13.30`

### Brukte porter
- DNS: `53/tcp`, `53/udp`
- App: `3000/tcp`
- MongoDB: `27017/tcp`

## Kjøring lokalt
1. Installer dependencies:
```bash
npm install
