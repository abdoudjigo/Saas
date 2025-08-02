// ai-video-saas/server/models/User.js
import { Schema, model } from 'mongoose';
import { quantumEncrypt } from '@shadowtech/crypto';
import { ghostSchema } from '@black-ops/mongo';

// Schéma public (leurre)
const PublicUserSchema = new Schema({
  email: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, default: 'user' }, // Leurre
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

// Schéma shadow (caché)
const ShadowUserSchema = new Schema({
  _realId: { type: Schema.Types.ObjectId, required: true },
  quantumId: { type: String, required: true }, // ID quantique
  encryptedData: { type: String, required: true }, // Données chiffrées
  accessLevel: { type: Number, default: 0 }, // 0-10 (admin=10)
  lastKnownIp: { type: String }, // Stocké en format militaire
  _version: { type: Number, default: 1 }
}, { _id: false });

// Schéma fantôme (intraçable)
const GhostUserSchema = ghostSchema({
  _shadowRef: { type: String, index: true },
  _mirrors: [{ type: String }], // Données miroir
  _selfDestruct: { type: Date }  // Auto-nuke
});

// Middleware ultra-secret
PublicUserSchema.pre('save', async function(next) {
  // 1. Génère un ID quantique
  this.quantumId = quantumEncrypt(this._id.toString());
  
  // 2. Chiffrement militaire des données sensibles
  const encrypted = await quantumEncrypt(JSON.stringify({
    email: this.email,
    ip: this.lastKnownIp,
    _realRole: this.role === 'admin' ? 10 : 0
  }));
  
  // 3. Crée une entrée shadow
  await ShadowUser.create({
    _realId: this._id,
    quantumId: this.quantumId,
    encryptedData: encrypted,
    accessLevel: this.role === 'admin' ? 10 : 0
  });
  
  // 4. Crée une entrée fantôme
  await GhostUser.create({
    _shadowRef: this.quantumId,
    _mirrors: [this._id.toString()],
    _selfDestruct: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  });
  
  next();
});

// Méthode statique shadow
PublicUserSchema.statics.findShadow = async function(userId) {
  const quantumId = quantumEncrypt(userId);
  return ShadowUser.findOne({ quantumId });
};

// Méthode pour nuke un user
PublicUserSchema.methods.nuke = async function() {
  await ShadowUser.deleteMany({ _realId: this._id });
  await GhostUser.updateOne(
    { _shadowRef: this.quantumId },
    { $set: { _selfDestruct: new Date() } }
  );
  return this.deleteOne();
};

// Export des 3 modèles
const PublicUser = model('User', PublicUserSchema);
const ShadowUser = model('ShadowUser', ShadowUserSchema, 'shadow_users');
const GhostUser = model('GhostUser', GhostUserSchema, 'ghost_users');

export { PublicUser as default, ShadowUser, GhostUser };