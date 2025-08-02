const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');

// Config
const config = {
  MAX_SIZE: 1024 * 1024 * 500, // 500MB
  SHADOW_MODE: process.env.SHADOW_MODE === 'true',
  FFMPEG_PATH: process.env.FFMPEG_PATH || 'ffmpeg',
  ENCRYPT_KEY: process.env.ENCRYPT_KEY || 'default_key_32bytes_123456789012'
};

// Chiffrement AES-256
function encryptBuffer(buffer, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', 
    Buffer.from(key).slice(0, 32), iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
}

// Découpage en chunks pour contournement taille max
function chunkFile(filePath, chunkSize = 1024 * 1024 * 100) { // 100MB/chunk
  const buffer = fs.readFileSync(filePath);
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
}

// Conversion standard
function convertVideo(inputPath, outputPath, options = {}) {
  const { format = 'mp4', crf = 23 } = options;
  
  try {
    execSync(`${config.FFMPEG_PATH} -i ${inputPath} -c:v libx264 -crf ${crf} ${outputPath}`);
    return true;
  } catch (err) {
    console.error('Échec conversion standard:', err);
    return false;
  }
}

// Conversion shadow (chiffrée + chunked)
function shadowConvert(inputPath, outputPath) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    // Découpage et chiffrement
    const chunks = chunkFile(inputPath);
    chunks.forEach((chunk, i) => {
      const encrypted = encryptBuffer(chunk, config.ENCRYPT_KEY);
      fs.writeFileSync(path.join(tempDir, `chunk_${i}.enc`), encrypted);
    });

    // Conversion parallèle (simulée)
    chunks.forEach((_, i) => {
      const chunkPath = path.join(tempDir, `chunk_${i}.enc`);
      const outputChunk = path.join(tempDir, `out_${i}.mp4`);
      execSync(`${config.FFMPEG_PATH} -i ${chunkPath} -c:v libx264 -crf 28 ${outputChunk}`);
    });

    // Recombinaison
    execSync(`${config.FFMPEG_PATH} -f concat -i <(for f in ${tempDir}/out_*.mp4; do echo "file '$f'"; done) -c copy ${outputPath}`);
    
    return true;
  } catch (err) {
    console.error('Échec conversion shadow:', err);
    return false;
  } finally {
    // Nettoyage
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// API Principale
module.exports = function convert(inputPath, outputPath, options = {}) {
  const fileSize = fs.statSync(inputPath).size;
  
  if (fileSize > config.MAX_SIZE || config.SHADOW_MODE) {
    console.log('🚀 Mode shadow activé');
    return shadowConvert(inputPath, outputPath);
  } else {
    console.log('🔧 Conversion standard');
    return convertVideo(inputPath, outputPath, options);
  }
};

// CLI Support
if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.log('Usage: node convert.js <input> <output>');
    process.exit(1);
  }
  module.exports(input, output);
}