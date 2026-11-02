// Revalgo Companion Popup Script

let capturedCode = '';
let capturedLanguage = 'cpp';
let capturedDifficulty = 'Medium';
let capturedTestCases = [];

const DEFAULT_SERVER_URL = 'https://dsa-tracker.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const serverUrlInput = document.getElementById('serverUrlInput');
  const tokenInput = document.getElementById('tokenInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  const titleInput = document.getElementById('titleInput');
  const urlInput = document.getElementById('urlInput');
  const diffBadge = document.getElementById('diffBadge');
  const langBadge = document.getElementById('langBadge');
  const codePreview = document.getElementById('codePreview');
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

  // Load saved settings
  const config = await chrome.storage.local.get(['revalgo_server_url', 'revalgo_token']);
  const serverUrl = config.revalgo_server_url || DEFAULT_SERVER_URL;
  const token = config.revalgo_token || '';

  serverUrlInput.value = serverUrl;
  tokenInput.value = token;

  if (!token) {
    settingsPanel.classList.remove('hidden');
    showStatus('Please set your Revalgo Token in Settings to connect.', true);
  }

  toggleSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const newUrl = serverUrlInput.value.trim().replace(/\/$/, '') || DEFAULT_SERVER_URL;
    const newToken = tokenInput.value.trim();

    await chrome.storage.local.set({
      revalgo_server_url: newUrl,
      revalgo_token: newToken
    });

    settingsPanel.classList.add('hidden');
    showStatus('Connection settings saved successfully!');
    setTimeout(hideStatus, 3000);
  });

  // Query Active Tab to scrape problem & code
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROBLEM' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Not on a supported problem page or content script hasn't injected yet
          return;
        }

        if (res.title) titleInput.value = res.title;
        if (res.url) urlInput.value = res.url;
        if (res.difficulty) {
          capturedDifficulty = res.difficulty;
          diffBadge.innerText = res.difficulty;
          diffBadge.className = `badge badge-${res.difficulty.toLowerCase()}`;
        }
        if (res.code) {
          capturedCode = res.code;
          codePreview.innerText = res.code.slice(0, 300) + (res.code.length > 300 ? '\n... (truncated)' : '');
        }
        if (res.language) {
          capturedLanguage = res.language;
          langBadge.innerText = res.language.toUpperCase();
        }
      });
    }
  } catch (err) {
    console.error('Failed to communicate with tab:', err);
  }

  // AI Auto-Fill Notes from Code
  aiNotesBtn.addEventListener('click', async () => {
    const cfg = await chrome.storage.local.get(['revalgo_server_url', 'revalgo_token']);
    const baseUrl = cfg.revalgo_server_url || DEFAULT_SERVER_URL;
    const authToken = cfg.revalgo_token;

    if (!authToken) {
      showStatus('Please configure your Revalgo token in Settings first.', true);
      settingsPanel.classList.remove('hidden');
      return;
    }

    if (!capturedCode.trim()) {
      showStatus('No code detected in editor to summarize.', true);
      return;
    }

    aiNotesBtn.disabled = true;
    aiNotesBtn.innerText = 'Analyzing...';
    hideStatus();

    try {
      const response = await fetch(`${baseUrl}/api/ai/summarize-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: titleInput.value || 'Problem',
          code: capturedCode,
          codeLanguage: capturedLanguage
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to summarize code');
      }

      const data = await response.json();
      notesInput.value = `${data.intuition}\n\n**Complexity:** ${data.complexity}`;
      showStatus('Notes auto-generated from your variable names!');
      setTimeout(hideStatus, 3500);
    } catch (err) {
      showStatus(`AI Summary Error: ${err.message}`, true);
    } finally {
      aiNotesBtn.disabled = false;
      aiNotesBtn.innerText = '✨ Auto-Fill from Code';
    }
  });

  // Submit to Revalgo
  submitBtn.addEventListener('click', async () => {
    const cfg = await chrome.storage.local.get(['revalgo_server_url', 'revalgo_token']);
    const baseUrl = cfg.revalgo_server_url || DEFAULT_SERVER_URL;
    const authToken = cfg.revalgo_token;

    if (!authToken) {
      showStatus('Please configure your Revalgo token in Settings first.', true);
      settingsPanel.classList.remove('hidden');
      return;
    }

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const notes = notesInput.value.trim();

    if (!title) {
      showStatus('Please enter a problem title.', true);
      return;
    }

    if (!notes) {
      showStatus('Please write a brief intuition note (or click Auto-Fill).', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Saving to Revalgo...</span>';
    hideStatus();

    try {
      // 1. Classify with AI
      const aiRes = await fetch(`${baseUrl}/api/ai/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, url, notes })
      });

      if (!aiRes.ok) {
        const errData = await aiRes.json();
        throw new Error(errData.error || 'AI classification failed');
      }

      const aiData = await aiRes.json();

      // 2. Post Question to Revalgo
      const qRes = await fetch(`${baseUrl}/api/questions`, {
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
          code: capturedCode,
          codeLanguage: capturedLanguage,
          testCases: capturedTestCases
        })
      });

      if (!qRes.ok) {
        const errData = await qRes.json();
        throw new Error(errData.error || 'Failed to save question');
      }

      showStatus('✓ Question Saved! Spaced repetition scheduled for tomorrow.');
      submitBtn.innerHTML = '<span>✓ Saved to Revalgo!</span>';
      setTimeout(() => {
        window.close();
      }, 1800);
    } catch (err) {
      showStatus(`Save Error: ${err.message}`, true);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🚀 Log to Revalgo &amp; Schedule SM-2</span>';
    }
  });
});
