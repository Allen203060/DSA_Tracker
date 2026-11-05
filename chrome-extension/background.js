// Revalgo Companion Background Service Worker
// Manages persistent asynchronous problem logging and native desktop notifications

async function getResolvedServerUrl() {
  try {
    const stored = await chrome.storage.local.get(['revalgo_server_url']);
    if (stored.revalgo_server_url && typeof stored.revalgo_server_url === 'string') {
      const url = stored.revalgo_server_url.replace(/\/+$/, '');
      if (!url.includes('revalgo-api.onrender.com')) {
        return url;
      }
    }
  } catch (_) {}

  // Auto-heal: verify if local backend on port 5000 is active (sub-millisecond local check)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 250);
    const localRes = await fetch('http://localhost:5000/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (localRes.ok) {
      await chrome.storage.local.set({ revalgo_server_url: 'http://localhost:5000' });
      return 'http://localhost:5000';
    }
  } catch (_) {}

  // Auto-heal: check if local Vite dev server (port 5173) is active
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 250);
    const viteRes = await fetch('http://localhost:5173/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (viteRes.ok) {
      await chrome.storage.local.set({ revalgo_server_url: 'http://localhost:5173' });
      return 'http://localhost:5173';
    }
  } catch (_) {}

  // Runtime decoded default endpoint to avoid cleartext backend disclosure in source
  return atob('aHR0cHM6Ly9yZXZhbGdvLWFwaS5vbnJlbmRlci5jb20=');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LOG_QUESTION_ASYNC') {
    handleAsyncLog(request.payload)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message port open for async response
  }
});

async function handleAsyncLog(payload) {
  const { title, url, notes, code, codeLanguage, difficulty, testCases, authToken } = payload;

  if (!authToken) {
    throw new Error('Authentication token missing. Please set your token in extension config.');
  }

  const serverUrl = await getResolvedServerUrl();

  // 1. Classify with AI
  const aiRes = await fetch(`${serverUrl}/api/ai/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ title, url, notes, code, codeLanguage })
  });

  if (!aiRes.ok) {
    if (aiRes.status === 401) {
      throw new Error('Unauthorized (401). Please verify your token in ⚙ Config.');
    }
    let errMsg = 'AI classification failed';
    try {
      const errData = await aiRes.json();
      errMsg = errData.error || errMsg;
    } catch (_) {
      errMsg = `${aiRes.status} ${aiRes.statusText}`;
    }
    throw new Error(errMsg);
  }

  const aiData = await aiRes.json();

  // 2. Post Question to Revalgo
  const qRes = await fetch(`${serverUrl}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      title,
      url,
      notes,
      enhancedNotes: aiData.enhancedNotes,
      topic: aiData.topic,
      subtopic: aiData.subtopic,
      difficulty: difficulty || aiData.difficulty || 'Medium',
      patternNames: aiData.patterns || [],
      code: code || '',
      codeLanguage: codeLanguage || 'cpp',
      testCases: testCases || []
    })
  });

  if (!qRes.ok) {
    let errMsg = 'Failed to save question';
    try {
      const errData = await qRes.json();
      errMsg = errData.error || errMsg;
    } catch (_) {
      errMsg = `${qRes.status} ${qRes.statusText}`;
    }
    throw new Error(errMsg);
  }

  const savedQuestion = await qRes.json();

  // 3. Clear draft from storage
  await chrome.storage.local.remove(['draft_question']);

  // 4. Trigger native browser desktop notification
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '✓ Question Logged to Revalgo!',
      message: `"${title}" has been saved & scheduled for spaced repetition review tomorrow.`
    });
  } catch (_) {}

  return savedQuestion;
}
