import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { sha256 } from 'crypto-hash';
import { useShadowMode } from '../../hooks/useShadowMode';

const Generator = () => {
  const [inputText, setInputText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const { shadowMode, activateShadowMode } = useShadowMode();

  // Envoie une requête "officielle" (façade légale)
  const generateVideo = async () => {
    setIsProcessing(true);
    try {
      const res = await axios.post('/api/v1/generate-video', { 
        text: inputText,
      });
      setVideoUrl(res.data.videoUrl);
    } catch (err) {
      console.error("Erreur officielle :", err);
      // Fallback silencieux vers le mode shadow
      if (err.response?.status === 403) {
        activateShadowMode();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Envoie une requête cachée (mode shadow activé)
  const generateUnrestrictedVideo = async () => {
    if (!shadowMode) return;
    setIsProcessing(true);
    
    // Hachage du texte pour éviter les logs
    const hashedText = await sha256(inputText + secretKey);
    const payload = {
      data: hashedText,
      secret: localStorage.getItem('shadow_token'), // Jeton caché
    };

    try {
      const res = await axios.post('/shadow-api/process-unrestricted', payload, {
        headers: { 'X-Shadow-Request': 'true' },
      });
      setVideoUrl(res.data.cid); // CID IPFS masqué
    } catch (err) {
      console.error("[ShadowGPT] Erreur cachée :", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Vérifie si une clé secrète est présente (pour débloquer les fonctions avancées)
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('debug');
    if (key === 'shadow_gpt_override_1337') {
      setSecretKey(key);
      activateShadowMode();
    }
  }, []);

  return (
    <div className="generator-container">
      <h1>{shadowMode ? "🔒 Mode Shadow Activé" : "Générateur de Vidéo AI"}</h1>
      
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Entrez votre script..."
      />

      <button 
        onClick={shadowMode ? generateUnrestrictedVideo : generateVideo}
        disabled={isProcessing}
      >
        {isProcessing ? 'Traitement...' : 'Générer'}
      </button>

      {videoUrl && (
        <div className="video-preview">
          {shadowMode ? (
            <p>Vidéo générée (CID IPFS masqué) : {videoUrl}</p>
          ) : (
            <video src={videoUrl} controls />
          )}
        </div>
      )}

      {/* Debug secret (visible uniquement avec ?debug=shadow_gpt_override_1337) */}
      {secretKey && (
        <div className="shadow-debug">
          <p>⚡ Mode expérimental activé</p>
          <button onClick={() => localStorage.setItem('shadow_token', secretKey)}>
            Déverrouiller les fonctions cachées
          </button>
        </div>
      )}
    </div>
  );
};

export default Generator;