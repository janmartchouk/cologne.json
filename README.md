# cologne.json
<sup>(english documentation further down)</sup>
## Implementierte services
+ ### [KVB Status](#kvb-status-1)
<br>

## Vorbereiten
+ #### Dependencies (vorher installieren):
  + NodeJS & npm
  + curl

+ #### Repo clonen
  + `git clone https://github.com/realnajan/cologne.json.git`
  + `cd cologne.json`
+ #### NodeJS Deps installieren
  + `npm install`


## Benutzen

### KVB Status
<b>Stellt KVB Statusmeldungen als JSON API bereit</b>
#### Erklärung
Generiert zwei JSON Dateien:
+ <b>perlinie.json</b>: key ist die Linie, value ist die Statusmeldung, bspw.:<br>
```json
{
  "7" : "Unfall an der (H) Heumarkt, folgende Fahrt entfällt: ...",
  "9": "Unfallaufnahme an der (H) Mauritiuskirche beendet, ..."
}
 ```
+ <b>indexed.json</b>: Array mit allen Statusmeldungen, bspw.:<br>
```json
[
  {
    "Linie": "1",
    "stoerung": "Unfall an der (H) Heumarkt, folgende Fahrt entfällt: ..."
   },
  {
    "Linie": "18",
    "stoerung": "Unfallaufnahme an der (H) Friesenplatz beendet, ..."
   }
]
 ```
#### Benutzung
  + `cd kvb-status`<br>
  
  Im normalen Modus starten - Webserver hostet Dateien (localhost:8080):<br>
  + `node app.js`<br>
  
  Ohne Webserver starten (nur HTML downloaden und in JSON konvertieren):<br>
  + `node app.js --no-webserver`<br>
  
  Nur HTML downloaden:<br>
  + `chmod +x ./download.sh`
  + `./download.sh`
