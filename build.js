/* Zet content.md (alle tekst) en data/scene.json (3D-instellingen) om naar js/content.js,
   zodat index.html ook werkt als je het rechtstreeks opent (file://), waar fetch()
   geblokkeerd is, én online op GitHub Pages.

   Gebruik (vanuit de map 08_landingspagina):
     node build.js          één keer omzetten
     node build.js --watch  automatisch opnieuw bij elke wijziging */

const fs = require('fs');
const path = require('path');

const md = path.join(__dirname, 'content.md');
const scene = path.join(__dirname, 'data', 'scene.json');
const out = path.join(__dirname, 'js', 'content.js');

function build() {
  const text = fs.readFileSync(md, 'utf8');
  const config = JSON.parse(fs.readFileSync(scene, 'utf8')); // controleert meteen of de JSON geldig is
  const js = '/* Automatisch gemaakt uit content.md en data/scene.json door build.js — niet zelf aanpassen. */\n'
    + `window.CONTENT_MD = ${JSON.stringify(text)};\n`
    + `window.SCENE = ${JSON.stringify(config, null, 2)};\n`;
  fs.writeFileSync(out, js);
  console.log(`content.js bijgewerkt (${new Date().toLocaleTimeString()})`);
}

build();

if (process.argv.includes('--watch')) {
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { try { build(); } catch (e) { console.error('Fout:', e.message); } }, 100);
  };
  fs.watch(md, rebuild);
  fs.watch(scene, rebuild);
  console.log('Wacht op wijzigingen in content.md en data/scene.json… (Ctrl+C om te stoppen)');
}
