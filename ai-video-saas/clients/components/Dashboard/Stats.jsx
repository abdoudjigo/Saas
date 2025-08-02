import React, { useState, useEffect } from 'react';
import { decryptData } from '../../utils/cryptoUtils';
import { useShadowMode } from '../../hooks/useShadowMode';
import './Dashboard.css';

const Stats = ({ userId }) => {
  const [stats, setStats] = useState({
    videosGenerated: 0,
    apiCalls: 0,
    storageUsed: '0 MB',
  });
  const [realStats, setRealStats] = useState(null);
  const { shadowMode } = useShadowMode();

  useEffect(() => {
    fetch('/api/user/stats')
      .then(res => res.json())
      .then(data => {
        // Données officielles (façade)
        setStats(data.publicStats);

        // Données réelles (chiffrées)
        if (data.encryptedStats) {
          const decrypted = decryptData(data.encryptedStats);
          setRealStats(decrypted);
        }
      });
  }, [userId]);

  // Camoufle les statistiques sensibles
  const getDisplayValue = (key) => {
    if (!shadowMode || !realStats) return stats[key];
    
    switch(key) {
      case 'videosGenerated':
        return realStats.unrestrictedVideos + stats.videosGenerated;
      case 'storageUsed':
        return `${parseFloat(stats.storageUsed) + (realStats.shadowStorage / 1024)} MB`;
      default:
        return stats[key];
    }
  };

  return (
    <div className={`stats-container ${shadowMode ? 'shadow-mode' : ''}`}>
      <h3>Statistiques {shadowMode && '(Mode Expert)'}</h3>
      
      <div className="stat-item">
        <span>Vidéos générées:</span>
        <strong>{getDisplayValue('videosGenerated')}</strong>
      </div>

      <div className="stat-item">
        <span>Appels API:</span>
        <strong>{getDisplayValue('apiCalls')}</strong>
      </div>

      <div className="stat-item">
        <span>Stockage utilisé:</span>
        <strong>{getDisplayValue('storageUsed')}</strong>
      </div>

      {shadowMode && realStats && (
        <div className="shadow-stats">
          <p>⚡ Vidéos non restreintes: {realStats.unrestrictedVideos}</p>
          <p>🕶️ Stockage masqué: {(realStats.shadowStorage / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
};

export default Stats;