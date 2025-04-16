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
const USERNAME = 'wjdgml1216';
const PASSWORD = 'wjdgmlWkd';
const hashedPassword = bcrypt.hashSync(PASSWORD, 10);

console.log('Server started with credentials:', {
    username: USERNAME,
    password: PASSWORD,
    hashedPassword: hashedPassword
});

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
        console.log('Login request received:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요' });
        }

        console.log('Comparing credentials:', {
            inputUsername: username,
            inputPassword: password,
            storedUsername: USERNAME,
            passwordMatch: bcrypt.compareSync(password, hashedPassword)
        });

        if (username !== USERNAME) {
            console.log('Username mismatch');
            return res.status(401).json({ message: '아이디가 틀렸습니다' });
        }

        if (!bcrypt.compareSync(password, hashedPassword)) {
            console.log('Password mismatch');
            return res.status(401).json({ message: '비밀번호가 틀렸습니다' });
        }

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful, token generated');
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
});

// 인증 미들웨어
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: '인증이 필요합니다' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.username !== USERNAME) {
            console.log('Token username mismatch');
            return res.status(401).json({ message: '인증에 실패했습니다' });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
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