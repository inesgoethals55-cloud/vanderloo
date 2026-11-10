/* ==========================================================
   Vanderloo · animaties met anime.js (v4)
   Alle doorlopende animaties worden hier met for-lussen opgebouwd en
   in één lijst bewaard. Zo kan de bezoeker alles in één keer pauzeren
   (pause()) en weer afspelen (play()) met de knop rechtsonder.

   1. zwevende vormen   honingbol, lotusblad, ring (elk een eigen tempo)
   2. lint              de zintuiglijke woorden schuiven traag voorbij
   3. woordwissel       "Draag uw thuis. / rust. / warmte."
   4. video's           pauzeren mee met de animaties
   Bij prefers-reduced-motion start alles gepauzeerd; de bezoeker kan
   het zelf aanzetten. De keuze wordt onthouden.
   ========================================================== */

window.VanderlooAnimaties = (() => {
  const root = document.documentElement;
  const animaties = [];          // alles wat play() en pause() kent
  let speelt = true;
  let knop;

  const SLEUTEL = 'vanderloo-animaties';
  const bewaar = (waarde) => { try { localStorage.setItem(SLEUTEL, waarde); } catch (e) { /* privévenster */ } };
  const lees = () => { try { return localStorage.getItem(SLEUTEL); } catch (e) { return null; } };

  /* ---------- 1. zwevende vormen ---------- */
  function vormen(anime) {
    const shapes = document.querySelectorAll('.shape:not(.shape-ring)');
    for (let i = 0; i < shapes.length; i++) {
      const vorm = shapes[i];
      const traag = vorm.classList.contains('shape-petal');
      animaties.push(anime.animate(vorm, {
        marginTop: [0, traag ? -18 : -14],  // zachtjes op en neer
        duration: traag ? 4500 : 3500,
        delay: i * 400,                      // elke vorm zweeft net iets later
        ease: 'inOutSine',
        alternate: true,
        loop: true,
        autoplay: false,
      }));
    }
    const ringen = document.querySelectorAll('.shape-ring');
    for (let i = 0; i < ringen.length; i++) {
      animaties.push(anime.animate(ringen[i], {
        opacity: [0.9, 0.45],                // de ring ademt
        duration: 5000,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
        autoplay: false,
      }));
    }
  }

  /* ---------- 2. lint met woorden ---------- */
  function lint(anime) {
    const tracks = document.querySelectorAll('.ribbon-track');
    for (let i = 0; i < tracks.length; i++) {
      const anim = anime.animate(tracks[i], {
        x: ['0%', '-50%'],                   // de woorden staan er twee keer in: naadloze lus
        duration: 38000,
        ease: 'linear',
        loop: true,
        autoplay: false,
      });
      animaties.push(anim);
      // met de muis erop staat het lint even stil, zodat u het rustig kunt lezen
      const lintEl = tracks[i].parentElement;
      lintEl.addEventListener('mouseenter', () => anim.pause());
      lintEl.addEventListener('mouseleave', () => { if (speelt) anim.play(); });
    }
  }

  /* ---------- 3. woordwissel in de titel ---------- */
  function woordwissel(anime) {
    const el = document.querySelector('[data-swap]');
    const woorden = (document.querySelector('.hero')?.dataset.words || '').split('|').filter(Boolean);
    if (!el || woorden.length < 2) return;
    const woord = el.querySelector('i');
    let i = 0;
    const timer = anime.createTimer({
      duration: 3800,
      loop: true,
      autoplay: false,
      onLoop: () => {
        // eerst uitfaden, dan het volgende woord laten opkomen
        anime.createTimeline()
          .add(woord, { opacity: [1, 0], y: ['0em', '0.25em'], filter: ['blur(0px)', 'blur(6px)'], duration: 450, ease: 'inQuad',
            onComplete: () => { i = (i + 1) % woorden.length; woord.textContent = woorden[i]; } })
          .add(woord, { opacity: [0, 1], y: ['-0.2em', '0em'], filter: ['blur(6px)', 'blur(0px)'], duration: 550, ease: 'outQuad' });
      },
    });
    animaties.push(timer);
  }

  /* ---------- 4. video's ---------- */
  function videos(actie) {
    const lijst = document.querySelectorAll('video');
    for (let i = 0; i < lijst.length; i++) {
      const v = lijst[i];
      if (actie === 'pause') v.pause();
      else if (v.dataset.loaded && v.dataset.inView === '1') v.play().catch(() => {});
    }
  }

  /* ---------- play() en pause() ---------- */
  function play() {
    speelt = true;
    root.classList.remove('anim-paused');
    for (let i = 0; i < animaties.length; i++) animaties[i].play();
    videos('play');
    tekenKnop();
  }

  function pause() {
    speelt = false;
    root.classList.add('anim-paused');
    for (let i = 0; i < animaties.length; i++) animaties[i].pause();
    videos('pause');
    tekenKnop();
  }

  function tekenKnop() {
    if (!knop) return;
    knop.setAttribute('aria-pressed', String(!speelt));
    knop.querySelector('.anim-toggle-text').textContent = speelt ? 'Animaties pauzeren' : 'Animaties afspelen';
    knop.querySelector('.anim-toggle-icon').innerHTML = speelt
      ? '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5l12 7-12 7z"/></svg>';
  }

  function maakKnop() {
    knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'anim-toggle';
    knop.innerHTML = '<span class="anim-toggle-icon" aria-hidden="true"></span><span class="anim-toggle-text"></span>';
    knop.addEventListener('click', () => {
      if (speelt) pause(); else play();
      bewaar(speelt ? 'aan' : 'uit');
    });
    document.body.appendChild(knop);
  }

  function init() {
    const anime = window.anime;
    maakKnop();
    if (anime) {
      root.classList.add('has-anime');   // de CSS-versies van deze animaties gaan uit
      vormen(anime);
      lint(anime);
      woordwissel(anime);
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const keuze = lees();
    if (keuze === 'uit' || (reduce && keuze !== 'aan')) pause(); else play();
  }

  return { init, play, pause, get speelt() { return speelt; } };
})();
