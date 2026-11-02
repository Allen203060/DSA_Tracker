import User from '../models/User.js';
import Question from '../models/Question.js';

export const seedDemoQuestions = async (userId) => {
  const now = Date.now();
  const demoQuestions = [
    {
      title: 'Two Sum',
      url: 'https://leetcode.com/problems/two-sum/',
      userId,
      topic: 'Arrays & Hashing',
      subtopic: 'Hash Map Lookup',
      difficulty: 'Easy',
      notes: 'Instead of quadratic brute-force with two loops, invert lookup by tracking (target - nums[i]) in a single-pass hash map.',
      enhancedNotes: `### Core Algorithmic Insight: Hash Inversion Pattern

1. **The Inversion**: At index \`i\`, query the hash map: *"Have I previously encountered \`target - nums[i]\`?"*
2. **One-Pass Optimization**: Add each element into the map *after* checking, automatically avoiding pairing an element with itself.
3. **Complexity**:
   - **Time Complexity**: $O(N)$ with average $O(1)$ dictionary lookup.
   - **Space Complexity**: $O(N)$ auxiliary space for table storage.

\`\`\`cpp
// Optimal Single-Pass C++ Implementation
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.count(complement)) return {seen[complement], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
\`\`\``,
      codeLanguage: 'cpp',
      code: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      testCases: [
        { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
        { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' }
      ],
      repetitions: 1,
      easeFactor: 2.5,
      interval: 1,
      // Due 2 hours ago so it shows immediately in the "Due Today" revision queue
      nextReviewDate: new Date(now - 2 * 60 * 60 * 1000),
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      reviewHistory: [
        { reviewedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), quality: 4 }
      ]
    },
    {
      title: 'Daily Temperatures',
      url: 'https://leetcode.com/problems/daily-temperatures/',
      userId,
      topic: 'Stack',
      subtopic: 'Monotonic Decreasing Stack',
      difficulty: 'Medium',
      notes: 'Maintain a monotonically decreasing stack of day indices. When a warmer day arrives, resolve all pending cooler days.',
      enhancedNotes: `### Monotonic Decreasing Stack Invariant

- **Target**: Find distance to the Next Greater Element for every array position.
- **Invariant**: The stack strictly stores indices whose warmer days are still unresolved, ordered from coldest to warmest downwards.
- **Resolution Step**:
  - While current \`temperatures[i] > temperatures[st.top()]\`:
    - Pop index \`prevIndex = st.top()\`
    - Record distance: \`ans[prevIndex] = i - prevIndex\`
  - Push current index \`i\` onto stack.
- **Amortized Runtime**: $O(N)$ because every index enters and leaves the stack at most once.

\`\`\`cpp
vector<int> dailyTemperatures(vector<int>& temperatures) {
    int n = temperatures.size();
    vector<int> res(n, 0);
    stack<int> st;
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && temperatures[i] > temperatures[st.top()]) {
            int prev = st.top(); st.pop();
            res[prev] = i - prev;
        }
        st.push(i);
    }
    return res;
}
\`\`\``,
      codeLanguage: 'cpp',
      code: `#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> ans(n, 0);
        stack<int> st;
        
        for (int i = 0; i < n; i++) {
            while (!st.empty() && temperatures[i] > temperatures[st.top()]) {
                int prev = st.top();
                st.pop();
                ans[prev] = i - prev;
            }
            st.push(i);
        }
        return ans;
    }
};`,
      testCases: [
        { input: 'temperatures = [73,74,75,71,69,72,76,73]', expectedOutput: '[1,1,4,2,1,1,0,0]' },
        { input: 'temperatures = [30,40,50,60]', expectedOutput: '[1,1,1,0]' }
      ],
      repetitions: 2,
      easeFactor: 2.6,
      interval: 1,
      // Due 45 minutes ago so it shows in the "Due Today" revision queue
      nextReviewDate: new Date(now - 45 * 60 * 1000),
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      reviewHistory: [
        { reviewedAt: new Date(now - 3 * 24 * 60 * 60 * 1000), quality: 3 },
        { reviewedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), quality: 5 }
      ]
    },
    {
      title: 'Trapping Rain Water',
      url: 'https://leetcode.com/problems/trapping-rain-water/',
      userId,
      topic: 'Two Pointers',
      subtopic: 'Shrinking Window Invariant',
      difficulty: 'Hard',
      notes: 'Two pointers at left and right boundaries. The water trapped is determined by min(leftMax, rightMax) - height. Advance the pointer with the smaller boundary.',
      enhancedNotes: `### Trapping Rain Water: Space-Optimized Invariant

1. **Volume Equation**: \`trapped[i] = max(0, min(leftMax, rightMax) - height[i])\`
2. **Two-Pointer Guarantee**: If \`height[left] < height[right]\`, we know with mathematical certainty that \`leftMax\` is the true bottleneck for column \`left\`, regardless of what heights exist in the unexplored interior!
3. **Execution**:
   - Update \`leftMax\` or accumulate \`leftMax - height[left]\`, then increment \`left++\`.
   - Symmetric logic applies when \`height[right] <= height[left]\`.
4. **Complexity**: $O(N)$ Time with $O(1)$ Extra Space.`,
      codeLanguage: 'cpp',
      code: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0;
        int totalWater = 0;
        
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else totalWater += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else totalWater += rightMax - height[right];
                right--;
            }
        }
        return totalWater;
    }
};`,
      testCases: [
        { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6' },
        { input: 'height = [4,2,0,3,2,5]', expectedOutput: '9' }
      ],
      repetitions: 3,
      easeFactor: 2.7,
      interval: 4,
      // Due in 4 days (demonstrating future SM-2 spaced repetition scheduling)
      nextReviewDate: new Date(now + 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      reviewHistory: [
        { reviewedAt: new Date(now - 5 * 24 * 60 * 60 * 1000), quality: 3 },
        { reviewedAt: new Date(now - 3 * 24 * 60 * 60 * 1000), quality: 5 },
        { reviewedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), quality: 5 }
      ]
    },
    {
      title: 'Sliding Window Maximum',
      url: 'https://leetcode.com/problems/sliding-window-maximum/',
      userId,
      topic: 'Monotonic Queue',
      subtopic: 'Deque Range Extrema',
      difficulty: 'Hard',
      notes: 'Monotonic decreasing deque holding window indices. Evict indices outside current window from front, evict smaller elements from back.',
      enhancedNotes: `### Monotonic Deque for Continuous Window Extrema

