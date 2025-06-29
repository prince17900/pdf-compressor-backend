const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

app.post('/compress', upload.single('pdf'), (req, res) => {
  const inputPath = req.file.path;
  const outputFileName = `compressed-${uuidv4()}.pdf`;
  const outputPath = path.join('compressed', outputFileName);

  const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;

  exec(gsCommand, (err) => {
    if (err) {
      return res.status(500).send('Compression failed.');
    }

    const statsOriginal = fs.statSync(inputPath);
    const statsCompressed = fs.statSync(outputPath);

    res.json({
      downloadUrl: `/compressed/${outputFileName}`,
      originalSize: (statsOriginal.size / 1024).toFixed(2),
      compressedSize: (statsCompressed.size / 1024).toFixed(2)
    });

    fs.unlinkSync(inputPath);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
