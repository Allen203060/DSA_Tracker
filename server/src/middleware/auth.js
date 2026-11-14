import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL SECURITY ERROR] JWT_SECRET must be set in environment variables in production mode!');
    }
    return 'revalgo_jwt_dev_secret_local_only';
  }
  return secret;
};

export const JWT_SECRET = getJwtSecret();

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};
