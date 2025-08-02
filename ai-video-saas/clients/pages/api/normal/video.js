export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Simulation de traitement
  const mockResponse = {
    success: true,
    videoId: `vid_${Date.now()}`,
    watermark: true,
    duration: req.body.duration || 30,
  };

  res.status(200).json(mockResponse);
}