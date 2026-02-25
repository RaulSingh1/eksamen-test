# Database I Sikret Segment

## Mål
Databasen skal ikke være direkte eksponert mot internett. Kun applikasjonsserveren skal kunne nå databasen.

## Segmentering
- `DMZ/App-segment`: Web-applikasjon (Node.js/Express)
- `DB-segment`: MongoDB (privat subnett/VLAN)

## Nettverksregler (eksempel)
- Tillat `App-segment -> DB-segment` kun på `TCP 27017`
- Blokker all annen innkommende trafikk til DB-segment
- Blokker `Internet -> DB-segment` fullstendig
- Begrens SSH/RDP administrasjon til et eget admin-nett

## Autentisering og kryptering
- Aktiver databasebruker med passord og minst nødvendige rettigheter
- Bruk TLS mellom app og database der miljøet støtter det
- Lagre `MONGO_URI` i miljøvariabler, ikke i kildekode

## Drift og logging
- Overvåk innlogginger og feilede innlogginger mot databasen
- Ta jevnlige backups og test restore-rutine
- Hold MongoDB og OS oppdatert med sikkerhetspatcher
