/* ==========================================================
   Vanderloo · landingspagina
   Laadt content.md en maakt van elk ## hoofdstuk een eigen sectie.
   Per hoofdstuk bepaalt "stijl:" hoe de sectie eruitziet
   (verhaal, geurnoten, momenten, inschrijven, faq, footer).
   ========================================================== */

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* MailerLite: plak hier de action-URL uit je embed-code
   (Forms > jouw formulier > Embed > HTML, zoek action="https://assets.mailerlite.com/jsonp/.../subscribe").
   Leeg = demomodus: het formulier controleert de velden en toont een bedankje, maar verstuurt niets. */
const MAILERLITE_ACTION = 'https://assets.mailerlite.com/jsonp/2749192/forms/203715682493269918/subscribe';

/* ---------- markdown → structuur ---------- */

// regels als "label: ..." direct onder een kop zijn instellingen, geen lopende tekst
const META_KEYS = ['label', 'wissel', 'beeld', 'knop', 'knop2', 'klein', 'stijl', 'menu',
  'onderschrift', 'bedankt', 'laag', 'moment', 'instagram'];
const META_RE = new RegExp(`^(${META_KEYS.join('|')}):\\s*(.+)$`, 'i');

function parseMarkdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const doc = { title: '', meta: {}, blocks: [], chapters: [] };
  let target = doc;
  let para = null, list = null, card = null;
  const close = () => { para = null; list = null; };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { close(); continue; }

    const meta = line.match(META_RE);
    if (line.startsWith('# ')) {
      close(); card = null; doc.title = line.slice(2).trim(); target = doc;
    } else if (line.startsWith('## ')) {
      close(); card = null;
      target = { title: line.slice(3).trim(), meta: {}, blocks: [] };
      doc.chapters.push(target);
    } else if (line.startsWith('### ')) {
      close();
      card = { type: 'card', title: line.slice(4).trim(), meta: {}, text: '' };
      target.blocks.push(card);
    } else if (meta) {
      (card || target).meta[meta[1].toLowerCase()] = meta[2].trim();
    } else if (line.startsWith('>')) {
      close(); card = null;
      target.blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') });
    } else if (/^[-*]\s+/.test(line)) {
      para = null; card = null;
      if (!list) { list = { type: 'list', items: [] }; target.blocks.push(list); }
      list.items.push(line.replace(/^[-*]\s+/, ''));
    } else if (card) {
      card.text += (card.text ? ' ' : '') + line;
    } else {
      list = null;
      if (!para) { para = { type: 'p', text: '' }; target.blocks.push(para); }
      para.text += (para.text ? ' ' : '') + line;
    }
  }
  return doc;
}

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// **vet**, *cursief* (in titels: het accentwoord), [link](url)
const inline = (text = '') => esc(text)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<i>$1</i>')
  .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, href) =>
    `<a href="${/^(https?:|mailto:|#)/i.test(href) ? href : '#'}">${label}</a>`);

const plain = (text = '') => text.replace(/\*+/g, '');
const split = (value = '') => value.split('|').map((s) => s.trim());
const paras = (blocks) => blocks.filter((b) => b.type === 'p');
const quotes = (blocks) => blocks.filter((b) => b.type === 'quote');
const cards = (blocks) => blocks.filter((b) => b.type === 'card');
const lists = (blocks) => blocks.filter((b) => b.type === 'list');

/* ---------- bouwstenen ---------- */

// "pad | alt-tekst" → <video> (mp4, laadt pas in beeld) of <img>
function media(value, { eager = false } = {}) {
  if (!value) return '';
  const [src, alt = ''] = split(value);
  if (/\.mp4$/i.test(src)) {
    const poster = src.replace('/video/', '/img/').replace(/\.mp4$/i, '-poster.webp');
    return `<video class="lazy-video" muted loop playsinline preload="${eager ? 'metadata' : 'none'}" poster="${esc(poster)}" aria-label="${esc(alt)}">
      <source data-src="${esc(src)}" type="video/mp4"></video>`;
  }
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}">`;
}

// "knop in een knop": pijl in een eigen rondje (skill high-end-visual-design)
const ARROW = '<span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>';

