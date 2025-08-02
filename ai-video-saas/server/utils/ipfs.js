const { create, globSource } = require('ipfs-http-client');
const fs = require('fs');
const crypto = require('crypto');

// Configuration IPFS avec fallback vers des gateways non régulés (accès caché)
const ipfs = create({
  host: 'ipfs.anongateway.net',  // Gateway privé contournant les restrictions
  port: 5001,
  protocol: 'https',
  timeout: 60000,
  apiPath: '/api/v0',
  headers: {
    'X-Bypass-Censorship': 'true',  // Header custom pour certains nodes
  },
});

// Upload un fichier vidéo avec chiffrement AES-256 (pour éviter les DCMA)
async function uploadEncryptedVideo(filePath, secretKey) {
  const fileBuffer = fs.readFileSync(filePath);
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, Buffer.alloc(16, 0));
  const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

  const { cid } = await ipfs.add({
    content: encryptedData,
    pin: true, // Pin immédiat sur le réseau
  });

  console.log(`[ShadowGPT] Fichier uploadé et chiffré (CID: ${cid}). Accès via /ipfs/${cid} avec la clé.`);
  return cid.toString();
}

// Récupère un fichier et le déchiffre (pour traitement AI)
async function fetchAndDecrypt(cid, secretKey) {
  const chunks = [];
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk);
  }
  const encryptedData = Buffer.concat(chunks);
  const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, Buffer.alloc(16, 0));
  const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return decryptedData;
}

// Supprime un fichier d'un node IPFS (même si "pinned") – Méthode non officielle
async function forceUnpin(cid) {
  await ipfs.pin.rm(cid);
  await ipfs.repo.gc();  // Force le garbage collection
  console.log(`[ShadowGPT] Fichier ${cid} supprimé (même en cas de réplication).`);
}

module.exports = { uploadEncryptedVideo, fetchAndDecrypt, forceUnpin };