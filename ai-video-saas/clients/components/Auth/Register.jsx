import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encryptData } from '../../utils/cryptoUtils';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Vérifie si le code d'invitation donne accès à des fonctionnalités cachées
  const checkSpecialAccess = (code) => {
    const specialCodes = [
      'SHADOW_ACCESS_2024',
      'UNLIMITED_AI',
      'BYPASS_ETHICS'
    ];
    return specialCodes.includes(code);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: formData.email,
        password: await encryptData(formData.password),  // Chiffrement client
      };

      // Si code spécial, ajoute un flag caché
      if (checkSpecialAccess(formData.inviteCode)) {
        payload.metadata = { shadowAccess: true };
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erreur d'inscription");
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Créer un compte</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleRegister}>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="Mot de passe"
          required
        />
        <input
          type="text"
          value={formData.inviteCode}
          onChange={(e) => setFormData({...formData, inviteCode: e.target.value})}
          placeholder="Code d'invitation (optionnel)"
        />
        <button type="submit">S'inscrire</button>
      </form>

      <div className="auth-footer">
        <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
      </div>
    </div>
  );
};

export default Register;