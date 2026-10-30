import User from '../models/User.js';
import Question from '../models/Question.js';

export const bootstrapUser = async () => {
  try {
    const adminUsername = 'allen';
    let allenUser = await User.findOne({ username: adminUsername });

    if (!allenUser) {
      const defaultPassword = process.env.DEFAULT_ALLEN_PASSWORD || 'allen123';
      allenUser = await User.create({
        username: adminUsername,
        displayName: 'Allen',
        password: defaultPassword
      });
      console.log(`[Bootstrap] 👤 Initialized default account: Allen (username: "allen")`);
    }

    // Safely migrate all questions without a userId to user Allen
    const unassignedCount = await Question.countDocuments({
      $or: [{ userId: { $exists: false } }, { userId: null }]
    });

    if (unassignedCount > 0) {
      const result = await Question.updateMany(
        { $or: [{ userId: { $exists: false } }, { userId: null }] },
        { $set: { userId: allenUser._id } }
      );
      console.log(`[Bootstrap] 🛡️ Successfully migrated and secured ${result.modifiedCount} question(s) under user Allen!`);
    } else {
      console.log(`[Bootstrap] 🛡️ All existing questions are already secured under their respective user accounts.`);
    }
  } catch (error) {
    console.error('[Bootstrap] Failed to bootstrap Allen user:', error.message);
  }
};
