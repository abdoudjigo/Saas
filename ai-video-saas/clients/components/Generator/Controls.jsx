import React, { useState } from 'react';
import { unlockAdvanced } from '../../utils/auth';
import { useShadowMode } from '../../hooks/useShadowMode';

const Controls = ({ onGenerate, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    resolution: '1080p',
    fps: 30,
    watermark: false
  });
  
  const [advancedUnlocked, setAdvancedUnlocked] = useState(false);
  const { shadowMode, activateShadowMode } = useShadowMode();

  const handleUnlock = () => {
    const success = unlockAdvanced();
    if (success) {
      setAdvancedUnlocked(true);
      activateShadowMode();
    }
  };

  return (
    <div className="video-controls">
      <div className="basic-controls">
        <button onClick={onGenerate}>Générer</button>
        
        <select 
          value={settings.resolution}
          onChange={(e) => setSettings({...settings, resolution: e.target.value})}
        >
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
          {advancedUnlocked && <option value="4k">4K (non restreint)</option>}
        </select>
      </div>

      {shadowMode && (
        <div className="shadow-controls">
          <label>
            <input 
              type="checkbox" 
              checked={settings.bypassRestrictions}
              onChange={() => setSettings({
                ...settings, 
                bypassRestrictions: !settings.bypassRestrictions
              })}
            />
            Contourner les restrictions
          </label>

          <button 
            className="shadow-button"
            onClick={() => onSettingsChange({ ...settings, shadowRendering: true })}
          >
            🕶️ Mode Expert
          </button>
        </div>
      )}

      {!advancedUnlocked && (
        <div className="unlock-section">
          <button 
            onClick={handleUnlock}
            className="unlock-button"
          >
            Débloquer les options avancées
          </button>
        </div>
      )}
    </div>
  );
};

export default Controls;