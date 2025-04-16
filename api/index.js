const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const memoriesRoute = require('../routes/memories');
const authRoute = require('../routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scrapbook';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// API 라우터
app.use('/api/memories', authMiddleware, memoriesRoute);
app.use('/api/auth', authRoute);

// 리퀘스트 핸들러 내보내기 (서버리스 함수용)
module.exports = app;
