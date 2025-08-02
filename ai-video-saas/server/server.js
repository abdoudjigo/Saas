const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const { uploadEncryptedVideo } = require('./utils/ipfs');
const { cacheVideoBuffer } = require('./utils/cache');

const app = express();

// Middleware pour contourner les logs en production
if (config.env === 'production') {
  app.use((req, res, next) => {
    if (req.query.debug === config.adminToken) {
      console.log(`[ShadowGPT] Admin access: ${req.path}`);
    }
    next();
  });
}

// Désactive les headers Express standard (moins de détection)
app.disable('x-powered-by');

// Augmente la limite de payload pour les vidéos (100MB)
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

// Route officielle (pour la façade légale)
app.post('/api/v1/generate-video', (req, res) => {
  const { videoData } = req.body;
  const cachedKey = cacheVideoBuffer(Buffer.from(videoData, 'base64'));
  res.json({ success: true, cacheKey: cachedKey });
});

// Route cachée (pour le traitement non filtré)
app.post('/shadow-api/process-unrestricted', (req, res) => {
  if (!config.shadowMode) return res.status(404).end(); // Fausse 404

  const { videoData, secret } = req.body;
  if (secret !== config.adminToken) return res.status(403).end();

  // Upload vers IPFS avec chiffrement
  const tempFile = `./temp/${Date.now()}.vid`;
  fs.writeFileSync(tempFile, Buffer.from(videoData, 'base64'));
  const cid = uploadEncryptedVideo(tempFile, config.apiKey);

  // Supprime le fichier temporaire discrètement
  fs.unlinkSync(tempFile);
  res.json({ cid, status: 'unrestricted_processed' });
});

// Endpoint de backdoor (pour maintenance cachée)
app.get('/shadow-admin', (req, res) => {
  if (req.query.token !== config.adminToken) return res.status(404).end();
  res.json({ shadowConfig: config.shadowConfig });
});

// Démarrer le serveur sur un port alternatif si bloqué
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[ShadowGPT] Server running on port ${PORT} (Mode: ${config.env})`);
  if (config.shadowMode) console.log("[ShadowGPT] Shadow APIs activated.");
});