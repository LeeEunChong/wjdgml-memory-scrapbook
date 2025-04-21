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

        // 컬렉션 초기화 및 확인
        const db = mongoose.connection.db;
        
        // 모든 컬렉션 목록 가져오기
        const collections = await db.listCollections().toArray();
        console.log('현재 데이터베이스의 컬렉션 목록:', collections.map(col => col.name));

        // memories 컬렉션이 없으면 생성
        if (!collections.some(col => col.name === 'memories')) {
            console.log('memories 컬렉션이 없습니다. 생성합니다...');
            await db.createCollection('memories');
            console.log('memories 컬렉션이 생성되었습니다.');
        } else {
            console.log('memories 컬렉션이 이미 존재합니다.');
            
            // 컬렉션의 문서 수 확인
            const count = await db.collection('memories').countDocuments();
            console.log(`memories 컬렉션의 문서 수: ${count}`);
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
    title: {
        type: String,
        required: [true, '제목은 필수입니다'],
        trim: true,
        maxlength: [100, '제목은 100자 이내로 입력해주세요']
    },
    content: {
        type: String,
        required: [true, '내용은 필수입니다'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, '날짜는 필수입니다'],
        validate: {
            validator: function(v) {
                return v instanceof Date && !isNaN(v);
            },
            message: props => `${props.value}는 유효한 날짜가 아닙니다!`
        }
    },
    imageUrl: {
        type: String,
        required: [true, '이미지는 필수입니다']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // createdAt과 updatedAt을 자동으로 관리
    versionKey: false // __v 필드를 비활성화
});

// 스키마에 인덱스 추가
memorySchema.index({ date: -1 }); // 날짜 기준 내림차순 정렬을 위한 인덱스
memorySchema.index({ title: 'text', content: 'text' }); // 텍스트 검색을 위한 인덱스

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
        console.log('Received memory data:', req.body);
        
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

        console.log('Processed date:', memoryDate);

        const memory = new Memory({
            title: req.body.title,
            content: req.body.content,
            date: memoryDate,
            imageUrl: imageUrl
        });

        const newMemory = await memory.save();
        console.log('Memory saved successfully:', newMemory);
        res.status(201).json(newMemory);
    } catch (error) {
        console.error('Error creating memory:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors || '추억 추가에 실패했습니다'
        });
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