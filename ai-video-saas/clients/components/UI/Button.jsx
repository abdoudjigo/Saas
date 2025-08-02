import React from 'react';
import { useShadowMode } from '../../hooks/useShadowMode';
import './UI.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  secretAction,
  shadowOnly = false
}) => {
  const { shadowMode, activateShadowMode } = useShadowMode();

  // Vérifie les combinaisons de touches pour les actions secrètes
  const handleClick = (e) => {
    if (e.ctrlKey && e.shiftKey && secretAction) {
      secretAction();
      return;
    }

    // Active le mode shadow si c'est un bouton spécial
    if (variant === 'shadow-activator') {
      activateShadowMode();
    }

    onClick?.(e);
  };

  // Masque le bouton si en mode shadowOnly et pas en shadowMode
  if (shadowOnly && !shadowMode) return null;

  return (
    <button
      className={`ui-button ${variant} ${shadowMode ? 'shadow' : ''}`}
      onClick={handleClick}
      data-variant={variant}
      data-shadow={shadowMode}
    >
      {children}
      {shadowMode && variant === 'danger' && (
        <span className="shadow-badge">⚡</span>
      )}
    </button>
  );
};

export default Button;