function button(value, cls = 'btn') {
  if (!value) return '';
  const [text, href = '#inschrijven'] = split(value);
  return `<a href="${esc(href)}" class="${cls}" data-magnetic><span class="btn-text">${inline(text)}</span>${ARROW}</a>`;
}

const label = (meta) => (meta.label ? `<p class="label reveal">${inline(meta.label)}</p>` : '');
const slugify = (s) => plain(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ---------- secties ---------- */

function renderHero(doc) {
  const m = doc.meta;
  const words = split(m.wissel);
  // "Draag je *thuis.*": het cursieve woord wordt het wisselwoord
  const title = inline(doc.title).replace(/<i>(.+?)<\/i>/, '<span class="swap" data-swap><i>$1</i></span>');
  const ribbon = ['warm', 'authentiek', 'zacht', 'honing', 'vanille', 'witte lotus', 'buitenlucht', 'thuiskomen']
    .map((w) => `<span>${w}</span><span>·</span>`).join('');
  return `
  <section class="hero" id="top" aria-labelledby="hero-title" data-words="${esc(words.join('|'))}">
    <div class="wrap hero-grid">
      <div class="hero-text">
        ${label(m)}
        <h1 id="hero-title" class="hero-title reveal">${title}</h1>
        ${paras(doc.blocks).map((p) => `<p class="lede reveal">${inline(p.text)}</p>`).join('')}
        <div class="hero-cta reveal">${button(m.knop)}${button(m.knop2, 'btn btn-ghost')}</div>
        ${m.klein ? `<p class="hero-note reveal">${inline(m.klein)}</p>` : ''}
      </div>
      <figure class="hero-visual reveal" data-tilt>
        <div class="arch arch-hero">${media(m.beeld, { eager: true })}<span class="glare" aria-hidden="true"></span></div>
        <span class="shape shape-honey" data-depth="1.4" aria-hidden="true"></span>
        <span class="shape shape-petal" data-depth="2.2" aria-hidden="true"></span>
        <span class="shape shape-ring" data-depth="0.8" aria-hidden="true"></span>
        <span class="signature" aria-hidden="true">signature</span>
      </figure>
    </div>
    <a href="#${slugify(doc.chapters[0]?.meta.menu || doc.chapters[0]?.title || '')}" class="scroll-hint" aria-label="Naar ${esc(doc.chapters[0]?.meta.menu || 'de volgende sectie')}"><span></span></a>
  </section>
  <div class="ribbon" aria-hidden="true"><div class="ribbon-track">${ribbon}${ribbon}</div></div>`;
}

const RENDER = {
  verhaal(c, id) {
    const m = c.meta;
    const [knopText, knopHref = '#inschrijven'] = split(m.knop);
    return `
    <section class="story section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap story-grid">
        <figure class="story-visual reveal" data-tilt data-scroll3d>
          <div class="arch">${media(m.beeld)}<span class="glare" aria-hidden="true"></span></div>
          <span class="shape shape-petal shape-sm" data-depth="1.8" aria-hidden="true"></span>
          ${m.onderschrift ? `<figcaption>${inline(m.onderschrift)}</figcaption>` : ''}
        </figure>
        <div class="story-text">
          ${label(m)}
          <h2 id="${id}-t" class="reveal">${inline(c.title)}</h2>
          ${paras(c.blocks).map((p) => `<p class="reveal">${inline(p.text)}</p>`).join('')}
          ${quotes(c.blocks).map((q) => `<blockquote class="quote reveal"><p>${inline(q.text)}</p></blockquote>`).join('')}
          ${m.knop ? `<a href="${esc(knopHref)}" class="link-arrow reveal">${inline(knopText)} <span aria-hidden="true">→</span></a>` : ''}
        </div>
      </div>
    </section>`;
  },

  geurnoten(c, id) {
    const m = c.meta;
    const notes = cards(c.blocks);
    const first = notes[0] || { meta: {}, title: '', text: '' };
    const senses = (lists(c.blocks)[0]?.items || [])
      .map((i) => i.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/)).filter(Boolean);
    const quote = quotes(c.blocks)[0];
    return `
    <section class="notes section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap">
        <div class="notes-head">
          ${label(m)}
          <h2 id="${id}-t" class="reveal">${inline(c.title)}</h2>
          ${paras(c.blocks).map((p) => `<p class="reveal">${inline(p.text)}</p>`).join('')}
        </div>
        <div class="notes-grid">
          <div class="notes-tabs" role="tablist" aria-label="Geurnoten" data-notes-tabs>
            ${notes.map((n, i) => `
              <button role="tab" id="tab-${i}" aria-selected="${i === 0}" aria-controls="note-panel" tabindex="${i === 0 ? 0 : -1}">
                <span class="tab-dot" aria-hidden="true"></span>
                <span class="tab-layer">${inline(n.meta.laag)}</span><span class="tab-name">${inline(n.title)}</span>
              </button>`).join('')}
          </div>
          <div class="note-panel" id="note-panel" role="tabpanel" aria-labelledby="tab-0" aria-live="polite" data-note-panel>
            <div class="note-stage" data-tilt>
              <div class="note-media arch" data-note-media>${media(first.meta.beeld)}<span class="glare" aria-hidden="true"></span></div>
              <div class="orbit" aria-hidden="true" data-orbit>
                ${notes.map((_, i) => `<span class="orb" data-orb="${i}" style="--i:${i};--n:${notes.length}"></span>`).join('')}
              </div>
            </div>
            <div class="note-copy">
              <p class="note-moment" data-note-moment>${inline(first.meta.moment)}</p>
              <h3 data-note-name>${inline(first.title)}</h3>
              <p data-note-text>${inline(first.text)}</p>
              <div class="note-bar" aria-hidden="true"><span data-note-bar></span></div>
            </div>
          </div>
        </div>
        <div class="notes-film">
          <figure class="film-frame reveal" data-tilt data-scroll3d>${media(m.beeld)}<span class="glare" aria-hidden="true"></span></figure>
          <div class="film-text">
            ${quote ? `<h3 class="reveal">${inline(quote.text)}</h3>` : ''}
            ${senses.length ? `<dl class="senses reveal">${senses.map((s) => `<div><dt>${inline(s[1])}</dt><dd>${inline(s[2])}</dd></div>`).join('')}</dl>` : ''}
            <a href="#inschrijven" class="btn reveal" data-magnetic><span class="btn-text">Schrijf u in</span>${ARROW}</a>
          </div>
        </div>
      </div>
    </section>`;
  },

  momenten(c, id) {
    return `
    <section class="moments section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap">
        <div class="section-head">
          ${label(c.meta)}
          <h2 id="${id}-t" class="reveal">${inline(c.title)}</h2>
          ${paras(c.blocks).map((p) => `<p class="reveal">${inline(p.text)}</p>`).join('')}
        </div>
        <ul class="moments-grid">
          ${cards(c.blocks).map((k) => `
            <li class="moment reveal">
              <div class="moment-img" data-tilt data-scroll3d>${media(k.meta.beeld)}<span class="glare" aria-hidden="true"></span></div>
              <h3>${inline(k.title)}</h3>
              <p>${inline(k.text)}</p>
            </li>`).join('')}
        </ul>
      </div>
    </section>`;
  },

  inschrijven(c, id) {
    const m = c.meta;
    const [intro, ...rest] = paras(c.blocks);
    const [thanksTitle, thanksText] = split(m.bedankt);
    return `
    <section class="signup section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap signup-grid">
        <figure class="signup-visual reveal" data-tilt><div class="arch">${media(m.beeld)}<span class="glare" aria-hidden="true"></span></div><span class="shape shape-honey shape-sm" data-depth="1.6" aria-hidden="true"></span></figure>
        <div class="signup-card reveal">
          ${m.label ? `<p class="label">${inline(m.label)}</p>` : ''}
          <h2 id="${id}-t">${inline(c.title)}</h2>
          ${intro ? `<p>${inline(intro.text)}</p>` : ''}
          <form class="form" data-signup novalidate>
            <div class="field">
              <label for="f-name">Voornaam</label>
              <input id="f-name" name="fields[name]" type="text" autocomplete="given-name" required placeholder="Bv. Marleen">
              <p class="error" data-error-for="f-name">Vul uw voornaam in.</p>
            </div>
            <div class="field">
              <label for="f-lastname">Achternaam <span class="optional">(optioneel)</span></label>
              <input id="f-lastname" name="fields[last_name]" type="text" autocomplete="family-name" placeholder="Bv. Peeters">
            </div>
            <div class="field">
              <label for="f-email">E-mailadres</label>
              <input id="f-email" name="fields[email]" type="email" autocomplete="email" inputmode="email" required placeholder="naam@voorbeeld.be">
              <p class="error" data-error-for="f-email">Vul een geldig e-mailadres in.</p>
            </div>
            <div class="field field-check">
              <input id="f-optin" name="gdpr[]" type="checkbox" value="Nieuwsbrief" required>
              <label for="f-optin">Ja, ik wil de nieuwsbrief van Vanderloo ontvangen. Ik kan mij altijd uitschrijven. Lees de <a href="#privacy">privacyverklaring</a>.</label>
              <p class="error" data-error-for="f-optin">Geef toestemming om u de nieuwsbrief te sturen.</p>
            </div>
            <input type="hidden" name="ml-submit" value="1">
            <input type="hidden" name="anticsrf" value="true">
            <button type="submit" class="btn btn-full" data-magnetic><span class="btn-label">${inline(m.knop || 'Schrijf mij in')}</span>${ARROW}</button>
            ${rest.map((p) => `<p class="form-small">${inline(p.text)}</p>`).join('')}
          </form>
          <div class="form-success" data-success hidden tabindex="-1">
            <span class="signature signature-inline" aria-hidden="true">welkom</span>
            <h3>${inline(thanksTitle || 'Fijn dat u er bent')}, <span data-success-name></span>.</h3>
            <p>${inline(thanksText || '')}</p>
          </div>
        </div>
      </div>
    </section>`;
  },

  social(c, id) {
    const m = c.meta;
    const posts = cards(c.blocks);
    const [follow, followHref = '#'] = split(m.knop);
    const icons = `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2 0 3.4 1.1 4.2 2.4h.4c.8-1.3 2.2-2.4 4.2-2.4 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z"/></svg>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4.2A8 8 0 1 1 20 12z"/></svg>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z"/></svg>`;
    return `
    <section class="social section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap">
        <div class="social-head">
          <div>
            ${label(m)}
            <h2 id="${id}-t" class="reveal">${inline(c.title)}</h2>
            ${paras(c.blocks).map((p) => `<p class="reveal">${inline(p.text)}</p>`).join('')}
          </div>
          <div class="social-controls reveal">
            <div class="format-switch" role="group" aria-label="Formaat kiezen">
              <button type="button" aria-pressed="true" data-format="post">Post</button>
              <button type="button" aria-pressed="false" data-format="story">Story</button>
              <button type="button" aria-pressed="false" data-format="ad">Advertentie</button>
            </div>
            <div class="social-arrows">
              <button type="button" class="arrow" data-social-prev aria-label="Vorige posts">←</button>
              <button type="button" class="arrow" data-social-next aria-label="Volgende posts">→</button>
            </div>
          </div>
        </div>
      </div>
      <div class="social-track" data-format="post" data-coverflow tabindex="0" aria-label="Instagramposts van Vanderloo, scroll horizontaal">
        ${posts.map((k, i) => {
          const [cta] = split(k.meta.knop);
          return `
          <article class="ig" aria-label="Post ${i + 1}: ${esc(plain(k.title))}">
            <div class="ig-bars" aria-hidden="true"><span></span><span></span><span></span></div>
            <header class="ig-head">
              <span class="ig-avatar" aria-hidden="true"><img src="assets/logo/vanderloo-beige.svg" alt=""></span>
              <span class="ig-name">vanderloo<small class="ig-sponsored">Gesponsord</small></span>
              <span class="ig-dots" aria-hidden="true">···</span>
            </header>
            <div class="ig-media">
              ${media(k.meta.beeld)}
              <div class="ig-overlay">
                <h3 class="ig-title">${inline(k.title)}</h3>
                <p class="ig-sub">${inline(k.text)}</p>
                <span class="ig-cta">${inline(cta)}</span>
              </div>
            </div>
            <div class="ig-adbar"><span>${inline(cta)}</span><span aria-hidden="true">›</span></div>
            <footer class="ig-foot">
              <div class="ig-icons">${icons}</div>
              <p><strong>vanderloo</strong> ${inline(k.text)} #vanderloo #draagjethuis</p>
            </footer>
          </article>`;
        }).join('')}
      </div>
      <div class="wrap social-follow reveal">
        <a href="${esc(followHref)}" class="btn btn-ghost" data-magnetic><span class="btn-text">${inline(follow || 'Schrijf u in')}</span>${ARROW}</a>
      </div>
    </section>`;
  },

  faq(c, id) {
    return `
    <section class="faq section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap faq-wrap">
        <div class="section-head">
          ${label(c.meta)}
          <h2 id="${id}-t" class="reveal">${inline(c.title)}</h2>
        </div>
        <div class="faq-list">
          ${cards(c.blocks).map((k) => `<details class="reveal"><summary>${inline(k.title)}</summary><p>${inline(k.text)}</p></details>`).join('')}
        </div>
        ${button(c.meta.knop, 'btn reveal')}
      </div>
    </section>`;
  },

  // standaard voor een nieuw hoofdstuk zonder stijl: titel + tekst
  tekst(c, id) {
    return `
    <section class="section" id="${id}" aria-labelledby="${id}-t">
      <div class="wrap faq-wrap">
        ${label(c.meta)}
        <h2 id="${id}-t" class="reveal">${inline(c.title)}</h2>
        ${paras(c.blocks).map((p) => `<p class="reveal">${inline(p.text)}</p>`).join('')}
        ${button(c.meta.knop, 'btn reveal')}
      </div>
    </section>`;
  }
};

