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
  if (/^\s*(#include|using namespace|std::|vector<|int main|class Solution\s*\{\s*public:)/m.test(code)) return 'cpp';
  if (/^\s*(def |import |from |class Solution:|print\(|self\.)/m.test(code)) return 'python';
  if (/^\s*(public class|private |protected |System\.out|ArrayList<|HashMap<|Queue<|class Solution\s*\{[\s\S]*?(?:public\s+(?:int|void|boolean|String|List|long)|class\s+Node))/m.test(code) || /\b(new int\[|new String\[|Arrays\.fill|LinkedList<|ArrayList<|HashMap<|HashSet<)/m.test(code)) return 'java';
  if (/^\s*(function |const |let |var |console\.log|module\.exports)/m.test(code)) return 'javascript';
  if (/^\s*(package |func |fmt\.)/m.test(code)) return 'go';
  if (/class Solution/m.test(code)) {
    if (/\b(public\s+[a-zA-Z<>]+|new\s+[A-Z]\w+|System\.out)\b/.test(code)) return 'java';
    return 'cpp';
  }
  return 'cpp';
}

async function initPopup() {
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
    if (!statusMsg) return;
    statusMsg.innerText = text;
    statusMsg.className = `status-msg ${isError ? 'status-error' : 'status-success'}`;
    statusMsg.style.display = 'block';
  }

  function hideStatus() {
    if (!statusMsg) return;
    statusMsg.style.display = 'none';
  }

  function persistDraft() {
    chrome.storage.local.set({
      draft_question: {
        title: titleInput ? titleInput.value : '',
        url: urlInput ? urlInput.value : '',
        notes: notesInput ? notesInput.value : '',
        code: codeTextarea ? codeTextarea.value : '',
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
    if (draft.notes && notesInput) notesInput.value = draft.notes;
    if (draft.code && codeTextarea) {
      codeTextarea.value = draft.code;
      capturedCode = draft.code;
    }
    if (draft.title && titleInput) titleInput.value = draft.title;
    if (draft.url && urlInput) urlInput.value = draft.url;
  }

  if (tokenInput) tokenInput.value = token;

  if (!token) {
    if (settingsPanel) settingsPanel.classList.remove('hidden');
    showStatus('Please enter your Revalgo Account Token to connect.', true);
  }

  // Non-blocking auto-detection of Token & Server URL from open tabs
  async function detectTokenFromOpenTabs() {
    try {
      const candidateTabs = await chrome.tabs.query({});
      for (const t of candidateTabs) {
        if (!t.id || !t.url) continue;
        if (t.url.startsWith('chrome://') || t.url.startsWith('edge://') || t.url.startsWith('about:') || t.url.startsWith('chrome-extension://')) continue;
        const isRevalgoCandidate = t.url.includes('onrender.com') ||
                                   t.url.includes('localhost') ||
                                   t.url.includes('127.0.0.1') ||
                                   (t.title && t.title.toLowerCase().includes('revalgo'));
        if (!isRevalgoCandidate) continue;

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
            await chrome.storage.local.set({
              revalgo_token: res.token,
              revalgo_server_url: res.serverUrl
            });
            return res.token;
          }
        } catch (_) {}
      }
    } catch (_) {}
    return null;
  }

  if (!token) {
    detectTokenFromOpenTabs().then(detectedToken => {
      if (detectedToken) {
        token = detectedToken;
        if (tokenInput) tokenInput.value = token;
        if (settingsPanel) settingsPanel.classList.add('hidden');
        hideStatus();
      }
    }).catch(console.error);
  }

  if (toggleSettingsBtn) {
    toggleSettingsBtn.addEventListener('click', () => {
      if (settingsPanel) settingsPanel.classList.toggle('hidden');
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      const newToken = (tokenInput ? tokenInput.value : '').trim();
      if (!newToken) {
        showStatus('Please enter your Revalgo Account Token.', true);
        return;
      }
      await chrome.storage.local.set({ revalgo_token: newToken });
      token = newToken;
      if (settingsPanel) settingsPanel.classList.add('hidden');
      showStatus('✓ Account connected successfully!');
      setTimeout(hideStatus, 3000);
    });
  }

  if (titleInput) titleInput.addEventListener('input', persistDraft);
  if (notesInput) notesInput.addEventListener('input', persistDraft);

  if (codeTextarea) {
    codeTextarea.addEventListener('input', () => {
      capturedCode = codeTextarea.value;
      const detected = detectCodeLanguage(codeTextarea.value);
      if (detected) {
        capturedLanguage = detected;
        if (langBadge) langBadge.innerText = detected.toUpperCase();
      }
      persistDraft();
    });
  }

  if (clearCodeBtn) {
    clearCodeBtn.addEventListener('click', () => {
      if (codeTextarea) codeTextarea.value = '';
      capturedCode = '';
      persistDraft();
      if (codeTextarea) codeTextarea.focus();
    });
  }

  function applyScrapedData(res) {
    if (!res) return;
    if (res.title && titleInput && (!titleInput.value || titleInput.value === 'GeeksforGeeks Problem')) {
      titleInput.value = res.title;
    }
    if (res.url && urlInput) {
      urlInput.value = res.url;
    }
    if (res.difficulty && diffBadge) {
      capturedDifficulty = res.difficulty;
      diffBadge.innerText = res.difficulty;
      diffBadge.className = `badge badge-${res.difficulty.toLowerCase()}`;
    }
    if (res.code && res.code.trim().length > 0 && codeTextarea) {
      const currentCode = (codeTextarea.value || '').trim();
      const incomingCode = res.code.trim();

      const currentHasSignature = /(class Solution|def |public |function |#include|package )/m.test(currentCode);
      const incomingHasSignature = /(class Solution|def |public |function |#include|package )/m.test(incomingCode);

      const shouldUpdate = !currentCode ||
        (!currentHasSignature && incomingHasSignature) ||
        (incomingCode.length >= currentCode.length && (!currentHasSignature || incomingHasSignature));

      if (shouldUpdate) {
        capturedCode = res.code;
        codeTextarea.value = res.code;
        const detected = res.language || detectCodeLanguage(res.code);
        if (detected) {
          capturedLanguage = detected;
          if (langBadge) langBadge.innerText = detected.toUpperCase();
        }
      }
    }
    if (res.language && langBadge) {
      capturedLanguage = res.language;
      langBadge.innerText = res.language.toUpperCase();
    }
    persistDraft();
  }

  function fallbackParseFromTab(tab) {
    if (!tab) return;
    if (tab.url && urlInput) {
      urlInput.value = tab.url;
    }

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
      const slugMatch = (tab.url || '').match(/problems?\/([^\/\?#]+)/i);
      if (slugMatch) {
        const rawSlug = slugMatch[1].replace(/-[0-9]{6,}$/g, '').replace(/[-_]+/g, ' ');
        title = rawSlug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    if (title && titleInput && (!titleInput.value || titleInput.value === 'GeeksforGeeks Problem')) {
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

      // In-page comprehensive scraper function
      const inPageScrape = () => {
        try {
          const res = {
            url: window.location.origin + window.location.pathname,
            title: '',
            difficulty: 'Medium',
            language: '',
            code: '',
            source: ''
          };

          // 1. EXTRACT TITLE
          const lcTitleEl = document.querySelector('div[class*="text-title-large"] a') ||
                            document.querySelector('div[class*="text-title-large"]') ||
                            document.querySelector('[data-cy="question-title"]') ||
                            document.querySelector('div.flex.items-start h4') ||
                            document.querySelector('div[class*="title-large"]');
          if (lcTitleEl && lcTitleEl.innerText && lcTitleEl.innerText.trim()) {
            res.title = lcTitleEl.innerText.trim();
          }

          if (!res.title) {
            const gfgTitleEl = document.querySelector('.problem-tab__name') ||
                               document.querySelector('h3.problem-tab__name') ||
                               document.querySelector('[class*="problem_title"]') ||
                               document.querySelector('[class*="problemName"]') ||
                               document.querySelector('[class*="problems_header_content"] h3') ||
                               document.querySelector('[class*="problems_header_content"] h2');
            if (gfgTitleEl && gfgTitleEl.innerText && gfgTitleEl.innerText.trim()) {
              res.title = gfgTitleEl.innerText.trim();
            }
          }

          if (!res.title) {
            try {
              const nextScript = document.getElementById('__NEXT_DATA__');
              if (nextScript && nextScript.textContent) {
                const parsed = JSON.parse(nextScript.textContent);
                const probData = parsed.props?.pageProps?.allData?.probData ||
                                 parsed.props?.pageProps?.data ||
                                 parsed.props?.pageProps?.problemData;
                if (probData && probData.problem_name) {
                  res.title = probData.problem_name;
                }
              }
            } catch (_) {}
          }

          if (!res.title || /^(practice|problems|geeksforgeeks|problem of the day|leetcode)$/i.test(res.title)) {
            let docTitle = document.title || '';
            docTitle = docTitle
              .replace(/\|\s*Practice.*$/i, '')
              .replace(/\|\s*GeeksforGeeks.*$/i, '')
              .replace(/-\s*GeeksforGeeks.*$/i, '')
              .replace(/-\s*Practice.*$/i, '')
              .replace(/-\s*LeetCode.*$/i, '')
              .replace(/^Practice\s*\|\s*/i, '')
              .replace(/^Problems\s*\|\s*/i, '')
              .trim();
            if (docTitle && !/^(practice|problems|geeksforgeeks|problem of the day|leetcode)$/i.test(docTitle)) {
              res.title = docTitle;
            }
          }

          if (!res.title) {
            const match = window.location.pathname.match(/problems?\/([^\/\?#]+)/i);
            if (match) {
              const rawSlug = match[1].replace(/-[0-9]{6,}$/g, '').replace(/[-_]+/g, ' ');
              res.title = rawSlug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
          }

          // 2. EXTRACT DIFFICULTY
          const diffEl = document.querySelector('div[class*="text-difficulty-"]') ||
                         document.querySelector('div[class*="text-olive"]') ||
                         document.querySelector('div[class*="text-yellow"]') ||
                         document.querySelector('div[class*="text-pink"]') ||
                         document.querySelector('div[class*="text-teal"]') ||
                         document.querySelector('div[class*="text-green"]') ||
                         document.querySelector('div[class*="text-red"]');
          if (diffEl && diffEl.innerText && diffEl.innerText.trim()) {
            const dText = diffEl.innerText.trim().toLowerCase();
            if (dText.includes('easy')) res.difficulty = 'Easy';
            else if (dText.includes('hard')) res.difficulty = 'Hard';
            else if (dText.includes('med')) res.difficulty = 'Medium';
          } else {
            const gfgDiffEl = document.querySelector('.problem-tab__difficulty') ||
                              document.querySelector('[class*="difficulty"]') ||
                              document.querySelector('[class*="level"]');
            if (gfgDiffEl && gfgDiffEl.innerText) {
              const dText = gfgDiffEl.innerText.toLowerCase();
              if (dText.includes('school') || dText.includes('basic') || dText.includes('easy')) res.difficulty = 'Easy';
              else if (dText.includes('hard')) res.difficulty = 'Hard';
              else if (dText.includes('med')) res.difficulty = 'Medium';
            }
          }

          // 3. EXTRACT LANGUAGE FROM DOM BUTTON
          const langBtn = document.querySelector('button[id*="headlessui-listbox-button"]') ||
                          document.querySelector('button[aria-haspopup="listbox"]') ||
                          document.querySelector('button[data-cy="lang-select"]') ||
                          document.querySelector('button[class*="language"]') ||
                          document.querySelector('select[class*="language"]') ||
                          document.querySelector('[aria-label*="language"]');
          if (langBtn && langBtn.innerText) {
            const lText = langBtn.innerText.toLowerCase();
            if (lText.includes('c++')) res.language = 'cpp';
            else if (lText.includes('python')) res.language = 'python';
            else if (lText.includes('java') && !lText.includes('script')) res.language = 'java';
            else if (lText.includes('script')) res.language = 'javascript';
            else if (lText.includes('go')) res.language = 'go';
          }

          // 4. EXTRACT CODE
          // A. Page bridge
          if (typeof window.__revalgoExtractCode === 'function') {
            const b = window.__revalgoExtractCode();
            if (b && b.code && b.code.trim().length > 20) {
              res.code = b.code;
              res.source = 'bridge-fn';
            }
          }
          if (!res.code) {
            const bridgeEl = document.getElementById('__revalgo_code_bridge__');
            if (bridgeEl && bridgeEl.value && bridgeEl.value.trim().length > 20) {
              res.code = bridgeEl.value;
              res.source = 'bridge-el';
            }
          }

          // B. Monaco Editor models
          if (!res.code && window.monaco && window.monaco.editor && typeof window.monaco.editor.getModels === 'function') {
            const models = window.monaco.editor.getModels();
            if (Array.isArray(models) && models.length > 0) {
              let bestCode = '';
              let bestScore = -1;
              let modelLang = '';
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
                  modelLang = lang;
                }
              }
              if (bestCode && bestCode.trim()) {
                res.code = bestCode;
                res.source = 'monaco-model';
                if (!res.language && modelLang) {
                  if (modelLang.includes('java') && !modelLang.includes('script')) res.language = 'java';
                  else if (modelLang.includes('py')) res.language = 'python';
                  else if (modelLang.includes('cpp') || modelLang === 'c') res.language = 'cpp';
                  else if (modelLang.includes('script')) res.language = 'javascript';
                  else if (modelLang.includes('go')) res.language = 'go';
                }
              }
            }
          }

          // C. Monaco Editor instances
          if (!res.code && window.monaco && window.monaco.editor && typeof window.monaco.editor.getEditors === 'function') {
            const editors = window.monaco.editor.getEditors();
            if (Array.isArray(editors) && editors.length > 0) {
              for (const ed of editors) {
                try {
                  const val = ed.getValue();
                  if (val && val.trim().length > 20) {
                    res.code = val;
                    res.source = 'monaco-editor';
                    break;
                  }
                } catch (_) {}
              }
            }
          }

          // D. React Fiber Traversal on Monaco & Editor DOM roots
          if (!res.code) {
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
                        if (val && typeof val === 'string' && val.trim().length > 20) {
                          res.code = val;
                          res.source = 'react-fiber';
                          break;
                        }
                      }
                      if (target.editor && typeof target.editor.getValue === 'function') {
                        const val = target.editor.getValue();
                        if (val && typeof val === 'string' && val.trim().length > 20) {
                          res.code = val;
                          res.source = 'react-fiber';
                          break;
                        }
                      }
                      if (target._editor && typeof target._editor.getValue === 'function') {
                        const val = target._editor.getValue();
                        if (val && typeof val === 'string' && val.trim().length > 20) {
                          res.code = val;
                          res.source = 'react-fiber';
                          break;
                        }
                      }
                      if (target.ref && target.ref.current && typeof target.ref.current.getValue === 'function') {
                        const val = target.ref.current.getValue();
                        if (val && typeof val === 'string' && val.trim().length > 20) {
                          res.code = val;
                          res.source = 'react-fiber';
                          break;
                        }
                      }
                      if (target.model && typeof target.model.getValue === 'function') {
                        const val = target.model.getValue();
                        if (val && typeof val === 'string' && val.trim().length > 20) {
                          res.code = val;
                          res.source = 'react-fiber';
                          break;
                        }
                      }
                      if (typeof target.value === 'string' && target.value.length > 25 && /(class |def |function |#include|import )/.test(target.value)) {
                        res.code = target.value;
                        res.source = 'react-fiber';
                        break;
                      }
                      if (typeof target.code === 'string' && target.code.length > 25 && /(class |def |function |#include|import )/.test(target.code)) {
                        res.code = target.code;
                        res.source = 'react-fiber';
                        break;
                      }
                    } catch (_) {}
                  }
                  if (res.code) break;
                  curr = curr.return;
                  depth++;
                }
              }
              if (res.code) break;
            }
          }

          // E. Ace Editor & CodeMirror
          if (!res.code) {
            const aceEl = document.querySelector('.ace_editor');
            if (aceEl && aceEl.env && aceEl.env.editor) {
              res.code = aceEl.env.editor.getValue();
              res.source = 'ace-env';
            } else if (window.ace && typeof window.ace.edit === 'function' && aceEl) {
              try {
                res.code = window.ace.edit(aceEl).getValue();
                res.source = 'ace-global';
              } catch (_) {}
            } else if (window.editor && typeof window.editor.getValue === 'function') {
              res.code = window.editor.getValue();
              res.source = 'window-editor';
            }
          }

          // F. LocalStorage Search
          if (!res.code) {
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
              if (bestLocal && bestLocalScore > 10000) {
                res.code = bestLocal;
                res.source = 'localstorage';
              }
            } catch (_) {}
          }

          // G. DOM View Lines fallback
          if (!res.code) {
            const viewLines = Array.from(document.querySelectorAll('.monaco-editor .view-line, .view-lines .view-line, .ace_line, [class*="ace_line"]'));
            if (viewLines.length > 0) {
              res.code = viewLines.map(l => l.innerText.replace(/\u00A0/g, ' ')).join('\n').trim();
              res.source = 'dom-view-lines';
            }
          }

          // Detect language from code if not yet detected
          if (!res.language && res.code) {
            if (/^\s*(#include|using namespace|std::|vector<|int main|class Solution\s*\{\s*public:)/m.test(res.code)) res.language = 'cpp';
            else if (/^\s*(def |import |from |class Solution:|print\(|self\.)/m.test(res.code)) res.language = 'python';
            else if (/^\s*(public class|private |protected |System\.out|ArrayList<|HashMap<|Queue<|class Solution\s*\{[\s\S]*?(?:public\s+(?:int|void|boolean|String|List|long)|class\s+Node))/m.test(res.code) || /\b(new int\[|new String\[|Arrays\.fill|LinkedList<|ArrayList<|HashMap<|HashSet<)/m.test(res.code)) res.language = 'java';
            else if (/^\s*(function |const |let |var |console\.log|module\.exports)/m.test(res.code)) res.language = 'javascript';
            else if (/^\s*(package |func |fmt\.)/m.test(res.code)) res.language = 'go';
            else if (/class Solution/m.test(res.code)) {
              if (/\b(public\s+[a-zA-Z<>]+|new\s+[A-Z]\w+|System\.out)\b/.test(res.code)) res.language = 'java';
              else res.language = 'cpp';
            }
          }

          return res;
        } catch (err) {
          return { error: err.toString() };
        }
      };

      // 2. Direct Main World Extraction (Bypasses Monaco/Ace DOM Virtualization)
      try {
        const injection = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: inPageScrape
        });

        if (injection && injection[0] && injection[0].result) {
          applyScrapedData(injection[0].result);
        }
      } catch (mainErr) {
        console.log('Main world direct query notice:', mainErr);
        // Fallback to isolated world execution if MAIN world is restricted
        try {
          const isoInjection = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: inPageScrape
          });
          if (isoInjection && isoInjection[0] && isoInjection[0].result) {
            applyScrapedData(isoInjection[0].result);
          }
        } catch (_) {}
      }

      // 3. Content script query & auto-injection fallback
      chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROBLEM' }, async (res) => {
        if (chrome.runtime.lastError || !res) {
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
  if (aiNotesBtn) {
    aiNotesBtn.addEventListener('click', async () => {
      const cfg = await chrome.storage.local.get(['revalgo_token']);
      const authToken = cfg.revalgo_token;

      if (!authToken) {
        showStatus('Please configure your Revalgo token in Settings first.', true);
        if (settingsPanel) settingsPanel.classList.remove('hidden');
        return;
      }

      const currentCode = (codeTextarea ? codeTextarea.value : '' || capturedCode || '').trim();
      if (!currentCode) {
        showStatus('Please paste or write your solution code in the Solution Code box above.', true);
        if (codeTextarea) codeTextarea.focus();
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
            title: titleInput ? titleInput.value : 'Problem',
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
        if (notesInput) notesInput.value = formatted;
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
  }

  // Resilient Background Logging to Revalgo
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const cfg = await chrome.storage.local.get(['revalgo_token']);
      const authToken = cfg.revalgo_token;

      if (!authToken) {
        showStatus('Please configure your Revalgo token in Settings first.', true);
        if (settingsPanel) settingsPanel.classList.remove('hidden');
        return;
      }

      const title = titleInput ? titleInput.value.trim() : '';
      const url = urlInput ? urlInput.value.trim() : '';
      const notes = notesInput ? notesInput.value.trim() : '';
      const currentCode = (codeTextarea ? codeTextarea.value : '' || capturedCode || '').trim();
      const currentLang = detectCodeLanguage(currentCode) || capturedLanguage || 'cpp';

      if (!title) {
        showStatus('Please enter a problem title.', true);
        if (titleInput) titleInput.focus();
        return;
      }

      if (!notes) {
        showStatus('Please write a brief intuition note (or click Auto-Fill).', true);
        if (notesInput) notesInput.focus();
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
  }
}

// Reliable entrypoint check: handles cases where DOMContentLoaded already fired before script execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
