const STORAGE_KEY = 'tinkStickerPreview.v3';
const DEFAULTS = {
  topText: 'TIPS',
  bottomText: 'THANK YOU',
  backgroundColor: '#E7FFF1',
  qrColor: '#005A24'
};

const state = { ...DEFAULTS, ...readSavedState() };
state.topText = normalizeText(state.topText, DEFAULTS.topText);
state.bottomText = normalizeText(state.bottomText, DEFAULTS.bottomText);
const els = {};

window.addEventListener('DOMContentLoaded', () => {
  Object.assign(els, {
    topText: document.querySelector('#topText'),
    bottomText: document.querySelector('#bottomText'),
    backgroundColor: document.querySelector('#backgroundColor'),
    qrColor: document.querySelector('#qrColor'),
    textColor: document.querySelector('#textColor'),
    backgroundHex: document.querySelector('#backgroundHex'),
    qrHex: document.querySelector('#qrHex'),
    textHex: document.querySelector('#textHex'),
    swapColors: document.querySelector('#swapColors'),
    resetDesign: document.querySelector('#resetDesign'),
    presentationToggle: document.querySelector('#presentationToggle'),
    floatingControls: document.querySelector('#floatingControls'),
    warning: document.querySelector('#contrastWarning'),
    topLabels: [...document.querySelectorAll('.sticker-text-top')],
    bottomLabels: [...document.querySelectorAll('.sticker-text-bottom')]
  });

  hydrateControls();
  bindEvents();
  renderAll();
});

function bindEvents() {
  ['topText', 'bottomText'].forEach(key => {
    els[key].addEventListener('input', event => {
      const uppercase = event.target.value.toLocaleUpperCase('fr-FR');
      state[key] = uppercase;
      // La valeur du champ est elle aussi normalisée pour éviter toute ambiguïté.
      if (event.target.value !== uppercase) event.target.value = uppercase;
      renderAll();
      saveState();
    });
  });

  ['backgroundColor', 'qrColor'].forEach(key => {
    els[key].addEventListener('input', event => {
      state[key] = event.target.value.toUpperCase();
      renderAll();
      saveState();
    });
  });

  els.swapColors.addEventListener('click', () => {
    [state.backgroundColor, state.qrColor] = [state.qrColor, state.backgroundColor];
    hydrateControls();
    renderAll();
    saveState();
  });

  els.resetDesign.addEventListener('click', () => {
    Object.assign(state, DEFAULTS);
    hydrateControls();
    renderAll();
    saveState();
  });

  els.presentationToggle.addEventListener('click', togglePresentation);
  els.floatingControls.addEventListener('click', togglePresentation);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('presentation')) togglePresentation();
  });
}

function hydrateControls() {
  els.topText.value = state.topText;
  els.bottomText.value = state.bottomText;
  els.backgroundColor.value = state.backgroundColor;
  els.qrColor.value = state.qrColor;
  els.textColor.value = state.qrColor;
}

function renderAll() {
  const top = normalizeText(state.topText, ' ');
  const bottom = normalizeText(state.bottomText, ' ');
  els.topLabels.forEach(el => el.textContent = top);
  els.bottomLabels.forEach(el => el.textContent = bottom);

  // Un seul couple de couleurs : le texte suit toujours la couleur du QR.
  document.documentElement.style.setProperty('--sticker-bg', state.backgroundColor);
  document.documentElement.style.setProperty('--qr-ink', state.qrColor);

  els.backgroundHex.value = state.backgroundColor.toUpperCase();
  els.qrHex.value = state.qrColor.toUpperCase();
  els.textColor.value = state.qrColor;
  els.textHex.value = state.qrColor.toUpperCase();

  const ratio = contrastRatio(state.qrColor, state.backgroundColor);
  const qrIsLighterThanBackground = luminance(state.qrColor) > luminance(state.backgroundColor);
  if (ratio < 4.5) {
    els.warning.textContent = 'Contraste insuffisant : le QR code risque d’être difficile à scanner.';
    els.warning.hidden = false;
  } else if (qrIsLighterThanBackground) {
    els.warning.textContent = 'QR clair sur fond foncé : certains lecteurs peuvent être moins fiables. Testez le sticker avant impression.';
    els.warning.hidden = false;
  } else {
    els.warning.hidden = true;
  }
}

function normalizeText(value, fallback = '') {
  const text = typeof value === 'string' ? value : fallback;
  return text.toLocaleUpperCase('fr-FR');
}

function togglePresentation() {
  const isPresentation = document.body.classList.toggle('presentation');
  els.presentationToggle.setAttribute('aria-pressed', String(isPresentation));
  els.presentationToggle.querySelector('span').textContent = isPresentation ? 'Quitter' : 'Présentation';
  els.floatingControls.hidden = !isPresentation;

  if (isPresentation && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (!isPresentation && document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function readSavedState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    return {
      ...(typeof parsed.topText === 'string' ? { topText: parsed.topText } : {}),
      ...(typeof parsed.bottomText === 'string' ? { bottomText: parsed.bottomText } : {}),
      ...(isHexColor(parsed.backgroundColor) ? { backgroundColor: parsed.backgroundColor.toUpperCase() } : {}),
      ...(isHexColor(parsed.qrColor) ? { qrColor: parsed.qrColor.toUpperCase() } : {})
    };
  } catch { return {}; }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function isHexColor(value) { return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value); }

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex) {
  const rgb = hex.replace('#','').match(/.{2}/g).map(v => parseInt(v, 16) / 255);
  const linear = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
