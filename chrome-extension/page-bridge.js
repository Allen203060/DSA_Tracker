// Revalgo Companion Page Bridge (Main World Execution Script)
// Runs directly in the webpage context (LeetCode / GeeksforGeeks) to bypass DOM virtualization
// and access full Monaco, Ace, and CodeMirror editor models directly from window memory and React fibers.

(function () {
  'use strict';

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

        // Check if key relates to code storage or the current question
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
        return { code: bestCode, source: 'localstorage-cache' };
      }
    } catch (_) {}
    return null;
  }

  function extractCompleteCodeFromPage() {
    try {
      // 1. MONACO EDITOR GLOBAL MODELS (LeetCode & Modern GeeksforGeeks)
      if (window.monaco && window.monaco.editor) {
        if (typeof window.monaco.editor.getModels === 'function') {
          const models = window.monaco.editor.getModels();
          if (Array.isArray(models) && models.length > 0) {
            let bestCode = '';
            let bestScore = -1;

            for (const model of models) {
              const text = model.getValue();
              if (!text || !text.trim()) continue;

              const lang = (model.getLanguageId ? model.getLanguageId() : '').toLowerCase();
              let score = text.length;

              // Prioritize standard programming languages over plaintext test cases
              if (['cpp', 'c', 'java', 'python', 'python3', 'javascript', 'typescript', 'go', 'rust', 'csharp', 'kotlin', 'swift'].includes(lang)) {
                score += 10000;
              } else if (lang === 'plaintext' || lang === 'json') {
                score -= 5000;
              }

              // High priority if it contains standard class/function signatures
              if (/(class Solution|def |public |function |#include|package )/m.test(text)) {
                score += 20000;
              }

              if (score > bestScore) {
                bestScore = score;
                bestCode = text;
              }
            }

            if (bestCode && bestCode.trim()) {
              return { code: bestCode, source: 'monaco-model' };
            }
          }
        }

        // Secondary Monaco check: Active editor instances
        if (typeof window.monaco.editor.getEditors === 'function') {
          const editors = window.monaco.editor.getEditors();
          if (Array.isArray(editors) && editors.length > 0) {
            let bestEdCode = '';
            let bestEdScore = -1;
            for (const ed of editors) {
              try {
                const val = ed.getValue();
                if (val && val.trim().length > 20) {
                  let s = val.length;
                  if (/(class Solution|def |public |function |#include|package )/m.test(val)) s += 20000;
                  if (s > bestEdScore) {
                    bestEdScore = s;
                    bestEdCode = val;
                  }
                }
              } catch (_) {}
            }
            if (bestEdCode && bestEdCode.trim()) {
              return { code: bestEdCode, source: 'monaco-editor' };
            }
          }
        }
      }

      // 2. REACT FIBER TRAVERSAL (LeetCode Dynamic Layout / Next.js Component Trees)
      // Extracts Monaco instance directly from React component state or ref when window.monaco is unexported
      const editorRoots = document.querySelectorAll('.monaco-editor, [data-track-load="code_editor"], .editor-container, .view-lines, [class*="code-editor"], [class*="CodeEditor"], .ace_editor');
      for (const root of editorRoots) {
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (fiberKey) {
          let curr = root[fiberKey];
          let depth = 0;
          while (curr && depth < 45) {
            const targets = [curr.memoizedProps, curr.memoizedState, curr.stateNode];

            for (const target of targets) {
              if (!target || typeof target !== 'object') continue;

              // Check for editor instances with .getValue()
              try {
                if (typeof target.getValue === 'function') {
                  const val = target.getValue();
                  if (val && typeof val === 'string' && val.trim().length > 20) {
                    return { code: val, source: 'react-fiber-direct-getValue' };
                  }
                }
                if (target.editor && typeof target.editor.getValue === 'function') {
                  const val = target.editor.getValue();
                  if (val && typeof val === 'string' && val.trim().length > 20) {
                    return { code: val, source: 'react-fiber-editor-getValue' };
                  }
                }
                if (target._editor && typeof target._editor.getValue === 'function') {
                  const val = target._editor.getValue();
                  if (val && typeof val === 'string' && val.trim().length > 20) {
                    return { code: val, source: 'react-fiber-_editor-getValue' };
                  }
                }
                if (target.ref && target.ref.current && typeof target.ref.current.getValue === 'function') {
                  const val = target.ref.current.getValue();
                  if (val && typeof val === 'string' && val.trim().length > 20) {
                    return { code: val, source: 'react-fiber-ref-getValue' };
                  }
                }
                if (target.model && typeof target.model.getValue === 'function') {
                  const val = target.model.getValue();
                  if (val && typeof val === 'string' && val.trim().length > 20) {
                    return { code: val, source: 'react-fiber-model-getValue' };
                  }
                }
              } catch (_) {}

              // Scan direct object keys for nested Monaco instances
              for (const k of Object.keys(target)) {
                try {
                  const candidate = target[k];
                  if (candidate && typeof candidate === 'object') {
                    if (typeof candidate.getValue === 'function') {
                      const val = candidate.getValue();
                      if (val && typeof val === 'string' && val.trim().length > 20) {
                        return { code: val, source: `react-fiber-key-${k}-getValue` };
                      }
                    }
                  }
                } catch (_) {}
              }

              // Check static code/value props
              if (typeof target.value === 'string' && target.value.length > 25 && /(class |def |function |#include|import )/.test(target.value)) {
                return { code: target.value, source: 'react-fiber-props-value' };
              }
              if (typeof target.code === 'string' && target.code.length > 25 && /(class |def |function |#include|import )/.test(target.code)) {
                return { code: target.code, source: 'react-fiber-props-code' };
              }
            }

            curr = curr.return;
            depth++;
          }
        }
      }

      // 3. ACE EDITOR (GeeksforGeeks classic/practice portal)
      const aceElement = document.querySelector('.ace_editor');
      if (aceElement) {
        if (aceElement.env && aceElement.env.editor && typeof aceElement.env.editor.getValue === 'function') {
          const val = aceElement.env.editor.getValue();
          if (val && val.trim()) {
            return { code: val, source: 'ace-env-editor' };
          }
        }
        if (window.ace && typeof window.ace.edit === 'function') {
          try {
            const ed = window.ace.edit(aceElement);
            if (ed && typeof ed.getValue === 'function') {
              const val = ed.getValue();
              if (val && val.trim()) {
                return { code: val, source: 'ace-edit-fn' };
              }
            }
          } catch (_) {}
        }
      }

      // 4. GLOBAL EDITOR HANDLES
      if (window.editor && typeof window.editor.getValue === 'function') {
        const val = window.editor.getValue();
        if (val && val.trim()) {
          return { code: val, source: 'window-editor' };
        }
      }
      if (window.aceEditor && typeof window.aceEditor.getValue === 'function') {
        const val = window.aceEditor.getValue();
        if (val && val.trim()) {
          return { code: val, source: 'window-aceEditor' };
        }
      }

      // 5. CODEMIRROR
      const cmElement = document.querySelector('.CodeMirror');
      if (cmElement && cmElement.CodeMirror && typeof cmElement.CodeMirror.getValue === 'function') {
        const val = cmElement.CodeMirror.getValue();
        if (val && val.trim()) {
          return { code: val, source: 'codemirror' };
        }
      }

      // 6. LEETCODE LOCALSTORAGE PERSISTENT DRAFT FALLBACK
      const localCode = extractCodeFromLocalStorage();
      if (localCode) {
        return localCode;
      }
    } catch (err) {
      console.warn('[Revalgo Page Bridge] Extraction notice:', err);
    }

    return null;
  }

  function dispatchExtractedCode() {
    const result = extractCompleteCodeFromPage();
    const code = result ? result.code : '';
    const source = result ? result.source : '';

    // 1. Shared DOM Element Bridge (Highest reliability: immune to event filtering & structured clone issues)
    try {
      let bridge = document.getElementById('__revalgo_code_bridge__');
      if (!bridge) {
        bridge = document.createElement('textarea');
        bridge.id = '__revalgo_code_bridge__';
        bridge.style.display = 'none';
        bridge.setAttribute('aria-hidden', 'true');
        (document.body || document.documentElement).appendChild(bridge);
      }
      bridge.value = code;
      bridge.dataset.ready = 'true';
      bridge.dataset.source = source;
      bridge.dataset.timestamp = String(Date.now());
    } catch (_) {}

    // 2. window.postMessage (Standard cross-realm structured cloning)
    try {
      window.postMessage({
        type: 'REVALGO_RECEIVE_FULL_CODE',
        code: code,
        source: source
      }, '*');
    } catch (_) {}

    // 3. CustomEvent on document
    try {
      document.dispatchEvent(new CustomEvent('REVALGO_RECEIVE_FULL_CODE', {
        detail: code
      }));
    } catch (_) {}

    return result;
  }

  // Expose on window for direct chrome.scripting calls
  window.__revalgoExtractCode = extractCompleteCodeFromPage;

  // Listen for requests dispatched by content.js (in isolated world)
  document.addEventListener('REVALGO_REQUEST_FULL_CODE', function () {
    dispatchExtractedCode();
  });

  window.addEventListener('message', function (event) {
    if (event.data && (event.data.type === 'REVALGO_REQUEST_FULL_CODE' || event.data.type === 'REVALGO_PING_CODE')) {
      const result = dispatchExtractedCode();
      if (event.data.type === 'REVALGO_PING_CODE') {
        window.postMessage({
          type: 'REVALGO_PONG_CODE',
          code: result ? result.code : ''
        }, '*');
      }
    }
  });

  // Self-execute once when page bridge mounts if bridge element is waiting
  if (document.getElementById('__revalgo_code_bridge__')) {
    dispatchExtractedCode();
  }
})();
