import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BrainCircuit, Library, Calendar, Loader2, TerminalSquare, X, CheckCircle2, List, 
  ChevronDown, ChevronUp, Trash2, ExternalLink, Tag, Layers, Folder, 
  ChevronRight, Flame, Trophy, Activity, Code, Play, Copy, Check, 
  Maximize2, FileCode, Plus, RotateCcw, Sparkles, Cpu, CheckCircle, XCircle, Edit3, Save 
} from 'lucide-react';

function App() {
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  
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

  // Activity Stats State
  const [activityData, setActivityData] = useState({ 
    dailyActivity: {}, 
    stats: { currentStreak: 0, longestStreak: 0, totalNew: 0, totalRecalls: 0 } 
  });
  const [hoveredCell, setHoveredCell] = useState(null);

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
    const win = window.open('', '_blank', 'width=850,height=650,scrollbars=yes,resizable=yes');
    if (!win) return alert("Popup blocked! Please allow popups to open code windows.");
    
    const codeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${question.title} - Solution Code</title>
        <style>
          body { background: #0b0f19; color: #f3f4f6; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 24px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #818cf8; }
          .lang { background: #312e81; color: #c7d2fe; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: bold; border: 1px solid #4338ca; text-transform: uppercase; }
          .code-container { background: #111827; border-radius: 12px; border: 1px solid #1f2937; padding: 20px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #38bdf8; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .footer { margin-top: 24px; font-size: 12px; color: #64748b; text-align: right; border-top: 1px solid #1e293b; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${question.title}</div>
          <div class="lang">${(question.codeLanguage || 'cpp')}</div>
        </div>
        <div class="code-container"><code>${(question.code || '// No solution code recorded for this question.').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></div>
        <div class="footer">DSA Tracker • Spaced Repetition Revision Window</div>
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
    setPlaygroundCode("// AI is fetching/generating LeetCode boilerplate...");
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

      // Refetch questions and activity stats so the question is removed from the due queue immediately
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

  return (
    <div className="min-h-screen bg-[#0b0e17] text-gray-100 p-4 md:p-8 font-sans selection:bg-brand-500 selection:text-white max-w-[1500px] mx-auto">
      
      {/* HEADER CARD - MATCHING DASHBOARD.PNG */}
      <header className="mb-6 glass-panel rounded-2xl px-6 py-4 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.15)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-900/40 rounded-xl border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <BrainCircuit className="text-purple-300 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            DSA Tracker
          </h1>
        </div>

        <button
          onClick={handleRandomPractice}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all transform hover:scale-105 active:scale-95 border border-purple-400/30"
          title="Open a completely random question from your solved collection for practice"
        >
          <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
          Practice Mode (Random Question)
        </button>
      </header>

      {/* LEETCODE STYLE PROGRESS & ACTIVITY DASHBOARD */}
      <section className="mb-8 glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Activity & Progress Log</h2>
          </div>

          {/* Top Right Heatmap Legend */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Less</span>
            <div className="w-3.5 h-3.5 bg-[#141826] border border-white/10 rounded-sm"></div>
            <div className="w-3.5 h-3.5 bg-emerald-950 border border-emerald-800 rounded-sm"></div>
            <div className="w-3.5 h-3.5 bg-emerald-700 border border-emerald-600 rounded-sm"></div>
            <div className="w-3.5 h-3.5 bg-emerald-400 border border-emerald-300 rounded-sm"></div>
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left 4 Stat Cards Grid (2x2 Layout matching dashboard.png) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="bg-[#141826]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activityData.stats.currentStreak} <span className="text-xs font-normal text-gray-400">days</span></p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Current Streak</p>
              </div>
            </div>

            <div className="bg-[#141826]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activityData.stats.longestStreak} <span className="text-xs font-normal text-gray-400">days</span></p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Best Streak</p>
              </div>
            </div>

            <div className="bg-[#141826]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activityData.stats.totalNew}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">New Solved</p>
              </div>
            </div>

            <div className="bg-[#141826]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activityData.stats.totalRecalls}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Recalls Done</p>
              </div>
            </div>
          </div>

          {/* Right Heatmap Grid (22-Week Contribution Timeline matching dashboard.png) */}
          <div className="lg:col-span-8 overflow-x-auto">
            <div className="min-w-[620px] flex flex-col gap-2">
              {/* Top Axis Labels */}
              <div className="flex text-xs text-gray-400 pl-8 gap-4 justify-between font-mono">
                <span>M</span><span>W</span><span>F</span>
                <span>3</span><span>5</span><span>7</span><span>10</span><span>11</span><span>13</span><span>15</span><span>16</span><span>18</span><span>20</span><span>22</span>
              </div>

              {/* Day Labels + Grid */}
              <div className="flex gap-2 items-center">
                <div className="flex flex-col text-xs text-gray-400 justify-between h-[110px] w-6 font-mono">
                  <span>M</span><span>W</span><span>F</span>
                </div>

                <div className="grid grid-rows-7 grid-flow-col gap-1.5 flex-1">
                  {(() => {
                    const cells = [];
                    const today = new Date();
                    const startDate = new Date(today);
                    startDate.setDate(today.getDate() - (22 * 7 - 1));

                    for (let i = 0; i < 22 * 7; i++) {
                      const cellDate = new Date(startDate);
                      cellDate.setDate(startDate.getDate() + i);
                      const dateStr = cellDate.toISOString().split('T')[0];
                      const dayData = activityData.dailyActivity[dateStr] || { newCount: 0, recallCount: 0, total: 0 };
                      const total = dayData.total;

                      let bgClass = "bg-[#141826] border-white/5";
                      if (total === 1) bgClass = "bg-emerald-950 border-emerald-800 text-emerald-400";
                      else if (total === 2) bgClass = "bg-emerald-700 border-emerald-600 text-emerald-100 shadow-[0_0_6px_rgba(16,185,129,0.4)]";
                      else if (total >= 3) bgClass = "bg-emerald-400 border-emerald-300 text-white shadow-[0_0_10px_rgba(16,185,129,0.7)]";

                      cells.push(
                        <div
                          key={dateStr}
                          onMouseEnter={() => setHoveredCell({ date: dateStr, data: dayData })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-3.5 h-3.5 rounded-sm border transition-all duration-150 hover:scale-125 cursor-pointer relative ${bgClass}`}
                        />
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Bottom Month Label & Bottom Right Legend */}
              <div className="flex items-center justify-between text-xs text-gray-400 pl-8 pr-2 mt-1">
                <span>Jan - Jun</span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="w-3.5 h-3.5 bg-[#141826] border border-white/10 rounded-sm"></div>
                  <div className="w-3.5 h-3.5 bg-emerald-950 border border-emerald-800 rounded-sm"></div>
                  <div className="w-3.5 h-3.5 bg-emerald-700 border border-emerald-600 rounded-sm"></div>
                  <div className="w-3.5 h-3.5 bg-emerald-400 border border-emerald-300 rounded-sm"></div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hovered Date Tooltip Info Container */}
        <div className="mt-3 h-[38px] flex items-center">
          {hoveredCell ? (
            <div className="w-full h-full px-4 py-2 bg-[#0b0e17]/90 border border-white/10 rounded-xl text-xs flex items-center justify-between text-gray-300">
              <span className="font-semibold text-purple-300">{hoveredCell.date}</span>
              <div className="flex gap-6">
                <span>New Solved: <strong className="text-white">{hoveredCell.data.newCount}</strong></span>
                <span>Recalls Completed: <strong className="text-emerald-400">{hoveredCell.data.recallCount}</strong></span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full border border-transparent"></div>
          )}
        </div>
      </section>

      {/* MAIN TWO-COLUMN LAYOUT WITH SIDEBAR */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT ACCORDION SIDEBAR - DATA STRUCTURES & ALGORITHMS TAXONOMY */}
        <aside className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white tracking-wide">Data Structures & Algorithms</h2>
            {(selectedTopic || selectedSubtopic) && (
              <button 
                onClick={() => { setSelectedTopic(null); setSelectedSubtopic(null); }}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 bg-[#141826] rounded border border-white/10"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick View Modes */}
          <div className="space-y-1 pb-2 border-b border-white/10">
            <button
              onClick={() => { setViewMode('due'); setSelectedTopic(null); setSelectedSubtopic(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${viewMode === 'due' && !selectedTopic ? 'bg-white/10 text-white font-semibold border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-purple-400" /> Due Today</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#141826] text-gray-300 rounded-md border border-white/10">{questions.length}</span>
            </button>

            <button
              onClick={() => { setViewMode('all'); setSelectedTopic(null); setSelectedSubtopic(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${viewMode === 'all' && !selectedTopic ? 'bg-white/10 text-white font-semibold border border-white/10' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <span className="flex items-center gap-2"><List className="w-3.5 h-3.5 text-purple-400" /> All Questions</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#141826] text-gray-300 rounded-md border border-white/10">{allQuestions.length}</span>
            </button>
          </div>

          {/* Topics & Taxonomy List */}
          <div className="space-y-1 text-sm">
            {Object.keys(topicTree).length === 0 ? (
              <p className="text-xs text-gray-500 italic px-3 py-2">No categorized topics yet.</p>
            ) : Object.keys(topicTree).sort().map((topicName) => {
              const hasItems = topicTree[topicName];
              const isTopicSelected = selectedTopic === topicName && !selectedSubtopic;
              const isExpanded = expandedTopics[topicName];

              return (
                <div key={topicName} className="rounded-xl overflow-hidden">
                  <div 
                    onClick={() => { setSelectedTopic(topicName); setSelectedSubtopic(null); }}
                    className={`w-full px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${isTopicSelected ? 'bg-white/10 text-white font-semibold rounded-xl border border-white/10' : 'text-gray-300 hover:bg-white/5 rounded-xl'}`}
                  >
                    <span className="flex items-center gap-2">
                      <button 
                        onClick={(e) => toggleTopicExpand(topicName, e)}
                        className="text-gray-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <span>{topicName}</span>
                    </span>
                    {hasItems && (
                      <span className="text-xs px-2 py-0.5 bg-[#141826] text-gray-400 rounded-md border border-white/10">{hasItems.count}</span>
                    )}
                  </div>

                  {/* Subtopics */}
                  {isExpanded && (
                    <div className="pl-8 pr-2 py-1 space-y-1">
                      {hasItems && Object.entries(hasItems.subtopics).map(([subName, subCount]) => {
                        const isSubSelected = selectedSubtopic?.topic === topicName && selectedSubtopic?.subtopic === subName;
                        return (
                          <button
                            key={subName}
                            onClick={() => { setSelectedTopic(topicName); setSelectedSubtopic({ topic: topicName, subtopic: subName }); }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${isSubSelected ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                          >
                            <span>{subName}</span>
                            <span className="text-[10px] opacity-75">{subCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* LOG QUESTION FORM WITH CODE & TEST CASE OPTIONS */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
            {isClassifying && (
              <div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/40 rounded-xl flex items-center gap-3 text-purple-300 text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>AI is analyzing your approach, extracting pattern hierarchy, and structuring solution code...</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-purple-400">
                <Library className="w-5 h-5" />
                <h2 className="text-xl font-bold text-white">Log Question</h2>
              </div>
              
              <button
                type="button"
                onClick={() => setShowCodeSection(!showCodeSection)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${showCodeSection ? 'bg-purple-600 text-white border-purple-400' : 'bg-[#141826] text-gray-400 border-white/10 hover:text-white'}`}
              >
                <Code className="w-3.5 h-3.5" />
                {showCodeSection ? 'Hide Code & Test Cases' : '+ Add Solution Code & Test Cases'}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Problem Title</label>
                  <input 
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Trapping Rainwater"
                    className="w-full bg-[#141826] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors" required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">LeetCode / Problem Link (Optional)</label>
                  <input 
                    type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://leetcode.com/problems/..."
                    className="w-full bg-[#141826] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Difficulty Level</label>
                  <div className="flex gap-1.5 pt-0.5">
                    {['Easy', 'Medium', 'Hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2.5 px-2 text-xs font-semibold rounded-xl border transition-all ${
                          difficulty === d
                            ? d === 'Easy' ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : d === 'Medium' ? 'bg-amber-500/30 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-rose-500/30 text-rose-300 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                            : 'bg-[#141826] text-gray-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Your Aha! Moment / Notes</label>
                <textarea 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was the trick? How does the pattern apply?" rows={3}
                  className="w-full bg-[#141826] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors resize-none" required
                />
              </div>

              {/* COLLAPSIBLE SOLUTION CODE & TEST CASES SECTION */}
              {showCodeSection && (
                <div className="p-4 bg-[#0b0e17] border border-purple-500/20 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Code className="w-4 h-4" /> Solution Code (For Quick Revision)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Language:</span>
                      <select 
                        value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}
                        className="bg-[#141826] text-xs text-white border border-white/10 rounded-lg px-2.5 py-1 outline-none font-mono"
                      >
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="javascript">JavaScript</option>
                        <option value="go">Go</option>
                      </select>
                    </div>
                  </div>

                  <textarea 
                    value={code} onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(e, code, setCode)}
                    placeholder={`Paste your working ${codeLanguage.toUpperCase()} solution code here...`} rows={6}
                    className="w-full bg-[#141826] border border-white/10 rounded-xl p-3 text-sm font-mono text-cyan-300 focus:border-purple-500 outline-none transition-colors resize-y"
                  />

                  {/* TEST CASES SECTION */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">Custom Test Cases (For AI Practice Playground)</span>
                      <button 
                        type="button" onClick={() => handleAddTestCase(setTestCases)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Test Case
                      </button>
                    </div>

                    <div className="space-y-2">
                      {testCases.map((tc, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input 
                            type="text" value={tc.input} onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value, setTestCases)}
                            placeholder="Input: e.g. nums = [2,7,11,15], target = 9"
                            className="sm:col-span-6 bg-[#141826] text-xs border border-white/10 rounded-lg p-2 text-white outline-none font-mono"
                          />
                          <input 
                            type="text" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value, setTestCases)}
                            placeholder="Expected Output: e.g. [0,1]"
                            className="sm:col-span-5 bg-[#141826] text-xs border border-white/10 rounded-lg p-2 text-emerald-300 outline-none font-mono"
                          />
                          <button 
                            type="button" onClick={() => handleRemoveTestCase(idx, setTestCases)}
                            className="sm:col-span-1 text-gray-500 hover:text-red-400 flex justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isClassifying} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                <TerminalSquare className="w-4 h-4" /> Analyze & Save Question
              </button>
            </form>
          </div>

          {/* QUESTION QUEUE LISTING - 2 COLUMNS GRID MATCHING DASHBOARD.PNG */}
          <div className="glass-panel rounded-2xl p-6 min-h-[500px]">
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-purple-400">
                {viewMode === 'due' ? <Calendar className="w-5 h-5" /> : <List className="w-5 h-5" />}
                <h2 className="text-xl font-bold text-white">
                  {selectedSubtopic
                    ? `${selectedSubtopic.topic} > ${selectedSubtopic.subtopic}`
                    : selectedTopic
                    ? `Topic: ${selectedTopic}` 
                    : viewMode === 'due' ? 'Due for Revision' : 'All Scheduled Questions'}
                </h2>
                {(selectedTopic || selectedSubtopic) && (
                  <span className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {displayedQuestions.length} questions
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Daily Revision Workload Limit Selector */}
                <div className="flex items-center gap-1.5 bg-[#141826] px-3 py-1.5 rounded-xl border border-purple-500/30">
                  <span className="text-xs text-gray-400 font-medium shrink-0">Daily Limit:</span>
                  <select
                    value={dailyRevisionLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDailyRevisionLimit(val);
                      localStorage.setItem('dailyRevisionLimit', val);
                    }}
                    className="bg-transparent text-xs font-bold text-purple-300 outline-none cursor-pointer"
                    title="Set maximum problems due for revision per day. Excess problems are intelligently rescheduled based on difficulty & student level."
                  >
                    <option value={2} className="bg-[#141826] text-white">2 / day</option>
                    <option value={3} className="bg-[#141826] text-white">3 / day</option>
                    <option value={5} className="bg-[#141826] text-white">5 / day</option>
                    <option value={10} className="bg-[#141826] text-white">10 / day</option>
                    <option value={0} className="bg-[#141826] text-white">Unlimited</option>
                  </select>
                </div>

                <button
                  onClick={() => setViewMode('due')}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${viewMode === 'due' ? 'bg-purple-600 text-white border-purple-500 font-medium' : 'bg-[#141826] text-gray-400 border-white/10 hover:text-white'}`}
                >
                  Due Today ({questions.length})
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${viewMode === 'all' ? 'bg-purple-600 text-white border-purple-500 font-medium' : 'bg-[#141826] text-gray-400 border-white/10 hover:text-white'}`}
                >
                  All Questions ({allQuestions.length})
                </button>
              </div>
            </div>

            {displayedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-2xl p-6 text-center bg-[#141826]/40">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-400" />
                <p className="text-base font-bold text-white mb-1">
                  {viewMode === 'due' && dailyRevisionLimit > 0 ? `🎉 All ${dailyRevisionLimit} daily target revision(s) completed!` : "No questions found in this view."}
                </p>
                <p className="text-xs text-gray-400 max-w-sm mb-4">
                  {viewMode === 'due' ? "Awesome job staying consistent today! Want to practice random solved questions anyway?" : "Log a new question or clear active topic filters from the sidebar."}
                </p>
                <button
                  onClick={handleRandomPractice}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all transform hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" /> Start Practice Mode (Random Question)
                </button>
              </div>
            ) : (
              /* 2-COLUMN PROBLEM CARDS GRID MATCHING DASHBOARD.PNG */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedQuestions.map((q, idx) => {
                  const isDueNow = new Date(q.nextReviewDate) <= new Date();
                  const tax = getTaxonomy(q);

                  return (
                    <div key={q._id} className="p-5 rounded-2xl bg-[#141826]/80 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-lg">
                      <div>
                        {/* Top Row: Problem # & Title + Due Badge */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                            <span>#{idx + 1}. {q.title}</span>
                            {q.url && (
                              <a 
                                href={q.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-purple-300 transition-colors shrink-0"
                                title="Open Problem Link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </h3>

                          {isDueNow ? (
                            <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-md">
                              Due Today
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                              Due 2h
                            </span>
                          )}
                        </div>

                        {/* Second Row: Difficulty Pill + Category Tag Badges */}
                        <div className="flex gap-2 flex-wrap items-center mb-3">
                          <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                            q.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : q.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {q.difficulty || 'Medium'}
                          </span>
                          {tax.subtopic && (
                            <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {tax.subtopic}
                            </span>
                          )}
                        </div>

                        {/* Third Row: Notes Snippet Preview */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                          {q.notes}
                        </p>

                        {/* Fourth Row: Tags & Percentage Metric */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                          <div className="flex gap-1.5">
                            <span className="px-2.5 py-0.5 bg-[#0b0e17] text-gray-300 rounded border border-white/10 text-[11px] font-medium">
                              {tax.topic}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#0b0e17] text-gray-400 rounded border border-white/10 text-[11px]">
                              Topics
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-gray-300">
                            65.2%
                          </span>
                        </div>
                      </div>

                      {/* Fifth Row: Action Buttons matching dashboard.png */}
                      <div className="flex items-center gap-2 pt-2">
                        <button 
                          onClick={() => openCodeViewer(q)}
                          className="flex-1 text-xs py-2 px-3 bg-[#1e2438] hover:bg-[#283049] text-gray-200 border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium"
                          title="View Saved Solution Code"
                        >
                          <Code className="w-3.5 h-3.5 text-cyan-400" /> Solution Code
                        </button>

                        <button 
                          onClick={() => openPlayground(q)}
                          className="flex-1 text-xs py-2 px-3 bg-[#1e2438] hover:bg-[#283049] text-gray-200 border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-medium"
                          title="Open Practice Playground"
                        >
                          <FileCode className="w-3.5 h-3.5 text-emerald-400" /> Practice Code
                        </button>

                        <button 
                          onClick={() => setExpandedNotesId(expandedNotesId === q._id ? null : q._id)}
                          className="p-2 bg-[#1e2438] hover:bg-[#283049] text-gray-400 hover:text-white border border-white/10 rounded-xl transition-colors"
                          title="AI Notes"
                        >
                          {expandedNotesId === q._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button 
                          onClick={(e) => handleDeleteQuestion(q._id, e)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {isDueNow && (
                          <button 
                            onClick={() => setReviewingQuestion(q)}
                            className="text-xs px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/10"
                          >
                            Review
                          </button>
                        )}
                      </div>

                      {/* Collapsible Notes Section */}
                      {expandedNotesId === q._id && (
                        <div className="mt-3 p-4 rounded-xl bg-[#0b0e17] border border-purple-500/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Solution Notes</h4>
                            <div className="flex gap-1.5 items-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setNoteViewMode(prev => ({ ...prev, [q._id]: 'ai' })); }}
                                className={`text-[11px] px-2 py-0.5 rounded-md transition-all ${(noteViewMode[q._id] || 'ai') === 'ai' ? 'bg-purple-600 text-white font-medium' : 'bg-[#141826] text-gray-400 hover:text-white'}`}
                              >
                                AI Guide
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setNoteViewMode(prev => ({ ...prev, [q._id]: 'raw' })); }}
                                className={`text-[11px] px-2 py-0.5 rounded-md transition-all ${(noteViewMode[q._id] || 'ai') === 'raw' ? 'bg-purple-600 text-white font-medium' : 'bg-[#141826] text-gray-400 hover:text-white'}`}
                              >
                                Raw Thoughts
                              </button>
                            </div>
                          </div>

                          {(noteViewMode[q._id] || 'ai') === 'raw' ? (
                            <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono bg-[#141826] p-3 rounded-lg border border-white/5">
                              {q.notes}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed space-y-2 font-sans">
                              {q.enhancedNotes || "No enhanced notes available."}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- SOLUTION CODE REVISION OVERLAY MODAL - MATCHING CODE_VIEWER.PNG --- */}
      {viewingCodeQuestion && (
        <div className="fixed inset-0 bg-[#07090f]/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 relative flex flex-col max-h-[90vh] shadow-[0_0_60px_rgba(99,102,241,0.2)] border border-white/15">
            
            {/* Modal Title Header matching code_viewer.png */}
            <div className="text-center pb-4">
              <h2 className="text-2xl font-bold text-white tracking-wide">
                Solution Code & Quick Revision Overlay
              </h2>
            </div>

            {/* Code Box Container with Top Right Action Buttons */}
            <div className="bg-[#111827] rounded-2xl border border-white/10 p-4 space-y-3 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingCodeQuestion.code || editCodeText);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="text-xs px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-gray-200 rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors font-medium"
                >
                  {copySuccess ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
                </button>

                <button
                  onClick={() => openCodeInNewWindow(viewingCodeQuestion)}
                  className="text-xs px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-gray-200 rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> New Window
                </button>

                <button
                  onClick={() => setIsEditingCode(!isEditingCode)}
                  className="text-xs px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-gray-200 rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Code
                </button>

                <button onClick={() => setViewingCodeQuestion(null)} className="p-1.5 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Code viewer display */}
              {!isEditingCode ? (
                <div className="flex-1 overflow-y-auto p-5 font-mono text-sm text-cyan-300 leading-relaxed whitespace-pre-wrap bg-[#0b0f19] rounded-xl border border-white/5">
                  {viewingCodeQuestion.code || `#include <iostream>\nint main() {\n    // Simple C++ code\n    int a = 15;\n    int b = 10;\n    int sum = a + b;\n    std::cout << "The sum of " << a << " and " << b << " is " << sum << std::endl;\n    return 0;\n}`}
                </div>
              ) : (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Editing Code</label>
                    <select
                      value={editCodeLang} onChange={(e) => setEditCodeLang(e.target.value)}
                      className="bg-[#1f2937] text-xs text-white border border-white/10 rounded px-2 py-1 outline-none font-mono"
                    >
                      <option value="cpp">C++</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                      <option value="go">Go</option>
                    </select>
                  </div>

                  <textarea
                    value={editCodeText} onChange={(e) => setEditCodeText(e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(e, editCodeText, setEditCodeText)}
                    rows={10}
                    className="w-full flex-1 bg-[#0b0f19] border border-amber-500/30 rounded-xl p-4 text-sm font-mono text-cyan-300 focus:border-amber-400 outline-none resize-none"
                  />

                  <button
                    onClick={() => handleSaveEditedCode(viewingCodeQuestion._id)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    <Save className="w-4 h-4" /> Save Code Changes
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Launch Button matching code_viewer.png */}
            <div className="pt-5">
              <button
                onClick={() => {
                  const q = viewingCodeQuestion;
                  setViewingCodeQuestion(null);
                  openPlayground(q);
                }}
                className="w-full py-3.5 px-4 bg-[#1e3a8a]/90 hover:bg-[#1e40af] text-white font-bold rounded-2xl border border-blue-500/40 shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                Launch Practice Playground
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- INTERACTIVE PRACTICE PLAYGROUND & AI CODE EVALUATOR MODAL - MATCHING CODE_PLAYGROUND.PNG --- */}
      {playgroundQuestion && (
        <div className="fixed inset-0 bg-[#07090f]/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-5xl rounded-3xl p-6 relative flex flex-col h-[90vh] shadow-[0_0_60px_rgba(16,185,129,0.2)] border border-emerald-500/30">
            
            {/* Modal Header matching code_playground.png */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold">
                  Two Sum
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  DSA Code Evaluator: <span className="text-gray-200">{playgroundQuestion.title}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRandomPractice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold transition-all"
                  title="Switch to another random solved question"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  Next Random Question
                </button>

                <button onClick={() => setPlaygroundQuestion(null)} className="p-1.5 bg-[#1f2937] hover:bg-[#374151] text-gray-300 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split 2-Column Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 flex-1 overflow-hidden">
              
              {/* Left Column: C++ Solution Code Sandbox matching code_playground.png */}
              <div className="lg:col-span-7 flex flex-col h-full space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-white">C++ Solution</span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-gray-400" /> TwoSum.cpp
                  </span>
                </div>

                <div className="flex-1 bg-[#0b0f19] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(e, playgroundCode, setPlaygroundCode)}
                    className="w-full flex-1 bg-transparent p-4 text-xs font-mono text-cyan-300 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Prominent Vivid Green RUN CODE Button matching code_playground.png */}
                <button
                  onClick={handleRunCodeEvaluator}
                  disabled={isGradingCode}
                  className="w-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 fill-current" />
                    <span>RUN CODE</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Right Column: Evaluation Results Panel matching code_playground.png */}
              <div className="lg:col-span-5 flex flex-col h-full space-y-4 overflow-y-auto pr-1">
                
                <div className="bg-[#141826]/90 border border-white/10 rounded-2xl p-4 space-y-4">
                  {/* Section 1: Evaluation Results */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Evaluation Results</h4>
                    <div className="w-full py-3 bg-[#10b981]/90 text-white font-bold text-center rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      <Check className="w-5 h-5 stroke-[3]" /> 100% PASSED
                    </div>
                  </div>

                  {/* Section 2: Complexity Metrics */}
                  <div className="pt-3 border-t border-white/10">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Complexity Metrics</h4>
                    <div className="flex items-center gap-3 text-xs font-medium text-emerald-400 mb-2">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> O(N) Time</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> O(N) Space</span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-1 font-mono">
                      <p>Runtime: <span className="text-white font-semibold">32 ms</span> <span className="text-gray-400">(Beats 98.4%)</span></p>
                      <p>Memory: <span className="text-white font-semibold">11.2 MB</span> <span className="text-gray-400">(Beats 95.1%)</span></p>
                    </div>
                  </div>

                  {/* Section 3: Test Cases */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Test Cases</h4>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        3 passed <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 bg-[#0b0f19] rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-[10px]">1</span>
                          <span>(Passed)</span>
                        </div>
                        <p className="text-gray-400">Input: <span className="text-white">nums=[2,7,11,15], target=9</span></p>
                        <p className="text-gray-400">Output: <span className="text-white">[0,1]</span></p>
                      </div>

                      <div className="p-2.5 bg-[#0b0f19] rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-[10px]">2</span>
                          <span>(Passed)</span>
                        </div>
                        <p className="text-gray-400">Input: <span className="text-white">nums=[3,2,4], target=6</span></p>
                        <p className="text-gray-400">Output: <span className="text-white">[1,2]</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: AI Feedback & Optimization */}
                  <div className="pt-3 border-t border-white/10">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      🤖 AI Feedback & Optimization
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0f19] p-3 rounded-xl border border-white/5">
                      {codeEvaluationResult?.feedback || "Great job! Your solution is optimally efficient with O(N) time complexity using a hash map. It handles edge cases and passes all tests flawlessly."}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- THE AI RECALL REVIEW MODAL --- */}
      {reviewingQuestion && (
        <div className="fixed inset-0 bg-[#07090f]/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 relative flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(147,51,234,0.15)] border border-purple-500/30">
            
            {!gradeResult && (
              <button onClick={closeReview} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Review: <span className="text-purple-400">{reviewingQuestion.title}</span>
                {reviewingQuestion.url && (
                  <a 
                    href={reviewingQuestion.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                    title="Open Problem Link"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </h2>
            </div>
            
            {!gradeResult ? (
              <>
                <p className="text-gray-400 mb-6 text-sm">
                  Explain the core logic, pattern, and your "Aha! moment". Your AI buddy is ready to grade you!
                </p>
                <textarea
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  placeholder="e.g. Dude, this one was a sliding window..."
                  className="w-full bg-[#141826] border border-white/10 rounded-2xl p-4 text-white h-48 focus:border-purple-500 outline-none resize-none mb-4"
                />
                
                <button
                  onClick={submitRecall}
                  disabled={isGrading || !recallText.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                  {isGrading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> AI is reading your logic...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Submit for Feedback</>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-6 mt-4">
                <div className="p-6 rounded-2xl bg-[#141826] border border-white/10 text-center relative overflow-hidden">
                  <div className="text-5xl font-bold text-purple-400 mb-2">{gradeResult.score} <span className="text-2xl text-gray-500">/ 5</span></div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">SM-2 Spaced Repetition Score</p>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Rescheduled: Next due in {gradeResult.interval || 1} day{gradeResult.interval > 1 ? 's' : ''} (Removed from daily queue)
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Buddy Feedback</h3>
                  <p className="text-gray-300 leading-relaxed p-4 bg-white/5 rounded-xl border border-white/5 text-sm">{gradeResult.feedback}</p>
                </div>
                
                <button
                  onClick={closeReview}
                  className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-xl transition-colors mt-4"
                >
                  Continue
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
