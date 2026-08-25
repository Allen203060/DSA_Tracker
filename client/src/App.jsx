import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrainCircuit, Library, Calendar, Loader2, TerminalSquare, X, CheckCircle2, List, ChevronDown, ChevronUp, Trash2, ExternalLink, Tag, Layers, Filter, Folder, ChevronRight, Flame, Trophy, Activity, TrendingUp } from 'lucide-react';

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
  const [isClassifying, setIsClassifying] = useState(false);

  // Review Modal State
  const [reviewingQuestion, setReviewingQuestion] = useState(null);
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [noteViewMode, setNoteViewMode] = useState({}); // { [qId]: 'ai' | 'raw' }
  const [recallText, setRecallText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);

  // LeetCode Progress & Activity State
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
  // If a topic filter is active, target allQuestions so non-due questions in that topic are also visible!
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !notes) return;
    setIsClassifying(true);

    try {
      const aiResponse = await axios.post('/api/ai/classify', { title, url, notes });
      const { patterns: extractedPatterns, enhancedNotes, topic, subtopic } = aiResponse.data; 

      await axios.post('/api/questions', {
        title, url, notes, enhancedNotes, topic, subtopic, patternNames: extractedPatterns
      });

      setTitle(''); setUrl(''); setNotes('');
      fetchQuestions();
      fetchActivityStats();
    } catch (error) {
      // This will log the EXACT error payload sent from our Node.js server!
      const backendError = error.response?.data?.error || error.message;
      console.error("Failed to process question:", backendError);
      alert(`Backend Error: ${backendError}`);
    } finally {
      setIsClassifying(false);
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
    fetchQuestions(); 
    fetchActivityStats();
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

  // Calculate 20-week grid matrix for LeetCode Activity Heatmap
  const getGridWeeks = () => {
    const weeks = [];
    const totalWeeks = 22;
    const today = new Date();
    
    // Find the Sunday of totalWeeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalWeeks * 7) + (0 - today.getDay()));

    for (let w = 0; w < totalWeeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + (w * 7) + d);
        const dateStr = current.toISOString().split('T')[0];
        const act = activityData.dailyActivity?.[dateStr] || { newCount: 0, recallCount: 0, total: 0 };

        week.push({
          dateStr,
          dateObj: current,
          dayOfWeek: d,
          ...act
        });
      }
      weeks.push(week);
    }
    return weeks;
  };
  const gridWeeks = getGridWeeks();

  return (
    <div className="min-h-screen p-8 selection:bg-brand-500 selection:text-white">
      
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
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
          
          {/* Header Title */}
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

        {/* LeetCode Contribution Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex flex-col gap-1.5 min-w-[700px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, dayIndex) => (
              <div key={dayLabel} className="flex items-center gap-2">
                <span className="w-7 text-[10px] font-mono text-gray-500 text-right pr-1">
                  {dayIndex % 2 === 1 ? dayLabel : ''}
                </span>
                <div className="flex gap-1.5 flex-1">
                  {gridWeeks.map((week, weekIdx) => {
                    const cell = week[dayIndex];
                    if (!cell) return <div key={weekIdx} className="w-3.5 h-3.5" />;
                    
                    let cellColor = "bg-base-800/50 border-white/5";
                    if (cell.total === 1) cellColor = "bg-emerald-900/60 border-emerald-700/50";
                    else if (cell.total === 2 || cell.total === 3) cellColor = "bg-emerald-600/80 border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]";
                    else if (cell.total >= 4) cellColor = "bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)]";

                    return (
                      <div
                        key={cell.dateStr}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-3.5 h-3.5 rounded-sm border ${cellColor} transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Grid Footer & Hover Tooltip */}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-400 pt-3 border-t border-white/5">
            <div className="text-gray-400 font-mono text-[11px]">
              {hoveredCell ? (
                <span className="text-emerald-400 font-medium">
                  📅 {hoveredCell.dateStr}: <strong className="text-white">{hoveredCell.newCount}</strong> new solved + <strong className="text-white">{hoveredCell.recallCount}</strong> recall reviews
                </span>
              ) : (
                <span>Hover over grid cells to view daily activity breakdown</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Less</span>
              <div className="w-3 h-3 rounded-sm bg-base-800/50 border border-white/5" />
              <div className="w-3 h-3 rounded-sm bg-emerald-900/60 border border-emerald-700/50" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600/80 border border-emerald-500" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300" />
              <span className="text-[10px] text-gray-500">More</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout with Left Sidebar */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR: TOPICS & PATTERNS */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-6">
            
            {/* Navigation Views */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Navigation</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => { setViewMode('due'); setSelectedTopic(null); setSelectedSubtopic(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'due' && !selectedTopic && !selectedSubtopic ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-red-400" /> Due Today</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/20 font-semibold">
                    {allQuestions.filter(q => new Date(q.nextReviewDate) <= new Date()).length}
                  </span>
                </button>

                <button
                  onClick={() => { setViewMode('all'); setSelectedTopic(null); setSelectedSubtopic(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'all' && !selectedTopic && !selectedSubtopic ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="flex items-center gap-2.5"><List className="w-4 h-4 text-brand-400" /> All Questions</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-base-700 text-gray-300 font-semibold">
                    {allQuestions.length}
                  </span>
                </button>
              </nav>
            </div>

            {/* Hierarchical Topics & Subtopics Accordion */}
            <div>
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topics & Subtopics</h3>
                {(selectedTopic || selectedSubtopic) && (
                  <button 
                    onClick={() => { setSelectedTopic(null); setSelectedSubtopic(null); }}
                    className="text-xs text-brand-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <nav className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {Object.keys(topicTree).length === 0 ? (
                  <p className="text-xs text-gray-500 px-2 py-2">No topics logged yet.</p>
                ) : (
                  Object.keys(topicTree).sort().map(topicName => {
                    const isTopicSelected = selectedTopic === topicName && !selectedSubtopic;
                    const isExpanded = expandedTopics[topicName] !== false; // Default expanded
                    const subtopicsMap = topicTree[topicName].subtopics;

                    return (
                      <div key={topicName} className="space-y-1">
                        {/* Main Topic Header */}
                        <div
                          onClick={() => { setSelectedTopic(isTopicSelected ? null : topicName); setSelectedSubtopic(null); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isTopicSelected ? 'bg-brand-600 text-white shadow-md' : 'text-gray-200 hover:bg-white/5'}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <button 
                              onClick={(e) => toggleTopicExpand(topicName, e)}
                              className="p-0.5 hover:bg-white/10 rounded transition-colors text-gray-400"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <Folder className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                            <span className="truncate">{topicName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${isTopicSelected ? 'bg-white/20 text-white' : 'bg-base-800 text-brand-300 border border-brand-500/20'}`}>
                            {topicTree[topicName].count}
                          </span>
                        </div>

                        {/* Subtopics List */}
                        {isExpanded && (
                          <div className="pl-6 space-y-1 border-l border-white/10 ml-3">
                            {Object.keys(subtopicsMap).sort().map(subtopicName => {
                              const isSubSelected = selectedSubtopic?.topic === topicName && selectedSubtopic?.subtopic === subtopicName;

                              return (
                                <button
                                  key={subtopicName}
                                  onClick={() => {
                                    if (isSubSelected) {
                                      setSelectedSubtopic(null);
                                    } else {
                                      setSelectedSubtopic({ topic: topicName, subtopic: subtopicName });
                                      setSelectedTopic(null);
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${isSubSelected ? 'bg-brand-500/30 text-brand-300 font-semibold border border-brand-500/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                  <span className="truncate flex items-center gap-1.5">
                                    <Tag className="w-3 h-3 opacity-60 shrink-0" />
                                    <span className="truncate">{subtopicName}</span>
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-mono">
                                    {subtopicsMap[subtopicName]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>
            </div>

          </div>
        </aside>

        {/* RIGHT AREA: FORM & QUESTION QUEUE */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Input Form */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            {isClassifying && (
              <div className="absolute inset-0 bg-base-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-4" />
                <p className="text-brand-400 font-medium">AI is classifying patterns...</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6 text-brand-400">
              <Library className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-white">Log Question</h2>
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

              <button type="submit" disabled={isClassifying} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <TerminalSquare className="w-4 h-4" /> Analyze & Save
              </button>
            </form>
          </div>

          {/* Dynamic Queue */}
          <div className="glass-panel rounded-2xl p-6 min-h-[500px]">
            
            {/* Header with View Toggle & Active Filter */}
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
              
              <div className="flex p-1 bg-base-900/50 rounded-lg border border-white/5">
                <button 
                  onClick={() => setViewMode('due')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'due' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Due Today
                </button>
                <button 
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'all' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  All Questions
                </button>
              </div>
            </div>
            
            {displayedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p>No questions found in this topic or view.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayedQuestions.map((q) => (
                  <div key={q._id} className="p-4 rounded-xl bg-base-800/50 border border-white/5 hover:border-brand-500/30 transition-colors cursor-pointer group">
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
                          {q.patterns?.map(pattern => (
                            <span key={pattern._id} className="text-xs px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/20">
                              {pattern.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {/* Intelligent Label Rendering based on Date */}
                        {new Date(q.nextReviewDate) <= new Date() ? (
                          <span className="text-xs font-medium px-2 py-1 bg-red-500/20 text-red-400 rounded-md border border-red-500/20">
                            Due Now
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-1 bg-brand-500/20 text-brand-400 rounded-md border border-brand-500/20">
                            Scheduled: {new Date(q.nextReviewDate).toLocaleDateString()}
                          </span>
                        )}
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setExpandedNotesId(expandedNotesId === q._id ? null : q._id)}
                            className="text-xs px-3 py-1.5 flex items-center gap-1 bg-base-700 hover:bg-base-600 text-gray-300 rounded-md transition-colors"
                          >
                            {expandedNotesId === q._id ? <><ChevronUp className="w-3 h-3"/> Hide Notes</> : <><ChevronDown className="w-3 h-3"/> AI Notes</>}
                          </button>

                          {/* Delete Question Button */}
                          <button 
                            onClick={(e) => handleDeleteQuestion(q._id, e)}
                            className="text-xs p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors flex items-center justify-center border border-red-500/20"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Only allow reviewing if it's actually due! */}
                          {new Date(q.nextReviewDate) <= new Date() && (
                            <button 
                              onClick={() => setReviewingQuestion(q)}
                              className="text-xs px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                            >
                              Review Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Collapsible Notes Section with Raw Thoughts vs AI Guide Toggle */}
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

      {/* --- THE AI REVIEW MODAL --- */}
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
