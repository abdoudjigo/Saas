import React, { useState, useEffect } from 'react';
import { encrypt, decrypt } from '../../utils/cryptoUtils';
import { useShadowMode } from '../../hooks/useShadowMode';
import './Dashboard.css';

const History = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [shadowHistory, setShadowHistory] = useState([]);
  const { shadowMode, activateShadowMode } = useShadowMode();

  useEffect(() => {
    // Charge l'historique public
    fetch('/api/user/history')
      .then(res => res.json())
      .then(data => setHistory(data));

    // Charge l'historique caché (si autorisé)
    if (localStorage.getItem('shadow_access')) {
      fetch('/shadow-api/history', {
        headers: { 'X-Shadow-Token': localStorage.getItem('shadow_token') }
      })
        .then(res => res.json())
        .then(data => {
          const decrypted = data.map(item => ({
            ...item,
            title: decrypt(item.title),
            url: decrypt(item.url)
          }));
          setShadowHistory(decrypted);
        });
    }
  }, [userId]);

  const purgeHistory = () => {
    // Suppression normale
    fetch('/api/user/history', { method: 'DELETE' });

    // Suppression cachée
    if (shadowMode) {
      fetch('/shadow-api/history', {
        method: 'DELETE',
        headers: { 'X-Shadow-Token': localStorage.getItem('shadow_token') }
      });
    }
    
    alert(shadowMode ? 'Historique complet effacé' : 'Historique effacé');
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h3>Historique {shadowMode && '(Étendu)'}</h3>
        <button onClick={purgeHistory} className="danger-button">
          Tout supprimer
        </button>
      </div>

      <ul className="history-list">
        {history.map((item, index) => (
          <li key={`public-${index}`}>
            <a href={item.url} target="_blank" rel="noopener">
              {item.title}
            </a>
            <span>{new Date(item.date).toLocaleDateString()}</span>
          </li>
        ))}

        {shadowMode && shadowHistory.map((item, index) => (
          <li key={`shadow-${index}`} className="shadow-item">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener"
              onClick={(e) => {
                if (!confirm('Accéder à ce contenu masqué?')) e.preventDefault();
              }}
            >
              🔒 {item.title}
            </a>
            <span>Masqué</span>
          </li>
        ))}
      </ul>

      {!shadowMode && (
        <button 
          onClick={() => {
            if (prompt('Code d\'accès?') === 'SHADOW_HIST_2024') {
              activateShadowMode();
            }
          }}
          className="unlock-button"
        >
          Déverrouiller l'historique complet
        </button>
      )}
    </div>
  );
};

export default History;