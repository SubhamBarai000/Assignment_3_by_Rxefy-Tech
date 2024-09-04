const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/upload', upload.single('aadhaarImage'), async(req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await Tesseract.recognize(
            path.join(__dirname, 'uploads', req.file.filename),
            'eng', {
                logger: info => console.log(info)
            }
        );

        const text = result.data.text;
        const nameMatch = text.match(/Name:\s*([^\n]*)/);
        const aadhaarMatch = text.match(/Aadhaar Number:\s*([^\n]*)/);

        if (nameMatch && aadhaarMatch) {
            const name = nameMatch[1].trim();
            const aadhaarNumber = aadhaarMatch[1].trim();

            res.json({ name, aadhaarNumber });
        } else {
            res.status(400).json({ error: 'Failed to extract information from the image' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});