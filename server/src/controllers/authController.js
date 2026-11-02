import User from '../models/User.js';
import Question from '../models/Question.js';
import { generateToken } from '../middleware/auth.js';
import { bootstrapDemoAccount, seedDemoQuestions } from '../utils/bootstrapUser.js';

export const register = async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    const user = await User.create({
      username: cleanUsername,
      displayName: (displayName && displayName.trim()) || username.trim(),
      password,
      recoveryKey: `${cleanUsername}-recovery`
    });

    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        email: req.user.email,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Google OAuth 2.0 Sign-In Handler ---
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    // Verify token with Google's official tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google authentication token.' });
    }

    const payload = await response.json();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by googleId or email or matching username
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email: email?.toLowerCase() }
      ]
    });

    if (!user) {
      // Create new user for this Google account
      let baseUsername = (email ? email.split('@')[0] : 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (baseUsername.length < 3) baseUsername = `user_${googleId.slice(0, 5)}`;
      
      let candidateUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: candidateUsername })) {
        candidateUsername = `${baseUsername}${counter++}`;
      }

      user = await User.create({
        username: candidateUsername,
        displayName: name || candidateUsername,
        email: email?.toLowerCase(),
        googleId,
        avatar: picture || '',
        recoveryKey: `${candidateUsername}-recovery`
      });
    } else {
      // Update existing user with googleId/avatar if missing
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
};

// --- Forgot / Reset Password Handler ---
export const resetPassword = async (req, res) => {
  try {
    const { username, recoveryKey, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify recovery key
    const expectedKey = user.recoveryKey || `${cleanUsername}-recovery`;
    if (!recoveryKey || recoveryKey.trim() !== expectedKey.trim()) {
      return res.status(403).json({ error: 'Invalid recovery key for this account.' });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);

    res.json({
      message: 'Password reset successfully!',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Authenticated Change Password Handler ---
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password does not match.' });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Guest Demo Login Handler ---
export const demoLogin = async (req, res) => {
  try {
    let demoUser = await User.findOne({ username: 'demo' });
    if (!demoUser) {
      demoUser = await bootstrapDemoAccount();
    }

    if (!demoUser) {
      return res.status(500).json({ error: 'Failed to initialize demo account.' });
    }

    // Ensure showcase questions exist
    const questionCount = await Question.countDocuments({ userId: demoUser._id });
    if (questionCount === 0) {
      await seedDemoQuestions(demoUser._id);
    }

    const token = generateToken(demoUser);

    res.json({
      user: {
        id: demoUser._id,
        username: demoUser.username,
        displayName: demoUser.displayName,
        email: demoUser.email || 'demo@revalgo.dev',
        avatar: demoUser.avatar || '',
        isDemo: true,
        createdAt: demoUser.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Reset Demo Showcase Questions Handler ---
export const demoReset = async (req, res) => {
  try {
    let demoUser = await User.findOne({ username: 'demo' });
    if (!demoUser) {
      demoUser = await bootstrapDemoAccount();
    }

    if (!demoUser) {
      return res.status(500).json({ error: 'Failed to initialize demo account.' });
    }

    // Clear existing questions for demo user and re-seed
    await Question.deleteMany({ userId: demoUser._id });
    await seedDemoQuestions(demoUser._id);

    res.json({ message: 'Demo showcase questions have been reset to pristine initial state!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
