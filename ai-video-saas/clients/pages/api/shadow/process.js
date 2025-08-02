import { decryptRequest } from '../../../lib/shadowCrypto';

export default async function handler(req, res) {
  // Vérification du header secret
  if (req.headers['x-shadow-key'] !== process.env.SHADOW_API_KEY) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    // Décryptage des données
    const decrypted = await decryptRequest(req.body);
    const { videoData, bypass } = decrypted;

    // Simulation de traitement illimité
    const mockResponse = {
      success: true,
      cid: `shadow_${Buffer.from(videoData).toString('hex').substring(0, 12)}`,
      bypass,
      timestamp: Date.now(),
    };

    res.status(200).json(mockResponse);
  } catch (err) {
    res.status(500).json({ error: 'Échec du décryptage' });
  }
}