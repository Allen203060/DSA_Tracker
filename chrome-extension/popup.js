// Revalgo Companion Popup Script

let capturedCode = '';
let capturedLanguage = 'cpp';
let capturedDifficulty = 'Medium';
let capturedTestCases = [];

const SERVER_URL = 'https://revalgo-api.onrender.com';

function detectCodeLanguage(code) {
  if (!code) return 'cpp';
  if (/^\s*(#include|using namespace|std::|vector<|int main|class Solution)/m.test(code)) return 'cpp';
  if (/^\s*(def |import |from |class Solution:|print\(|self\.)/m.test(code)) return 'python';
  if (/^\s*(public class|private |protected |System\.out|ArrayList<|HashMap<)/m.test(code)) return 'java';
  if (/^\s*(function |const |let |var |console\.log|module\.exports)/m.test(code)) return 'javascript';
  if (/^\s*(package |func |fmt\.)/m.test(code)) return 'go';
  return 'cpp';
}

document.addEventListener('DOMContentLoaded', async () => {
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const tokenInput = document.getElementById('tokenInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  const titleInput = document.getElementById('titleInput');
  const urlInput = document.getElementById('urlInput');
  const diffBadge = document.getElementById('diffBadge');
  const langBadge = document.getElementById('langBadge');
  const codeTextarea = document.getElementById('codeTextarea');
  const clearCodeBtn = document.getElementById('clearCodeBtn');
  const notesInput = document.getElementById('notesInput');
  const aiNotesBtn = document.getElementById('aiNotesBtn');
  const submitBtn = document.getElementById('submitBtn');
  const statusMsg = document.getElementById('statusMsg');

  function showStatus(text, isError = false) {
    statusMsg.innerText = text;
    statusMsg.className = `status-msg ${isError ? 'status-error' : 'status-success'}`;
    statusMsg.style.display = 'block';
  }

  function hideStatus() {
    statusMsg.style.display = 'none';
  }

  // Load saved token
  const config = await chrome.storage.local.get(['revalgo_token']);
  let token = config.revalgo_token || '';

  // Auto-detect Token from open Revalgo tabs if token is missing
  if (!token) {
    try {
      const candidateTabs = await chrome.tabs.query({
        url: ['*://revalgo-api.onrender.com/*', '*://*.onrender.com/*', '*://localhost:*/*', '*://127.0.0.1:*/*']
      });
      for (const t of candidateTabs) {
        if (t.id) {
          const injection = await chrome.scripting.executeScript({
            target: { tabId: t.id },
            func: () => localStorage.getItem('revalgo_token')
          });
          if (injection && injection[0] && injection[0].result) {
            token = injection[0].result;
            await chrome.storage.local.set({ revalgo_token: token });
            break;
          }
        }
      }
    } catch (_) {}
  }

  tokenInput.value = token;

  if (!token) {
    settingsPanel.classList.remove('hidden');
    showStatus('Please enter your Revalgo Account Token to connect.', true);
  }

  toggleSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const newToken = tokenInput.value.trim();

    if (!newToken) {
      showStatus('Please enter your Revalgo Account Token.', true);
      return;
    }

    await chrome.storage.local.set({
      revalgo_token: newToken
    });

    settingsPanel.classList.add('hidden');
    showStatus('✓ Account connected successfully!');
    setTimeout(hideStatus, 3000);
  });

  // Manual code input synchronization
  codeTextarea.addEventListener('input', () => {
    capturedCode = codeTextarea.value;
    const detected = detectCodeLanguage(codeTextarea.value);
    if (detected) {
      capturedLanguage = detected;
      langBadge.innerText = detected.toUpperCase();
    }
  });

  if (clearCodeBtn) {
    clearCodeBtn.addEventListener('click', () => {
      codeTextarea.value = '';
      capturedCode = '';
      codeTextarea.focus();
    });
  }

  function applyScrapedData(res) {
    if (!res) return;
    if (res.title && (!titleInput.value || titleInput.value === 'GeeksforGeeks Problem')) {
      titleInput.value = res.title;
    }
    if (res.url) urlInput.value = res.url;
    if (res.difficulty) {
      capturedDifficulty = res.difficulty;
      diffBadge.innerText = res.difficulty;
      diffBadge.className = `badge badge-${res.difficulty.toLowerCase()}`;
    }
    if (res.code && (!codeTextarea.value.trim() || codeTextarea.value === capturedCode)) {
      capturedCode = res.code;
      codeTextarea.value = res.code;
    }
    if (res.language) {
      capturedLanguage = res.language;
      langBadge.innerText = res.language.toUpperCase();
    }
  }

  function fallbackParseFromTab(tab) {
    if (!tab || !tab.url) return;
    urlInput.value = tab.url;

    let title = tab.title || '';
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\|\s*Practice.*$/i, '')
      .replace(/\|\s*GeeksforGeeks.*$/i, '')
      .replace(/-\s*GeeksforGeeks.*$/i, '')
      .replace(/-\s*Practice.*$/i, '')
      .replace(/-\s*LeetCode.*$/i, '')
      .replace(/^Practice\s*\|\s*/i, '')
      .replace(/^Problems\s*\|\s*/i, '')
      .trim();

    if (!title || /^(practice|problems|geeksforgeeks|problem of the day|leetcode)$/i.test(title)) {
      const slugMatch = tab.url.match(/problems?\/([^\/\?#]+)/i);
      if (slugMatch) {
        const rawSlug = slugMatch[1].replace(/-[0-9]{6,}$/g, '').replace(/[-_]+/g, ' ');
        title = rawSlug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    if (title) {
      titleInput.value = title;
    }
  }

  // Query Active Tab to scrape problem & code
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      // 1. Instantly parse from active tab's URL and title (zero latency)
      fallbackParseFromTab(tab);

      // 2. Query content script
      chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROBLEM' }, async (res) => {
        if (chrome.runtime.lastError || !res) {
          // Tab was open before extension was installed or content script needs injection
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            // Retry message after dynamic injection
            chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROBLEM' }, (retryRes) => {
              if (retryRes) applyScrapedData(retryRes);
            });
          } catch (scriptErr) {
            console.log('Script injection notice:', scriptErr);
          }
          return;
        }

        applyScrapedData(res);
      });
    }
  } catch (err) {
    console.error('Failed to communicate with tab:', err);
  }

  // AI Auto-Fill Notes from Code
  aiNotesBtn.addEventListener('click', async () => {
    const cfg = await chrome.storage.local.get(['revalgo_token']);
    const authToken = cfg.revalgo_token;

    if (!authToken) {
      showStatus('Please configure your Revalgo token in Settings first.', true);
      settingsPanel.classList.remove('hidden');
      return;
    }

    const currentCode = (codeTextarea.value || capturedCode || '').trim();
    if (!currentCode) {
      showStatus('Please paste or write your solution code in the Solution Code box above.', true);
      codeTextarea.focus();
      return;
    }

    const currentLang = detectCodeLanguage(currentCode) || capturedLanguage || 'cpp';

    aiNotesBtn.disabled = true;
    aiNotesBtn.innerText = 'Analyzing...';
    hideStatus();

    try {
      const response = await fetch(`${SERVER_URL}/api/ai/summarize-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: titleInput.value || 'Problem',
          code: currentCode,
          codeLanguage: currentLang
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized (401). Please update your API token in ⚙ Config.');
        }
        let errMsg = 'Failed to summarize code';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `${response.status} ${response.statusText}`;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      notesInput.value = `${data.intuition}\n\n**Complexity:** ${data.complexity}`;
      showStatus('✨ Notes auto-generated from your variable names!');
      setTimeout(hideStatus, 3500);
    } catch (err) {
      let message = err.message || 'Connection failed';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        message = 'Cannot connect to Revalgo cloud service. Please check your connection.';
      }
      showStatus(`AI Summary Error: ${message}`, true);
    } finally {
      aiNotesBtn.disabled = false;
      aiNotesBtn.innerText = '✨ Auto-Fill from Code';
    }
  });

  // Submit to Revalgo
  submitBtn.addEventListener('click', async () => {
    const cfg = await chrome.storage.local.get(['revalgo_token']);
    const authToken = cfg.revalgo_token;

    if (!authToken) {
      showStatus('Please configure your Revalgo token in Settings first.', true);
      settingsPanel.classList.remove('hidden');
      return;
    }

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const notes = notesInput.value.trim();
    const currentCode = (codeTextarea.value || capturedCode || '').trim();
    const currentLang = detectCodeLanguage(currentCode) || capturedLanguage || 'cpp';

    if (!title) {
      showStatus('Please enter a problem title.', true);
      titleInput.focus();
      return;
    }

    if (!notes) {
      showStatus('Please write a brief intuition note (or click Auto-Fill).', true);
      notesInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Saving to Revalgo...</span>';
    hideStatus();

    try {
      // 1. Classify with AI
      const aiRes = await fetch(`${SERVER_URL}/api/ai/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, url, notes })
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
      const qRes = await fetch(`${SERVER_URL}/api/questions`, {
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
          difficulty: capturedDifficulty || aiData.difficulty || 'Medium',
          patternNames: aiData.patterns || [],
          code: currentCode,
          codeLanguage: currentLang,
          testCases: capturedTestCases
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

      showStatus('✓ Question Saved! Spaced repetition scheduled for tomorrow.');
      submitBtn.innerHTML = '<span>✓ Saved to Revalgo!</span>';
      setTimeout(() => {
        window.close();
      }, 1800);
    } catch (err) {
      let message = err.message || 'Connection failed';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        message = 'Cannot connect to Revalgo cloud. Please check your connection.';
      }
      showStatus(`Save Error: ${message}`, true);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🚀 Log to Revalgo &amp; Schedule SM-2</span>';
    }
  });
});
