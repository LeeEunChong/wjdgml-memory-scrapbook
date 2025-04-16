const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 하드코딩된 사용자 정보
const USERNAME = 'wjdgml';
const PASSWORD = 'wjdgml1216';
const hashedPassword = bcrypt.hashSync(PASSWORD, 10);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scrapbook', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// 로그인 라우트
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username !== USERNAME || !bcrypt.compareSync(password, hashedPassword)) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다' });
        }

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 인증 미들웨어
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.username !== USERNAME) {
            return res.status(401).json({ message: '인증에 실패했습니다' });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: '인증에 실패했습니다' });
    }
};

// API Routes
app.use('/api/memories', auth, require('./routes/memories'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 