const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://wjdgml1216:XHiwvBc2C6xHjCHO@wjdgmlwkd.cvcbl67.mongodb.net/?appName=wjdgmlWkd";

async function testConnection() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        console.log('MongoDB 연결 시도 중...');
        await client.connect();
        console.log('MongoDB 연결 성공!');
        
        // 데이터베이스 목록 확인
        const databases = await client.db().admin().listDatabases();
        console.log('사용 가능한 데이터베이스:', databases.databases.map(db => db.name));
        
    } catch (error) {
        console.error('MongoDB 연결 실패:', error);
    } finally {
        await client.close();
    }
}

testConnection(); 