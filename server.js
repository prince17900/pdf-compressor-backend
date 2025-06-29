const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('compressed'));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

app.post('/compress', upload.single('pdf'), (req, res) => {
  const inputPath = req.file.path;
  const outputFilename = 'compressed-' + path.basename(inputPath);
  const outputPath = path.join('compressed', outputFilename);

  const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;

  exec(command, (err) => {
    if (err) {
      console.error('Compression error:', err);
      return res.status(500).send('Compression failed.');
    }

    fs.stat(outputPath, (err, stats) => {
      if (err) return res.status(500).send('Could not retrieve compressed file.');

      res.json({
        original: req.file.size,
        compressed: stats.size,
        downloadUrl: '/' + outputFilename,
      });

      // Optional cleanup after 5 minutes
      setTimeout(() => {
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
      }, 5 * 60 * 1000);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
