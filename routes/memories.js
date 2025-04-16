const express = require('express');
const router = express.Router();
const multer = require('multer');
const Memory = require('../models/Memory');
const cloudinary = require('cloudinary').v2;

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 모든 추억 가져오기
router.get('/', async (req, res) => {
    try {
        const memories = await Memory.find().sort({ date: -1 });
        res.json(memories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 새 추억 추가
router.post('/', upload.single('media'), async (req, res) => {
    try {
        const { date, title, content } = req.body;
        let mediaUrl = null;

        if (req.file) {
            const result = await cloudinary.uploader.upload_stream({
                resource_type: 'auto'
            }, (error, result) => {
                if (error) throw error;
                mediaUrl = result.secure_url;
            }).end(req.file.buffer);
        }

        const memory = new Memory({
            date,
            title,
            content,
            mediaUrl
        });

        const newMemory = await memory.save();
        res.status(201).json(newMemory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 