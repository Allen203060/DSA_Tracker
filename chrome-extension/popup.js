// Revalgo Companion Popup Script

let capturedCode = '';
let capturedLanguage = 'cpp';
let capturedDifficulty = 'Medium';
let capturedTestCases = [];

async function getResolvedServerUrl() {
  try {
    const stored = await chrome.storage.local.get(['revalgo_server_url']);
    if (stored.revalgo_server_url && typeof stored.revalgo_server_url === 'string') {
      return stored.revalgo_server_url.replace(/\/+$/, '');
    }
  } catch (_) {}
  // Runtime decoded default endpoint to avoid cleartext backend disclosure in source
  return atob('aHR0cHM6Ly9yZXZhbGdvLWFwaS5vbnJlbmRlci5jb20=');
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

  function persistDraft() {
    chrome.storage.local.set({
      draft_question: {
        title: titleInput.value,
        url: urlInput.value,
        notes: notesInput.value,
        code: codeTextarea.value,
        difficulty: capturedDifficulty,
        language: capturedLanguage,
        updatedAt: Date.now()
      }
    });
  }

  // Load saved token & draft
  const config = await chrome.storage.local.get(['revalgo_token', 'draft_question']);
  let token = config.revalgo_token || '';

  // Restore unsaved draft if user previously closed popup
  if (config.draft_question) {
    const draft = config.draft_question;
    if (draft.notes) notesInput.value = draft.notes;
    if (draft.code) {
      codeTextarea.value = draft.code;
      capturedCode = draft.code;
    }
    if (draft.title) titleInput.value = draft.title;
  }

  // Auto-detect Token & Server URL from open Revalgo tabs if token is missing
  if (!token) {
    try {
      const candidateTabs = await chrome.tabs.query({});
      for (const t of candidateTabs) {
        if (t.id && t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('edge://') && !t.url.startsWith('about:')) {
          try {
            const injection = await chrome.scripting.executeScript({
              target: { tabId: t.id },
              func: () => {
                try {
                  const tok = localStorage.getItem('revalgo_token');
                  if (tok) {
                    return {
                      token: tok,
                      serverUrl: localStorage.getItem('revalgo_api_endpoint') || window.location.origin
                    };
                  }
                } catch (_) {}
                return null;
              }
            });
            if (injection && injection[0] && injection[0].result) {
              const res = injection[0].result;
              token = res.token;
              await chrome.storage.local.set({
                revalgo_token: token,
                revalgo_server_url: res.serverUrl
              });
              break;
            }
          } catch (_) {}
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

  // Manual code & notes input draft synchronization
  titleInput.addEventListener('input', persistDraft);
  notesInput.addEventListener('input', persistDraft);

  codeTextarea.addEventListener('input', () => {
    capturedCode = codeTextarea.value;
    const detected = detectCodeLanguage(codeTextarea.value);
    if (detected) {
      capturedLanguage = detected;
      langBadge.innerText = detected.toUpperCase();
    }
    persistDraft();
  });

  if (clearCodeBtn) {
    clearCodeBtn.addEventListener('click', () => {
      codeTextarea.value = '';
      capturedCode = '';
      persistDraft();
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
    // Only update code if incoming code is at least as complete/long as current code (prevents truncation overwrite)
    if (res.code && res.code.trim().length > 0) {
      const currentCode = (codeTextarea.value || '').trim();
      const incomingCode = res.code.trim();

      const currentHasSignature = /(class Solution|def |public |function |#include|package )/m.test(currentCode);
      const incomingHasSignature = /(class Solution|def |public |function |#include|package )/m.test(incomingCode);

      // Never overwrite a code with valid signatures using a truncated fragment missing signatures
      const shouldUpdate = !currentCode ||
        (!currentHasSignature && incomingHasSignature) ||
        (incomingCode.length >= currentCode.length && (!currentHasSignature || incomingHasSignature));

      if (shouldUpdate) {
        capturedCode = res.code;
        codeTextarea.value = res.code;
        const detected = detectCodeLanguage(res.code);
        if (detected) {
          capturedLanguage = detected;
          langBadge.innerText = detected.toUpperCase();
        }
      }
    }
    if (res.language) {
      capturedLanguage = res.language;
      langBadge.innerText = res.language.toUpperCase();
    }
    persistDraft();
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
    persistDraft();
  }

  // Query Active Tab to scrape problem & code
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      // 1. Instantly parse from active tab's URL and title (zero latency)
      fallbackParseFromTab(tab);

      // 2. Direct Main World Extraction (Bypasses Monaco/Ace DOM Virtualization)
      try {
        const injection = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => {
            try {
              // A. Existing bridge function or element
              if (typeof window.__revalgoExtractCode === 'function') {
                const res = window.__revalgoExtractCode();
                if (res && res.code && res.code.trim().length > 20) return res.code;
              }
              const bridgeEl = document.getElementById('__revalgo_code_bridge__');
              if (bridgeEl && bridgeEl.value && bridgeEl.value.trim().length > 20) {
                return bridgeEl.value;
              }

              // B. Monaco Editor global models
              if (window.monaco && window.monaco.editor) {
                if (typeof window.monaco.editor.getModels === 'function') {
                  const models = window.monaco.editor.getModels();
                  if (Array.isArray(models) && models.length > 0) {
                    let bestCode = '';
                    let bestScore = -1;
                    for (const m of models) {
                      const text = m.getValue();
                      if (!text || !text.trim()) continue;
                      const lang = (m.getLanguageId ? m.getLanguageId() : '').toLowerCase();
                      let score = text.length;
                      if (['cpp', 'c', 'java', 'python', 'python3', 'javascript', 'typescript', 'go', 'rust', 'csharp', 'kotlin', 'swift'].includes(lang)) {
                        score += 10000;
                      } else if (lang === 'plaintext' || lang === 'json') {
                        score -= 5000;
                      }
                      if (/(class Solution|def |public |function |#include|package )/m.test(text)) {
                        score += 20000;
                      }
                      if (score > bestScore) {
                        bestScore = score;
                        bestCode = text;
                      }
                    }
                    if (bestCode && bestCode.trim()) return bestCode;
                  }
                }

                if (typeof window.monaco.editor.getEditors === 'function') {
                  const editors = window.monaco.editor.getEditors();
                  if (Array.isArray(editors) && editors.length > 0) {
                    for (const ed of editors) {
                      try {
                        const val = ed.getValue();
                        if (val && val.trim().length > 20) return val;
                      } catch (_) {}
                    }
                  }
                }
              }

              // C. Deep React Fiber Traversal on Monaco Editor DOM roots
              const roots = document.querySelectorAll('.monaco-editor, [data-track-load="code_editor"], .editor-container, .view-lines, [class*="code-editor"], [class*="CodeEditor"], .ace_editor');
              for (const root of roots) {
                const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
                if (fiberKey) {
                  let curr = root[fiberKey];
                  let depth = 0;
                  while (curr && depth < 45) {
                    const targets = [curr.memoizedProps, curr.memoizedState, curr.stateNode];
                    for (const target of targets) {
                      if (!target || typeof target !== 'object') continue;
                      try {
                        if (typeof target.getValue === 'function') {
                          const val = target.getValue();
                          if (val && typeof val === 'string' && val.trim().length > 20) return val;
                        }
                        if (target.editor && typeof target.editor.getValue === 'function') {
                          const val = target.editor.getValue();
                          if (val && typeof val === 'string' && val.trim().length > 20) return val;
                        }
                        if (target._editor && typeof target._editor.getValue === 'function') {
                          const val = target._editor.getValue();
                          if (val && typeof val === 'string' && val.trim().length > 20) return val;
                        }
                        if (target.ref && target.ref.current && typeof target.ref.current.getValue === 'function') {
                          const val = target.ref.current.getValue();
                          if (val && typeof val === 'string' && val.trim().length > 20) return val;
                        }
                        if (target.model && typeof target.model.getValue === 'function') {
                          const val = target.model.getValue();
                          if (val && typeof val === 'string' && val.trim().length > 20) return val;
                        }
                      } catch (_) {}

                      for (const k of Object.keys(target)) {
                        try {
                          const c = target[k];
                          if (c && typeof c === 'object' && typeof c.getValue === 'function') {
                            const val = c.getValue();
                            if (val && typeof val === 'string' && val.trim().length > 20) return val;
                          }
                        } catch (_) {}
                      }

                      if (typeof target.value === 'string' && target.value.length > 25 && /(class |def |function |#include|import )/.test(target.value)) {
                        return target.value;
                      }
                      if (typeof target.code === 'string' && target.code.length > 25 && /(class |def |function |#include|import )/.test(target.code)) {
                        return target.code;
                      }
                    }
                    curr = curr.return;
                    depth++;
                  }
                }
              }

              // D. Ace Editor & CodeMirror
              const aceEl = document.querySelector('.ace_editor');
              if (aceEl && aceEl.env && aceEl.env.editor) {
                const val = aceEl.env.editor.getValue();
                if (val && val.trim()) return val;
              }
              if (window.ace && typeof window.ace.edit === 'function' && aceEl) {
                try {
                  const val = window.ace.edit(aceEl).getValue();
                  if (val && val.trim()) return val;
                } catch (_) {}
              }
              if (window.editor && typeof window.editor.getValue === 'function') {
                const val = window.editor.getValue();
                if (val && val.trim()) return val;
              }
              const cmEl = document.querySelector('.CodeMirror');
              if (cmEl && cmEl.CodeMirror && typeof cmEl.CodeMirror.getValue === 'function') {
                const val = cmEl.CodeMirror.getValue();
                if (val && val.trim()) return val;
              }

              // E. LeetCode LocalStorage Search
              try {
                const slugMatch = window.location.pathname.match(/problems\/([^\/\?#]+)/i);
                const slug = slugMatch ? slugMatch[1].toLowerCase().replace(/[-_]+/g, '') : '';
                let bestLocal = '';
                let bestLocalScore = -1;
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (!key) continue;
                  const lower = key.toLowerCase();
                  if (!lower.includes('code') && !lower.includes('solution') && !lower.includes('editor') && (!slug || !lower.replace(/[-_]+/g, '').includes(slug))) continue;
                  const raw = localStorage.getItem(key);
                  if (!raw || raw.length < 25) continue;
                  let cand = raw;
                  if (raw.trim().startsWith('{') || raw.trim().startsWith('"')) {
                    try {
                      const p = JSON.parse(raw);
                      cand = typeof p === 'string' ? p : (p.code || p.typed_code || p.solution || p.value || '');
                    } catch (_) {}
                  }
                  if (typeof cand === 'string' && cand.trim().length > 25) {
                    let s = cand.length;
                    if (/(class Solution|def |public |function |#include|package )/m.test(cand)) s += 25000;
                    if (slug && lower.replace(/[-_]+/g, '').includes(slug)) s += 15000;
                    if (s > bestLocalScore) {
                      bestLocalScore = s;
                      bestLocal = cand;
                    }
                  }
                }
                if (bestLocal && bestLocalScore > 10000) return bestLocal;
              } catch (_) {}
            } catch (_) {}
            return null;
          }
        });

        if (injection && injection[0] && injection[0].result) {
          const mainCode = injection[0].result;
          if (mainCode && mainCode.trim().length >= (codeTextarea.value || '').trim().length) {
            codeTextarea.value = mainCode;
            capturedCode = mainCode;
            const detected = detectCodeLanguage(mainCode);
            if (detected) {
              capturedLanguage = detected;
              langBadge.innerText = detected.toUpperCase();
            }
            persistDraft();
          }
        }
      } catch (mainErr) {
        console.log('Main world direct query notice:', mainErr);
      }

      // 3. Query content script for metadata & fallback code
      chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROBLEM' }, async (res) => {
        if (chrome.runtime.lastError || !res) {
          // Tab was open before extension was installed or content script needs injection
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              world: 'MAIN',
              files: ['page-bridge.js']
            });
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
      const serverUrl = await getResolvedServerUrl();
      const response = await fetch(`${serverUrl}/api/ai/summarize-code`, {
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
      let formatted = data.intuition || '';
      if (Array.isArray(data.keySteps) && data.keySteps.length > 0) {
        formatted += '\n\n**Key Steps:**\n' + data.keySteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      }
      if (Array.isArray(data.edgeCases) && data.edgeCases.length > 0) {
        formatted += '\n\n**Edge Cases:**\n' + data.edgeCases.map(e => `- ${e}`).join('\n');
      }
      if (data.complexity) {
        formatted += `\n\n**Complexity:** ${data.complexity}`;
      }
      notesInput.value = formatted;
      persistDraft();
      showStatus('✨ Deep intuition & key steps generated from your code!');
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

  // Resilient Background Logging to Revalgo
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
    submitBtn.innerHTML = '<span>Saving in Background...</span>';
    showStatus('Saving... You can safely close this popup or switch tabs.');

    // Delegate to Background Service Worker so closing popup NEVER aborts the save
    chrome.runtime.sendMessage({
      type: 'LOG_QUESTION_ASYNC',
      payload: {
        title,
        url,
        notes,
        code: currentCode,
        codeLanguage: currentLang,
        difficulty: capturedDifficulty,
        testCases: capturedTestCases,
        authToken
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        // If popup closed before response arrived, background service worker finished it!
        return;
      }

      if (response && response.success) {
        showStatus('✓ Question Saved! Spaced repetition scheduled for tomorrow.');
        submitBtn.innerHTML = '<span>✓ Saved to Revalgo!</span>';
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        showStatus(`Save Error: ${response?.error || 'Failed to save question'}`, true);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🚀 Log to Revalgo &amp; Schedule SM-2</span>';
      }
    });
  });
});
