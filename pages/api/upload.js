import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const packagesUploadsDir = path.join(uploadsDir, 'packages');
const videosUploadsDir = path.join(uploadsDir, 'videos');

[uploadsDir, packagesUploadsDir, videosUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
      /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.originalname);
    cb(null, isVideo ? videosUploadsDir : packagesUploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() ||
      (file.mimetype && file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const safeOriginal = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${safeOriginal || 'media'}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, upload.any());

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => {
      const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
        /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.filename);
      const subDir = isVideo ? 'videos' : 'packages';
      const url = `/uploads/${subDir}/${file.filename}`;
      return {
        url,
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        isVideo
      };
    });

    return res.status(200).json({
      success: true,
      url: files[0].url,
      isVideo: files[0].isVideo,
      urls: files.map(f => f.url),
      files
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: error.message || 'File upload failed' });
  }
}