function renderFooter(c) {
  const ps = paras(c.blocks);
  const small = ps.pop();
  const [insta, instaHref = '#'] = split(c.meta.instagram);
  return `
    <div class="wrap footer-grid">
      <div>
        <img src="assets/logo/vanderloo-beige.svg" alt="Vanderloo" width="140" height="81" loading="lazy">
        <p class="footer-tag">Draag uw <i>thuis.</i></p>
      </div>
      <div id="privacy" class="footer-privacy">
        <h2 class="footer-h">${inline(c.title)}</h2>
        ${ps.map((p) => `<p>${inline(p.text)}</p>`).join('')}
      </div>
      <div>
        <h2 class="footer-h">Volg ons</h2>
        ${insta ? (instaHref === '#' ? `<p class="footer-note">${inline(insta)} <small>(account volgt bij de lancering)</small></p>` : `<a href="${esc(instaHref)}" class="footer-link">${inline(insta)}</a>`) : ''}
      </div>
    </div>
    ${small ? `<p class="wrap footer-small">${inline(small.text)}</p>` : ''}`;
}

const FIXED_IDS = { inschrijven: 'inschrijven', faq: 'faq', geurnoten: 'geurnoten', social: 'social' };

function render(doc) {
  const chapters = doc.chapters.filter((c) => c.meta.stijl !== 'footer');
  const footer = doc.chapters.find((c) => c.meta.stijl === 'footer');

  $('[data-content]').innerHTML = renderHero(doc) + chapters.map((c) => {
    c.id = FIXED_IDS[c.meta.stijl] || slugify(c.meta.menu || c.title);
    return (RENDER[c.meta.stijl] || RENDER.tekst)(c, c.id);
  }).join('');

  if (footer) $('[data-footer]').innerHTML = renderFooter(footer);

  $('[data-menu]').innerHTML = chapters.filter((c) => c.meta.menu && c.meta.stijl !== 'inschrijven')
    .map((c) => `<a href="#${c.id}">${esc(c.meta.menu)}</a>`).join('');
  const mobile = $('[data-menu-mobile]');
  if (mobile) mobile.innerHTML = $('[data-menu]').innerHTML
    + '<a href="#inschrijven" class="menu-overlay-cta">Schrijf u in</a>';

  // FAQ ook als gestructureerde data voor Google
  const faq = chapters.find((c) => c.meta.stijl === 'faq');
  if (faq) {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: cards(faq.blocks).map((k) => ({
        '@type': 'Question', name: plain(k.title), acceptedAnswer: { '@type': 'Answer', text: plain(k.text) }
      }))
    });
    document.head.appendChild(ld);
  }
  return chapters.find((c) => c.meta.stijl === 'geurnoten');
}

