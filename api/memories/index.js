const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        await client.connect();
        const db = client.db('scrapbook');
        const memories = db.collection('memories');

        switch (req.method) {
            case 'GET':
                const allMemories = await memories.find({}).sort({ date: -1 }).toArray();
                res.json(allMemories);
                break;

            case 'POST':
                let imageUrl = null;
                
                // 이미지가 있는 경우 Cloudinary에 업로드
                if (req.body.image) {
                    const uploadResult = await cloudinary.uploader.upload(req.body.image, {
                        folder: 'scrapbook'
                    });
                    imageUrl = uploadResult.secure_url;
                }

                const memory = {
                    title: req.body.title,
                    content: req.body.content,
                    date: new Date(req.body.date),
                    imageUrl: imageUrl,
                    createdAt: new Date()
                };

                const result = await memories.insertOne(memory);
                res.status(201).json({ ...memory, _id: result.insertedId });
                break;

            case 'PUT':
                const { id, ...updateData } = req.body;
                await memories.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );
                res.json({ message: '추억이 업데이트되었습니다' });
                break;

            case 'DELETE':
                await memories.deleteOne({ _id: new ObjectId(req.query.id) });
                res.json({ message: '추억이 삭제되었습니다' });
                break;

            default:
                res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Memory operation error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다' });
    } finally {
        await client.close();
    }
}; 