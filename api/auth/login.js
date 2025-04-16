const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 하드코딩된 사용자 정보
const USERNAME = 'wjdgml1216';
const PASSWORD = 'wjdgmlWkd';
const hashedPassword = bcrypt.hashSync(PASSWORD, 10);


module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
      }
    
      try {
        const { username, password } = req.body;
    
        if (!username || !password) {
          return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요' });
        }
    
        if (username !== USERNAME) {
          return res.status(401).json({ message: '아이디가 틀렸습니다' });
        }
    
        if (!bcrypt.compareSync(password, hashedPassword)) {
          return res.status(401).json({ message: '비밀번호가 틀렸습니다' });
        }
    
        const token = jwt.sign({ username }, process.env.JWT_SECRET, {
          expiresIn: '24h',
        });
    
        res.status(200).json({ token });
      } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: '서버 오류가 발생했습니다' });
      }
    /*
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

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요' });
        }

        console.log('Login attempt:', { username, password });

        if (username !== USERNAME || !bcrypt.compareSync(password, hashedPassword)) {
            console.log('Login failed:', { 
                usernameMatch: username === USERNAME,
                passwordMatch: bcrypt.compareSync(password, hashedPassword)
            });
            return res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다' });
        }

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful');
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
        */
       
}; 