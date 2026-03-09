const multer = require('multer');
const path = require('path');
const fs = require('fs');

function ensureDir(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

function createUploader(folderName, maxFiles = 1) {
  const destination = path.join(process.cwd(), 'uploads', folderName);
  ensureDir(destination);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safe);
    },
  });

  const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (!imageMimeTypes.has(file.mimetype)) {
        return cb(new Error('Tipo de archivo inválido. Solo imágenes permitidas'));
      }
      cb(null, true);
    },
  });

  return upload;
}

module.exports = { createUploader };
