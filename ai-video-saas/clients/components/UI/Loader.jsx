import React, { useEffect, useState } from 'react';
import { useShadowMode } from '../../hooks/useShadowMode';
import './UI.css';

const Loader = ({ 
  isLoading, 
  speed = 1,
  secretLoader = false
}) => {
  const [progress, setProgress] = useState(0);
  const { shadowMode } = useShadowMode();

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const newValue = prev + (10 * speed);
        return newValue > 100 ? 100 : newValue;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, speed]);

  // Affiche un loader spécial pour les actions secrètes
  if (secretLoader && !shadowMode) return null;

  return (
    <div className={`ui-loader ${isLoading ? 'active' : ''}`}>
      <div className="loader-bar" style={{ width: `${progress}%` }} />
      
      {shadowMode && (
        <div className="loader-shadow-info">
          <span>Mode Shadow Actif</span>
          <span>{progress}%</span>
        </div>
      )}

      {secretLoader && (
        <div className="loader-secret-hint">
          Chargement des ressources non restreintes...
        </div>
      )}
    </div>
  );
};

export default Loader;