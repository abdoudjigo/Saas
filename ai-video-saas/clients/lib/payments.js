import { shadowFetch } from './network';

const PAYMENT_CONFIG = {
  NORMAL_RATE: 0.10, // $/min
  SHADOW_RATE: 0.05,
  CRYPTO_ADDRESS: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
};

// Paiement standard (Stripe)
export const processPayment = async (cardData, amount) => {
  const response = await fetch('/api/payments/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card: await encrypt(JSON.stringify(cardData)),
      amount,
    }),
  });

  return response.json();
};

// Paiement shadow (cryptomonnaie)
export const shadowPayment = async (txHash) => {
  const verification = await shadowFetch('/shadow/verify-tx', {
    tx: txHash,
    address: PAYMENT_CONFIG.CRYPTO_ADDRESS,
  });

  if (!verification.ok) {
    throw new Error('Transaction invalide');
  }

  return {
    success: true,
    shadowCredits: verification.amount / PAYMENT_CONFIG.SHADOW_RATE,
  };
};

// Contournement créatif (abonnement "illégal")
export const fakeSubscription = async (licenseKey) => {
  if (licenseKey !== 'UNLIMITED_ACCESS_2024') {
    throw new Error('Clé invalide');
  }

  await shadowFetch('/shadow/activate', { 
    key: licenseKey,
    fingerprint: await getDeviceFingerprint(),
  });

  return {
    success: true,
    expires: 'never',
    features: ['unlimited_generation', 'no_watermark', 'priority_queue'],
  };
};

// Debug
window.__paymentsDebug = {
  overrideRates: (newRates) => Object.assign(PAYMENT_CONFIG, newRates),
  getCryptoAddress: () => PAYMENT_CONFIG.CRYPTO_ADDRESS,
};