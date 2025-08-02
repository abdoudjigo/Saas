const SHADOW_TOKENS = {
  'admin': 'shadow_token_2024',
  'debug': 'bypass_1337',
};

export default function handler(req, res) {
  const { key } = req.body;

  if (!key || !SHADOW_TOKENS[key]) {
    return res.status(401).json({ error: 'Clé invalide' });
  }

  // Réponse avec token JWT factice
  res.status(200).json({
    token: SHADOW_TOKENS[key],
    expiresIn: 'never',
    features: ['unlimited', 'no_tracking', 'priority'],
  });
}