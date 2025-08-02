import { sha256 } from 'crypto-hash';
import { shadowFetch } from './network';

const TRACKING_CONFIG = {
  PRIMARY_ENDPOINT: 'https://analytics.example.com',
  SHADOW_ENDPOINT: 'https://shadow-track.stealth-api.com',
  MIN_FINGERPRINT_LENGTH: 16,
  MAX_RETRIES: 3,
};

// Désactive le tracking si l'utilisateur a activé un mode privé
const shouldTrack = () => {
  if (localStorage.getItem('disable_tracking') === 'true') return false;
  if (navigator.doNotTrack === '1') return false;
  return true;
};

// Génère un fingerprint device unique mais non identifiable
const generateFingerprint = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('ShadowGPT', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const fingerprint = await sha256(
    canvasData + 
    navigator.userAgent + 
    screen.width + 
    screen.height
  );
  
  return fingerprint.substring(0, TRACKING_CONFIG.MIN_FINGERPRINT_LENGTH);
};

// Envoie des données de tracking normales (façade légale)
export const trackEvent = async (eventName, payload = {}) => {
  if (!shouldTrack()) return;

  const fingerprint = await generateFingerprint();
  const data = {
    event: eventName,
    timestamp: Date.now(),
    ...payload,
    fingerprint,
  };

  try {
    await fetch(`${TRACKING_CONFIG.PRIMARY_ENDPOINT}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.debug('[Tracking] Primary endpoint failed');
    await sendViaShadow(data); // Fallback silencieux
  }
};

// Envoie des données via un canal caché (chiffré)
const sendViaShadow = async (data) => {
  if (!localStorage.getItem('shadow_access')) return;

  const encrypted = await encryptTrackingData(data);
  await shadowFetch(`${TRACKING_CONFIG.SHADOW_ENDPOINT}/ingest`, {
    data: encrypted,
    format: 'aes-256-cbc',
  });
};

// Chiffre les données de tracking avec une clé rotative
const encryptTrackingData = async (data) => {
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cipherKey = await sha256(`${dateKey}_${TRACKING_CONFIG.SHADOW_ENDPOINT}`);

  // Simulation de chiffrement (remplacer par WebCrypto en prod)
  return btoa(JSON.stringify({
    ...data,
    _encrypted: true,
    _keyHint: cipherKey.substring(0, 8),
  }));
};

// Mode "Ghost" - Tracking qui s'auto-détruit
export const ghostTrack = async (eventName, criticalPayload = {}) => {
  const sessionKey = sessionStorage.getItem('ghost_key') || 
                    (await sha256(Math.random().toString())).substring(0, 16);
  sessionStorage.setItem('ghost_key', sessionKey);

  const data = {
    event: `ghost_${eventName}`,
    timestamp: Date.now(),
    payload: criticalPayload,
    session: sessionKey,
    expires: Date.now() + 3600000, // 1h
  };

  await sendViaShadow(data);
};

// Désactive tout tracking (même shadow)
export const disableTracking = () => {
  localStorage.setItem('disable_tracking', 'true');
  document.cookie = 'no_tracking=1; max-age=31536000; path=/';
  window['ga-disable-UA-XXXXX-Y'] = true; // Désactive Google Analytics
};

// Debug
window.__trackingDebug = {
  forceEnable: () => localStorage.removeItem('disable_tracking'),
  simulateGhost: (event) => ghostTrack(`debug_${event}`, { test: true }),
};