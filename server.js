const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB Connection
const uri = "mongodb+srv://wjdgml1216:XHiwvBc2C6xHjCHO@wjdgmlwkd.cvcbl67.mongodb.net/?appName=wjdgmlWkd";

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            retryReads: true
        });
        console.log("MongoDB 연결 성공!");

        // 컬렉션 초기화
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        if (!collectionNames.includes('memories')) {
            await db.createCollection('memories');
            console.log('memories 컬렉션이 생성되었습니다.');
        }

        // 연결 상태 모니터링
        mongoose.connection.on('connected', () => {
            console.log('MongoDB 연결됨');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB 연결 오류:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB 연결 끊김');
        });

    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
        process.exit(1);
    }
};

connectDB();

// Memory Schema
const memorySchema = new mongoose.Schema({
    title: String,
    content: String,
    date: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                return v instanceof Date && !isNaN(v);
            },
            message: props => `${props.value}는 유효한 날짜가 아닙니다!`
        }
    },
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const Memory = mongoose.model('Memory', memorySchema);

// API Routes
app.get('/api/memories', async (req, res) => {
    try {
        const memories = await Memory.find().sort({ date: -1 });
        res.json(memories || []);
    } catch (error) {
        console.error('Error fetching memories:', error);
        res.status(500).json({ message: error.message, memories: [] });
    }
});

app.post('/api/memories', upload.single('image'), async (req, res) => {
    try {
        let imageUrl = null;
        
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'scrapbook',
                resource_type: 'auto'
            });
            imageUrl = uploadResult.secure_url;
        }

        // 날짜 처리 개선
        let memoryDate;
        if (req.body.date) {
            // YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
            const [year, month, day] = req.body.date.split('-').map(Number);
            memoryDate = new Date(year, month - 1, day);
            
            if (isNaN(memoryDate.getTime())) {
                throw new Error('유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.');
            }
        } else {
            memoryDate = new Date();
        }

        const memory = new Memory({
            title: req.body.title,
            content: req.body.content,
            date: memoryDate,
            imageUrl: imageUrl
        });

        const newMemory = await memory.save();
        res.status(201).json(newMemory);
    } catch (error) {
        console.error('Error creating memory:', error);
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/memories/:id', async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);
        if (!memory) {
            return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
        }

        memory.title = req.body.title || memory.title;
        memory.content = req.body.content || memory.content;
        memory.date = req.body.date ? new Date(req.body.date) : memory.date;

        const updatedMemory = await memory.save();
        res.json(updatedMemory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/memories/:id', async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);
        if (!memory) {
            return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
        }

        await memory.remove();
        res.json({ message: '추억이 삭제되었습니다' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 