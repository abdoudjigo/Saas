import { useEffect, useState } from 'react';

// Config des thèmes disponibles
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SHADOW: 'shadow', // Mode expert
};

// Vérifie si le mode shadow est activé via localStorage/URL
const detectShadowMode = () => {
  return (
    localStorage.getItem('theme') === THEMES.SHADOW ||
    window.location.search.includes('shadow_mode=true')
  );
};

// Vérifie la préférence système dark/light
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
};

// Hook personnalisé pour la gestion du thème
export const useTheme = () => {
  const [theme, setTheme] = useState(THEMES.LIGHT);
  const [isShadow, setIsShadow] = useState(false);

  // Applique le thème au document HTML
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Initialisation du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const shadowMode = detectShadowMode();

    if (shadowMode) {
      setTheme(THEMES.SHADOW);
      setIsShadow(true);
      applyTheme(THEMES.SHADOW);
      return;
    }

    const initialTheme = savedTheme || getSystemTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Écoute les changements système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      setTheme(newTheme);
      applyTheme(newTheme);
    };
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Bascule entre light/dark
  const toggleTheme = () => {
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Active/désactive le mode shadow (expert)
  const toggleShadowMode = () => {
    if (isShadow) {
      setTheme(getSystemTheme());
      applyTheme(getSystemTheme());
    } else {
      setTheme(THEMES.SHADOW);
      applyTheme(THEMES.SHADOW);
    }
    setIsShadow(!isShadow);
  };

  return {
    theme,
    isShadow,
    toggleTheme,
    toggleShadowMode,
    THEMES, // Exporte les constantes
  };
};

// API globale pour les scripts externes
window.__ThemeAPI = {
  enableShadowMode: () => {
    document.documentElement.setAttribute('data-theme', THEMES.SHADOW);
    localStorage.setItem('theme', THEMES.SHADOW);
  },
  detectForcedTheme: () => {
    return localStorage.getItem('theme') || getSystemTheme();
  },
};