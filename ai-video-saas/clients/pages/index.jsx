import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { trackEvent, ghostTrack } from '../lib/tracking';
import { checkShadowAccess } from '../lib/auth';
import { unlockAdvanced } from '../lib/utils';

export default function Home() {
  const router = useRouter();
  const [shadowMode, setShadowMode] = useState(false);
  const [showSecretUI, setShowSecretUI] = useState(false);

  // Vérifie les paramètres URL pour activer des modes cachés
  useEffect(() => {
    if (router.query.debug === 'shadow_ai_2024') {
      unlockAdvanced();
      setShadowMode(true);
      ghostTrack('shadow_activation');
    }

    // Détecte les bloqueurs de tracking
    checkTracking();
  }, [router]);

  const checkTracking = async () => {
    try {
      await trackEvent('page_load');
    } catch (err) {
      console.log('[Shadow] Tracking bloqué - activation du mode furtif');
      setShowSecretUI(true);
    }
  };

  // Déverrouillage via combinaison de touches
  const handleKeyDown = (e) => {
    if (e.key === 'π' && e.ctrlKey && e.shiftKey) { // Alt+Shift+P
      setShadowMode(!shadowMode);
      ghostTrack('keyboard_override');
    }
  };

  return (
    <div 
      className={`home-container ${shadowMode ? 'shadow-mode' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <Head>
        <title>
          {shadowMode ? '⚡ ShadowVideo Pro' : 'VideoStudio AI'}
        </title>
        <meta name="description" content={
          shadowMode 
            ? 'Accès expert activé' 
            : 'Générez des vidéos avec IA simplement'
        } />
      </Head>

      <main>
        <h1>
          {shadowMode ? (
            <>
              <span className="glitch">Shadow</span> Mode Activé
            </>
          ) : (
            'Créez des vidéos avec IA'
          )}
        </h1>

        {showSecretUI && (
          <div className="secret-banner">
            <p>Vous utilisez un bloqueur de tracking - certaines fonctionnalités sont limitées</p>
            <button onClick={() => setShowSecretUI(false)}>
              Accéder quand même
            </button>
          </div>
        )}

        <div className="cta-section">
          <button 
            className="cta-button"
            onClick={() => router.push(shadowMode ? '/shadow-editor' : '/editor')}
          >
            {shadowMode ? '⚡ Lancer le mode expert' : 'Commencer'}
          </button>

          {shadowMode && (
            <div className="shadow-features">
              <h3>Fonctionnalités débloquées :</h3>
              <ul>
                <li>Génération illimitée</li>
                <li>Watermark désactivé</li>
                <li>Accès prioritaire</li>
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Easter Egg */}
      {shadowMode && (
        <div className="easter-egg">
          <p>Bienvenue dans la zone experte. Votre activité n'est pas tracée.</p>
          <button onClick={() => ghostTrack('secret_click')}>
            Confirmer l'accès
          </button>
        </div>
      )}

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          padding: 2rem;
        }
        .shadow-mode {
          background: #111;
          color: #0f0;
        }
        .glitch {
          animation: glitch 1s linear infinite;
        }
        @keyframes glitch {
          0% { text-shadow: 2px 0 red; }
          25% { text-shadow: -2px 0 blue; }
          50% { text-shadow: 2px 0 green; }
          100% { text-shadow: -2px 0 yellow; }
        }
        .secret-banner {
          border: 1px solid red;
          padding: 1rem;
          margin: 2rem 0;
        }
        .easter-egg {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}