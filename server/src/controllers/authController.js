import User from '../models/User.js';
import Question from '../models/Question.js';
import { generateToken } from '../middleware/auth.js';
import { bootstrapDemoAccount, seedDemoQuestions } from '../utils/bootstrapUser.js';
import crypto from 'crypto';

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

    const generatedRecoveryKey = crypto.randomBytes(16).toString('hex');
    const user = await User.create({
      username: cleanUsername,
      displayName: (displayName && displayName.trim()) || username.trim(),
      password,
      recoveryKey: generatedRecoveryKey
    });

    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email || '',
        avatar: user.avatar || '',
        googleId: null,
        createdAt: user.createdAt
      },
      token,
      recoveryKey: generatedRecoveryKey
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
        googleId: user.googleId || null,
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
        googleId: req.user.googleId || null,
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
    const { credential, linkUsername, linkPassword } = req.body;
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

    let user = null;

    // Optional: Explicitly link with existing Revalgo account via username & password
    if (linkUsername && linkPassword) {
      const existingUser = await User.findOne({ username: linkUsername.trim().toLowerCase() });
      if (!existingUser) {
        return res.status(404).json({ error: 'Revalgo account not found.' });
      }
      const isMatch = await existingUser.comparePassword(linkPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password for existing account.' });
      }

      // Check if this Google account is already linked to a different account
      const googleConflict = await User.findOne({ googleId, _id: { $ne: existingUser._id } });
      if (googleConflict) {
        return res.status(409).json({ error: `This Google account is already linked to @${googleConflict.username}.` });
      }

      existingUser.googleId = googleId;
      if (email) existingUser.email = email.toLowerCase();
      if (picture && !existingUser.avatar) existingUser.avatar = picture;
      await existingUser.save();
      user = existingUser;
    }

    if (!user) {
      // Check if user exists by googleId or registered email
      const matchConditions = [{ googleId }];
      if (email) {
        matchConditions.push({ email: email.toLowerCase() });
      }
      user = await User.findOne({ $or: matchConditions });
    }

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
        recoveryKey: crypto.randomBytes(16).toString('hex')
      });
    } else {
      // Update existing user with googleId/avatar if missing
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.email && email) user.email = email.toLowerCase();
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
        googleId: user.googleId,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
};

// --- Authenticated Connect / Link Google Account Handler ---
export const linkGoogleAccount = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google authentication token.' });
    }

    const payload = await response.json();
    const { sub: googleId, email, picture } = payload;

    // Check if this Google account is already linked to another account
    const existing = await User.findOne({ googleId, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ error: `This Google account is already linked to @${existing.username}.` });
    }

    req.user.googleId = googleId;
    if (email) req.user.email = email.toLowerCase();
    if (picture && !req.user.avatar) req.user.avatar = picture;
    await req.user.save();

    res.json({
      message: 'Google account connected successfully!',
      user: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        email: req.user.email,
        avatar: req.user.avatar,
        googleId: req.user.googleId,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Link Google Error:', error);
    res.status(500).json({ error: error.message || 'Failed to connect Google account.' });
  }
};

// --- Authenticated Disconnect / Unlink Google Account Handler ---
export const unlinkGoogleAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Please set a password before disconnecting your Google account.' });
    }

    user.googleId = undefined;
    await user.save();

    res.json({
      message: 'Google account disconnected successfully!',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        googleId: null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Unlink Google Error:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect Google account.' });
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
    if (cleanUsername === 'demo') {
      return res.status(403).json({ error: 'The demo explorer account cannot be reset.' });
    }

    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify recovery key strictly against stored value
    if (!user.recoveryKey || !recoveryKey || recoveryKey.trim() !== user.recoveryKey.trim()) {
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
        email: user.email || '',
        avatar: user.avatar || '',
        googleId: user.googleId || null,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Forgot / Reset Password via Google OAuth Verification Handler ---
export const resetPasswordWithGoogle = async (req, res) => {
  try {
    const { credential, username, newPassword } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google authentication token.' });
    }

    const payload = await response.json();
    const { sub: googleId, email: googleEmail, picture } = payload;
    const normalizedGoogleEmail = googleEmail?.toLowerCase();

    let user = null;

    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername === 'demo') {
        return res.status(403).json({ error: 'The demo explorer account cannot be reset.' });
      }
      user = await User.findOne({ username: cleanUsername });
      if (!user) {
        return res.status(404).json({ error: `Account @${cleanUsername} not found.` });
      }

      // Security check: Verify that this Google account matches the user
      const isGoogleIdMatch = user.googleId && user.googleId === googleId;
      const isEmailMatch = user.email && user.email.toLowerCase() === normalizedGoogleEmail;

      if (!isGoogleIdMatch && !isEmailMatch) {
        if (user.googleId || user.email) {
          return res.status(403).json({
            error: `Your Google account (${normalizedGoogleEmail}) does not match the registered recovery email for @${cleanUsername}.`
          });
        }
      }
    } else {
      // Find user by linked googleId or matching registered email
      user = await User.findOne({
        $or: [
          { googleId },
          { email: normalizedGoogleEmail }
        ]
      });

      if (!user) {
        return res.status(404).json({
          error: `No Revalgo account is linked to Google account (${normalizedGoogleEmail}). Please enter your username above to link and recover.`
        });
      }
    }

    if (user.username === 'demo') {
      return res.status(403).json({ error: 'The demo explorer account cannot be reset.' });
    }

    // Set new password
    user.password = newPassword;
    if (!user.googleId) user.googleId = googleId;
    if (!user.email && normalizedGoogleEmail) user.email = normalizedGoogleEmail;
    if (!user.avatar && picture) user.avatar = picture;
    await user.save();

    const token = generateToken(user);

    res.json({
      message: 'Password successfully reset with Google verification!',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email || '',
        avatar: user.avatar || '',
        googleId: user.googleId || null,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Google Password Reset Error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password with Google.' });
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

    if (user.username === 'demo') {
      return res.status(403).json({ error: 'The demo explorer account password cannot be changed.' });
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

// --- Public Google Client ID Discovery Handler ---
export const getGoogleClientId = async (req, res) => {
  try {
    let clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    const matchingKeys = [];
    for (const [key, val] of Object.entries(process.env)) {
      const k = key.toLowerCase();
      if ((k.includes('google') || k.includes('oauth') || k.includes('client')) && !k.includes('secret')) {
        matchingKeys.push({ key, hasVal: !!val, length: val ? val.length : 0 });
        if (!clientId && val) {
          clientId = val.trim().replace(/^["']|["']$/g, '');
        }
      }
    }
    res.json({ clientId, debugMatchingKeys: matchingKeys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
