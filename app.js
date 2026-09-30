// ============================================================
//   MAPA DE OPORTUNIDADES COM IA — app.js
//   Supabase: https://ivixesgteovthazcebid.supabase.co
// ============================================================

const SUPABASE_URL  = 'https://ivixesgteovthazcebid.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aXhlc2d0ZW92dGhhemNlYmlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MjA0NDYsImV4cCI6MjEwNjI5NjQ0Nn0.PIsSri7FkUTBbT3nC8cr5tSYi2zuzR5nW0wZ_zkqK94';
const TABLE = 'opportunities';

// ── Supabase helper ──────────────────────────────────────────
const db = {
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Prefer': 'return=representation'
  },

  async get(params = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${params}`, {
      headers: { ...this.headers, 'Prefer': '' }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async insert(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

// ── State ────────────────────────────────────────────────────
let allOpportunities = [];
let likedIds = new Set(JSON.parse(localStorage.getItem('liked_ids') || '[]'));
let isSubmitting = false;

// ── DOM refs ────────────────────────────────────────────────
const $grid      = document.getElementById('cards-grid');
const $loading   = document.getElementById('loading-state');
const $empty     = document.getElementById('empty-state');
const $modal     = document.getElementById('modal-overlay');
const $form      = document.getElementById('opportunity-form');
const $filterCity    = document.getElementById('filter-city');
const $filterCountry = document.getElementById('filter-country');
const $filterCat     = document.getElementById('filter-category');

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadOpportunities();
  setupEventListeners();
});

// ── Load & Render ────────────────────────────────────────────
async function loadOpportunities() {
  showLoading(true);
  try {
    const data = await db.get('order=created_at.desc&select=*');
    allOpportunities = data;
    updateStats(data);
    renderFiltered();
  } catch (err) {
    showToast('Erro ao carregar oportunidades: ' + err.message, 'error');
    showLoading(false);
  }
}

function renderFiltered() {
  const city    = $filterCity.value.trim().toLowerCase();
  const country = $filterCountry.value.trim().toLowerCase();
  const cat     = $filterCat.value;

  const filtered = allOpportunities.filter(o => {
    const matchCity    = !city    || o.city.toLowerCase().includes(city);
    const matchCountry = !country || o.country.toLowerCase().includes(country);
    const matchCat     = !cat     || o.category === cat;
    return matchCity && matchCountry && matchCat;
  });

  showLoading(false);
  if (filtered.length === 0) {
    $empty.style.display = 'block';
    $grid.style.display  = 'none';
  } else {
    $empty.style.display = 'none';
    $grid.style.display  = 'grid';
    $grid.innerHTML = filtered.map(renderCard).join('');
  }
}

function renderCard(o) {
  const liked   = likedIds.has(o.id);
  const dateStr = new Date(o.created_at).toLocaleDateString('pt-PT', { day:'2-digit', month:'short', year:'numeric' });

  return `
  <article class="opp-card">
    <div class="card-header">
      <h2 class="card-title">${esc(o.name)}</h2>
      <span class="card-category">${esc(o.category)}</span>
    </div>

    <div class="card-location">
      <span class="card-location-icon">📍</span>
      ${esc(o.city)}, ${esc(o.country)}
    </div>

    <div>
      <div class="card-section-label problem">⚠️ Problema</div>
      <p class="card-text">${esc(o.problem)}</p>
    </div>

    <div>
      <div class="card-section-label solution">🤖 Solução com IA</div>
      <p class="card-text">${esc(o.ai_solution)}</p>
    </div>

    <div>
      <div class="card-section-label potential">💰 Potencial</div>
      <p class="card-text">${esc(o.potential)}</p>
    </div>

    <div class="card-footer">
      <span class="card-date">${dateStr}</span>
      <button
        class="like-btn ${liked ? 'liked' : ''}"
        id="like-btn-${o.id}"
        onclick="handleLike('${o.id}', ${o.likes})"
        ${liked ? 'title="Já deste like"' : 'title="Dar like"'}
      >
        ${liked ? '❤️' : '🤍'} <span class="like-count" id="like-count-${o.id}">${o.likes}</span>
      </button>
    </div>
  </article>`;
}

function updateStats(data) {
  document.getElementById('stat-total').textContent  = data.length;
  const cities = new Set(data.map(o => `${o.city}|${o.country}`)).size;
  document.getElementById('stat-cities').textContent = cities;
  const totalLikes = data.reduce((s, o) => s + (o.likes || 0), 0);
  document.getElementById('stat-likes').textContent  = totalLikes;
}

// ── Like Handler ─────────────────────────────────────────────
async function handleLike(id, currentLikes) {
  const btn = document.getElementById(`like-btn-${id}`);
  if (!btn || btn.disabled) return;

  if (likedIds.has(id)) {
    showToast('Já deste like a esta oportunidade! 🤍', 'info');
    return;
  }

  btn.disabled = true;
  const newLikes = currentLikes + 1;

  try {
    await db.update(id, { likes: newLikes });

    likedIds.add(id);
    localStorage.setItem('liked_ids', JSON.stringify([...likedIds]));

    // Update local state
    const opp = allOpportunities.find(o => o.id === id);
    if (opp) opp.likes = newLikes;

    // Update DOM
    const countEl = document.getElementById(`like-count-${id}`);
    if (countEl) countEl.textContent = newLikes;
    btn.classList.add('liked');
    btn.innerHTML = `❤️ <span class="like-count" id="like-count-${id}">${newLikes}</span>`;
    btn.title = 'Já deste like';

    updateStats(allOpportunities);
    showToast('Like dado! ❤️', 'success');
  } catch (err) {
    showToast('Erro ao dar like: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Form Validation ──────────────────────────────────────────
const FIELDS = [
  { id: 'field-name',       errorId: 'error-name',       label: 'Nome / Título',        max: 100 },
  { id: 'field-category',   errorId: 'error-category',   label: 'Categoria',             select: true },
  { id: 'field-city',       errorId: 'error-city',        label: 'Cidade',               max: 80 },
  { id: 'field-country',    errorId: 'error-country',     label: 'País',                 max: 80 },
  { id: 'field-problem',    errorId: 'error-problem',     label: 'Problema Detetado',    max: 500 },
  { id: 'field-ai-solution',errorId: 'error-ai-solution', label: 'Solução com IA',       max: 500 },
  { id: 'field-potential',  errorId: 'error-potential',   label: 'Potencial de Mercado', max: 200 }
];

function sanitize(str) {
  return str.trim().replace(/<[^>]*>/g, '').substring(0, 500);
}

function validateForm() {
  let valid = true;

  FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(f.errorId);
    const val = el.value.trim();

    el.classList.remove('has-error');
    errEl.textContent = '';

    if (!val) {
      el.classList.add('has-error');
      errEl.textContent = `${f.label} é obrigatório.`;
      valid = false;
    } else if (!f.select && f.max && val.length > f.max) {
      el.classList.add('has-error');
      errEl.textContent = `Máximo ${f.max} caracteres.`;
      valid = false;
    }
  });

  return valid;
}

function clearFormErrors() {
  FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(f.errorId);
    if (el) el.classList.remove('has-error');
    if (errEl) errEl.textContent = '';
  });
  const gErr = document.getElementById('form-global-error');
  if (gErr) { gErr.style.display = 'none'; gErr.textContent = ''; }
}

// ── Form Submit ──────────────────────────────────────────────
$form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  clearFormErrors();
  if (!validateForm()) return;

  isSubmitting = true;
  const labelEl   = document.getElementById('submit-label');
  const spinnerEl = document.getElementById('submit-spinner');
  const btnSubmit = document.getElementById('btn-submit');

  labelEl.style.display   = 'none';
  spinnerEl.style.display = 'inline';
  btnSubmit.disabled = true;

  const payload = {
    name:        sanitize(document.getElementById('field-name').value).substring(0, 100),
    city:        sanitize(document.getElementById('field-city').value).substring(0, 80),
    country:     sanitize(document.getElementById('field-country').value).substring(0, 80),
    problem:     sanitize(document.getElementById('field-problem').value).substring(0, 500),
    ai_solution: sanitize(document.getElementById('field-ai-solution').value).substring(0, 500),
    category:    document.getElementById('field-category').value,
    potential:   sanitize(document.getElementById('field-potential').value).substring(0, 200),
    likes:       0
  };

  try {
    await db.insert(payload);
    showToast('✅ Oportunidade publicada com sucesso!', 'success');
    closeModal();
    $form.reset();
    ['count-problem','count-ai-solution'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0/' + (id === 'count-problem' ? '500' : '500');
    });
    await loadOpportunities();
  } catch (err) {
    const gErr = document.getElementById('form-global-error');
    gErr.textContent = 'Erro ao publicar: ' + err.message;
    gErr.style.display = 'block';
    showToast('Erro ao publicar a oportunidade.', 'error');
  } finally {
    isSubmitting = false;
    labelEl.style.display   = 'inline';
    spinnerEl.style.display = 'none';
    btnSubmit.disabled = false;
  }
});

// ── Modal ────────────────────────────────────────────────────
function openModal() {
  $modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  clearFormErrors();
  setTimeout(() => document.getElementById('field-name').focus(), 100);
}

function closeModal() {
  $modal.style.display = 'none';
  document.body.style.overflow = '';
  clearFormErrors();
}

// ── Event Listeners ──────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('btn-open-modal').addEventListener('click', openModal);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    $filterCity.value    = '';
    $filterCountry.value = '';
    $filterCat.value     = '';
    renderFiltered();
  });

  $modal.addEventListener('click', (e) => {
    if (e.target === $modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Live filters
  let filterTimer;
  [$filterCity, $filterCountry, $filterCat].forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(renderFiltered, 250);
    });
  });

  // Char counters
  setupCharCounter('field-problem', 'count-problem', 500);
  setupCharCounter('field-ai-solution', 'count-ai-solution', 500);

  // Clear individual field errors on input
  FIELDS.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('has-error');
        document.getElementById(f.errorId).textContent = '';
      });
    }
  });
}

function setupCharCounter(fieldId, countId, max) {
  const field = document.getElementById(fieldId);
  const count = document.getElementById(countId);
  if (!field || !count) return;
  field.addEventListener('input', () => {
    const len = field.value.length;
    count.textContent = `${len}/${max}`;
    count.style.color = len > max * 0.9 ? '#fbbf24' : '';
  });
}

// ── UI Helpers ───────────────────────────────────────────────
function showLoading(show) {
  $loading.style.display = show ? 'flex' : 'none';
  if (show) {
    $grid.style.display  = 'none';
    $empty.style.display = 'none';
  }
}

function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Expose for inline handlers
window.openModal   = openModal;
window.closeModal  = closeModal;
window.handleLike  = handleLike;
