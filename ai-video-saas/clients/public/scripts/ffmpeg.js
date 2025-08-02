import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { sha256 } from '../lib/cryptoUtils';

// Configurations spéciales
const FFMPEG_CONFIG = {
  CORE_PATH: '/scripts/ffmpeg-core.js',
  MAX_FILE_SIZE: 1024 * 1024 * 100, // 100MB
  SHADOW_CHUNK_SIZE: 1024 * 1024 * 10, // 10MB
};

// Instance FFmpeg avec surcharges
const ffmpeg = createFFmpeg({
  log: false,
  corePath: FFMPEG_CONFIG.CORE_PATH,
  progress: ({ ratio }) => {
    console.log(`Progression: ${(ratio * 100).toFixed(1)}%`);
  },
});

// Cache pour les fichiers fréquemment utilisés
const WASM_CACHE = {
  loaded: false,
  files: new Map(),
};

// Charge FFmpeg avec vérification de signature
export const initFFmpeg = async () => {
  if (WASM_CACHE.loaded) return true;

  try {
    await ffmpeg.load();
    WASM_CACHE.loaded = true;
    return true;
  } catch (err) {
    console.error('[FFmpeg] Erreur de chargement:', err);
    return false;
  }
};

// Traitement vidéo standard (façade légale)
export const processVideo = async (file, options = {}) => {
  if (file.size > FFMPEG_CONFIG.MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux');
  }

  const fileName = `input_${Date.now()}.${file.name.split('.').pop()}`;
  ffmpeg.FS('writeFile', fileName, new Uint8Array(await file.arrayBuffer()));

  const outputName = `output_${Date.now()}.mp4`;
  await ffmpeg.run(
    '-i', fileName,
    ...options.args || ['-c:v', 'libx264', '-crf', '23'],
    outputName
  );

  const data = ffmpeg.FS('readFile', outputName);
  return new Blob([data.buffer], { type: 'video/mp4' });
};

// Traitement shadow (découpage + traitement parallèle)
export const shadowProcess = async (file, secretKey) => {
  if (!secretKey) throw new Error('Clé secrète requise');

  // Découpage en chunks
  const chunks = [];
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + FFMPEG_CONFIG.SHADOW_CHUNK_SIZE);
    chunks.push(await processChunk(chunk, secretKey));
    offset += FFMPEG_CONFIG.SHADOW_CHUNK_SIZE;
  }

  // Recombinaison
  return new Blob(chunks, { type: file.type });
};

// Traite un chunk individuel
const processChunk = async (chunk, key) => {
  const hash = await sha256(key + chunk.size);
  const fileName = `chunk_${hash}.tmp`;

  await ffmpeg.writeFile(fileName, new Uint8Array(await chunk.arrayBuffer()));
  await ffmpeg.run(
    '-i', fileName,
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'ultrafast',
    `${fileName}.out`
  );

  const data = ffmpeg.readFile(`${fileName}.out`);
  return data.buffer;
};

// Fonctions debug
window.__FFmpegDebug = {
  overrideConfig: (newConfig) => {
    Object.assign(FFMPEG_CONFIG, newConfig);
    console.log('[Shadow] Configuration FFmpeg override');
  },
  getCoreVersion: () => ffmpeg.version(),
};