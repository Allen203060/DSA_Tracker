// Revalgo Companion Content Script
// Extracts problem metadata and solution code directly from LeetCode and GeeksforGeeks tabs

function injectPageBridgeIfNeeded() {
  if (document.getElementById('__revalgo_bridge_script__')) return;
  try {
    const script = document.createElement('script');
    script.id = '__revalgo_bridge_script__';
    script.src = chrome.runtime.getURL('page-bridge.js');
    (document.head || document.documentElement).appendChild(script);
  } catch (_) {}
}

function extractCodeFromLocalStorage() {
  try {
    const slugMatch = window.location.pathname.match(/problems\/([^\/\?#]+)/i);
    const slug = slugMatch ? slugMatch[1].toLowerCase().replace(/[-_]+/g, '') : '';
    let bestCode = '';
    let bestScore = -1;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lowerKey = key.toLowerCase();

      const isProblemKey = slug && lowerKey.replace(/[-_]+/g, '').includes(slug);
      const isCodeKey = lowerKey.includes('code') || lowerKey.includes('solution') || lowerKey.includes('editor') || lowerKey.includes('user_saved');

      if (!isProblemKey && !isCodeKey) continue;

      const rawVal = localStorage.getItem(key);
      if (!rawVal || rawVal.length < 25) continue;

      let candidate = rawVal;
      if (rawVal.trim().startsWith('{') || rawVal.trim().startsWith('"')) {
        try {
          const parsed = JSON.parse(rawVal);
          if (typeof parsed === 'string') {
            candidate = parsed;
          } else if (parsed && typeof parsed === 'object') {
            candidate = parsed.code || parsed.typed_code || parsed.solution || parsed.userCode || parsed.value || '';
          }
        } catch (_) {}
      }

      if (typeof candidate === 'string' && candidate.trim().length > 25) {
        let score = candidate.length;
        if (/(class Solution|def |public |function |#include|package )/m.test(candidate)) {
          score += 25000;
        }
        if (isProblemKey) {
          score += 15000;
        }
        if (score > bestScore) {
          bestScore = score;
          bestCode = candidate;
        }
      }
    }

    if (bestCode && bestScore > 10000) {
      return bestCode;
    }
  } catch (_) {}
  return null;
}

async function scrapeMonacoWithAutoScroll() {
  try {
    const viewLines = Array.from(document.querySelectorAll('.monaco-editor .view-line, .view-lines .view-line'));
    if (viewLines.length === 0) return '';

    const firstLineEl = viewLines[0];
    const topPx = parseInt(firstLineEl.style.top || '0', 10);

    // If top line is near 0px, editor is already at top
    if (topPx <= 25) {
      return viewLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
    }

    // Editor is scrolled down! Scroll to top temporarily to render unvirtualized lines 1..N
    const scrollEl = document.querySelector('.monaco-editor .monaco-scrollable-element, .monaco-editor .overflow-guard');
    if (scrollEl) {
      const origScroll = scrollEl.scrollTop;
      scrollEl.scrollTop = 0;
      await new Promise(r => setTimeout(r, 60));
      const topLines = Array.from(document.querySelectorAll('.monaco-editor .view-line, .view-lines .view-line'));
      const text = topLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
      scrollEl.scrollTop = origScroll; // restore scroll position
      if (text.length > 20) return text;
    }

    return viewLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
  } catch (_) {
    return '';
  }
}

function requestFullCodeFromPage() {
  return new Promise((resolve) => {
    // Check DOM bridge immediately
    const existingBridge = document.getElementById('__revalgo_code_bridge__');
    if (existingBridge && existingBridge.value && existingBridge.value.trim().length > 30) {
      return resolve(existingBridge.value);
    }

    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('REVALGO_RECEIVE_FULL_CODE', onCustomEvent);
      if (observer) observer.disconnect();
    };

    const finish = (code) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(code || '');
    };

    const onMessage = (e) => {
      if (e.data && (e.data.type === 'REVALGO_RECEIVE_FULL_CODE' || e.data.type === 'REVALGO_PONG_CODE')) {
        if (e.data.code && e.data.code.trim().length > 0) {
          finish(e.data.code);
        }
      }
    };
    window.addEventListener('message', onMessage);

    const onCustomEvent = (e) => {
      const code = e.detail || '';
      if (code && code.trim().length > 0) {
        finish(code);
      }
    };
    document.addEventListener('REVALGO_RECEIVE_FULL_CODE', onCustomEvent);

    let observer = null;
    try {
      let bridge = document.getElementById('__revalgo_code_bridge__');
      if (!bridge) {
        bridge = document.createElement('textarea');
        bridge.id = '__revalgo_code_bridge__';
        bridge.style.display = 'none';
        bridge.setAttribute('aria-hidden', 'true');
        (document.body || document.documentElement).appendChild(bridge);
      }
      observer = new MutationObserver(() => {
        const b = document.getElementById('__revalgo_code_bridge__');
        if (b && b.dataset.ready === 'true' && b.value && b.value.trim().length > 0) {
          finish(b.value);
        }
      });
      observer.observe(bridge, { attributes: true });
    } catch (_) {}

    injectPageBridgeIfNeeded();

    document.dispatchEvent(new CustomEvent('REVALGO_REQUEST_FULL_CODE'));
    window.postMessage({ type: 'REVALGO_REQUEST_FULL_CODE' }, '*');
    window.postMessage({ type: 'REVALGO_PING_CODE' }, '*');

    // 400ms timeout safeguard (resolves instantly upon bridge response)
    setTimeout(() => {
      if (!resolved) {
        const b = document.getElementById('__revalgo_code_bridge__');
        const code = (b && b.value) ? b.value : '';
        finish(code);
      }
    }, 400);
  });
}

async function extractLeetCodeData() {
  const url = window.location.origin + window.location.pathname;

  // Extract Title
  let title = '';
  const titleEl = document.querySelector('div[class*="text-title-large"] a') ||
                  document.querySelector('div[class*="text-title-large"]') ||
                  document.querySelector('[data-cy="question-title"]');
  if (titleEl && titleEl.innerText.trim()) {
    title = titleEl.innerText.trim();
  } else {
    // Fallback: parse document.title
    title = document.title.replace(/-\s*LeetCode.*$/i, '').trim();
    if (!title || title.toLowerCase().includes('problem')) {
      const match = window.location.pathname.match(/problems\/([^\/]+)/);
      if (match) {
        title = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }

  // Extract Difficulty
  let difficulty = 'Medium';
  const diffEl = document.querySelector('div[class*="text-difficulty-"]') ||
                 document.querySelector('div[class*="text-olive"]') ||
                 document.querySelector('div[class*="text-yellow"]') ||
                 document.querySelector('div[class*="text-pink"]');
  if (diffEl && diffEl.innerText.trim()) {
    const dText = diffEl.innerText.trim().toLowerCase();
    if (dText.includes('easy')) difficulty = 'Easy';
    else if (dText.includes('hard')) difficulty = 'Hard';
    else if (dText.includes('med')) difficulty = 'Medium';
  }

  // Extract Solution Code (Main World unvirtualized model first, then localStorage, then DOM fallback)
  let code = await requestFullCodeFromPage();
  if (!code || !code.trim()) {
    code = extractCodeFromLocalStorage() || '';
  }
  if (!code || !code.trim()) {
    code = await scrapeMonacoWithAutoScroll();
  }

  // Extract Language
  let language = 'cpp';
  const langBtn = document.querySelector('button[id*="headlessui-listbox-button"]') ||
                  document.querySelector('button[aria-haspopup="listbox"]') ||
                  document.querySelector('button[data-cy="lang-select"]');
  if (langBtn && langBtn.innerText) {
    const lText = langBtn.innerText.toLowerCase();
    if (lText.includes('c++')) language = 'cpp';
    else if (lText.includes('python')) language = 'python';
    else if (lText.includes('java') && !lText.includes('script')) language = 'java';
    else if (lText.includes('script')) language = 'javascript';
    else if (lText.includes('go')) language = 'go';
  } else {
    language = detectCodeLanguage(code);
  }

  return {
    platform: 'leetcode',
    title,
    url,
    difficulty,
    code,
    language
  };
}

function cleanHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function detectCodeLanguage(code) {
  if (!code) return 'cpp';
  if (/^\s*(#include|using namespace|std::|vector<|int main|class Solution)/m.test(code)) return 'cpp';
  if (/^\s*(def |import |from |class Solution:|print\(|self\.)/m.test(code)) return 'python';
  if (/^\s*(public class|private |protected |System\.out|ArrayList<|HashMap<)/m.test(code)) return 'java';
  if (/^\s*(function |const |let |var |console\.log|module\.exports)/m.test(code)) return 'javascript';
  if (/^\s*(package |func |fmt\.)/m.test(code)) return 'go';
  return 'cpp';
}

async function extractGFGData() {
  const url = window.location.origin + window.location.pathname;

  let title = '';

  // 1. Try Next.js embedded state (__NEXT_DATA__)
  try {
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript && nextScript.textContent) {
      const parsed = JSON.parse(nextScript.textContent);
      const probData = parsed.props?.pageProps?.allData?.probData ||
                       parsed.props?.pageProps?.data ||
                       parsed.props?.pageProps?.problemData;
      if (probData && probData.problem_name) {
        title = probData.problem_name;
      }
    }
  } catch (e) {
    // Continue to DOM selectors
  }

  // 2. Try modern and legacy DOM selectors
  if (!title) {
    const selectors = [
      '.problem-tab__name',
      'h3.problem-tab__name',
      '[class*="problem_title"]',
      '[class*="problemName"]',
      '[class*="ProblemTitle"]',
      '[class*="problems_header_content"] h3',
      '[class*="problems_header_content"] h2',
      'div[class*="problem-title"]',
      'h1[class*="title"]',
      'h2[class*="title"]',
      'h3[class*="title"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        const candidate = el.innerText.trim();
        // Guard against generic tab labels
        if (!/^(problem|discussion|submissions|editorial|hints|tags)$/i.test(candidate)) {
          title = candidate;
          break;
        }
      }
    }
  }

  // 3. Try OpenGraph / Twitter meta tags
  if (!title) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                    document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    if (ogTitle) {
      title = ogTitle;
    }
  }

  // 4. Try document.title with aggressive cleanup
  if (!title && document.title) {
    title = document.title;
  }

  if (title) {
    title = cleanHtmlEntities(title)
      .replace(/\|\s*Practice.*$/i, '')
      .replace(/\|\s*GeeksforGeeks.*$/i, '')
      .replace(/-\s*GeeksforGeeks.*$/i, '')
      .replace(/-\s*Practice.*$/i, '')
      .replace(/^Practice\s*\|\s*/i, '')
      .replace(/^Problems\s*\|\s*/i, '')
      .trim();
  }

  // 5. Ultimate Fallback: Derive problem title from URL pathname slug
  if (!title || /^(practice|problems|geeksforgeeks|problem of the day)$/i.test(title)) {
    const slugMatch = window.location.pathname.match(/problems?\/([^\/\?#]+)/i);
    if (slugMatch) {
      const rawSlug = slugMatch[1].replace(/-[0-9]{6,}$/g, '').replace(/[-_]+/g, ' ');
      title = rawSlug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Extract Difficulty
  let difficulty = 'Medium';
  try {
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript && nextScript.textContent) {
      const parsed = JSON.parse(nextScript.textContent);
      const probData = parsed.props?.pageProps?.allData?.probData || parsed.props?.pageProps?.data;
      if (probData && probData.difficulty) {
        difficulty = probData.difficulty;
      }
    }
  } catch (e) {}

  if (!difficulty || difficulty === 'Medium') {
    const diffEl = document.querySelector('.problem-tab__difficulty') ||
                   document.querySelector('[class*="difficulty"]') ||
                   document.querySelector('[class*="Difficulty"]');
    if (diffEl && diffEl.innerText.trim()) {
      const dText = diffEl.innerText.trim().toLowerCase();
      if (dText.includes('easy') || dText.includes('school') || dText.includes('basic')) difficulty = 'Easy';
      else if (dText.includes('hard')) difficulty = 'Hard';
      else if (dText.includes('med')) difficulty = 'Medium';
    }
  }

  // Extract Solution Code from Page Bridge (Monaco/Ace unvirtualized) or DOM lines
  let code = await requestFullCodeFromPage();
  if (!code || !code.trim()) {
    code = extractCodeFromLocalStorage() || '';
  }
  if (!code || !code.trim()) {
    code = await scrapeMonacoWithAutoScroll();
  }
  if (!code || !code.trim()) {
    const monacoLines = Array.from(document.querySelectorAll('.ace_layer.ace_text-layer .ace_line, .monaco-editor .view-line, .ace_line, [class*="ace_line"], .code-editor-content pre'));
    if (monacoLines.length > 0) {
      code = monacoLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
    }
  }

  // Extract or Detect Language
  let language = 'cpp';
  const langEl = document.querySelector('button[class*="language"]') ||
                 document.querySelector('select[class*="language"]') ||
                 document.querySelector('[aria-label*="language"]');
  if (langEl && langEl.innerText) {
    const lText = langEl.innerText.toLowerCase();
    if (lText.includes('c++')) language = 'cpp';
    else if (lText.includes('python')) language = 'python';
    else if (lText.includes('java') && !lText.includes('script')) language = 'java';
    else if (lText.includes('script')) language = 'javascript';
    else if (lText.includes('go')) language = 'go';
  } else {
    language = detectCodeLanguage(code);
  }

  return {
    platform: 'geeksforgeeks',
    title: title || 'GeeksforGeeks Problem',
    url,
    difficulty,
    code,
    language
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SCRAPE_PROBLEM') {
    const host = window.location.hostname;
    
    (async () => {
      try {
        let data;
        if (host.includes('leetcode.com')) {
          data = await extractLeetCodeData();
        } else if (host.includes('geeksforgeeks.org')) {
          data = await extractGFGData();
        } else {
          data = {
            platform: 'generic',
            title: document.title.trim(),
            url: window.location.href,
            difficulty: 'Medium',
            code: '',
            language: 'cpp'
          };
        }
        sendResponse(data);
      } catch (err) {
        console.error('Error in content script scraping:', err);
        sendResponse(null);
      }
    })();

    return true; // Keep message channel open for async response
  }
});
