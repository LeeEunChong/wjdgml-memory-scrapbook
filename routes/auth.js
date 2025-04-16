const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 하드코딩된 사용자
const USERNAME = 'wjdgml1216';
const PASSWORD = 'wjdgmlWkd';
const hashedPassword = bcrypt.hashSync(PASSWORD, 10);

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username !== USERNAME || !bcrypt.compareSync(password, hashedPassword)) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});

module.exports = router;
