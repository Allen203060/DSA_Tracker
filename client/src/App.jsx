import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import axios from 'axios';
import { 
  BrainCircuit, Loader2, X, List, 
  ChevronDown, ChevronUp, Trash2, ExternalLink, Layers, Folder, 
  ChevronRight, Flame, Trophy, Activity, Code, Play, Copy, Check, 
  Plus, RotateCcw, Sparkles, CheckCircle, Edit3, Save, Sun, Moon 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ThreeBackground from './components/ThreeBackground';

function App() {
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  
  // Theme State: 'dark' (softer dark) or 'light'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (e) {}
    return 'dark';
  });
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);

  // Hierarchical Filter State
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({ Stack: true, Queue: true });
  
  const [viewMode, setViewMode] = useState('due'); // 'due' or 'all'
  
  // Daily Revision Limit & Difficulty Settings
  const [dailyRevisionLimit, setDailyRevisionLimit] = useState(() => {
    return parseInt(localStorage.getItem('dailyRevisionLimit')) || 5;
  });
  const [difficulty, setDifficulty] = useState('Medium');
  
  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('cpp');
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [showCodeSection, setShowCodeSection] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  // Question Notes State
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [noteViewMode, setNoteViewMode] = useState({}); // { [qId]: 'ai' | 'raw' }

  // Recall Review Modal State
  const [reviewingQuestion, setReviewingQuestion] = useState(null);
  const [recallText, setRecallText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);

  // Code Revision Window (Modal) State
  const [viewingCodeQuestion, setViewingCodeQuestion] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editCodeText, setEditCodeText] = useState('');
  const [editCodeLang, setEditCodeLang] = useState('cpp');
  const [editTestCases, setEditTestCases] = useState([]);

  // Code Practice Playground State
  const [playgroundQuestion, setPlaygroundQuestion] = useState(null);
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [playgroundLang, setPlaygroundLang] = useState('cpp');
  const [playgroundTestCases, setPlaygroundTestCases] = useState([]);
  const [isGradingCode, setIsGradingCode] = useState(false);
  const [isGeneratingBoilerplate, setIsGeneratingBoilerplate] = useState(false);
  const [codeEvaluationResult, setCodeEvaluationResult] = useState(null);

  // Heatmap & Learning Analytics State
  const [activityData, setActivityData] = useState({ 
    dailyActivity: {}, 
    stats: { currentStreak: 0, longestStreak: 0, totalNew: 0, totalRecalls: 0 } 
  });
  const [hoveredCell, setHoveredCell] = useState(null);

  // Apply and persist theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Noticeable radial outward circular reveal theme toggle with luminous shockwave ring
  const toggleTheme = (e) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // Trigger rotational micro-interaction
    setIsThemeSpinning(true);
    setTimeout(() => setIsThemeSpinning(false), 750);

    if (
      !document.startViewTransition || 
      (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      setTheme(nextTheme);
      return;
    }

    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : (e?.clientX ?? window.innerWidth / 2);
    const y = rect ? rect.top + rect.height / 2 : (e?.clientY ?? 0);

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.classList.add('theme-transitioning');

    // Spawn dramatic luminous shockwave ring across viewport
    try {
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '0px';
      ripple.style.height = '0px';
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '100000';
      ripple.style.border = nextTheme === 'dark' 
        ? '3px solid rgba(129, 140, 248, 0.95)' 
        : '3px solid rgba(99, 102, 241, 0.95)';
      ripple.style.boxShadow = nextTheme === 'dark'
        ? '0 0 60px 18px rgba(99, 102, 241, 0.8), inset 0 0 30px rgba(56, 189, 248, 0.65)'
        : '0 0 60px 18px rgba(99, 102, 241, 0.6), inset 0 0 30px rgba(99, 102, 241, 0.4)';
      document.body.appendChild(ripple);

      const rippleAnim = ripple.animate(
        [
          { width: '0px', height: '0px', opacity: 1 },
          { width: `${endRadius * 2.15}px`, height: `${endRadius * 2.15}px`, opacity: 0 }
        ],
        {
          duration: 720,
          easing: 'cubic-bezier(0.18, 1, 0.22, 1)'
        }
      );
      rippleAnim.onfinish = () => ripple.remove();
      rippleAnim.oncancel = () => ripple.remove();
    } catch {
      // Graceful fallback if DOM measurement fails
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
        if (nextTheme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
        try {
          localStorage.setItem('theme', nextTheme);
        } catch {
          // ignore
        }
      });
    });

    transition.ready.then(() => {
      const animation = root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 720,
          easing: 'cubic-bezier(0.18, 1, 0.22, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );

      const cleanup = () => {
        root.classList.remove('theme-transitioning');
      };

      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    }).catch(() => {
      root.classList.remove('theme-transitioning');
    });
  };

  const fetchQuestions = async () => {
    try {
      const dueRes = await axios.get(`/api/questions/due?limit=${dailyRevisionLimit}`);
      const allRes = await axios.get('/api/questions');
      setAllQuestions(allRes.data);
      setQuestions(viewMode === 'due' ? dueRes.data : allRes.data);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const res = await axios.get('/api/analytics/activity');
      setActivityData(res.data);
    } catch (error) {
      console.error("Failed to fetch activity stats", error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchActivityStats();
  }, [viewMode, dailyRevisionLimit]);

  // Global Escape key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (playgroundQuestion) setPlaygroundQuestion(null);
        if (viewingCodeQuestion) setViewingCodeQuestion(null);
        if (reviewingQuestion) closeReview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playgroundQuestion, viewingCodeQuestion, reviewingQuestion]);

  // Starter Boilerplate Code Templates
  const getStarterTemplate = (lang, titleStr) => {
    const pTitle = titleStr || 'Problem';
    switch (lang) {
      case 'cpp':
        return `#include <vector>\n#include <iostream>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Solution for ${pTitle}\n    vector<int> solve(vector<int>& nums, int target) {\n        unordered_map<int, int> num_map;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (num_map.count(complement))\n                return {num_map[complement], i};\n            num_map[nums[i]] = i;\n        }\n        return {};\n    }\n};\n`;
      case 'python':
        return `class Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        # Solution for ${pTitle}\n        num_map = {}\n        for i, num in enumerate(nums):\n            complement = target - num\n            if complement in num_map:\n                return [num_map[complement], i]\n            num_map[num] = i\n        return []\n`;
      case 'java':
        return `import java.util.*;\n\nclass Solution {\n    public int[] solve(int[] nums, int target) {\n        // Solution for ${pTitle}\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}\n`;
      case 'javascript':
        return `/**\n * Solution for ${pTitle}\n */\nfunction solve(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}\n`;
      case 'go':
        return `package main\n\nimport "fmt"\n\n// Solution for ${pTitle}\nfunc solve(nums []int, target int) []int {\n    m := make(map[int]int)\n    for i, num := range nums {\n        if idx, ok := m[target-num]; ok {\n            return []int{idx, i}\n        }\n        m[num] = i\n    }\n    return nil\n}\n`;
      default:
        return `// Write your ${lang} code here\n`;
    }
  };

  // Popout Code in New Window
  const openCodeInNewWindow = (question) => {
    const win = window.open('', '_blank', 'width=880,height=680,scrollbars=yes,resizable=yes');
    if (!win) return alert("Popup blocked! Please allow popups to open standalone code windows.");
    
    const codeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${question.title} — Solution</title>
        <style>
          body { background: #141926; color: #f1f5f9; font-family: 'JetBrains Mono', monospace; padding: 28px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; color: #818cf8; }
          .lang { background: rgba(99,102,241,0.15); color: #c7d2fe; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid rgba(99,102,241,0.3); text-transform: uppercase; }
          .code-container { background: #0e121e; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 24px; font-size: 13px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; color: #38bdf8; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: right; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; font-family: system-ui, sans-serif; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${question.title}</div>
          <div class="lang">${(question.codeLanguage || 'cpp')}</div>
        </div>
        <div class="code-container"><code>${(question.code || '// No solution code recorded for this question.').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></div>
        <div class="footer">DSA Tracker • Spaced Repetition Algorithmic Revision</div>
      </body>
      </html>
    `;
    win.document.write(codeHtml);
    win.document.close();
  };

  // Code Editor Keyboard Shortcuts & Formatting Handler
  const handleCodeKeyDown = (e, value, setter) => {
    const target = e.target;
    const { selectionStart, selectionEnd } = target;

    // 1. TAB & SHIFT+TAB
    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = '    ';
      
      if (e.shiftKey) {
        // Shift+Tab: Unindent
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const lastLineStart = before.lastIndexOf('\n') + 1;
        const currentLine = before.substring(lastLineStart);

        if (currentLine.startsWith(indent)) {
          const newBefore = before.substring(0, lastLineStart) + currentLine.substring(indent.length);
          setter(newBefore + after);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = Math.max(lastLineStart, selectionStart - indent.length);
          }, 0);
        } else if (currentLine.startsWith(' ')) {
          const spacesToRemove = currentLine.match(/^ +/)[0].length % 4 || Math.min(currentLine.match(/^ +/)[0].length, 4);
          const newBefore = before.substring(0, lastLineStart) + currentLine.substring(spacesToRemove);
          setter(newBefore + after);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = Math.max(lastLineStart, selectionStart - spacesToRemove);
          }, 0);
        }
      } else {
        // Tab: Indent with 4 spaces
        const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
        setter(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart + indent.length;
        }, 0);
      }
    }

    // 2. ENTER (Auto Indent & Smart Braces)
    else if (e.key === 'Enter') {
      const lines = value.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : '';

      if (/[{:([]\s*$/.test(currentLine)) {
        indent += '    ';
      }

      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
      setter(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 1 + indent.length;
      }, 0);
    }

    // 3. AUTO-CLOSING BRACKETS & QUOTES
    else if (['(', '{', '[', '"', "'"].includes(e.key) && selectionStart === selectionEnd) {
      const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
      const closeChar = pairs[e.key];
      
      if (['"', "'"].includes(e.key) && value[selectionStart] === e.key) {
        e.preventDefault();
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart + 1;
        }, 0);
        return;
      }

      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + e.key + closeChar + value.substring(selectionEnd);
      setter(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 1;
      }, 0);
    }

    // 4. BACKSPACE OVER EMPTY PAIR
    else if (e.key === 'Backspace' && selectionStart === selectionEnd && selectionStart > 0) {
      const charBefore = value[selectionStart - 1];
      const charAfter = value[selectionStart];
      const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
      
      if (pairs[charBefore] === charAfter) {
        e.preventDefault();
        const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionEnd + 1);
        setter(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart - 1;
        }, 0);
      }
    }
  };

  // Helper to extract or infer taxonomy from q.topic/subtopic or q.patterns
  const getTaxonomy = (q) => {
    let topic = q.topic;
    let subtopic = q.subtopic;

    if ((!topic || topic === 'General') && q.patterns && q.patterns.length > 0) {
      const firstPat = typeof q.patterns[0] === 'object' ? q.patterns[0].name : q.patterns[0];
      if (firstPat) {
        subtopic = firstPat;
        const lower = firstPat.toLowerCase();
        if (lower.includes('stack')) topic = 'Stack';
        else if (lower.includes('queue')) topic = 'Queue';
        else if (lower.includes('window') || lower.includes('pointer') || lower.includes('array') || lower.includes('sliding') || lower.includes('sum')) topic = 'Array & Two Pointers';
        else if (lower.includes('tree') || lower.includes('graph') || lower.includes('bfs') || lower.includes('dfs')) topic = 'Tree & Graph';
        else if (lower.includes('dynamic') || lower.includes('dp') || lower.includes('knapsack')) topic = 'Dynamic Programming';
        else topic = firstPat;
      }
    }

    return {
      topic: topic || 'Uncategorized',
      subtopic: subtopic || 'General'
    };
  };

  // Aggregate questions by Topic -> Subtopic tree
  const topicTree = allQuestions.reduce((acc, q) => {
    const tax = getTaxonomy(q);
    
    if (!acc[tax.topic]) {
      acc[tax.topic] = { count: 0, subtopics: {} };
    }
    acc[tax.topic].count += 1;
    acc[tax.topic].subtopics[tax.subtopic] = (acc[tax.topic].subtopics[tax.subtopic] || 0) + 1;
    return acc;
  }, {});

  const toggleTopicExpand = (topicName, e) => {
    e.stopPropagation();
    setExpandedTopics(prev => ({ ...prev, [topicName]: !prev[topicName] }));
  };

  // Filter displayed questions based on selected topic / subtopic
  const targetQuestions = questions;

  const displayedQuestions = targetQuestions.filter(q => {
    const tax = getTaxonomy(q);
    if (selectedSubtopic) {
      return tax.topic === selectedSubtopic.topic && tax.subtopic === selectedSubtopic.subtopic;
    }
    if (selectedTopic) {
      return tax.topic === selectedTopic;
    }
    return true;
  });

  const handleAddTestCase = (setter) => {
    setter(prev => [...prev, { input: '', expectedOutput: '' }]);
  };

  const handleRemoveTestCase = (index, setter) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index, field, value, setter) => {
    setter(prev => prev.map((tc, i) => i === index ? { ...tc, [field]: value } : tc));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !notes) return;
    setIsClassifying(true);

    try {
      const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
      const aiResponse = await axios.post('/api/ai/classify', { title, url, notes });
      const { patterns: extractedPatterns, enhancedNotes, topic, subtopic, difficulty: aiDifficulty } = aiResponse.data; 

      await axios.post('/api/questions', {
        title, url, notes, enhancedNotes, topic, subtopic,
        difficulty: difficulty || aiDifficulty || 'Medium',
        patternNames: extractedPatterns,
        code, codeLanguage, testCases: validTestCases
      });

      setTitle(''); setUrl(''); setNotes(''); setCode(''); setDifficulty('Medium');
      setTestCases([{ input: '', expectedOutput: '' }]);
      setShowCodeSection(false);
      fetchQuestions();
      fetchActivityStats();
    } catch (error) {
      const backendError = error.response?.data?.error || error.message;
      console.error("Failed to process question:", backendError);
      alert(`Backend Error: ${backendError}`);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleDeleteQuestion = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await axios.delete(`/api/questions/${id}`);
      fetchQuestions();
      fetchActivityStats();
    } catch (error) {
      console.error("Failed to delete question", error);
      alert("Error deleting question");
    }
  };

  const handleSaveEditedCode = async (qId) => {
    try {
      const updated = await axios.put(`/api/questions/${qId}`, {
        code: editCodeText,
        codeLanguage: editCodeLang,
        testCases: editTestCases
      });
      setViewingCodeQuestion(updated.data);
      setIsEditingCode(false);
      fetchQuestions();
    } catch (err) {
      console.error("Failed to save edited code", err);
      alert("Failed to save code changes.");
    }
  };

  const openCodeViewer = (q) => {
    setViewingCodeQuestion(q);
    setEditCodeText(q.code || '');
    setEditCodeLang(q.codeLanguage || 'cpp');
    setEditTestCases(q.testCases || []);
    setIsEditingCode(false);
  };

  const generateDynamicBoilerplate = async (q, lang) => {
    setIsGeneratingBoilerplate(true);
    setPlaygroundCode("// AI is generating starter boilerplate...");
    try {
      const res = await axios.post('/api/ai/generate-boilerplate', {
        title: q.title,
        url: q.url,
        codeLanguage: lang
      });
      setPlaygroundCode(res.data.boilerplate || getStarterTemplate(lang, q.title));
    } catch (err) {
      console.error("Failed to generate boilerplate", err);
      setPlaygroundCode(getStarterTemplate(lang, q.title));
    } finally {
      setIsGeneratingBoilerplate(false);
    }
  };

  const openPlayground = (q) => {
    setPlaygroundQuestion(q);
    const initialLang = q.codeLanguage || 'cpp';
    setPlaygroundLang(initialLang);
    setPlaygroundTestCases(q.testCases && q.testCases.length > 0 ? q.testCases : [
      { input: 'nums=[2,7,11,15], target=9', expectedOutput: '[0,1]' },
      { input: 'nums=[3,2,4], target=6', expectedOutput: '[1,2]' }
    ]);
    setCodeEvaluationResult(null);
    
    if (q.code && q.code.trim().length > 0) {
      setPlaygroundCode(q.code);
    } else {
      generateDynamicBoilerplate(q, initialLang);
    }
  };

  const handleRunCodeEvaluator = async () => {
    if (!playgroundCode.trim()) return alert("Please enter some code to evaluate!");
    setIsGradingCode(true);

    try {
      const res = await axios.post('/api/ai/grade-code', {
        title: playgroundQuestion?.title || 'Algorithmic Problem',
        code: playgroundCode,
        codeLanguage: playgroundLang,
        originalNotes: playgroundQuestion?.notes || '',
        testCases: playgroundTestCases
      });
      setCodeEvaluationResult(res.data);
    } catch (err) {
      console.error("Code evaluation failed", err);
      alert("Failed to evaluate code with AI Compiler");
    } finally {
      setIsGradingCode(false);
    }
  };

  const submitRecall = async () => {
    if (!recallText.trim()) return;
    setIsGrading(true);
    
    try {
      const gradeRes = await axios.post('/api/ai/grade', {
        originalNotes: reviewingQuestion.notes,
        userRecall: recallText,
        title: reviewingQuestion.title,
        url: reviewingQuestion.url
      });
      
      const { score, feedback } = gradeRes.data;
      
      const reviewRes = await axios.post(`/api/questions/${reviewingQuestion._id}/review`, {
        quality: score
      });
      
      setGradeResult({ 
        score, 
        feedback,
        interval: reviewRes.data?.interval || 1,
        nextReviewDate: reviewRes.data?.nextReviewDate
      });

      fetchQuestions();
      fetchActivityStats();
    } catch (error) {
      console.error("Failed to grade", error);
      alert("Error grading recall");
    } finally {
      setIsGrading(false);
    }
  };

  const closeReview = () => {
    setReviewingQuestion(null);
    setRecallText('');
    setGradeResult(null);
    fetchQuestions();
    fetchActivityStats();
  };

  const handleRandomPractice = async () => {
    try {
      const res = await axios.get('/api/questions/random');
      if (res.data) {
        openPlayground(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch random question", err);
      if (allQuestions.length > 0) {
        const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        openPlayground(randomQ);
      } else {
        alert("No questions logged yet! Log some questions first to start Practice Mode.");
      }
    }
  };

  // Helper for rendering difficulty badges
  const renderDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            Easy
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
            Hard
          </span>
        );
      case 'Medium':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
            Medium
          </span>
        );
    }
  };

  return (
    <>
      <ThreeBackground theme={theme} />
      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto transition-colors duration-200">
        
        {/* --- SLEEK MINIMAL HEADER BAR --- */}
      <header className="mb-6 glass-panel rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-300 shadow-sm">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              DSA Tracker
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                Spaced Repetition
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Data Structures &amp; Algorithms Spaced Repetition Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Daily Quota Selector */}
          <div className="flex items-center gap-2 glass-input px-3 py-1.5 rounded-xl text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Daily Quota:</span>
            <select
              value={dailyRevisionLimit}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDailyRevisionLimit(val);
                localStorage.setItem('dailyRevisionLimit', val);
              }}
              className="bg-transparent text-indigo-600 dark:text-indigo-300 font-semibold outline-none cursor-pointer"
            >
              <option value={2} className="bg-slate-50 dark:bg-[#141926] text-slate-800 dark:text-slate-200">2 / day</option>
              <option value={3} className="bg-slate-50 dark:bg-[#141926] text-slate-800 dark:text-slate-200">3 / day</option>
              <option value={5} className="bg-slate-50 dark:bg-[#141926] text-slate-800 dark:text-slate-200">5 / day</option>
              <option value={10} className="bg-slate-50 dark:bg-[#141926] text-slate-800 dark:text-slate-200">10 / day</option>
              <option value={999} className="bg-slate-50 dark:bg-[#141926] text-slate-800 dark:text-slate-200">Unlimited</option>
            </select>
          </div>

          {/* Quick Random Practice Mode CTA */}
          <button
            onClick={handleRandomPractice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Practice Mode (Random Question)
          </button>

          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold font-mono">
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>{activityData.stats.currentStreak || 0}d streak</span>
          </div>

          {/* Light / Dark Mode Toggle with Noticeable Radial Shockwave Reveal */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl glass-input text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all active:scale-[0.88] relative group shadow-sm overflow-hidden"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Color Theme"
          >
            <div className={`transition-all duration-700 ease-out transform ${isThemeSpinning ? 'rotate-[360deg] scale-125' : 'group-hover:rotate-45'}`}>
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-colors" />
              )}
            </div>
          </button>
        </div>
      </header>

      {/* --- PROGRESS & ACTIVITY DASHBOARD --- */}
      <section className="mb-6 glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200 uppercase font-mono">
              Learning Activity &amp; Consistency
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Total Solved: <strong className="text-slate-900 dark:text-slate-100">{allQuestions.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 4 Stat Cards with subtle depth hover */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="glass-panel p-3.5 rounded-xl hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Current</span>
                <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{activityData.stats.currentStreak} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">days</span></p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active Streak</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Record</span>
                <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{activityData.stats.longestStreak} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">days</span></p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Best Streak</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Problems</span>
                <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{activityData.stats.totalNew || allQuestions.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Logged Solved</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Reviews</span>
                <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{activityData.stats.totalRecalls}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Recalls Completed</p>
            </div>
          </div>

          {/* Right Contribution Heatmap Matrix (No Harsh White Boxes) */}
          <div className="lg:col-span-8 glass-panel p-4 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
              <span>Revision Heatmap (Past 24 Weeks)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">Less</span>
                <div className="w-2.5 h-2.5 bg-slate-200/60 dark:bg-slate-800/40 rounded-sm border border-slate-300/30 dark:border-white/[0.04]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-200/80 dark:bg-emerald-950 rounded-sm border border-emerald-300/40 dark:border-emerald-900/40"></div>
                <div className="w-2.5 h-2.5 bg-emerald-400 dark:bg-emerald-700 rounded-sm border border-emerald-500 dark:border-emerald-600/40"></div>
                <div className="w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-500 rounded-sm border border-emerald-600 dark:border-emerald-400"></div>
                <span className="text-[10px]">More</span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex flex-col text-[10px] text-slate-400 dark:text-slate-500 justify-between h-[105px] w-5 font-mono">
                <span>M</span><span>W</span><span>F</span>
              </div>

              <div className="grid grid-rows-7 grid-flow-col gap-1.5 flex-1 overflow-x-auto pb-1">
                {Array.from({ length: 168 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (167 - i));
                  const dateStr = d.toISOString().split('T')[0];
                  const dayData = activityData.dailyActivity[dateStr] || { newCount: 0, recallCount: 0, total: 0 };
                  const total = dayData.total;

                  // Smooth translucent cells blending with glass theme (zero harsh white boxes)
                  let bgClass = "bg-slate-200/60 dark:bg-slate-800/40 border border-slate-300/30 dark:border-white/[0.03]";
                  if (total === 1) bgClass = "bg-emerald-200/80 dark:bg-emerald-950 border border-emerald-300/50 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-400";
                  else if (total === 2) bgClass = "bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600/60 text-white dark:text-emerald-100 shadow-[0_0_6px_rgba(16,185,129,0.3)]";
                  else if (total >= 3) bgClass = "bg-emerald-600 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]";

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredCell({ date: dateStr, data: dayData })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-150 cursor-pointer ${bgClass} hover:scale-125 hover:z-10`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Hover Tooltip / Detail Card */}
            <div className="min-h-[28px] mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.04] text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
              {hoveredCell ? (
                <>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{hoveredCell.date}</span>
                  <div className="flex gap-4">
                    <span>Solved: <strong className="text-slate-900 dark:text-slate-100">{hoveredCell.data.newCount}</strong></span>
                    <span>Recalls: <strong className="text-emerald-600 dark:text-emerald-400">{hoveredCell.data.recallCount}</strong></span>
                  </div>
                </>
              ) : (
                <span className="text-slate-400 text-[11px]">Hover over any day cell to view daily activity metrics</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- MAIN 12-COLUMN WORKSPACE --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: TAXONOMY & TOPIC ACCORDION SIDEBAR (Sanitized of Stark White Boxes) */}
        <aside className="lg:col-span-3 glass-panel rounded-2xl p-4 sm:p-5 space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] pb-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase font-mono flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Taxonomy
            </h3>
            {(selectedTopic || selectedSubtopic) && (
              <button 
                onClick={() => { setSelectedTopic(null); setSelectedSubtopic(null); }}
                className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white px-2 py-0.5 glass-input rounded"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { setSelectedTopic(null); setSelectedSubtopic(null); setViewMode('all'); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                viewMode === 'all' && !selectedTopic && !selectedSubtopic
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-500/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/35 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <List className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> All Logged Problems
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/[0.06] border border-slate-300/40 dark:border-white/[0.08] font-mono text-slate-600 dark:text-slate-400">
                {allQuestions.length}
              </span>
            </button>

            {Object.keys(topicTree).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">No topics logged yet</p>
            ) : (
              Object.entries(topicTree).map(([topicName, topicData]) => {
                const isExpanded = expandedTopics[topicName];
                const isTopicSelected = selectedTopic === topicName && !selectedSubtopic;

                return (
                  <div key={topicName} className="space-y-0.5 pt-1">
                    <div
                      onClick={() => {
                        setSelectedTopic(topicName);
                        setSelectedSubtopic(null);
                      }}
                      className={`w-full px-3 py-2 text-xs flex items-center justify-between cursor-pointer rounded-xl transition-all ${
                        isTopicSelected 
                          ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-500/25' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/35 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <button 
                          onClick={(e) => toggleTopicExpand(topicName, e)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                        >
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : ''}`} />
                        </button>
                        <Folder className="w-3.5 h-3.5 text-indigo-500/80 dark:text-indigo-400/80" />
                        <span className="truncate max-w-[140px]">{topicName}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/[0.06] border border-slate-300/40 dark:border-white/[0.06] font-mono text-slate-600 dark:text-slate-400">
                        {topicData.count}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="ml-4 pl-2 border-l border-slate-200/80 dark:border-white/10 space-y-0.5 my-1">
                        {Object.entries(topicData.subtopics).map(([subName, count]) => {
                          const isSubSelected = selectedSubtopic?.topic === topicName && selectedSubtopic?.subtopic === subName;
                          return (
                            <button
                              key={subName}
                              onClick={() => {
                                setSelectedTopic(topicName);
                                setSelectedSubtopic({ topic: topicName, subtopic: subName });
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isSubSelected 
                                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-500/30' 
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/30 dark:hover:bg-white/[0.03]'
                              }`}
                            >
                              <span className="truncate max-w-[130px]">{subName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: MAIN FORM & REVISION FEED */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* LOG QUESTION FORM */}
          <section className="glass-panel rounded-2xl p-5 sm:p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                    Log Question
                  </h3>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowCodeSection(!showCodeSection)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    showCodeSection 
                      ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40' 
                      : 'glass-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  {showCodeSection ? 'Hide Solution Code' : '+ Add Solution Code & Test Cases'}
                </button>
              </div>

              {/* Title & URL Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 block">Problem Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 739. Daily Temperatures"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 block">LeetCode / Problem URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/daily-temperatures/"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Difficulty Pills & Pattern Classifier Info */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1.5 block">Difficulty Level</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          difficulty === d 
                            ? d === 'Easy' 
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : d === 'Hard'
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 shadow-sm'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm'
                            : 'glass-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          d === 'Easy' ? 'bg-emerald-500 dark:bg-emerald-400' : d === 'Hard' ? 'bg-rose-500 dark:bg-rose-400' : 'bg-amber-500 dark:bg-amber-400'
                        }`}></span>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>AI classifies Pattern, Taxonomy &amp; schedules SM-2</span>
                </div>
              </div>

              {/* Intuition Notes Textarea */}
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 block">Intuition &amp; Key Notes</label>
                <textarea
                  placeholder="Summarize the core insight, approach, and edge cases in your own words..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full glass-input rounded-xl p-3.5 text-xs sm:text-sm resize-none font-sans leading-relaxed"
                  required
                />
              </div>

              {/* COLLAPSIBLE SOLUTION CODE & TEST CASES SECTION */}
              {showCodeSection && (
                <div className="p-4 rounded-xl bg-slate-200/30 dark:bg-slate-900/60 border border-slate-300/40 dark:border-indigo-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Code className="w-4 h-4" /> Solution Code
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Language:</span>
                      <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="glass-input text-xs px-2.5 py-1 rounded-lg font-mono text-indigo-600 dark:text-indigo-300"
                      >
                        <option value="cpp" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">C++</option>
                        <option value="python" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">Python</option>
                        <option value="java" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">Java</option>
                        <option value="javascript" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">JavaScript</option>
                        <option value="go" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">Go</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(e, code, setCode)}
                    placeholder={getStarterTemplate(codeLanguage, title || 'Problem')}
                    rows={8}
                    className="w-full p-3.5 rounded-xl bg-[#0e121e] border border-slate-700/50 dark:border-white/10 font-mono text-xs text-cyan-300 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
                  />

                  {/* Test Cases List */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Custom Test Cases</span>
                      <button 
                        type="button" 
                        onClick={() => handleAddTestCase(setTestCases)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Case
                      </button>
                    </div>

                    <div className="space-y-2">
                      {testCases.map((tc, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Input: nums=[2,7,11,15], target=9"
                            value={tc.input}
                            onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value, setTestCases)}
                            className="sm:col-span-6 glass-input text-xs px-3 py-1.5 rounded-lg font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Expected Output: [0,1]"
                            value={tc.expectedOutput}
                            onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value, setTestCases)}
                            className="sm:col-span-5 glass-input text-xs px-3 py-1.5 rounded-lg font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(idx, setTestCases)}
                            className="sm:col-span-1 text-slate-400 hover:text-rose-500 p-1 flex justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isClassifying || !title.trim() || !notes.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-[0.98]"
                >
                  {isClassifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isClassifying ? 'Analyzing & Structuring Notes...' : 'Save & Schedule Problem'}
                </button>
              </div>
            </form>
          </section>

          {/* QUESTIONS LIST SECTION */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{viewMode === 'due' ? 'Due for Review Today' : 'All Solved Problems'}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {displayedQuestions.length}
                  </span>
                </h3>
                {selectedTopic && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Filtered by: <strong className="text-indigo-600 dark:text-indigo-300">{selectedTopic}</strong> {selectedSubtopic && `› ${selectedSubtopic.subtopic}`}
                  </p>
                )}
              </div>

              {/* View Mode Toggle Switcher */}
              <div className="flex items-center gap-1.5 glass-panel p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('due')}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'due' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Due Today ({questions.length})
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'all' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({allQuestions.length})
                </button>
              </div>
            </div>

            {/* QUESTIONS GRID: 2-COLUMN RESPONSIVE LAYOUT WITH PHYSICAL DEPTH ANIMATION */}
            {displayedQuestions.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">All Caught Up for Today!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {viewMode === 'due' 
                      ? "You've mastered all problems in your daily revision queue. Solid consistency!" 
                      : "No problems found matching this filter criteria."}
                  </p>
                </div>
                {viewMode === 'due' && (
                  <button
                    onClick={handleRandomPractice}
                    className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Practice a Random Solved Question
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedQuestions.map((q) => {
                  const isExpanded = expandedNotesId === q._id;
                  const isDueNow = new Date(q.nextReviewDate) <= new Date();
                  const tax = getTaxonomy(q);

                  return (
                    <div 
                      key={q._id} 
                      className="glass-panel-interactive rounded-2xl p-5 flex flex-col justify-between space-y-3 group cursor-default"
                    >
                      <div>
                        {/* Top Metadata Row: Tags + Difficulty Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 font-mono truncate max-w-[200px]">
                            {tax.topic} • {tax.subtopic}
                          </span>
                          <div className="flex items-center gap-2">
                            {renderDifficultyBadge(q.difficulty || 'Medium')}
                            {isDueNow && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" title="Due today" />
                            )}
                          </div>
                        </div>

                        {/* Problem Title */}
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                          <span>{q.title}</span>
                          {q.url && (
                            <a 
                              href={q.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-white p-0.5"
                              title="Open on LeetCode"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </h4>

                        {/* Spaced Repetition Metrics Bar */}
                        <div className="flex items-center flex-wrap gap-2.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>Due: <strong className="text-slate-800 dark:text-slate-200">{new Date(q.nextReviewDate).toLocaleDateString()}</strong></span>
                          <span>Rep: <strong className="text-slate-800 dark:text-slate-200">{q.repetitions || 0}</strong></span>
                          <span>EF: <strong className="text-slate-800 dark:text-slate-200">{q.easeFactor ? q.easeFactor.toFixed(1) : '2.5'}</strong></span>
                          {q.priorityScore && (
                            <span className="text-indigo-600 dark:text-indigo-400">Score: {Math.round(q.priorityScore)}</span>
                          )}
                        </div>

                        {/* AI Markdown Notes Drawer */}
                        {(q.enhancedNotes || q.notes) && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/[0.05]">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setExpandedNotesId(isExpanded ? null : q._id)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-medium"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {isExpanded ? 'Hide Intuition & Notes' : 'View Intuition & Notes'}
                              </button>

                              {isExpanded && q.enhancedNotes && (
                                <div className="flex gap-1 text-[10px] font-mono">
                                  <button
                                    onClick={() => setNoteViewMode(prev => ({ ...prev, [q._id]: 'ai' }))}
                                    className={`px-1.5 py-0.5 rounded ${noteViewMode[q._id] !== 'raw' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}
                                  >
                                    AI
                                  </button>
                                  <button
                                    onClick={() => setNoteViewMode(prev => ({ ...prev, [q._id]: 'raw' }))}
                                    className={`px-1.5 py-0.5 rounded ${noteViewMode[q._id] === 'raw' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}
                                  >
                                    Raw
                                  </button>
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-2.5 p-3 rounded-xl bg-slate-200/30 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto leading-relaxed">
                                {noteViewMode[q._id] === 'raw' ? (
                                  <p className="whitespace-pre-wrap font-sans">{q.notes}</p>
                                ) : (
                                  <ReactMarkdown
                                    components={{
                                      h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mt-2.5 mb-1 uppercase tracking-wider" {...props} />,
                                      p: ({ node, ...props }) => <p className="mb-2 text-slate-700 dark:text-slate-300" {...props} />,
                                      code: ({ node, inline, ...props }) => 
                                        inline 
                                          ? <code className="bg-slate-200 dark:bg-base-900 px-1 py-0.5 rounded font-mono text-indigo-600 dark:text-cyan-300 text-[11px]" {...props} />
                                          : <code className="block bg-[#0e121e] p-2 rounded-lg font-mono text-cyan-300 text-[11px] overflow-x-auto my-1.5" {...props} />
                                    }}
                                  >
                                    {q.enhancedNotes || q.notes}
                                  </ReactMarkdown>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-white/[0.08] mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReviewingQuestion(q);
                              setRecallText('');
                              setGradeResult(null);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
                          >
                            Review Recall
                          </button>

                          <button
                            onClick={() => openCodeViewer(q)}
                            className="px-2.5 py-1.5 glass-input hover:bg-slate-200/40 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                          >
                            <Code className="w-3.5 h-3.5 text-slate-400" />
                            <span>Code</span>
                          </button>

                          <button
                            onClick={() => openPlayground(q)}
                            className="p-1.5 glass-input hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-300 hover:border-emerald-500/30 text-slate-500 dark:text-slate-400 rounded-lg transition-all"
                            title="Open in Code Playground"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => handleDeleteQuestion(q._id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* --- MODAL 1: SOLUTION CODE REVISION WINDOW --- */}
      {/* ========================================================================= */}
      {viewingCodeQuestion && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-4xl w-full rounded-2xl border border-indigo-500/30 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingCodeQuestion.title}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Language: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{viewingCodeQuestion.codeLanguage || 'cpp'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openCodeInNewWindow(viewingCodeQuestion)}
                  className="text-xs px-3 py-1.5 glass-input hover:bg-slate-200/40 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Popout Window
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingCodeQuestion.code || '');
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
                    copySuccess 
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' 
                      : 'glass-input text-slate-700 dark:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </button>

                <button
                  onClick={() => setViewingCodeQuestion(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {!isEditingCode ? (
                <div className="p-4 rounded-xl bg-[#0e121e] border border-slate-700/50 dark:border-white/[0.08] font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto">
                  <pre>{viewingCodeQuestion.code || '// No solution code recorded for this question.'}</pre>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Edit Solution Code</span>
                    <select
                      value={editCodeLang}
                      onChange={(e) => setEditCodeLang(e.target.value)}
                      className="glass-input text-xs px-2.5 py-1 rounded-lg font-mono text-indigo-600 dark:text-indigo-300"
                    >
                      <option value="cpp" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">C++</option>
                      <option value="python" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">Python</option>
                      <option value="java" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">Java</option>
                      <option value="javascript" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">JavaScript</option>
                      <option value="go" className="bg-slate-50 dark:bg-[#141926] text-slate-900 dark:text-slate-100">Go</option>
                    </select>
                  </div>
                  <textarea
                    value={editCodeText}
                    onChange={(e) => setEditCodeText(e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(e, editCodeText, setEditCodeText)}
                    rows={12}
                    className="w-full p-4 rounded-xl bg-[#0e121e] border border-slate-700/50 dark:border-white/[0.08] font-mono text-xs text-cyan-300 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Test Cases Preview */}
              {viewingCodeQuestion.testCases && viewingCodeQuestion.testCases.length > 0 && !isEditingCode && (
                <div className="p-3 rounded-xl bg-slate-200/30 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.05] space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Recorded Test Cases ({viewingCodeQuestion.testCases.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingCodeQuestion.testCases.map((tc, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-200/50 dark:bg-base-900 text-xs font-mono border border-slate-300/30 dark:border-white/5">
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">In: <span className="text-slate-800 dark:text-slate-200">{tc.input}</span></div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">Exp: <span className="text-emerald-600 dark:text-emerald-400">{tc.expectedOutput}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-white/[0.08] pt-3">
              <button
                onClick={() => setIsEditingCode(!isEditingCode)}
                className="text-xs px-3.5 py-2 glass-input hover:bg-slate-200/40 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditingCode ? 'Cancel Editing' : 'Edit Solution Code'}
              </button>

              <div className="flex items-center gap-2">
                {isEditingCode && (
                  <button
                    onClick={() => handleSaveEditedCode(viewingCodeQuestion._id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const q = viewingCodeQuestion;
                    setViewingCodeQuestion(null);
                    openPlayground(q);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5" /> Launch in Playground
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 2: INTERACTIVE CODE PLAYGROUND --- */}
      {/* ========================================================================= */}
      {playgroundQuestion && (
        <div className="fixed inset-0 bg-black/65 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="glass-panel max-w-6xl w-full h-[92vh] rounded-2xl border border-indigo-500/30 p-5 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {playgroundQuestion.title}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      Playground
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Interactive Code Sandbox &amp; AI Compiler</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleRandomPractice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
                  title="Switch to another random question"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Random Problem
                </button>
                <button
                  onClick={() => setPlaygroundQuestion(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Pane: Left Editor / Right Runner */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 flex-1 overflow-hidden">
              
              {/* Left Column: Monaco-style Code Editor (7 cols) */}
              <div className="lg:col-span-7 flex flex-col h-full rounded-xl bg-[#0e121e] border border-slate-700/50 dark:border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#141926] border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    {['cpp', 'python', 'java', 'javascript', 'go'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setPlaygroundLang(lang);
                          generateDynamicBoilerplate(playgroundQuestion, lang);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold uppercase transition-all ${
                          playgroundLang === lang 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Tab: 4 spaces • Auto-brackets
                  </span>
                </div>

                <div className="flex-1 relative overflow-hidden flex">
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(e, playgroundCode, setPlaygroundCode)}
                    className="w-full flex-1 bg-transparent p-4 text-xs font-mono text-cyan-300 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Column: Test Cases & AI Grader Console (5 cols) */}
              <div className="lg:col-span-5 flex flex-col h-full space-y-3 overflow-y-auto">
                
                {/* Run Button */}
                <button
                  onClick={handleRunCodeEvaluator}
                  disabled={isGradingCode}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isGradingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                  {isGradingCode ? 'Running & Evaluating Logic...' : 'Run with AI Compiler'}
                </button>

                {/* Test Cases Editor */}
                <div className="p-3.5 rounded-xl bg-slate-200/30 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Test Cases
                    </span>
                    <button
                      onClick={() => handleAddTestCase(setPlaygroundTestCases)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Case
                    </button>
                  </div>

                  <div className="space-y-2">
                    {playgroundTestCases.map((tc, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-200/50 dark:bg-base-900/90 border border-slate-300/30 dark:border-white/[0.05] space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">Case #{idx + 1}</span>
                          <button
                            onClick={() => handleRemoveTestCase(idx, setPlaygroundTestCases)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value, setPlaygroundTestCases)}
                          placeholder="Input (e.g. nums=[2,7,11,15], target=9)"
                          className="w-full glass-input text-xs px-2 py-1 rounded"
                        />
                        <input
                          value={tc.expectedOutput}
                          onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value, setPlaygroundTestCases)}
                          placeholder="Expected Output (e.g. [0,1])"
                          className="w-full glass-input text-xs px-2 py-1 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Console Output & Evaluation Card */}
                {codeEvaluationResult && (
                  <div className="p-3.5 rounded-xl bg-slate-200/30 dark:bg-slate-900/70 border border-indigo-500/20 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08] pb-2">
                      <span className="font-bold text-slate-800 dark:text-slate-300">Execution Status</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        codeEvaluationResult.passed 
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                      }`}>
                        {codeEvaluationResult.passed ? 'ALL PASSED' : 'TEST FAILED'}
                      </span>
                    </div>

                    {codeEvaluationResult.complexity && (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-200/50 dark:bg-base-900 border border-slate-300/30 dark:border-white/5">
                          <span className="text-slate-500 block">Time Complexity</span>
                          <strong className="text-indigo-600 dark:text-indigo-300">{codeEvaluationResult.complexity.time || 'O(N)'}</strong>
                        </div>
                        <div className="p-2 rounded bg-slate-200/50 dark:bg-base-900 border border-slate-300/30 dark:border-white/5">
                          <span className="text-slate-500 block">Space Complexity</span>
                          <strong className="text-purple-600 dark:text-purple-300">{codeEvaluationResult.complexity.space || 'O(1)'}</strong>
                        </div>
                      </div>
                    )}

                    {codeEvaluationResult.feedback && (
                      <div className="p-2.5 rounded bg-slate-200/40 dark:bg-base-900/80 border border-slate-300/30 dark:border-white/5 text-slate-700 dark:text-slate-300 font-sans text-xs">
                        <ReactMarkdown>{codeEvaluationResult.feedback}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 3: THE AI RECALL REVIEW MODAL --- */}
      {/* ========================================================================= */}
      {reviewingQuestion && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full rounded-2xl border border-indigo-500/30 p-6 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                  Active Recall Challenge
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{reviewingQuestion.title}</h3>
              </div>
              <button
                onClick={closeReview}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!gradeResult ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  Explain the core approach, data structures, and boundary edge cases from memory. Your AI tutor will evaluate your recall and adjust your SuperMemo-2 spaced repetition schedule!
                </p>

                <textarea
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  rows={6}
                  placeholder="e.g. We use a Monotonic Decreasing Stack. We iterate through the array and while current element is greater than stack top, we pop and record the day distance..."
                  className="w-full glass-input rounded-xl p-3.5 text-xs sm:text-sm font-sans resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {recallText.trim().length} chars (minimum 15 recommended)
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={closeReview}
                      className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitRecall}
                      disabled={isGrading || recallText.trim().length < 5}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-[0.98]"
                    >
                      {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGrading ? 'Grading Recall...' : 'Submit to AI Tutor'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Grade Result View */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-200/30 dark:bg-slate-900/70 border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">SM-2 Spaced Repetition Grade</span>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      {gradeResult.score} / 5
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Next due in {gradeResult.interval || 1} day{gradeResult.interval > 1 ? 's' : ''}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Removed from today&apos;s active queue</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-200/30 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-200 font-sans leading-relaxed max-h-60 overflow-y-auto">
                  <ReactMarkdown>{gradeResult.feedback}</ReactMarkdown>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={closeReview}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Done &amp; Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
    </>
  );
}

export default App;
