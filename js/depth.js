/* ==========================================================
   Vanderloo · 3D-opmaak en scroll-effecten
   Instellingen komen uit data/scene.json (via js/content.js).

   [data-tilt]      beeld kantelt in 3D mee met de muis, met lichtglans
   [data-depth]     zwevende vorm die op eigen diepte meebeweegt (muis + scroll)
   [data-scroll3d]  beeld komt achterover gekanteld binnen en draait recht bij het scrollen
   [data-coverflow] carrousel met social posts die in 3D wegdraaien aan de zijkanten
   ========================================================== */

window.VanderlooDepth = {
  init(scene = {}) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const tilt = { maxGraden: 9, glans: 0.35, ...(scene.kantelen || {}) };
    const depth = { muis: 22, scroll: 0.18, ...(scene.diepte || {}) };
    const scroll = { startGraden: 14, startSchaal: 0.92, ...(scene.scroll || {}) };
    const root = document.documentElement;
    root.style.setProperty('--glans', tilt.glans);
    root.style.setProperty('--start-rot', `${scroll.startGraden}deg`);
    root.style.setProperty('--start-scale', scroll.startSchaal);
    if (reduce) return;

    /* 1. kantelen met de muis */
    if (fine) {
      document.querySelectorAll('[data-tilt]').forEach((el) => {
        let frame;
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
          const y = (e.clientY - r.top) / r.height - 0.5;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            el.style.setProperty('--ry', `${x * tilt.maxGraden * 2}deg`);
            el.style.setProperty('--rx', `${-y * tilt.maxGraden * 2}deg`);
            el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
            el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
            el.classList.add('is-tilting');
          });
        });
        el.addEventListener('pointerleave', () => {
          cancelAnimationFrame(frame);
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
          el.classList.remove('is-tilting');
        });
      });
    }

    /* 2. zwevende vormen: diepte bij muis en scroll */
    const shapes = [...document.querySelectorAll('[data-depth]')];
    let mx = 0, my = 0;
    if (fine) {
      window.addEventListener('pointermove', (e) => {
        mx = e.clientX / innerWidth - 0.5;
        my = e.clientY / innerHeight - 0.5;
        requestUpdate();
      }, { passive: true });
    }

    /* 3. scroll: 3D-binnenkomst + parallax */
    const scrollers = [...document.querySelectorAll('[data-scroll3d]')];
    const hero = document.querySelector('.hero-visual');
    let ticking = false;
    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    function update() {
      ticking = false;
      const vh = innerHeight;
      scrollers.forEach((el) => {
        const r = el.getBoundingClientRect();
        // 0 = net onderaan in beeld, 1 = op een derde van het scherm
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.67)));
        el.style.setProperty('--p', p.toFixed(3));
      });
      shapes.forEach((el) => {
        const d = parseFloat(el.dataset.depth) || 1;
        const r = el.parentElement.getBoundingClientRect();
        const fromCenter = r.top + r.height / 2 - vh / 2;
        el.style.setProperty('--dx', `${(mx * depth.muis * d).toFixed(1)}px`);
        el.style.setProperty('--dy', `${(my * depth.muis * d - fromCenter * depth.scroll * d * 0.5).toFixed(1)}px`);
      });
      if (hero) {
        // de hero-boog kantelt zachtjes weg wanneer u naar beneden scrollt
        const q = Math.min(1, scrollY / (vh * 0.9));
        hero.style.setProperty('--away', q.toFixed(3));
      }
    }
    /* 4. social media: 3D-carrousel, kaarten draaien weg naarmate ze verder van het midden staan */
    document.querySelectorAll('[data-coverflow]').forEach((track) => {
      let raf;
      const flow = () => {
        const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
        track.querySelectorAll('.ig').forEach((card) => {
          const r = card.getBoundingClientRect();
          const off = Math.max(-1.5, Math.min(1.5, (r.left + r.width / 2 - mid) / (track.clientWidth / 2)));
          card.style.setProperty('--off', off.toFixed(3));
          card.style.setProperty('--abs', Math.abs(off).toFixed(3));
        });
      };
      track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(flow); }, { passive: true });
      window.addEventListener('resize', flow);
      flow();
    });

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }
};