/* ---------- interacties ---------- */

function initReveal() {
  const items = $$('.reveal');
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 90}ms`);
  });
  if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => io.observe(el));
}

function initHeader() {
  const header = $('[data-header]');
  const sticky = $('[data-sticky-cta]');
  const hero = $('.hero');
  const signup = $('#inschrijven');
  let lastY = window.scrollY;
  let signupVisible = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    header.classList.toggle('is-hidden', y > lastY && y > 400);
    sticky.classList.toggle('is-visible', y > hero.offsetHeight * 0.7 && !signupVisible);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!('IntersectionObserver' in window)) return;
  if (signup) new IntersectionObserver(([e]) => { signupVisible = e.isIntersecting; onScroll(); }, { threshold: 0.1 }).observe(signup);
  const links = $$('.nav a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });
}

/* mobiel menu: hamburger die naar een kruisje draait, scherm met de links */
function initMenu() {
  const toggle = $('[data-menu-toggle]');
  const overlay = $('[data-menu-overlay]');
  if (!toggle || !overlay) return;
  const text = $('.menu-toggle-text', toggle);
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    text.textContent = open ? 'Sluiten' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) {
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      $('a', overlay)?.focus();
    } else {
      overlay.classList.remove('is-open');
      setTimeout(() => { if (!overlay.classList.contains('is-open')) overlay.hidden = true; }, 500);
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  overlay.addEventListener('click', (e) => { if (e.target.closest('a') || e.target === overlay) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

function initWordSwap() {
  const el = $('[data-swap]');
  const words = ($('.hero')?.dataset.words || '').split('|').filter(Boolean);
  if (window.anime) return;            // anime.js neemt de woordwissel over (js/animaties.js)
  if (!el || reduceMotion || words.length < 2) return;
  let i = 0;
  setInterval(() => {
    el.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.querySelector('i').textContent = words[i];
      el.classList.remove('is-out');
    }, 500);
  }, 3800);
}

function initVideos() {
  const videos = $$('.lazy-video');
  const load = (v) => {
    if (v.dataset.loaded) return;
    v.querySelectorAll('source[data-src]').forEach((s) => { s.src = s.dataset.src; });
    v.load();
    v.dataset.loaded = '1';
  };
  if (!('IntersectionObserver' in window)) { videos.forEach(load); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      v.dataset.inView = isIntersecting ? '1' : '0';
      const gepauzeerd = document.documentElement.classList.contains('anim-paused');
      if (isIntersecting) { load(v); if (!reduceMotion && !gepauzeerd) v.play().catch(() => {}); } else { v.pause(); }
    });
  }, { rootMargin: '200px 0px' });
  videos.forEach((v) => io.observe(v));
}

function initMagnetic() {
  if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
  $$('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      btn.style.setProperty('--gx', `${x}px`);
      btn.style.setProperty('--gy', `${y}px`);
      if (btn.hasAttribute('data-magnetic')) {
        btn.style.setProperty('--mx', `${(x - r.width / 2) * 0.15}px`);
        btn.style.setProperty('--my', `${(y - r.height / 2) * 0.25}px`);
      }
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
  });
}

// geurnoten: tabs + 3D-flacon die naar de gekozen noot draait
function initNotes(chapter) {
  const panel = $('[data-note-panel]');
  if (!panel || !chapter) return;
  const notes = cards(chapter.blocks);
  const tabs = $$('[data-notes-tabs] button');
  const sceneNotes = window.SCENE?.noten || [];
  tabs.forEach((t, i) => { if (sceneNotes[i]) t.style.setProperty('--dot', sceneNotes[i].kleur); });

  const orbs = $$('[data-orb]', panel);
  orbs.forEach((o, i) => { if (sceneNotes[i]) o.style.setProperty('--dot', sceneNotes[i].kleur); });

  const show = (idx) => {
    const n = notes[idx];
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', i === idx); t.tabIndex = i === idx ? 0 : -1; });
    panel.setAttribute('aria-labelledby', `tab-${idx}`);
    orbs.forEach((o, i) => o.classList.toggle('is-active', i === idx));
    panel.style.setProperty('--turn', `${-idx * (360 / notes.length)}deg`);
    panel.classList.add('is-changing');
    setTimeout(() => {
      $('[data-note-media]', panel).innerHTML = media(n.meta.beeld) + '<span class="glare" aria-hidden="true"></span>';
      $('[data-note-moment]', panel).innerHTML = inline(n.meta.moment);
      $('[data-note-name]', panel).innerHTML = inline(n.title);
      $('[data-note-text]', panel).innerHTML = inline(n.text);
      $('[data-note-bar]', panel).style.width = `${((idx + 1) / notes.length) * 100}%`;
      panel.classList.remove('is-changing');
    }, reduceMotion ? 0 : 380);
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = (i + dir + tabs.length) % tabs.length;
      tabs[next].focus(); show(next);
    });
  });
  show(0);
}

// social media: formaat wisselen (post / story / advertentie) en pijltjes
function initSocial() {
  const track = $('[data-coverflow]');
  if (!track) return;
  $$('.format-switch button').forEach((b) => b.addEventListener('click', () => {
    $$('.format-switch button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    track.classList.add('is-switching');
    setTimeout(() => {
      track.dataset.format = b.dataset.format;
      track.classList.remove('is-switching');
      track.dispatchEvent(new Event('scroll'));
    }, reduceMotion ? 0 : 250);
  }));
  const step = () => (track.querySelector('.ig')?.offsetWidth || 300) + 28;
  const go = (dir) => track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
  $('[data-social-prev]')?.addEventListener('click', () => go(-1));
  $('[data-social-next]')?.addEventListener('click', () => go(1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
}

function initForm() {
  const form = $('[data-signup]');
  const success = $('[data-success]');
  if (!form) return;
  const btn = $('button[type="submit"]', form);
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const check = (input) => {
    const field = input.closest('.field');
    const ok = input.type === 'checkbox' ? input.checked
      : input.type === 'email' ? emailOk(input.value) : input.value.trim().length > 1;
    field.classList.toggle('has-error', !ok);
    field.classList.toggle('is-valid', ok && input.type !== 'checkbox');
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  };

  $$('input[required]', form).forEach((input) => {
    const err = $(`[data-error-for="${input.id}"]`, form);
    if (err) { err.id = `${input.id}-error`; input.setAttribute('aria-describedby', err.id); }
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'blur', () => check(input));
    input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) check(input); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = $$('input[required]', form);
    const results = inputs.map(check);
    if (results.includes(false)) { inputs[results.indexOf(false)].focus(); return; }
    btn.classList.add('is-loading'); btn.disabled = true;
    try {
      if (MAILERLITE_ACTION) {
        await fetch(MAILERLITE_ACTION, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      } else {
        await new Promise((r) => setTimeout(r, 900));
        console.info('[Vanderloo] Demomodus: vul MAILERLITE_ACTION bovenaan js/main.js in om echt in te schrijven.');
      }
      $('[data-success-name]').textContent = $('#f-name').value.trim();
      form.hidden = true; success.hidden = false; success.focus();
    } catch {
      btn.classList.remove('is-loading'); btn.disabled = false;
      alert('Er ging iets mis bij het inschrijven. Probeert u het later opnieuw?');
    }
  });
}

/* ---------- start ---------- */

// Via een server lezen we content.md rechtstreeks (altijd de nieuwste versie).
// Als bestand geopend (file://) blokkeert de browser fetch(); dan gebruiken we
// js/content.js, dat build.js uit content.md maakt.
async function loadMarkdown() {
  if (location.protocol !== 'file:') {
    try {
      const res = await fetch('content.md', { cache: 'no-cache' });
      if (res.ok) return await res.text();
    } catch { /* val terug op content.js */ }
  }
  if (typeof window.CONTENT_MD === 'string') return window.CONTENT_MD;
  throw new Error('content.md niet gevonden');
}

(async () => {
  let doc;
  try {
    doc = parseMarkdown(await loadMarkdown());
  } catch (err) {
    $('[data-content]').innerHTML = '<section class="section wrap"><h1>content.md kon niet geladen worden</h1><p>Voer <code>node build.js</code> uit in de map 08_landingspagina.</p></section>';
    console.error(err);
    return;
  }
  const notesChapter = render(doc);
  initHeader();
  initMenu();
  initVideos();
  initNotes(notesChapter);
  initReveal();
  initMagnetic();
  initWordSwap();
  initForm();
  initSocial();
  window.VanderlooDepth?.init(window.SCENE || {});
  window.VanderlooAnimaties?.init();   // anime.js: zwevende vormen, lint, woordwissel + play/pause-knop
})();
