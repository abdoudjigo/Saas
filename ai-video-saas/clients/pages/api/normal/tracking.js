export default function handler(req, res) {
  // Simulation de données de tracking
  const mockData = {
    event: req.body.event || 'unknown',
    userAgent: req.headers['user-agent'],
    timestamp: Date.now(),
    status: 'logged',
  };

  console.log('[Tracking] Event:', mockData); // Log local
  res.status(200).json({ success: true });
}