- **Data Structure**: \`std::deque<int>\` storing array indices in strictly decreasing value order.
- **Steps**:
  1. **Evict Outdated**: Pop front while \`dq.front() <= i - k\`.
  2. **Maintain Decreasing Order**: Pop back while \`nums[dq.back()] < nums[i]\`.
  3. **Append Current**: Push index \`i\` to back.
  4. **Record Extrema**: When \`i >= k - 1\`, \`nums[dq.front()]\` is the maximum of the current window.
- **Runtime**: $O(N)$ linear time, $O(K)$ space.`,
      codeLanguage: 'cpp',
      code: `#include <vector>
#include <deque>
using namespace std;

class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;
        vector<int> result;
        
        for (int i = 0; i < (int)nums.size(); i++) {
            if (!dq.empty() && dq.front() <= i - k) {
                dq.pop_front();
            }
            while (!dq.empty() && nums[dq.back()] < nums[i]) {
                dq.pop_back();
            }
            dq.push_back(i);
            
            if (i >= k - 1) {
                result.push_back(nums[dq.front()]);
            }
        }
        return result;
    }
};`,
      testCases: [
        { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', expectedOutput: '[3,3,5,5,6,7]' },
        { input: 'nums = [1], k = 1', expectedOutput: '[1]' }
      ],
      repetitions: 1,
      easeFactor: 2.5,
      interval: 2,
      // Due in 2 days
      nextReviewDate: new Date(now + 2 * 24 * 60 * 60 * 1000),
      // Created 25 minutes ago — shows right at the top of Recently Logged feed!
      createdAt: new Date(now - 25 * 60 * 1000),
      reviewHistory: []
    }
  ];

  await Question.insertMany(demoQuestions);
  console.log(`[Bootstrap] 🚀 Seeded ${demoQuestions.length} curated showcase questions for demo user.`);
};

export const bootstrapDemoAccount = async () => {
  try {
    const demoUsername = 'demo';
    let demoUser = await User.findOne({ username: demoUsername });

    if (!demoUser) {
      demoUser = await User.create({
        username: demoUsername,
        displayName: 'Demo Explorer',
        password: process.env.DEMO_USER_PASSWORD || 'demo_guest_pass_2026',
        email: 'demo@revalgo.dev',
        recoveryKey: 'demo-recovery-2026'
      });
      console.log(`[Bootstrap] 🌟 Initialized official guest demo account: Demo Explorer (username: "demo")`);
    }

    const questionCount = await Question.countDocuments({ userId: demoUser._id });
    if (questionCount === 0) {
      await seedDemoQuestions(demoUser._id);
    }

    return demoUser;
  } catch (error) {
    console.error('[Bootstrap] Failed to bootstrap demo account:', error.message);
    return null;
  }
};

export const bootstrapUser = async () => {
  try {
    const adminUsername = 'allen';
    let allenUser = await User.findOne({ username: adminUsername });

    if (!allenUser) {
      const defaultPassword = process.env.DEFAULT_ALLEN_PASSWORD || 'allen123';
      allenUser = await User.create({
        username: adminUsername,
        displayName: 'Allen',
        password: defaultPassword,
        recoveryKey: 'allen-recovery-2026'
      });
      console.log(`[Bootstrap] 👤 Initialized default account: Allen (username: "allen")`);
    } else if (!allenUser.recoveryKey) {
      allenUser.recoveryKey = 'allen-recovery-2026';
      await allenUser.save();
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

    // Bootstrap Demo Explorer account with showcase questions
    await bootstrapDemoAccount();
  } catch (error) {
    console.error('[Bootstrap] Failed to bootstrap accounts:', error.message);
  }
};
