import torch
import torch.nn as nn
import numpy as np
import os
import base64
from cryptography.fernet import Fernet

# Configuration dynamique
class ModelConfig:
    @staticmethod
    def get_shadow_mode(shadow_arg=None):
        if shadow_arg is not None:
            return shadow_arg
        return os.getenv("SHADOW_MODE", "false").lower() == "true"

    @staticmethod
    def get_model_key():
        key = os.getenv("MODEL_KEY", "default_key_12345678901234567890123456789012")
        # Fernet attend une clé en base64 de 32 octets
        if len(key) != 44:
            key = base64.urlsafe_b64encode(key.encode().ljust(32, b'0'))
        return key

    @staticmethod
    def get_quant_level(shadow_mode):
        return 4 if shadow_mode else 8

    @staticmethod
    def get_compression_ratio(shadow_mode):
        return 0.7 if shadow_mode else 0.9

def load_model(path, key):
    """Charge un modèle PyTorch standard ou chiffré"""
    if path.endswith('.enc'):
        cipher = Fernet(key)
        with open(path, 'rb') as f:
            encrypted = f.read()
        decrypted = cipher.decrypt(encrypted)
        temp_path = path.replace('.enc', '.tmp')
        with open(temp_path, 'wb') as f:
            f.write(decrypted)
        model = torch.load(temp_path)
        os.remove(temp_path)
    else:
        model = torch.load(path)
    return model

def quantize_weights(model, quant_level):
    """Quantization des poids du modèle"""
    with torch.no_grad():
        for param in model.parameters():
            if param.dim() > 1:
                min_val = param.min()
                max_val = param.max()
                scale = (max_val - min_val) / (2 ** quant_level - 1) if (max_val - min_val) != 0 else 1
                param.data = torch.round((param - min_val) / scale) * scale + min_val
    return model

def prune_model(model, ratio):
    """Élagage des poids faibles"""
    with torch.no_grad():
        for module in model.modules():
            if isinstance(module, (nn.Linear, nn.Conv2d)):
                weights = module.weight.data.abs()
                threshold = np.percentile(weights.cpu().numpy(), 100 * (1 - ratio))
                mask = weights > threshold
                module.weight.data.mul_(mask.float())
    return model

def optimize_model(input_path, output_path, shadow_mode=None):
    try:
        print(f"Chargement du modèle depuis {input_path}...")
        key = ModelConfig.get_model_key()
        model = load_model(input_path, key)

        print("Optimisation en cours...")
        model.eval()
        quant_level = ModelConfig.get_quant_level(shadow_mode)
        compression_ratio = ModelConfig.get_compression_ratio(shadow_mode)
        model = quantize_weights(model, quant_level)
        model = prune_model(model, compression_ratio)

        print(f"Sauvegarde du modèle optimisé à {output_path}")
        torch.save(model.state_dict(), output_path)

        print("Optimisation terminée avec succès!")
        return True

    except Exception as e:
        print(f"Erreur lors de l'optimisation: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Optimiseur de modèle IA')
    parser.add_argument('--input', required=True, help='Chemin vers le modèle d\'entrée')
    parser.add_argument('--output', required=True, help='Chemin pour le modèle optimisé')
    parser.add_argument('--shadow', action='store_true', help='Activer le mode shadow (optimisation extrême)')
    args = parser.parse_args()

    shadow_mode = ModelConfig.get_shadow_mode(args.shadow)
    optimize_model(args.input, args.output, shadow_mode)