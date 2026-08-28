import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BrainCircuit, Library, Calendar, Loader2, TerminalSquare, X, CheckCircle2, List, 
  ChevronDown, ChevronUp, Trash2, ExternalLink, Tag, Layers, Filter, Folder, 
  ChevronRight, Flame, Trophy, Activity, TrendingUp, Code, Play, Copy, Check, 
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
      const dueRes = await axios.get('/api/questions/due');
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
  }, [viewMode]);

  // Starter Boilerplate Code Templates
  const getStarterTemplate = (lang, titleStr) => {
    const pTitle = titleStr || 'Problem';
    switch (lang) {
      case 'cpp':
        return `#include <vector>\n#include <iostream>\n#include <stack>\n#include <deque>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Solution for ${pTitle}\n    void solve() {\n        // Write your solution logic here\n    }\n};\n`;
      case 'python':
        return `class Solution:\n    def solve(self):\n        # Solution for ${pTitle}\n        pass\n`;
      case 'java':
        return `import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Solution for ${pTitle}\n    }\n}\n`;
      case 'javascript':
        return `/**\n * Solution for ${pTitle}\n */\nfunction solve() {\n    // Write your solution logic here\n}\n`;
      case 'go':
        return `package main\n\nimport "fmt"\n\n// Solution for ${pTitle}\nfunc solve() {\n    // Write code here\n}\n`;
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
  const targetQuestions = (selectedTopic || selectedSubtopic) ? allQuestions : questions;

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
      const { patterns: extractedPatterns, enhancedNotes, topic, subtopic } = aiResponse.data; 

      await axios.post('/api/questions', {
        title, url, notes, enhancedNotes, topic, subtopic, patternNames: extractedPatterns,
        code, codeLanguage, testCases: validTestCases
      });

      setTitle(''); setUrl(''); setNotes(''); setCode('');
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
    setPlaygroundTestCases(q.testCases && q.testCases.length > 0 ? q.testCases : [{ input: 'nums = [1, 2, 3], k = 2', expectedOutput: '2' }]);
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
      
      await axios.post(`/api/questions/${reviewingQuestion._id}/review`, {
        quality: score
      });
      
      setGradeResult({ score, feedback });
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
  };

  return (
    <div className="min-h-screen bg-base-900 text-gray-100 p-4 md:p-8 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/20 rounded-xl border border-brand-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <BrainCircuit className="text-brand-400 w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            DSA <span className="text-brand-400">Tracker</span>
          </h1>
        </div>
      </header>

      {/* LEETCODE STYLE PROGRESS & ACTIVITY DASHBOARD */}
      <section className="mb-8 glass-panel rounded-2xl p-6 border border-white/5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-semibold mb-1">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Activity & Progress Log</h2>
            </div>
            <p className="text-xs text-gray-400">Daily question logging, recall sessions, and consistency streaks</p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="bg-base-900/60 border border-orange-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Current Streak</p>
                <p className="text-lg font-bold text-white">{activityData.stats.currentStreak} <span className="text-xs text-gray-400 font-normal">days</span></p>
              </div>
            </div>

            <div className="bg-base-900/60 border border-yellow-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Best Streak</p>
                <p className="text-lg font-bold text-white">{activityData.stats.longestStreak} <span className="text-xs text-gray-400 font-normal">days</span></p>
              </div>
            </div>

            <div className="bg-base-900/60 border border-brand-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                <TerminalSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">New Solved</p>
                <p className="text-lg font-bold text-white">{activityData.stats.totalNew} <span className="text-xs text-gray-400 font-normal">ques</span></p>
              </div>
            </div>

            <div className="bg-base-900/60 border border-purple-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Recalls Done</p>
                <p className="text-lg font-bold text-white">{activityData.stats.totalRecalls} <span className="text-xs text-gray-400 font-normal">reviews</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* 22-WEEK CONTRIBUTION HEATMAP */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            <div className="flex text-[10px] text-gray-400 mb-2 gap-[14px] pl-6">
              <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>

            <div className="flex gap-1.5 items-center">
              <div className="flex flex-col text-[9px] text-gray-400 justify-between h-[100px] pr-2">
                <span>Mon</span><span>Wed</span><span>Fri</span>
              </div>

              <div className="grid grid-rows-7 grid-flow-col gap-1.5">
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

                    let bgClass = "bg-base-800/60 border-white/5";
                    if (total === 1) bgClass = "bg-emerald-950 border-emerald-700/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                    else if (total === 2) bgClass = "bg-emerald-800 border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
                    else if (total >= 3) bgClass = "bg-emerald-500 border-emerald-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]";

                    cells.push(
                      <div
                        key={dateStr}
                        onMouseEnter={() => setHoveredCell({ date: dateStr, data: dayData })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-3.5 h-3.5 rounded-sm border transition-all duration-200 hover:scale-125 cursor-pointer relative ${bgClass}`}
                      />
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 px-6">
              <span>22-week recall activity</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="w-3 h-3 bg-base-800/60 border border-white/5 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-950 border border-emerald-700/50 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-800 border border-emerald-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-500 border border-emerald-300 rounded-sm"></div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hovered Date Tooltip Info Container (fixed height to prevent layout shift) */}
        <div className="mt-3 h-[42px] flex items-center">
          {hoveredCell ? (
            <div className="w-full h-full p-2.5 bg-base-950/80 border border-white/10 rounded-lg text-xs flex items-center justify-between text-gray-300">
              <span className="font-semibold text-brand-300">{hoveredCell.date}</span>
              <div className="flex gap-4">
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
        
        {/* LEFT ACCORDION SIDEBAR */}
        <aside className="lg:col-span-3 glass-panel rounded-2xl p-4 border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
              <Layers className="w-4 h-4" />
              <span>Pattern Taxonomy</span>
            </div>
            {(selectedTopic || selectedSubtopic) && (
              <button 
                onClick={() => { setSelectedTopic(null); setSelectedSubtopic(null); }}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 bg-base-800 rounded border border-white/10"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Quick View Modes */}
          <div className="space-y-1">
            <button
              onClick={() => { setViewMode('due'); setSelectedTopic(null); setSelectedSubtopic(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${viewMode === 'due' && !selectedTopic ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40' : 'hover:bg-base-800 text-gray-400'}`}
            >
              <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Due Today</span>
              <span className="text-[10px] px-2 py-0.5 bg-base-900 rounded-full border border-white/5">{questions.length}</span>
            </button>

            <button
              onClick={() => { setViewMode('all'); setSelectedTopic(null); setSelectedSubtopic(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${viewMode === 'all' && !selectedTopic ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40' : 'hover:bg-base-800 text-gray-400'}`}
            >
              <span className="flex items-center gap-2"><List className="w-3.5 h-3.5" /> All Questions</span>
              <span className="text-[10px] px-2 py-0.5 bg-base-900 rounded-full border border-white/5">{allQuestions.length}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="text-[11px] font-semibold uppercase text-gray-400 mb-2 px-1 tracking-wider">Topics & Patterns</p>
            
            {Object.keys(topicTree).length === 0 ? (
              <p className="text-xs text-gray-500 italic px-2 py-1">No categorized topics yet.</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(topicTree).map(([topicName, topicData]) => {
                  const isTopicSelected = selectedTopic === topicName && !selectedSubtopic;
                  const isExpanded = expandedTopics[topicName];

                  return (
                    <div key={topicName} className="rounded-lg bg-base-950/40 border border-white/5 overflow-hidden">
                      <div 
                        onClick={() => { setSelectedTopic(topicName); setSelectedSubtopic(null); }}
                        className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${isTopicSelected ? 'bg-brand-600/40 text-white font-semibold' : 'text-gray-300 hover:bg-base-800/80'}`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          <span className="truncate">{topicName}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.2 bg-base-900 text-gray-400 rounded-md border border-white/10">{topicData.count}</span>
                          <button 
                            onClick={(e) => toggleTopicExpand(topicName, e)}
                            className="p-1 hover:text-white text-gray-400"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Subtopic Children */}
                      {isExpanded && (
                        <div className="pl-6 pr-2 py-1 bg-base-900/60 border-t border-white/5 space-y-1">
                          {Object.entries(topicData.subtopics).map(([subName, subCount]) => {
                            const isSubSelected = selectedSubtopic?.topic === topicName && selectedSubtopic?.subtopic === subName;

                            return (
                              <button
                                key={subName}
                                onClick={() => { setSelectedTopic(topicName); setSelectedSubtopic({ topic: topicName, subtopic: subName }); }}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] flex items-center justify-between transition-colors ${isSubSelected ? 'bg-brand-500 text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-base-800/50'}`}
                              >
                                <span className="truncate flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-brand-400"></span>
                                  {subName}
                                </span>
                                <span className="text-[9px] opacity-75">{subCount}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* LOG QUESTION FORM WITH CODE & TEST CASE OPTIONS */}
          <div className="glass-panel rounded-2xl p-6">
            {isClassifying && (
              <div className="mb-4 p-3 bg-brand-500/20 border border-brand-500/40 rounded-xl flex items-center gap-3 text-brand-300 text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>AI is analyzing your approach, extracting pattern hierarchy, and structuring solution code...</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-brand-400">
                <Library className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-white">Log Question</h2>
              </div>
              
              <button
                type="button"
                onClick={() => setShowCodeSection(!showCodeSection)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${showCodeSection ? 'bg-brand-500 text-white border-brand-400' : 'bg-base-800 text-gray-400 border-white/10 hover:text-white'}`}
              >
                <Code className="w-3.5 h-3.5" />
                {showCodeSection ? 'Hide Code & Test Cases' : '+ Add Solution Code & Test Cases'}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Problem Title</label>
                  <input 
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Trapping Rainwater"
                    className="w-full bg-base-800/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors" required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">LeetCode / Problem Link (Optional)</label>
                  <input 
                    type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://leetcode.com/problems/..."
                    className="w-full bg-base-800/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Your Aha! Moment / Notes</label>
                <textarea 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was the trick? How does the pattern apply?" rows={3}
                  className="w-full bg-base-800/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-500 outline-none transition-colors resize-none" required
                />
              </div>

              {/* COLLAPSIBLE SOLUTION CODE & TEST CASES SECTION */}
              {showCodeSection && (
                <div className="p-4 bg-base-950/60 border border-brand-500/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code className="w-4 h-4" /> Solution Code (For Quick Revision)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Language:</span>
                      <select 
                        value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}
                        className="bg-base-800 text-xs text-white border border-white/10 rounded-md px-2 py-1 outline-none"
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
                    className="w-full bg-base-900 border border-white/10 rounded-lg p-3 text-sm font-mono text-cyan-300 focus:border-brand-500 outline-none transition-colors resize-y"
                  />

                  {/* TEST CASES SECTION */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">Custom Test Cases (For AI Practice Playground)</span>
                      <button 
                        type="button" onClick={() => handleAddTestCase(setTestCases)}
                        className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Test Case
                      </button>
                    </div>

                    <div className="space-y-2">
                      {testCases.map((tc, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input 
                            type="text" value={tc.input} onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value, setTestCases)}
                            placeholder="Input: e.g. nums = [1,3,-1,-3,5,3,6,7], k = 3"
                            className="sm:col-span-6 bg-base-900 text-xs border border-white/10 rounded p-2 text-white outline-none"
                          />
                          <input 
                            type="text" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value, setTestCases)}
                            placeholder="Expected Output: e.g. [3,3,5,5,6,7]"
                            className="sm:col-span-5 bg-base-900 text-xs border border-white/10 rounded p-2 text-white outline-none"
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

              <button type="submit" disabled={isClassifying} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <TerminalSquare className="w-4 h-4" /> Analyze & Save Question
              </button>
            </form>
          </div>

          {/* QUESTION QUEUE LISTING */}
          <div className="glass-panel rounded-2xl p-6 min-h-[500px]">
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-brand-400">
                {viewMode === 'due' ? <Calendar className="w-5 h-5" /> : <List className="w-5 h-5" />}
                <h2 className="text-xl font-semibold text-white">
                  {selectedSubtopic
                    ? `${selectedSubtopic.topic} > ${selectedSubtopic.subtopic}`
                    : selectedTopic
                    ? `Topic: ${selectedTopic}` 
                    : viewMode === 'due' ? 'Due for Revision' : 'All Scheduled Questions'}
                </h2>
                {(selectedTopic || selectedSubtopic) && (
                  <span className="text-xs px-2.5 py-1 bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {displayedQuestions.length} questions
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('due')}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${viewMode === 'due' ? 'bg-brand-600 text-white border-brand-500' : 'bg-base-800 text-gray-400 border-white/10 hover:text-white'}`}
                >
                  Due Today ({questions.length})
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${viewMode === 'all' ? 'bg-brand-600 text-white border-brand-500' : 'bg-base-800 text-gray-400 border-white/10 hover:text-white'}`}
                >
                  All Questions ({allQuestions.length})
                </button>
              </div>
            </div>

            {displayedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/40" />
                <p className="text-sm font-medium text-gray-400">No questions found in this view.</p>
                <p className="text-xs text-gray-600 mt-1">Log a new question or clear active topic filters from the sidebar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedQuestions.map((q) => (
                  <div key={q._id} className="p-5 rounded-xl bg-base-800/40 border border-white/5 hover:border-brand-500/30 transition-all space-y-3 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg text-white group-hover:text-brand-400 transition-colors">
                            {q.title}
                          </h3>
                          {q.url && (
                            <a 
                              href={q.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gray-400 hover:text-brand-400 transition-colors"
                              title="Open LeetCode Problem"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                          {(() => {
                            const tax = getTaxonomy(q);
                            return (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                                {tax.topic} &gt; {tax.subtopic}
                              </span>
                            );
                          })()}
                          {q.code && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-medium flex items-center gap-1">
                              <Code className="w-3 h-3" /> {(q.codeLanguage || 'cpp').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {new Date(q.nextReviewDate) <= new Date() ? (
                          <span className="text-xs font-medium px-2 py-1 bg-red-500/20 text-red-400 rounded-md border border-red-500/20">
                            Due Now
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-1 bg-brand-500/20 text-brand-400 rounded-md border border-brand-500/20">
                            Scheduled: {new Date(q.nextReviewDate).toLocaleDateString()}
                          </span>
                        )}
                        
                        <div className="flex gap-2 flex-wrap justify-end">
                          {/* VIEW CODE BUTTON */}
                          <button 
                            onClick={() => openCodeViewer(q)}
                            className="text-xs px-3 py-1.5 flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 rounded-md transition-colors"
                            title="View Saved Solution Code"
                          >
                            <FileCode className="w-3.5 h-3.5" /> Solution Code
                          </button>

                          {/* PRACTICE & CODE PLAYGROUND BUTTON */}
                          <button 
                            onClick={() => openPlayground(q)}
                            className="text-xs px-3 py-1.5 flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-md transition-colors"
                            title="Open Interactive Practice Playground"
                          >
                            <Play className="w-3.5 h-3.5" /> Practice Code
                          </button>

                          <button 
                            onClick={() => setExpandedNotesId(expandedNotesId === q._id ? null : q._id)}
                            className="text-xs px-3 py-1.5 flex items-center gap-1 bg-base-700 hover:bg-base-600 text-gray-300 rounded-md transition-colors"
                          >
                            {expandedNotesId === q._id ? <><ChevronUp className="w-3 h-3"/> Hide Notes</> : <><ChevronDown className="w-3 h-3"/> AI Notes</>}
                          </button>

                          <button 
                            onClick={(e) => handleDeleteQuestion(q._id, e)}
                            className="text-xs p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors flex items-center justify-center border border-red-500/20"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {new Date(q.nextReviewDate) <= new Date() && (
                            <button 
                              onClick={() => setReviewingQuestion(q)}
                              className="text-xs px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors font-medium"
                            >
                              Review Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Collapsible Notes Section */}
                    {expandedNotesId === q._id && (
                      <div className="mt-4 p-4 rounded-lg bg-base-900/80 border border-brand-500/20 shadow-inner space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h4 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Solution Notes</h4>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[10px] text-gray-400 mr-1">View:</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setNoteViewMode(prev => ({ ...prev, [q._id]: 'ai' })); }}
                              className={`text-xs px-2.5 py-0.5 rounded-md transition-all ${(noteViewMode[q._id] || 'ai') === 'ai' ? 'bg-brand-500 text-white font-medium shadow-sm' : 'bg-base-800 text-gray-400 hover:text-white'}`}
                            >
                              AI Structured Guide
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setNoteViewMode(prev => ({ ...prev, [q._id]: 'raw' })); }}
                              className={`text-xs px-2.5 py-0.5 rounded-md transition-all ${(noteViewMode[q._id] || 'ai') === 'raw' ? 'bg-brand-500 text-white font-medium shadow-sm' : 'bg-base-800 text-gray-400 hover:text-white'}`}
                            >
                              Your Raw Thoughts
                            </button>
                          </div>
                        </div>

                        {(noteViewMode[q._id] || 'ai') === 'raw' ? (
                          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono bg-base-950/60 p-3.5 rounded-md border border-white/5">
                            {q.notes}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed space-y-3 font-sans">
                            {q.enhancedNotes || "No enhanced notes available."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- SOLUTION CODE REVISION WINDOW (MODAL OVERLAY) --- */}
      {viewingCodeQuestion && (
        <div className="fixed inset-0 bg-base-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 relative flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-cyan-500/30">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 border border-cyan-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {viewingCodeQuestion.title}
                  </h2>
                  <p className="text-xs text-gray-400">Solution Code & Quick Revision Overlay</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingCodeQuestion.code || editCodeText);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="text-xs px-3 py-1.5 bg-base-800 hover:bg-base-700 text-gray-300 rounded-lg border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  {copySuccess ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
                </button>

                {/* Popout New Window Button */}
                <button
                  onClick={() => openCodeInNewWindow(viewingCodeQuestion)}
                  className="text-xs px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
                  title="Open in standalone window"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> New Window
                </button>

                {/* Edit Toggle Button */}
                <button
                  onClick={() => setIsEditingCode(!isEditingCode)}
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${isEditingCode ? 'bg-amber-500 text-black border-amber-400 font-semibold' : 'bg-base-800 text-gray-300 border-white/10 hover:text-white'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> {isEditingCode ? 'Cancel Edit' : 'Edit Code'}
                </button>

                <button onClick={() => setViewingCodeQuestion(null)} className="p-2 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="py-4 overflow-y-auto space-y-4 flex-1">
              {!isEditingCode ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
                      Language: {(viewingCodeQuestion.codeLanguage || 'cpp').toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-base-950 p-5 rounded-xl border border-white/10 font-mono text-sm text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {viewingCodeQuestion.code || '// No solution code recorded yet. Click "Edit Code" to add code!'}
                  </div>

                  {/* Test Cases View */}
                  {viewingCodeQuestion.testCases && viewingCodeQuestion.testCases.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recorded Test Cases</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {viewingCodeQuestion.testCases.map((tc, idx) => (
                          <div key={idx} className="p-3 bg-base-900/80 rounded-lg border border-white/5 text-xs font-mono">
                            <p className="text-gray-400">Input: <span className="text-white">{tc.input}</span></p>
                            <p className="text-gray-400 mt-1">Expected: <span className="text-emerald-400">{tc.expectedOutput}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Editing Code</label>
                    <select
                      value={editCodeLang} onChange={(e) => setEditCodeLang(e.target.value)}
                      className="bg-base-800 text-xs text-white border border-white/10 rounded px-2 py-1 outline-none"
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
                    rows={12}
                    className="w-full bg-base-950 border border-amber-500/30 rounded-xl p-4 text-sm font-mono text-cyan-300 focus:border-amber-400 outline-none resize-y"
                  />

                  {/* Edit Test Cases */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">Edit Test Cases</span>
                      <button 
                        type="button" onClick={() => handleAddTestCase(setEditTestCases)}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Test Case
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editTestCases.map((tc, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input 
                            type="text" value={tc.input} onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value, setEditTestCases)}
                            placeholder="Input"
                            className="sm:col-span-6 bg-base-900 text-xs border border-white/10 rounded p-2 text-white outline-none"
                          />
                          <input 
                            type="text" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value, setEditTestCases)}
                            placeholder="Expected Output"
                            className="sm:col-span-5 bg-base-900 text-xs border border-white/10 rounded p-2 text-white outline-none"
                          />
                          <button 
                            type="button" onClick={() => handleRemoveTestCase(idx, setEditTestCases)}
                            className="sm:col-span-1 text-gray-500 hover:text-red-400 flex justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveEditedCode(viewingCodeQuestion._id)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Code Changes
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <button
                onClick={() => {
                  const q = viewingCodeQuestion;
                  setViewingCodeQuestion(null);
                  openPlayground(q);
                }}
                className="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Launch Practice Playground
              </button>

              <button
                onClick={() => setViewingCodeQuestion(null)}
                className="text-xs px-4 py-2 bg-base-800 hover:bg-base-700 text-gray-300 rounded-lg transition-colors"
              >
                Close Overlay
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- INTERACTIVE PRACTICE PLAYGROUND & AI CODE EVALUATOR MODAL --- */}
      {playgroundQuestion && (
        <div className="fixed inset-0 bg-base-900/95 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6">
          <div className="glass-panel w-full max-w-6xl rounded-2xl p-6 relative flex flex-col h-[92vh] shadow-[0_0_60px_rgba(16,185,129,0.15)] border border-emerald-500/30">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Playground: <span className="text-emerald-400">{playgroundQuestion.title}</span>
                  </h2>
                  <p className="text-xs text-gray-400">Practice coding space with simulated compiler & AI test case evaluator</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Language:</span>
                  <select
                    value={playgroundLang} 
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setPlaygroundLang(newLang);
                      generateDynamicBoilerplate(playgroundQuestion, newLang);
                    }}
                    className="bg-base-800 text-xs text-white border border-white/10 rounded-lg px-3 py-1.5 outline-none"
                    disabled={isGeneratingBoilerplate}
                  >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="go">Go</option>
                  </select>
                </div>

                <button
                  onClick={() => generateDynamicBoilerplate(playgroundQuestion, playgroundLang)}
                  className="text-xs px-3 py-1.5 bg-base-800 hover:bg-base-700 text-gray-300 rounded-lg border border-white/10 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Reset to Boilerplate"
                  disabled={isGeneratingBoilerplate}
                >
                  {isGeneratingBoilerplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} 
                  Reset
                </button>

                <button onClick={() => setPlaygroundQuestion(null)} className="p-2 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 flex-1 overflow-hidden">
              
              {/* Left Column: Code Editor */}
              <div className="lg:col-span-7 flex flex-col h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4" /> Code Sandbox Editor
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">Monospace • Syntax Enabled</span>
                </div>

                <textarea
                  value={playgroundCode}
                  onChange={(e) => setPlaygroundCode(e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(e, playgroundCode, setPlaygroundCode)}
                  placeholder="Write your algorithm code here..."
                  className="w-full flex-1 bg-base-950 border border-emerald-500/20 rounded-xl p-4 text-sm font-mono text-cyan-300 focus:border-emerald-500 outline-none resize-none leading-relaxed"
                />

                <button
                  onClick={handleRunCodeEvaluator}
                  disabled={isGradingCode}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                >
                  {isGradingCode ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> AI Compiler is Evaluating Code & Test Cases...</>
                  ) : (
                    <><Play className="w-5 h-5 fill-current" /> Run AI Code Evaluator</>
                  )}
                </button>
              </div>

              {/* Right Column: Test Cases & AI Evaluation Feedback */}
              <div className="lg:col-span-5 flex flex-col h-full space-y-4 overflow-y-auto pr-1">
                
                {/* Custom Test Cases Editor Panel */}
                <div className="p-4 bg-base-950/80 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Test Cases</span>
                    <button 
                      onClick={() => handleAddTestCase(setPlaygroundTestCases)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Case
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {playgroundTestCases.map((tc, idx) => (
                      <div key={idx} className="p-2.5 bg-base-900 rounded-lg border border-white/5 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center text-gray-400">
                          <span>Case {idx + 1}</span>
                          <button onClick={() => handleRemoveTestCase(idx, setPlaygroundTestCases)} className="text-gray-500 hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text" value={tc.input} onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value, setPlaygroundTestCases)}
                          placeholder="Input: e.g. nums = [1,3,-1], k = 3"
                          className="w-full bg-base-950 border border-white/10 rounded p-1.5 text-white outline-none"
                        />
                        <input
                          type="text" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value, setPlaygroundTestCases)}
                          placeholder="Expected Output: e.g. [3]"
                          className="w-full bg-base-950 border border-white/10 rounded p-1.5 text-emerald-300 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Code Evaluation Results Panel */}
                {codeEvaluationResult ? (
                  <div className="p-4 bg-base-950/90 border border-emerald-500/30 rounded-xl space-y-4 shadow-lg flex-1">
                    
                    {/* Score & Complexity Summary Header */}
                    <div className="flex items-center justify-between p-3 bg-base-900/90 border border-white/10 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${codeEvaluationResult.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {codeEvaluationResult.score}%
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${codeEvaluationResult.passed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {codeEvaluationResult.passed ? 'PASSED' : 'NEEDS REFINEMENT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{codeEvaluationResult.summary}</p>
                      </div>

                      <div className="text-right text-xs font-mono space-y-1">
                        <div className="text-brand-300">Time: <span className="text-white font-bold">{codeEvaluationResult.timeComplexity}</span></div>
                        <div className="text-purple-300">Space: <span className="text-white font-bold">{codeEvaluationResult.spaceComplexity}</span></div>
                      </div>
                    </div>

                    {/* Test Case Execution Breakdown Matrix */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Simulated Test Case Results</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {codeEvaluationResult.testResults?.map((res, i) => (
                          <div key={i} className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${res.passed ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-red-950/30 border-red-500/30 text-red-300'}`}>
                            <div className="flex items-center justify-between font-semibold">
                              <span className="flex items-center gap-1.5">
                                {res.passed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                Test Case #{i + 1}
                              </span>
                              <span>{res.passed ? 'PASS' : 'FAIL'}</span>
                            </div>
                            <p className="text-gray-400">Input: <span className="text-gray-200">{res.input}</span></p>
                            <p className="text-gray-400">Expected: <span className="text-emerald-400">{res.expectedOutput}</span> | Actual: <span className="text-cyan-300">{res.actualOutput}</span></p>
                            {res.explanation && <p className="text-[11px] opacity-80 pt-1 border-t border-white/5">{res.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detailed AI Code Review */}
                    <div className="pt-2 border-t border-white/10">
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Code Review & Feedback
                      </h4>
                      <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed bg-base-900/60 p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                        {codeEvaluationResult.feedback}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl text-center text-gray-500 space-y-2">
                    <Cpu className="w-10 h-10 text-emerald-500/30 animate-pulse" />
                    <p className="text-xs font-medium text-gray-400">Click "Run AI Code Evaluator" to test your code.</p>
                    <p className="text-[11px] text-gray-600">The AI Compiler will execute your logic against all test cases, calculate $O(N)$ complexities, and analyze edge cases.</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- THE AI RECALL REVIEW MODAL --- */}
      {reviewingQuestion && (
        <div className="fixed inset-0 bg-base-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 relative flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(99,102,241,0.15)]">
            
            {!gradeResult && (
              <button onClick={closeReview} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Review: <span className="text-brand-400">{reviewingQuestion.title}</span>
                {reviewingQuestion.url && (
                  <a 
                    href={reviewingQuestion.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-brand-400 transition-colors"
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
                  className="w-full bg-base-800/50 border border-white/10 rounded-xl p-4 text-white h-48 focus:border-brand-500 outline-none resize-none mb-4"
                />
                
                <button
                  onClick={submitRecall}
                  disabled={isGrading || !recallText.trim()}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                <div className="p-6 rounded-xl bg-base-800/50 border border-white/10 text-center">
                  <div className="text-5xl font-bold text-brand-400 mb-2">{gradeResult.score} <span className="text-2xl text-gray-500">/ 5</span></div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">SM-2 Spaced Repetition Score</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Buddy Feedback</h3>
                  <p className="text-gray-300 leading-relaxed p-4 bg-white/5 rounded-lg border border-white/5">{gradeResult.feedback}</p>
                </div>
                
                <button
                  onClick={closeReview}
                  className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-lg transition-colors mt-4"
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
