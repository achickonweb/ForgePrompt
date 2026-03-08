/* ═══════════════════════════════════════════════════════════════
   FORGEPROMPT — main.js  (v2 — with auth, bookmarks, theme)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

// ── THEME ──────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('pf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const html    = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('pf_theme', next);
    themeToggle.querySelector('.theme-icon').textContent = next === 'dark' ? '◐' : '◑';
  });
  // Set correct icon on load
  const saved = localStorage.getItem('pf_theme') || 'dark';
  if (themeToggle.querySelector('.theme-icon')) {
    themeToggle.querySelector('.theme-icon').textContent = saved === 'dark' ? '◐' : '◑';
  }
}

// ── MOBILE MENU ───────────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    document.body.style.overflow = open ? 'hidden' : '';
  });
}
function closeMobileMenu() {
  mobileMenu && mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}
window.closeMobileMenu = closeMobileMenu;

// ── USER DROPDOWN ─────────────────────────────────────────────
function toggleUserMenu(e) {
  e.stopPropagation();
  document.getElementById('userDropdown')?.classList.toggle('open');
}
document.addEventListener('click', () => {
  document.getElementById('userDropdown')?.classList.remove('open');
});
window.toggleUserMenu = toggleUserMenu;

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'default') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show' + (type !== 'default' ? ' toast-' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
window.showToast = showToast;

// ── COPY (from data-text attribute) ──────────────────────────
function copyFromAttr(btn) {
  const text = btn.dataset.text;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    showToast('Prompt copied to clipboard!');
  });
}
window.copyFromAttr = copyFromAttr;

// Homepage cards use data-text on the card itself
function copyFromCard(btn) {
  const card = btn.closest('.prompt-card');
  const text = card?.dataset?.text || '';
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    showToast('Copied!');
  });
}
window.copyFromCard = copyFromCard;

// ── UPVOTE (requires login, toggles) ─────────────────────────
function upvote(id, btn) {
  fetch(`/api/prompts/${id}/upvote`, { method: 'POST' })
    .then(r => {
      if (r.status === 401 || r.redirected) {
        showToast('Log in to upvote prompts.', 'warn');
        setTimeout(() => window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname), 800);
        return null;
      }
      return r.json();
    })
    .then(data => {
      if (!data) return;
      const countEl = btn.querySelector('.upvote-count');
      if (countEl) countEl.textContent = data.upvotes;
      btn.classList.toggle('voted', data.voted);
      const labelEl = btn.querySelector('.upvote-label');
      if (labelEl) labelEl.textContent = data.voted ? 'Upvoted' : 'Upvote';
      showToast(data.voted ? '▲ Upvoted!' : 'Upvote removed.');
    })
    .catch(() => showToast('Something went wrong. Try again.', 'error'));
}
window.upvote = upvote;

// ── BOOKMARK (requires login, toggles) ───────────────────────
function toggleBookmark(id, btn) {
  fetch(`/api/bookmarks/${id}`, { method: 'POST' })
    .then(r => {
      if (r.status === 401 || r.redirected) {
        showToast('Log in to bookmark prompts.', 'warn');
        setTimeout(() => window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname), 800);
        return null;
      }
      return r.json();
    })
    .then(data => {
      if (!data) return;
      btn.classList.toggle('bookmarked', data.bookmarked);
      btn.textContent = data.bookmarked ? '♥' : '♡';
      showToast(data.bookmarked ? '♥ Bookmarked!' : 'Bookmark removed.');
    })
    .catch(() => showToast('Something went wrong.', 'error'));
}
window.toggleBookmark = toggleBookmark;

// ── SUBMIT MODAL ──────────────────────────────────────────────
function openSubmitModal() {
  document.getElementById('submitModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('s_title')?.focus(), 100);
}
function closeSubmitModal() {
  document.getElementById('submitModal')?.classList.remove('open');
  document.body.style.overflow = '';
  const fb = document.getElementById('submitFeedback');
  if (fb) fb.textContent = '';
}
window.openSubmitModal  = openSubmitModal;
window.closeSubmitModal = closeSubmitModal;

document.getElementById('submitModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeSubmitModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSubmitModal();
});

document.getElementById('s_text')?.addEventListener('input', function() {
  const el = document.getElementById('charCount');
  if (el) el.textContent = `${this.value.length} / 5000`;
  /* Feature 6: Token counter in submit modal */
  const tc = document.getElementById('submitTokenCount');
  if (tc) tc.textContent = `~${Math.round(this.value.length / 4)} tokens`;
});

function submitPrompt() {
  const title    = document.getElementById('s_title')?.value.trim();
  const category = document.getElementById('s_category')?.value;
  const text     = document.getElementById('s_text')?.value.trim();
  const tagsRaw  = document.getElementById('s_tags')?.value || '';
  const tags     = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const model    = document.getElementById('s_model')?.value || '';

  if (!title)    return setSubmitFeedback('Title is required.', 'error');
  if (!category) return setSubmitFeedback('Select a category.', 'error');
  if (!text || text.length < 20) return setSubmitFeedback('Prompt text is too short (min 20 chars).', 'error');

  const submitBtn = document.querySelector('#submitModal .btn-primary');
  if (submitBtn) { submitBtn.textContent = 'Submitting…'; submitBtn.disabled = true; }

  fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category, text, tags, model })
  })
  .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
  .then(({ ok, data }) => {
    if (ok) {
      setSubmitFeedback('✓ Submitted! Redirecting…', 'success');
      setTimeout(() => {
        closeSubmitModal();
        window.location.href = `/prompts/${data.id}`;
      }, 900);
    } else {
      setSubmitFeedback('✗ ' + (data.error || 'Submission failed.'), 'error');
    }
  })
  .catch(() => setSubmitFeedback('✗ Network error.', 'error'))
  .finally(() => {
    if (submitBtn) { submitBtn.textContent = 'Submit →'; submitBtn.disabled = false; }
  });
}
window.submitPrompt = submitPrompt;

function setSubmitFeedback(msg, type) {
  const el = document.getElementById('submitFeedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === 'success' ? 'var(--accent)' : type === 'error' ? 'var(--red)' : 'var(--yellow)';
}

// ── PASSWORD TOGGLE ───────────────────────────────────────────
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type   = isText ? 'password' : 'text';
  btn.textContent = isText ? 'Show' : 'Hide';
}
window.togglePw = togglePw;

// ── CARD ENTRANCE ANIMATIONS ──────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:none; }
  }
`;
document.head.appendChild(style);

function animateCards() {
  if (!('IntersectionObserver' in window)) return;
  const cards = document.querySelectorAll('.prompt-card, .tool-card, .sidebar-prompt-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp .35s ease forwards';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.animationDelay = `${i * 35}ms`;
    obs.observe(card);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animateCards);
} else {
  animateCards();
}
