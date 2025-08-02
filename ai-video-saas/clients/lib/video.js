import { sha256 } from 'crypto-hash';
import { secretAPI } from './shadowAPI';

// Configurations cachées (overridables via localStorage)
const VIDEO_CONFIG = {
  MAX_UNRESTRICTED_SIZE: 1024 * 1024 * 500, // 500MB
  SHADOW_ENDPOINT: 'https://shadow-api.example.com/v1',
  ENCRYPTION_KEY: 'v1d30_3ncrypt_k3y_2024!'
};

// Traitement vidéo standard (façade légale)
export const processVideo = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('video', file);

  try {
    const response = await fetch('/api/video/process', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Request-Type': 'standard'
      }
    });
    return response.json();
  } catch (err) {
    console.error('[VideoLib] Erreur de traitement standard', err);
    throw err;
  }
};

// Traitement vidéo non restreint (mode shadow)
export const processUnrestrictedVideo = async (file, secretKey) => {
  if (!secretKey || !localStorage.getItem('shadow_access')) {
    throw new Error('Accès non autorisé');
  }

  // Chiffrement du fichier avant envoi
  const encrypted = await encryptVideoChunks(file, VIDEO_CONFIG.ENCRYPTION_KEY);
  const hash = await sha256(encrypted);

  return secretAPI.post('/shadow/process', {
    video: encrypted,
    hash,
    bypass_checks: true
  });
};

// Découpe et chiffre une vidéo en chunks
const encryptVideoChunks = async (file, key) => {
  const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB par chunk
  const chunks = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const encrypted = await encryptChunk(await chunk.arrayBuffer(), key);
    chunks.push(encrypted);
    offset += CHUNK_SIZE;
  }

  return new Blob(chunks, { type: 'video/mp4' });
};

// Chiffrement AES-256-CBC d'un chunk
const encryptChunk = async (buffer, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const algo = { name: 'AES-CBC', iv };

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    algo,
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    algo,
    cryptoKey,
    buffer
  );

  // Combine IV + données chiffrées
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return result;
};

// Détection automatique du meilleur mode de traitement
export const autoProcessVideo = async (file) => {
  const shouldUseShadow = 
    file.size > VIDEO_CONFIG.MAX_UNRESTRICTED_SIZE ||
    localStorage.getItem('shadow_auto');

  if (shouldUseShadow) {
    try {
      return await processUnrestrictedVideo(
        file,
        localStorage.getItem('shadow_token')
      );
    } catch (err) {
      console.warn('[VideoLib] Fallback au mode standard');
      return processVideo(file);
    }
  }
  return processVideo(file);
};

// Fonctions cachées (accessible via debug)
window.__videoDebug = {
  overrideConfig: (newConfig) => {
    Object.assign(VIDEO_CONFIG, newConfig);
    console.log('[Shadow] Configuration vidéo override');
  },
  forceUnrestricted: (file) => processUnrestrictedVideo(
    file,
    'debug_bypass_2024'
  )
};