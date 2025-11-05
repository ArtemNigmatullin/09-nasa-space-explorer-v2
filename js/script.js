// js/script.js

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Simple “Did You Know?” facts (feel free to add more)
const SPACE_FACTS = [
  "Venus spins backwards: the Sun rises in the west and sets in the east.",
  "Neutron stars can spin 600+ times per second.",
  "There are more trees on Earth than stars in the Milky Way.",
  "A day on Mercury can last 176 Earth days.",
  "Saturn would float in water… if you could find an ocean big enough.",
  "The Great Red Spot on Jupiter is a storm older than modern science.",
  "Astronauts grow up to 5 cm taller in microgravity (it reverses on return).",
  "The observable universe is ~93 billion light-years across.",
  "The Moon is moving ~3.8 cm farther from Earth each year."
];

// ---------------------------------------------------------------------------
// On load: inject NASA styling + fact banner
// ---------------------------------------------------------------------------
(function initBrandingAndFact() {
  const style = document.createElement('style');
  style.setAttribute('data-injected', 'nasa-brand');
  style.textContent = `
    /* NASA-inspired palette */
    :root{
      --nasa-blue:#0B3D91;
      --nasa-red:#E03C31;
      --nasa-gray-100:#f5f7fb;
      --nasa-gray-700:#374151;
      --nasa-text:#1f2937;
    }

    /* Header tint */
    .site-header{
      background: var(--nasa-blue);
      border-radius: 12px;
      color: #fff;
    }
    .site-header h1{
      color:#fff;
      letter-spacing:.5px;
    }

    /* Button -> NASA red */
    #getImageBtn{
      background: var(--nasa-red);
      color:#fff;
      border:none;
      font-weight:600;
      transition: transform .08s ease, opacity .2s ease;
    }
    #getImageBtn:hover{ opacity:.9; }
    #getImageBtn:active{ transform: scale(.98); }

    /* Random fact banner */
    .fact-banner{
      background: var(--nasa-gray-100);
      color: var(--nasa-text);
      border-left: 6px solid var(--nasa-blue);
      padding: 12px 14px;
      border-radius: 10px;
      margin: 0 20px 16px;
      font-size: 15px;
      line-height: 1.5;
    }
    .fact-banner b{ color: var(--nasa-blue); }

    /* Hover zoom effect */
    .zoom-wrap{
      overflow:hidden;
      border-radius:6px;
    }
    .zoom-wrap img{
      transition: transform .35s ease;
      display:block;
    }
    .zoom-wrap:hover img{
      transform: scale(1.06);
    }

    /* Card footer text */
    .meta{
      margin-top:10px;
      font-size:14px;
      color: var(--nasa-gray-700);
    }

    /* Loading state */
    .loading{
      width:100%;
      text-align:center;
      color: var(--nasa-gray-700);
      padding: 30px 0;
      font-size:16px;
    }

    /* Modal */
    .modal-backdrop{
      position: fixed; inset: 0;
      background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content:center;
      z-index: 9999;
      padding: 20px;
    }
    .modal{
      background: #fff;
      max-width: 900px;
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,.35);
      overflow: hidden;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    .modal-header{
      background: var(--nasa-blue);
      color:#fff;
      padding:16px 20px;
      display:flex; align-items:center; justify-content:space-between;
      gap: 16px;
    }
    .modal-header h2{
      font-size:18px; line-height:1.3; font-weight:700;
    }
    .modal-header .date{
      opacity:.9; font-size:14px; margin-top:4px;
      display:block; font-weight:500;
    }
    .modal-body{
      padding: 16px 20px;
      background: #fff;
    }
    .modal-media{
      width:100%; max-height: 70vh;
      display: block; margin: 0 auto 14px;
      border-radius: 8px;
      background:#000;
      object-fit: contain;
    }
    .modal-body p{
      font-size:15px; line-height:1.6; color: var(--nasa-text);
    }
    .modal-actions{
      padding: 12px 16px;
      display:flex; justify-content:flex-end; gap:10px;
      background:#fafafa; border-top:1px solid #eee;
    }
    .btn{
      border:1px solid #ddd; background:#fff; color:#111;
      padding: 8px 12px; border-radius: 8px; cursor:pointer;
      font-weight:600;
    }
    .btn.primary{
      background: var(--nasa-red); color:#fff; border:none;
    }
    @media (max-width: 560px){
      .modal-header{ flex-direction: column; align-items: flex-start; }
    }
  `;
  document.head.appendChild(style);

  // Insert random fact banner just above the filters
  const container = document.querySelector('.container');
  const filters = document.querySelector('.filters');
  if (container && filters) {
    const banner = document.createElement('div');
    banner.className = 'fact-banner';
    banner.setAttribute('role', 'note');
    const fact = SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)];
    banner.innerHTML = `<b>Did you know?</b> ${fact}`;
    container.insertBefore(banner, filters);
  }
})();

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------
function showLoading(targetEl, msg = "🔄 Loading space photos…") {
  targetEl.innerHTML = `<div class="loading">${msg}</div>`;
}

