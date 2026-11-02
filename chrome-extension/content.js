// Revalgo Companion Content Script
// Extracts problem metadata and solution code directly from LeetCode and GeeksforGeeks tabs

function extractLeetCodeData() {
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

  // Extract Solution Code from Monaco Editor
  let code = '';
  const monacoLines = Array.from(document.querySelectorAll('.monaco-editor .view-line'));
  if (monacoLines.length > 0) {
    code = monacoLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
  }

  // Extract Language
  let language = 'cpp';
  const langBtn = document.querySelector('button[id*="headlessui-listbox-button"]') ||
                  document.querySelector('button[aria-haspopup="listbox"]');
  if (langBtn && langBtn.innerText) {
    const lText = langBtn.innerText.toLowerCase();
    if (lText.includes('c++')) language = 'cpp';
    else if (lText.includes('python')) language = 'python';
    else if (lText.includes('java') && !lText.includes('script')) language = 'java';
    else if (lText.includes('script')) language = 'javascript';
    else if (lText.includes('go')) language = 'go';
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

function extractGFGData() {
  const url = window.location.origin + window.location.pathname;

  let title = '';
  const titleEl = document.querySelector('.problem-tab__name') ||
                  document.querySelector('h3.problem-tab__name');
  if (titleEl && titleEl.innerText.trim()) {
    title = titleEl.innerText.trim();
  } else {
    title = document.title.replace(/\|\s*Practice.*$/i, '').replace(/\|\s*GeeksforGeeks.*$/i, '').trim();
  }

  let difficulty = 'Medium';
  const diffEl = document.querySelector('.problem-tab__difficulty') ||
                 document.querySelector('div[class*="difficulty"]');
  if (diffEl && diffEl.innerText.trim()) {
    const dText = diffEl.innerText.trim().toLowerCase();
    if (dText.includes('easy')) difficulty = 'Easy';
    else if (dText.includes('hard')) difficulty = 'Hard';
    else if (dText.includes('med')) difficulty = 'Medium';
  }

  let code = '';
  const monacoLines = Array.from(document.querySelectorAll('.monaco-editor .view-line, .ace_line'));
  if (monacoLines.length > 0) {
    code = monacoLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
  }

  return {
    platform: 'geeksforgeeks',
    title,
    url,
    difficulty,
    code,
    language: 'cpp'
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SCRAPE_PROBLEM') {
    const host = window.location.hostname;
    let data;

    if (host.includes('leetcode.com')) {
      data = extractLeetCodeData();
    } else if (host.includes('geeksforgeeks.org')) {
      data = extractGFGData();
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
  }
  return true;
});
