# Vanderloo · landingspagina

Vibe-coded landingspagina voor het fictieve parfummerk Vanderloo, gebouwd met Claude Code. Zelfde opbouw als de onepager van Digitale Vormgeving: **één index.html**, alle tekst in **content.md**, elk hoofdstuk wordt een eigen sectie.

## Openen
Dubbelklik op `index.html`: de pagina opent rechtstreeks in de browser (geen server nodig). Online op GitHub Pages werkt ze op dezelfde manier.

## Structuur
```
index.html            één pagina: SEO (meta, Open Graph, schema.org), header, lege <main> en <footer>
content.md            ALLE tekst: # titel + intro = hero, elk ## hoofdstuk = een sectie
data/scene.json       instellingen van de 3D-opmaak en scroll-effecten
build.js              zet content.md + scene.json om naar js/content.js
js/content.js         automatisch gemaakt door build.js (niet zelf aanpassen)
js/main.js            leest content.md, bouwt de secties, micro-interacties, formulier
js/animaties.js       anime.js: doorlopende animaties (for-lussen) + play/pause-knop
js/vendor/            anime.js v4.5.0 (lokaal, werkt ook zonder internet)
js/depth.js           3D: kantelen met de muis, lichtglans, zwevende vormen, scroll-diepte
css/style.css         huisstijl, layout, animaties, responsive
assets/img, video     Weave-keyframes en Firefly-clips, gecomprimeerd voor het web
assets/img/social     beelden van de Figma Buzz-posts (uit data-parfum-onderdeel-2.xlsx)
assets/logo           logo's (svg) + favicon
logboek-prompts.md    alle prompts letterlijk
robots.txt, sitemap.xml, .nojekyll
```

## Tekst aanpassen
1. Pas `content.md` aan (of `data/scene.json` voor de 3D-instellingen).
2. Voer in deze map uit: `node build.js` (of `node build.js --watch` terwijl u werkt).
3. Ververs de browser.

Onder elke kop staan korte instellingen (`stijl:`, `label:`, `beeld:`, `knop:` …). `stijl:` bepaalt de opmaak van de sectie: `verhaal`, `geurnoten`, `momenten`, `social`, `inschrijven`, `faq` of `footer`. Een nieuw hoofdstuk zonder stijl wordt een eenvoudige tekstsectie. `beeld: pad | alt-tekst` werkt voor foto's (.webp) en video's (.mp4).

## Secties
1. **Hero** · "Draag uw *thuis.*" met wisselend woord, eindshot-video in 3D-boog met zwevende honingdruppel, lotusblad en ring
2. **Ons verhaal** · thuiskomen, interieurvideo die in 3D binnenkantelt
3. **Geurnoten** (nachtpruim) · klikbare geurpiramide; drie noot-bollen draaien in een 3D-baan rond het beeld + geurnoten-video en zintuigen
4. **Momenten** · thuiskomen, een trage zondag, samen aan tafel
5. **Social media** (in de navigatie) · 16 Figma Buzz-posts uit het databestand (titel, tekst, CTA, beeld), te bekijken als post (1:1), story (9:16) of advertentie (4:5) in een 3D-carrousel met pijltjes
6. **Inschrijven** · naam, achternaam, e-mail, opt-in (zelfde velden als het MailerLite-form)
7. **FAQ** · ook als FAQ-schema voor Google
8. **Footer** · privacy- en AI-transparantie

## Doelgroep en toon
Dertigers tot zestigers die genieten van een authentieke geur en zich thuis goed willen voelen. Aanspreekvorm **u**. Functioneel: grote letters (17–20 px), donkere tekst met hoog contrast, knoppen van minstens 56 px hoog, duidelijke foutmeldingen. Visueel sterk: abstracte 3D-vormen rond de eigen beelden.

## Huisstijl
- 60% lavendelmist `#F7EEF5` · 30% Vanderloo mauve `#A86B94` (+ lilapoeder, orchidee) · 10% pruimbloesem `#80426D` (CTA's)
- Nachtpruim `#28142D` voor tekst, geurnoten en footer; honinggoud `#E1A347` als lichtpuntje (signature-woord, honingbol)
- DM Serif Display (titels, italic-accent) · DM Sans (tekst) · Pinyon Script (één woord: *signature*, *welkom*)
- Boogvormen = een deuropening: thuiskomen

## 3D, micro-animaties en scroll
Beelden kantelen in 3D mee met de muis met een lichtglans; zwevende vormen liggen op eigen diepte; beelden komen achterover gekanteld binnen en draaien recht tijdens het scrollen; de hero-boog kantelt weg als u naar beneden scrolt. Verder: scroll-reveal, woordwissel, magnetische knoppen, lint met zintuiglijke woorden, video's die pas laden in beeld, sticky knop op mobiel. Alles valt stil bij *prefers-reduced-motion*, en kantelen werkt enkel met een muis.

## Animaties pauzeren (anime.js)
De doorlopende animaties (zwevende honingbol, lotusblad en ring, het woordenlint, de woordwissel in de titel) zijn gemaakt met anime.js v4 in `js/animaties.js`. Ze worden met for-lussen opgebouwd en in één lijst bewaard, zodat `play()` en `pause()` alles tegelijk aansturen. Bezoekers gebruiken daarvoor de knop *Animaties pauzeren / afspelen* linksonder; de video's pauzeren mee en de keuze wordt onthouden. Bij *prefers-reduced-motion* start alles gepauzeerd. Ook in de console: `VanderlooAnimaties.pause()` en `VanderlooAnimaties.play()`.

## MailerLite koppelen
Gekoppeld aan het formulier uit de preview https://preview.mailerlite.io/forms/2749192/203715682493269918/share (account 2749192, formulier 203715682493269918).

De action-URL staat bovenaan `js/main.js` bij `MAILERLITE_ACTION`: `https://assets.mailerlite.com/jsonp/2749192/forms/203715682493269918/subscribe` (afgeleid uit de link; controleer met de embed-code via Forms > formulier > Embed > HTML). Leeg = demomodus (validatie + bedankje, er wordt niets verstuurd). Velden: `fields[name]`, `fields[last_name]`, `fields[email]`, `gdpr[]`.

## Publiceren op GitHub Pages
1. Upload de inhoud van deze map naar een repository.
2. Settings > Pages > Branch `main` / root > Save.
3. Vervang de voorlopige URL `https://inesgoethals55-cloud.github.io/vanderloo/` in `index.html`, `robots.txt` en `sitemap.xml`, en maak `og:image` een volledige URL.

## SEO
Titel en meta description, canonical, Open Graph, `lang="nl-BE"`, één H1, logische koppen, alt-teksten, schema.org (Organization, Product, FAQPage), robots.txt, sitemap.xml, lazy loading, webp-beelden en gecomprimeerde video's (±3 MB samen).
