# Muntlige Sensorsporsmal Og Korte Svar

## 1) Hva er forskjellen pa autentisering og autorisering?
- Autentisering bekrefter hvem brukeren er (innlogging med e-post og passord).
- Autorisering bestemmer hva brukeren far lov til (f.eks. admin-ruter krever admin-rolle).

## 2) Hvordan er admin-rollen implementert?
- Brukermodellen har feltet `role` med verdier `user` eller `admin`.
- Ved innlogging sjekkes `ADMIN_EMAIL` og rollen settes/oppdateres til `admin` for den e-posten.

## 3) Hvordan beskytter dere admin-ruter?
- `requireAdmin` middleware stopper tilgang for ikke-innloggede og ikke-admin brukere.
- Hele `/admin`-routeren ligger bak denne middleware.

## 4) Hvordan fungerer rapportering?
- Innlogget bruker sender rapport med kommentar pa en vurdering.
- Rapport lagres med kobling til vurdering, rapportor og status (`open/handled`).
- En bruker kan ha maks en rapport per vurdering (unik indeks).

## 5) Hvordan jobber admin med rapporter?
- Admin far liste over rapporter i eget panel.
- Admin kan markere rapport som handtert.
- Admin kan slette hele posten som er rapportert.

## 6) Hvordan er datarelasjoner laget?
- `Website` er hovedpost.
- `Comment` peker til `Website` og `User`.
- `Report` peker til `Website` og `User`.

## 7) Hvordan hindrer dere flere like/dislike fra samme bruker?
- Vi lagrer `likedBy` og `dislikedBy` med bruker-ID.
- Samme stemme igjen angrer stemmen.
- Motsatt stemme bytter retning.

## 8) Hvordan er nettverkssikkerhet tenkt?
- Database skal ligge i eget DB-segment.
- Kun app-segment kan na databasen pa nødvendig port.
- DB skal ikke være eksponert direkte mot internett.

## 9) Hvilke svakheter kjenner dere til?
- Ingen CSRF-beskyttelse enda.
- Session-secret bor alltid settes i miljøvariabel.
- Brannmurregler er dokumentert, men ma også settes i faktisk infrastruktur.

## 10) Hva ville dere gjort videre?
- Legge til CSRF-beskyttelse og rate limiting.
- Legge til validering/sanitering pa alle tekstfelt.
- Utvide admin med filtrering/sok i rapporter og revisjonslogg.
