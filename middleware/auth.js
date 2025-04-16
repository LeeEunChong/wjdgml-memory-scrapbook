const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: '사용자를 찾을 수 없습니다' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: '인증에 실패했습니다' });
    }
}; 