// ---------------------------------------------------------------------------
// Gallery rendering
// ---------------------------------------------------------------------------
function createCard(item) {
  const card = document.createElement('div');
  card.className = 'gallery-item';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open ${item.title} from ${item.date}`);

  // Media preview
  let mediaHTML = '';
  if (item.media_type === 'image') {
    mediaHTML = `
      <div class="zoom-wrap">
        <img src="${item.url}" loading="lazy" alt="${item.title}" />
      </div>
    `;
  } else if (item.media_type === 'video') {
    const thumb = item.thumbnail_url || '';
    if (thumb) {
      mediaHTML = `
        <div class="zoom-wrap">
          <img src="${thumb}" loading="lazy" alt="${item.title} (video)" />
        </div>
      `;
    } else {
      // Fallback visual for videos without thumbnail
      mediaHTML = `
        <div class="zoom-wrap" style="background:#000; aspect-ratio:16/9; display:grid; place-items:center; color:#fff;">
          ▶ Video
        </div>
      `;
    }
  } else {
    mediaHTML = `
      <div class="zoom-wrap" style="background:#eee; aspect-ratio:16/9; display:grid; place-items:center;">
        Unsupported media
      </div>
    `;
  }

  card.innerHTML = `
    ${mediaHTML}
    <p class="meta"><strong>${item.title}</strong><br>${item.date}</p>
  `;

  const open = () => openModal(item);
  card.addEventListener('click', open);
  card.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });

  return card;
}

function renderGallery(root, data) {
  root.innerHTML = '';
  if (!Array.isArray(data) || data.length === 0) {
    root.innerHTML = `<div class="placeholder"><div class="placeholder-icon">🛰️</div><p>No entries found.</p></div>`;
    return;
  }

  // Newest first if dates are present
  const items = [...data].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const frag = document.createDocumentFragment();
  items.forEach(item => frag.appendChild(createCard(item)));
  root.appendChild(frag);
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function openModal(item) {
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  // Modal shell
  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <div>
      <h2>${item.title}</h2>
      <span class="date">${item.date}</span>
    </div>
    <button class="btn" id="closeModalBtn" aria-label="Close modal">Close ✕</button>
  `;

  const body = document.createElement('div');
  body.className = 'modal-body';

  // Media in modal: use HD for images, embed for videos
  let mediaEl;
  if (item.media_type === 'image') {
    mediaEl = document.createElement('img');
    mediaEl.className = 'modal-media';
    mediaEl.src = item.hdurl || item.url;
    mediaEl.alt = item.title;
  } else if (item.media_type === 'video' && item.url) {
    // Try to embed if it looks like an embeddable URL
    mediaEl = document.createElement('iframe');
    mediaEl.className = 'modal-media';
    mediaEl.src = item.url;
    mediaEl.loading = 'lazy';
    mediaEl.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    mediaEl.referrerPolicy = 'strict-origin-when-cross-origin';
    mediaEl.allowFullscreen = true;
    mediaEl.title = item.title;
  } else {
    mediaEl = document.createElement('div');
    mediaEl.className = 'modal-media';
    mediaEl.style.display = 'grid';
    mediaEl.style.placeItems = 'center';
    mediaEl.style.color = '#fff';
    mediaEl.textContent = 'Media unavailable';
  }

  const expl = document.createElement('p');
  expl.textContent = item.explanation || 'No explanation provided.';

  body.appendChild(mediaEl);
  body.appendChild(expl);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  // Optional: open original link in new tab (use image or video URL)
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn primary';
  viewBtn.textContent = 'Open Source';
  viewBtn.addEventListener('click', () => {
    const link = (item.media_type === 'image') ? (item.hdurl || item.url) : item.url;
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  });

  const closeBtn = header.querySelector('#closeModalBtn');
  const doClose = () => {
    document.body.style.overflow = '';
    backdrop.remove();
    document.removeEventListener('keydown', escHandler);
  };
  const escHandler = (e) => { if (e.key === 'Escape') doClose(); };

  closeBtn.addEventListener('click', doClose);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) doClose(); });
  document.addEventListener('keydown', escHandler);

  actions.appendChild(viewBtn);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(actions);

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';
}

// ---------------------------------------------------------------------------
// Fetch + init
// ---------------------------------------------------------------------------
async function fetchEntries() {
  const resp = await fetch(apodData, { cache: 'no-store' });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  return resp.json();
}

function attachHandlers() {
  const gallery = $('#gallery');
  const btn = $('#getImageBtn');

  if (!gallery || !btn) return;

  btn.addEventListener('click', async () => {
    showLoading(gallery);
    try {
      const data = await fetchEntries();
      renderGallery(gallery, data);
    } catch (err) {
      console.error(err);
      gallery.innerHTML = `
        <div class="placeholder">
          <div class="placeholder-icon">🛰️</div>
          <p>Couldn’t load data. Please try again.</p>
        </div>
      `;
    }
  });
}

document.addEventListener('DOMContentLoaded', attachHandlers);
