// middleware/authMiddleware.js
const admin = require('../firebase/firebaseAdmin');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // menyimpan data user ke request
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token tidak valid', error });
  }
};

module.exports = verifyToken;
