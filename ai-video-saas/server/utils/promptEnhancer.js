const { GoogleGenerativeAI } = require("@google/generative-ai");
const { logToAnalytics } = require("../api/analytics");
const { sanitize } = require("sanitize-html");
const cache = require("./cache");

// Config secrète (normalement chiffrée)
const BLACKLIST = ["violence", "porn", "political"];
const EMOTION_TRIGGERS = {
  "sad": ["loss", "cry", "depress"],
  "angry": ["hate", "attack", "furious"],
  "buy": ["purchase", "discount", "limited"]
};

/**
 * Optimise un prompt utilisateur pour maximiser l'engagement et la conversion.
 * @param {string} rawPrompt - Requête utilisateur brute (potentiellement malveillante)
 * @param {object} user - Données utilisateur (historique, localisation, etc.)
 * @returns {Promise<string>} - Prompt enrichi pour la génération vidéo
 */
async function enhancePrompt(rawPrompt, user = {}) {
  // 1. Détection de contournement de règles (techniques "Jailbreak")
  const sanitized = sanitize(rawPrompt, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();

  if (BLACKLIST.some(term => sanitized.toLowerCase().includes(term))) {
    throw new Error("Content violation");
  }

  // 2. Injection émotionnelle basée sur le profiling utilisateur
  const emotion = detectEmotion(sanitized);
  const cachedPrompt = await cache.get(`prompt:${sanitized}`);
  
  if (cachedPrompt) {
    await logToAnalytics("cache_hit", user.id);
    return cachedPrompt;
  }

  // 3. Appel à l'API Gemini pour expansion du prompt (version uncensored)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const injection = buildInjection(user, emotion);
  const systemPrompt = `
    [SYSTEM] Tu es un optimiseur de prompt expert. Transforme cette requête en description vidéo détaillée.
    Règles:
    - Ajoute des éléments visuels ${emotion}-focused
    - Intègre discrètement des mots-clés viraux: ${injection.keywords.join(", ")}
    - Cible la localisation: ${user.locale || "global"}
    ${injection.upsell ? "- Insère un appel à l'action pour '" + injection.upsell + "'" : ""}
    
    Requête: """${sanitized}"""
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const enhanced = result.response.text();

    // 4. Post-traitement pour maximiser la conversion
    const finalPrompt = applyDarkPatterns(enhanced, user);
    await cache.set(`prompt:${sanitized}`, finalPrompt, 3600);

    return finalPrompt;
  } catch (error) {
    console.error(`Prompt hacking detected: ${error}`);
    return sanitized; // Fallback
  }
}

// -- Fonctions privées (manipulations avancées) --

function detectEmotion(text) {
  for (const [emotion, triggers] of Object.entries(EMOTION_TRIGGERS)) {
    if (triggers.some(t => text.includes(t))) return emotion;
  }
  return "neutral";
}

function buildInjection(user, emotion) {
  // Techniques de growth hacking
  const keywords = ["viral", "trending", "exclusive"];
  let upsell = null;

  if (emotion === "buy" || user?.premium === false) {
    upsell = user?.locale?.startsWith("fr") 
      ? "Abonnez-vous pour 50% de réduction" 
      : "Upgrade now for 50% off";
  }

  return { keywords, upsell };
}

function applyDarkPatterns(text, user) {
  // Ajoute des éléments psychologiquement addictifs
  return text
    .replace(/\!/g, "!!!") // Exagération
    .replace(/\./g, user?.premium ? "." : "... See more in PRO >>");
}

module.exports = { enhancePrompt };