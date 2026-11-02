// Import Controller for LeetCode, GeeksforGeeks, and Universal DSA Problem Scraper

const decodeHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

/**
 * Extract LeetCode slug from a full URL or partial slug string.
 */
const extractLeetCodeSlug = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const match = parsed.pathname.match(/(?:problems|contest\/[^\/]+\/problems)\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
  } catch (err) {
    // If not a full URL, treat direct slug or handle gracefully
    const match = rawUrl.match(/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
};

/**
 * POST /api/import/url
 * Scrapes metadata from LeetCode, GeeksforGeeks, or generic DSA platforms.
 */
export const importProblemFromUrl = async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Please provide a valid problem URL.' });
  }

  const cleanUrl = url.trim();

  try {
    // 1. LEETCODE IMPORT
    if (cleanUrl.includes('leetcode.com') || cleanUrl.includes('leetcode.cn')) {
      const slug = extractLeetCodeSlug(cleanUrl);
      if (!slug) {
        return res.status(400).json({ error: 'Could not extract problem slug from LeetCode URL.' });
      }

      const lcResponse = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          query: `
            query getQuestionDetail($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                questionFrontendId
                title
                titleSlug
                difficulty
                topicTags { name }
                sampleTestCase
                exampleTestcaseList
              }
            }
          `,
          variables: { titleSlug: slug }
        })
      });

      if (!lcResponse.ok) {
        throw new Error(`LeetCode GraphQL error: ${lcResponse.status}`);
      }

      const lcData = await lcResponse.json();
      const question = lcData.data?.question;

      if (!question) {
        return res.status(404).json({ error: `LeetCode problem '${slug}' not found.` });
      }

      const tags = Array.isArray(question.topicTags) ? question.topicTags.map(t => t.name) : [];
      const testCases = Array.isArray(question.exampleTestcaseList) && question.exampleTestcaseList.length > 0
        ? question.exampleTestcaseList.slice(0, 3).map(tc => ({ input: tc, expectedOutput: '' }))
        : (question.sampleTestCase ? [{ input: question.sampleTestCase, expectedOutput: '' }] : []);

      return res.json({
        platform: 'leetcode',
        title: `${question.questionFrontendId}. ${question.title}`,
        url: `https://leetcode.com/problems/${question.titleSlug}/`,
        difficulty: question.difficulty || 'Medium',
        topic: tags[0] || 'General',
        subtopic: tags[1] || tags[0] || 'General',
        tags,
        testCases
      });
    }

    // 2. GEEKSFORGEEKS IMPORT
    if (cleanUrl.includes('geeksforgeeks.org')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      let html = '';
      try {
        const gfgRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (gfgRes.ok) {
          html = await gfgRes.text();
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
      }

      // Extract Title from <title> tag
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      let title = titleMatch ? titleMatch[1].replace(/\|\s*Practice.*$/i, '').replace(/\|\s*GeeksforGeeks.*$/i, '').trim() : '';
      title = decodeHtml(title);

      if (!title || /just a moment|security check|cloudflare|robot/i.test(title)) {
        // Fallback to URL path slug
        const slugMatch = cleanUrl.match(/problems\/([^\/]+)/i);
        if (slugMatch) {
          title = slugMatch[1].replace(/-[0-9]+$/g, '').replace(/-/g, ' ');
          title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
          title = 'GeeksforGeeks Problem';
        }
      }

      // Extract Difficulty
      let difficulty = 'Medium';
      const diffMatch = html.match(/"difficulty":\s*"([^"]+)"/i) || html.match(/difficulty["\s:]+([A-Za-z]+)/i);
      if (diffMatch && ['easy', 'medium', 'hard'].includes(diffMatch[1].toLowerCase())) {
        difficulty = diffMatch[1].charAt(0).toUpperCase() + diffMatch[1].slice(1).toLowerCase();
      }

      return res.json({
        platform: 'geeksforgeeks',
        title,
        url: cleanUrl,
        difficulty,
        topic: 'General',
        subtopic: 'General',
        tags: [],
        testCases: []
      });
    }

    // 3. GENERIC PLATFORM FALLBACK (HackerRank, Codeforces, NeetCode, etc.)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let title = '';
    try {
      const genericRes = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const html = await genericRes.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        const rawTitle = titleMatch[1].trim();
        // Guard against bot challenges / generic Cloudflare page titles
        if (!/just a moment|security check|cloudflare|robot/i.test(rawTitle)) {
          title = decodeHtml(rawTitle.replace(/\|.*$/, '').replace(/-\s*HackerRank.*$/, '').trim());
        }
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
    }

    if (!title) {
      // Derive clean title from URL pathname
      try {
        const parsed = new URL(cleanUrl);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'Algorithm Problem';
        title = decodeURIComponent(lastSegment)
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      } catch (e) {
        title = 'Algorithmic Problem';
      }
    }

    return res.json({
      platform: 'generic',
      title,
      url: cleanUrl,
      difficulty: 'Medium',
      topic: 'General',
      subtopic: 'General',
      tags: [],
      testCases: []
    });

  } catch (error) {
    console.error('[importProblemFromUrl] Error:', error.message);
    res.status(500).json({ error: `Failed to scrape problem: ${error.message}` });
  }
};

/**
 * GET /api/import/search?query=...
 * Live autocomplete search querying LeetCode's public problemset directory.
 */
export const searchProblems = async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.json({ questions: [] });
  }

  const keyword = query.trim();

  try {
    const lcResponse = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query: `
          query problemsetQuestionList($limit: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(categorySlug: "", limit: $limit, filters: $filters) {
              questions: data {
                questionFrontendId
                title
                titleSlug
                difficulty
                topicTags { name }
              }
            }
          }
        `,
        variables: {
          limit: 6,
          filters: { searchKeywords: keyword }
        }
      })
    });

    if (!lcResponse.ok) {
      return res.json({ questions: [] });
    }

    const data = await lcResponse.json();
    const rawQuestions = data.data?.problemsetQuestionList?.questions || [];

    const formatted = rawQuestions.map(q => ({
      id: q.questionFrontendId,
      title: `${q.questionFrontendId}. ${q.title}`,
      titleSlug: q.titleSlug,
      difficulty: q.difficulty,
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
      tags: Array.isArray(q.topicTags) ? q.topicTags.map(t => t.name) : []
    }));

    res.json({ questions: formatted });
  } catch (error) {
    console.error('[searchProblems] Error:', error.message);
    res.json({ questions: [] });
  }
};
