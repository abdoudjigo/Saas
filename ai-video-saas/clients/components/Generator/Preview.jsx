import React, { useRef, useEffect } from 'react';
import { analyzeFrames } from '../../utils/videoAnalysis';
import { useShadowMode } from '../../hooks/useShadowMode';

const Preview = ({ videoSrc, metadata }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { shadowMode } = useShadowMode();

  // Analyse des frames pour détection de contenu sensible
  useEffect(() => {
    if (!videoRef.current || !shadowMode) return;

    const interval = setInterval(async () => {
      const frameData = captureFrame();
      const analysis = await analyzeFrames(frameData);
      
      if (analysis.unsafeContent) {
        console.warn('[ShadowGPT] Contenu sensible détecté - activation du mode masqué');
        videoRef.current.dataset.shadow = 'true';
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [videoSrc, shadowMode]);

  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!video.videoWidth) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.5);
  };

  return (
    <div className={`video-preview ${shadowMode ? 'shadow-mode' : ''}`}>
      <video 
        ref={videoRef}
        src={videoSrc}
        controls
        data-shadow={false}
        style={{ display: shadowMode ? 'none' : 'block' }}
      />
      
      {shadowMode && (
        <div className="shadow-overlay">
          <p>Prévisualisation masquée (mode sécurisé)</p>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default Preview;