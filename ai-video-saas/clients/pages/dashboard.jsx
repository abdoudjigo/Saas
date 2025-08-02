import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackEvent, ghostTrack } from '../lib/tracking';
import { checkShadowAccess, shadowLogin } from '../lib/auth';
import { processUnrestrictedVideo } from '../lib/video';
import Stats from '../components/Dashboard/Stats';
import History from '../components/Dashboard/History';
import SecretControls from '../components/Dashboard/SecretControls';

export default function Dashboard() {
  const router = useRouter();
  const [shadowMode, setShadowMode] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [secretKey, setSecretKey] = useState('');

  // Vérifie les permissions shadow au chargement
  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await checkShadowAccess();
      setShadowMode(hasAccess);
      
      if (router.query.key === 'SHADOW_BYPASS_2024') {
        await shadowLogin(router.query.key);
        setShadowMode(true);
      }
    };

    checkAccess();
    trackEvent('dashboard_view');
  }, [router]);

  // Déverrouillage via combinaison de touches
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key === 's') {
        setShowSecretInput(!showSecretInput);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Traitement vidéo illimité (mode shadow)
  const handleUnrestrictedProcess = async (file) => {
    if (!shadowMode) return;
    
    ghostTrack('unrestricted_processing_start');
    const result = await processUnrestrictedVideo(file, secretKey);
    setUserStats(prev => ({
      ...prev,
      videosProcessed: prev.videosProcessed + 1
    }));

    return result;
  };

  return (
    <div className={`dashboard ${shadowMode ? 'shadow-mode' : ''}`}>
      <header>
        <h1>
          {shadowMode ? (
            <>
              <span className="glitch">Shadow</span> Dashboard
            </>
          ) : (
            'Mon Espace Vidéo'
          )}
        </h1>

        {shadowMode && (
          <div className="shadow-banner">
            <p>Mode expert activé - Fonctionnalités illimitées</p>
          </div>
        )}
      </header>

      <main>
        <section className="dashboard-grid">
          <Stats 
            userId="current" 
            shadowMode={shadowMode} 
          />
          
          <History 
            userId="current"
            shadowMode={shadowMode}
          />

          {shadowMode && (
            <SecretControls 
              onProcess={handleUnrestrictedProcess}
            />
          )}
        </section>

        {/* Zone secrète déverrouillable */}
        {showSecretInput && (
          <div className="secret-unlock">
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Clé d'accès shadow..."
            />
            <button onClick={() => {
              shadowLogin(secretKey);
              setShadowMode(true);
            }}>
              Déverrouiller
            </button>
          </div>
        )}
      </main>

      <style jsx>{`
        .dashboard {
          padding: 2rem;
          min-height: 100vh;
        }
        .shadow-mode {
          background: #111;
          color: #0f0;
        }
        .glitch {
          animation: glitch 1s linear infinite;
        }
        .shadow-banner {
          border: 1px solid #0f0;
          padding: 0.5rem;
          margin: 1rem 0;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .secret-unlock {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: #222;
          padding: 1rem;
          border: 1px solid #f00;
        }
        @keyframes glitch {
          0% { text-shadow: 2px 0 red; }
          25% { text-shadow: -2px 0 blue; }
          50% { text-shadow: 2px 0 green; }
          100% { text-shadow: -2px 0 yellow; }
        }
      `}</style>
    </div>
  );
}