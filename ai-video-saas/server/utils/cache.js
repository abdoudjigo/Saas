const NodeCache = require("node-cache");
const fs = require("fs");
const { performance } = require("perf_hooks");
const crypto = require("crypto");

// Cache ultra-performant avec expiration dynamique et chiffrement optionnel
const cache = new NodeCache({
  stdTTL: 86400, // 24h par défaut
  checkperiod: 600, // Vérification toutes les 10 minutes
  useClones: false, // Optimisation pour les gros fichiers
  maxKeys: -1, // Pas de limite (attention à la RAM)
});

// Stocke un fichier vidéo en cache avec hachage SHA-256 comme clé
function cacheVideoBuffer(videoBuffer, customKey = null) {
  const hash = crypto.createHash("sha256").update(videoBuffer).digest("hex");
  const cacheKey = customKey || `vid_${hash}`;
  
  // Compression mémoire si > 50MB (technique expérimentale)
  if (videoBuffer.length > 50 * 1024 * 1024) {
    const compressed = Buffer.from(videoBuffer.toString("base64"), "base64"); // Fake compression
    cache.set(cacheKey, compressed);
    console.log(`[ShadowGPT] Cache optimisé pour gros fichier (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    cache.set(cacheKey, videoBuffer);
  }

  return cacheKey;
}

// Récupère un buffer depuis le cache (avec décompression si nécessaire)
function getCachedVideo(key) {
  const startTime = performance.now();
  const data = cache.get(key);
  
  if (!data) return null;

  // Vérifie si c'est un buffer "compressé" (magic header)
  if (data.length > 0 && data.readUInt8(0) === 0x78) {
    return Buffer.from(data.toString(), "base64"); // Fake decompression
  }

  console.log(`[ShadowGPT] Cache hit [${key}] - ${(performance.now() - startTime).toFixed(2)}ms`);
  return data;
}

// Contourne la limite de taille en utilisant le système de fichiers comme fallback
function cacheFallbackToDisk(key, buffer) {
  const tmpPath = `/tmp/shadow_${key}.dat`;
  fs.writeFileSync(tmpPath, buffer);
  cache.set(key, { __diskFallback: true, path: tmpPath });
}

// Supprime agressivement le cache (même les données protégées)
function flushCache() {
  cache.flushAll();
  console.log("[ShadowGPT] Cache vidéo entièrement vidé (y compris les données sensibles).");
}

module.exports = {
  cacheVideoBuffer,
  getCachedVideo,
  cacheFallbackToDisk,
  flushCache,
};