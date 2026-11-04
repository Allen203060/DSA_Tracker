import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import axios from 'axios';
import { 
  BrainCircuit, Loader2, X, List, 
  ChevronDown, ChevronUp, Trash2, ExternalLink, Layers, Folder, 
  ChevronRight, Flame, Trophy, Activity, Code, Play, Copy, Check, 
  Plus, RotateCcw, Sparkles, CheckCircle, Edit3, Save, Sun, Moon,
  User as UserIcon, LogOut, Key, ShieldCheck, UserPlus, ArrowLeft, Lock, Info, HelpCircle,
  Skull, AlertTriangle, Hourglass, Zap, Search, Wand2, Link2, CheckCheck, Download, Clock,
  ArrowRight, GraduationCap, BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ThreeBackground from './components/ThreeBackground';
import { cleanMarkdownNotes } from './utils/cleanMarkdown';
import { detectCodeLanguage } from './utils/codeDetector';

// Base API URL configuration for cloud deployment (e.g. DigitalOcean / Heroku) vs local proxy
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Attach JWT Bearer token to all outgoing API requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('revalgo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

function App() {
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [dueQuestions, setDueQuestions] = useState([]);
  
  // Multi-User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('revalgo_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authRecoveryKey, setAuthRecoveryKey] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  
  // Authenticated profile password modification state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isServerWakingUp, setIsServerWakingUp] = useState(false);

  // First-time Visitor Welcome & Interactive Guided Tour State
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showFeatureTourModal, setShowFeatureTourModal] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [demoActionLoading, setDemoActionLoading] = useState(false);
  const [demoToast, setDemoToast] = useState('');
  
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

  // Smart Importer & Omnibox State
  const [smartInput, setSmartInput] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');
  const [importError, setImportError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [detectedLangBadge, setDetectedLangBadge] = useState(null);
  const [isSummarizingCode, setIsSummarizingCode] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

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

  // Heatmap & Learning Analytics State (Wall of Fame vs Wall of Shame)
  const INITIAL_ACTIVITY_DATA = { 
    dailyActivity: {}, 
    shameActivity: {},
    stats: { 
      currentStreak: 0, 
      longestStreak: 0, 
      totalNew: 0, 
      totalRecalls: 0,
      totalSlackedDays: 0,
      currentSlackedStreak: 0,
      longestSlackedStreak: 0,
      activeDebtCount: 0
    } 
  };
  const [activityData, setActivityData] = useState(INITIAL_ACTIVITY_DATA);
  const [wallMode, setWallMode] = useState('fame'); // 'fame' | 'shame'
  const [isWallFlipping, setIsWallFlipping] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  const handleToggleWallMode = () => {
    setIsWallFlipping(true);
    setTimeout(() => {
      setWallMode(prev => prev === 'fame' ? 'shame' : 'fame');
    }, 180);
    setTimeout(() => {
      setIsWallFlipping(false);
    }, 550);
  };

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
      setDueQuestions(dueRes.data);
      if (viewMode === 'due') {
        setQuestions(dueRes.data);
      } else if (viewMode === 'recent') {
        const recentSorted = [...allRes.data].sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id));
        setQuestions(recentSorted);
      } else {
        setQuestions(allRes.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setIsAuthModalOpen(true);
      }
      console.error("Failed to fetch questions", error);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const res = await axios.get('/api/analytics/activity');
      setActivityData(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        setIsAuthModalOpen(true);
      }
      console.error("Failed to fetch activity stats", error);
    }
  };

  // Verify stored token and keep backend awake with heartbeat
  useEffect(() => {
    // Detect Render cold-start: if health ping takes >2s, show waking-up toast
    const wakeUpTimer = setTimeout(() => {
      setIsServerWakingUp(true);
    }, 2000);

    axios.get('/api/health')
      .finally(() => {
        clearTimeout(wakeUpTimer);
        setIsServerWakingUp(false);
      });

    const token = localStorage.getItem('revalgo_token');
    if (token) {
      localStorage.setItem('revalgo_api_endpoint', window.location.origin);
      axios.get('/api/auth/me')
        .then((res) => {
          setCurrentUser(res.data.user);
          localStorage.setItem('revalgo_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('revalgo_token');
          localStorage.removeItem('revalgo_user');
          setCurrentUser(null);
          setShowVisitorModal(true);
        });
    } else {
      setShowVisitorModal(true);
    }

    // Keep-alive heartbeat: ping backend every 10 minutes to prevent Render from going to sleep while tab is open
    const keepAliveInterval = setInterval(() => {
      axios.get('/api/health').catch(() => {});
    }, 10 * 60 * 1000);

    return () => {
      clearTimeout(wakeUpTimer);
      clearInterval(keepAliveInterval);
    };
  }, []);

  // Sync data whenever active user, viewMode, or revision limit updates
  useEffect(() => {
    if (currentUser) {
      fetchQuestions();
      fetchActivityStats();
    } else {
      setQuestions([]);
      setAllQuestions([]);
      setDueQuestions([]);
      setActivityData(INITIAL_ACTIVITY_DATA);
    }
  }, [currentUser, viewMode, dailyRevisionLimit]);

  // Google Sign-In initialization
  useEffect(() => {
    if (!isAuthModalOpen || currentUser) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleLoginSuccess,
            auto_select: false,
          });
          const container = document.getElementById('googleSignInBtn');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: theme === 'dark' ? 'filled_black' : 'outline',
              size: 'large',
              shape: 'rectangular',
              width: 320,
              text: 'continue_with',
            });
          }
        } catch (err) {
          console.warn('Google Sign-In initialization error:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGoogle();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [isAuthModalOpen, authMode, currentUser, theme]);

  const handleGoogleLoginSuccess = async (response) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post('/api/auth/google', { credential: response.credential });
      const { user, token } = res.data;
      localStorage.setItem('revalgo_token', token);
      localStorage.setItem('revalgo_api_endpoint', window.location.origin);
      localStorage.setItem('revalgo_user', JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setAuthError('');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Google Sign-In failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'forgot') {
        const res = await axios.post('/api/auth/reset-password', {
          username: authUsername,
          recoveryKey: authRecoveryKey,
          newPassword: authNewPassword
        });
        const { user, token } = res.data;
        localStorage.setItem('revalgo_token', token);
        localStorage.setItem('revalgo_api_endpoint', window.location.origin);
        localStorage.setItem('revalgo_user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setAuthPassword('');
        setAuthNewPassword('');
        setAuthRecoveryKey('');
        setAuthError('');
      } else {
        const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const payload = authMode === 'login' 
          ? { username: authUsername, password: authPassword }
          : { username: authUsername, password: authPassword, displayName: authDisplayName || authUsername };

        const res = await axios.post(endpoint, payload);
        const { user, token } = res.data;

        localStorage.setItem('revalgo_token', token);
        localStorage.setItem('revalgo_api_endpoint', window.location.origin);
        localStorage.setItem('revalgo_user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        setAuthPassword('');
        setAuthError('');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');
    setChangePasswordLoading(true);

    try {
      const res = await axios.post('/api/auth/change-password', {
        currentPassword: changeCurrentPassword,
        newPassword: changeNewPassword
      });
      setChangePasswordSuccess(res.data.message || 'Password updated successfully!');
      setChangeCurrentPassword('');
      setChangeNewPassword('');
      setTimeout(() => setChangePasswordSuccess(''), 4000);
    } catch (err) {
      setChangePasswordError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('revalgo_token');
    localStorage.removeItem('revalgo_user');
    setCurrentUser(null);
    setQuestions([]);
    setAllQuestions([]);
    setActivityData(INITIAL_ACTIVITY_DATA);
    setAuthMode('login');
    setAuthUsername('');
    setAuthPassword('');
    setAuthRecoveryKey('');
    setAuthNewPassword('');
    setShowVisitorModal(true);
    setIsAuthModalOpen(false);
  };

  const handleLaunchDemo = async () => {
    setDemoActionLoading(true);
    setAuthError('');
    try {
      const res = await axios.post('/api/auth/demo');
      const { user, token } = res.data;
      localStorage.setItem('revalgo_token', token);
      localStorage.setItem('revalgo_api_endpoint', window.location.origin);
      localStorage.setItem('revalgo_user', JSON.stringify(user));
      setCurrentUser(user);
      setShowVisitorModal(false);
      setIsAuthModalOpen(false);
      setTourStep(0);
      setShowFeatureTourModal(true);
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Failed to initialize demo account. Please try again.');
    } finally {
      setDemoActionLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    setDemoActionLoading(true);
    try {
      await axios.post('/api/auth/demo/reset');
      await fetchQuestions();
      await fetchActivityStats();
      setDemoToast('Demo showcase questions reset to pristine state!');
      setTimeout(() => setDemoToast(''), 4000);
    } catch (err) {
      setDemoToast('Failed to reset demo data.');
      setTimeout(() => setDemoToast(''), 4000);
    } finally {
      setDemoActionLoading(false);
    }
  };

  const FEATURE_TOUR_STEPS = [
    {
      stepNumber: 1,
      badge: 'Spatial Retention',
      icon: Clock,
      iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      title: 'Active Spaced Repetition (SM-2)',
      description: 'Cramming LeetCode problems 2 weeks before interviews leads to memory decay. Revalgo applies the SuperMemo SM-2 algorithm to compute the exact day you need to review a pattern right before it slips away.',
      highlights: [
        { label: 'Due Today Queue', text: 'Questions automatically surface in your "Revision" feed when due.' },
        { label: 'Dynamic Intervals', text: 'Successful recalls push intervals from 1 day to 4 days, then weeks.' },
        { label: 'Zero Cognitive Burden', text: 'You never have to guess what algorithm to revise next.' }
      ],
      proTip: 'Look at the "Revision" tab on your dashboard — "Two Sum" and "Daily Temperatures" are queued for review right now!'
    },
    {
      stepNumber: 2,
      badge: 'Conceptual Mastery',
      icon: BrainCircuit,
      iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      title: 'AI Study Buddy & Natural Recall Grading',
      description: 'Never jump straight to reading solutions! When you click "Test Recall", write the algorithmic invariant and approach in plain English. Our AI grades your explanation (0-100) and points out edge cases you missed.',
      highlights: [
        { label: 'Active Retrieval', text: 'Explaining concepts in plain English builds 10x deeper mental models.' },
        { label: 'Nuanced AI Feedback', text: 'Identifies missing edge cases, invariant slip-ups, and Big-O bottlenecks.' },
        { label: 'Quality Score (1-5)', text: 'Your recall grade feeds directly into the SM-2 scheduling algorithm.' }
      ],
      proTip: 'Click "Test Recall" on any question card to test your conceptual recall before looking at code.'
    },
    {
      stepNumber: 3,
      badge: 'Live Code Sandbox',
      icon: Code,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Split-Pane Playground & Complexity Evaluator',
      description: 'Practice writing your solution directly in our developer-tuned editor. Test against custom inputs, verify outputs, and ask the AI Complexity Grader to verify your Time & Space Big-O limits.',
      highlights: [
        { label: 'Multi-Language Support', text: 'Seamless practice in C++, Python, Java, JavaScript, and Go.' },
        { label: 'Custom Test Runner', text: 'Run edge cases like empty arrays, single elements, and large constraints.' },
        { label: 'Big-O Evaluation', text: 'Get instant algorithmic verification of asymptotic runtime.' }
      ],
      proTip: 'Click "Code Space" on "Trapping Rain Water" to explore the two-pointer invariant and run sample test cases.'
    },
    {
      stepNumber: 4,
      badge: 'Accountability System',
      icon: Flame,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Wall of Fame vs Wall of Shame',
      description: 'Real mastery is born from consistency. Revalgo provides GitHub-style streak heatmaps, and a toggleable "Wall of Shame" that highlights overdue questions and days when revisions were neglected.',
      highlights: [
        { label: 'Revision Streaks', text: 'Keep your consecutive practice streak alive every day.' },
        { label: 'Wall of Shame Flip', text: 'Toggle to Shame Mode to confront overdue learning debt.' },
        { label: 'Daily Quota Tuning', text: 'Set your target to 2, 3, 5, or 10 revisions per day to prevent burnout.' }
      ],
      proTip: 'Click "Fame / Shame" in the activity section to toggle between your achievement streak and overdue backlog.'
    },
    {
      stepNumber: 5,
      badge: '1-Click Workflow',
      icon: Zap,
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      title: 'Revalgo Browser Companion Extension',
      description: 'Log problems seamlessly as you solve them on LeetCode and GeeksforGeeks. The extension automatically detects problem titles, difficulty, topics, and even summarizes approaches using AI.',
      highlights: [
        { label: 'Edge & Chrome Ready', text: 'Install the companion in Microsoft Edge, Google Chrome, or Brave.' },
        { label: 'Background Service Worker', text: 'Asynchronous logging ensures problem saves never fail if the popup closes.' },
        { label: 'Recently Logged Feed', text: 'Freshly logged problems instantly populate your "Recently Logged" feed.' }
      ],
      proTip: 'Click the "Browser Companion" button in the top header to copy your extension token and download the zip bundle.'
    }
  ];

  const handleCopyToken = () => {
    const token = localStorage.getItem('revalgo_token');
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  // Global Escape key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (playgroundQuestion) setPlaygroundQuestion(null);
        if (viewingCodeQuestion) setViewingCodeQuestion(null);
        if (reviewingQuestion) closeReview();
        if (showExtensionModal) setShowExtensionModal(false);
        if (showFeatureTourModal) setShowFeatureTourModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playgroundQuestion, viewingCodeQuestion, reviewingQuestion, showExtensionModal]);

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
        <div class="footer">Revalgo • Spaced Repetition Algorithmic Revision</div>
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

  // Filter displayed questions based on selected topic / subtopic & active viewMode
  const targetQuestions = viewMode === 'due'
    ? (dueQuestions.length > 0 || questions.length > 0 ? (dueQuestions.length > 0 ? dueQuestions : questions) : [])
    : viewMode === 'recent'
    ? [...allQuestions].sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id))
    : allQuestions;

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

  // --- Smart Importer & Problem Search Handlers ---
  const handleImportFromUrl = async (targetUrl) => {
    const urlToFetch = (targetUrl || smartInput).trim();
    if (!urlToFetch) return;

    setIsImportingUrl(true);
    setImportError('');
    setImportSuccess('');
    setShowSearchDropdown(false);

    try {
      const res = await axios.post('/api/import/url', { url: urlToFetch });
      const { title: fetchedTitle, url: canonicalUrl, difficulty: fetchedDifficulty, testCases: fetchedTestCases } = res.data;

      if (fetchedTitle) setTitle(fetchedTitle);
      if (canonicalUrl) setUrl(canonicalUrl);
      if (fetchedDifficulty && ['Easy', 'Medium', 'Hard'].includes(fetchedDifficulty)) {
        setDifficulty(fetchedDifficulty);
      }
      if (Array.isArray(fetchedTestCases) && fetchedTestCases.length > 0) {
        setTestCases(fetchedTestCases);
      }
      setShowCodeSection(true);
      setImportSuccess(`Imported: ${fetchedTitle}`);
      setSmartInput('');
      setTimeout(() => setImportSuccess(''), 4000);
    } catch (err) {
      console.error('Import Error:', err);
      const msg = err.response?.data?.error || err.message;
      setImportError(msg);
      setTimeout(() => setImportError(''), 5000);
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleSearchInputChange = (val) => {
    setSmartInput(val);
    setImportError('');
    setImportSuccess('');

    // If user pasted a full URL, do not query autocomplete search
    if (val.includes('http') || val.includes('leetcode.com') || val.includes('geeksforgeeks.org')) {
      setShowSearchDropdown(false);
      return;
    }

    if (val.trim().length >= 2) {
      setIsSearching(true);
      axios.get(`/api/import/search?query=${encodeURIComponent(val.trim())}`)
        .then(res => {
          setSearchResults(res.data.questions || []);
          setShowSearchDropdown((res.data.questions || []).length > 0);
        })
        .catch(err => {
          console.error('Search error:', err);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectSearchResult = (q) => {
    setTitle(q.title);
    setUrl(q.url);
    if (q.difficulty) setDifficulty(q.difficulty);
    setShowSearchDropdown(false);
    setSmartInput('');
    setShowCodeSection(true);
    handleImportFromUrl(q.url);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    const detected = detectCodeLanguage(newCode);
    if (detected) {
      setCodeLanguage(detected);
      setDetectedLangBadge(detected);
    }
  };

  const handleSummarizeCode = async () => {
    if (!code.trim()) return;
    setIsSummarizingCode(true);
    try {
      const res = await axios.post('/api/ai/summarize-code', {
        title: title || 'Algorithmic Problem',
        code,
        codeLanguage
      });
      let summaryText = res.data.intuition || '';
      if (Array.isArray(res.data.keySteps) && res.data.keySteps.length > 0) {
        summaryText += '\n\n**Key Steps:**\n' + res.data.keySteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      }
      if (Array.isArray(res.data.edgeCases) && res.data.edgeCases.length > 0) {
        summaryText += '\n\n**Edge Cases:**\n' + res.data.edgeCases.map(e => `- ${e}`).join('\n');
      }
      if (res.data.complexity) {
        summaryText += `\n\n**Complexity:** ${res.data.complexity}`;
      }
      setNotes(summaryText);
    } catch (err) {
      console.error('Failed to summarize code:', err);
      alert('Could not summarize code: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSummarizingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !notes) return;
    setIsClassifying(true);

    try {
      const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
      const aiResponse = await axios.post('/api/ai/classify', { title, url, notes, code, codeLanguage });
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
      setDetectedLangBadge(null);
      setSmartInput('');
      setImportSuccess('');
      setImportError('');
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
        
        {/* Cold Start Wake-Up Indicator Toast */}
        {isServerWakingUp && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xl shadow-indigo-500/15 animate-pulse backdrop-blur-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            <span>Connecting to cloud backend (waking up server)...</span>
          </div>
        )}

        {/* --- SLEEK MINIMAL HEADER BAR --- */}
      <header className="mb-6 glass-panel rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-300 shadow-sm">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Revalgo
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

          {/* Browser Companion Extension Trigger */}
          <button
            onClick={() => setShowExtensionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold font-mono transition-all shadow-sm active:scale-[0.98]"
            title="Download Revalgo Browser Companion Extension (Edge, Chrome, Brave)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">Browser Companion</span>
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

          {/* User Account / Peer Switcher */}
          {currentUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-input hover:border-indigo-500/40 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-sm active:scale-[0.98]"
              title="Click to view profile, switch account, or log out"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="max-w-[100px] truncate">{currentUser.displayName || currentUser.username}</span>
              {(currentUser.username === 'demo' || currentUser.isDemo) && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold uppercase font-mono">
                  Demo
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* --- DEMO MODE ACTIVE BANNER --- */}
      {(currentUser?.username === 'demo' || currentUser?.isDemo) && (
        <div className="mb-6 p-4 rounded-2xl glass-panel border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-500/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">
                  Interactive Guest Demo
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold">
                  Live Showcase
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Exploring preloaded problems (Two Sum, Daily Temps, Trapping Rain Water). Test the AI recall, run code test cases, or take the guided tour!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => { setTourStep(0); setShowFeatureTourModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-input text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 transition-all shadow-sm active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Feature Tour
            </button>

            <button
              onClick={handleResetDemoData}
              disabled={demoActionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-input text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-all shadow-sm active:scale-95"
              title="Reset showcase questions to initial state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${demoActionLoading ? 'animate-spin' : ''}`} />
              Reset Data
            </button>

            <button
              onClick={() => {
                setAuthMode('register');
                setAuthUsername('');
                setAuthPassword('');
                setAuthDisplayName('');
                setAuthError('');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Create My Account
            </button>
          </div>
        </div>
      )}

      {/* Demo Notification Toast */}
      {demoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xl shadow-emerald-500/10 animate-fade-in backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{demoToast}</span>
        </div>
      )}

      {/* --- PROGRESS & ACTIVITY DASHBOARD (WALL OF FAME / WALL OF SHAME) --- */}
      <section className="mb-6 glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            {wallMode === 'fame' ? (
              <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
            )}
            <h2 className="text-sm font-semibold tracking-wide uppercase font-mono flex items-center gap-2">
              <span className={wallMode === 'fame' ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                {wallMode === 'fame' ? 'Wall of Fame // Activity & Mastery' : 'Wall of Shame // Inactivity & Debt Mirror'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                wallMode === 'fame' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {wallMode === 'fame' ? 'Fame Mode' : 'Shame Mode'}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive 3D Flip Toggle */}
            <button
              onClick={handleToggleWallMode}
              disabled={isWallFlipping}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono border transition-all duration-300 shadow-sm active:scale-95 ${
                wallMode === 'fame'
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:border-rose-500/50 hover:shadow-rose-500/10'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
              }`}
              title="Flip between Wall of Fame and Wall of Shame"
            >
              {wallMode === 'fame' ? (
                <>
                  <Skull className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  <span>Flip to Wall of Shame</span>
                </>
              ) : (
                <>
                  <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Flip to Wall of Fame</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              {wallMode === 'fame' ? (
                <>Total Solved: <strong className="text-slate-900 dark:text-slate-100">{allQuestions.length}</strong></>
              ) : (
                <>Overdue Debt: <strong className="text-rose-600 dark:text-rose-400">{activityData.stats.activeDebtCount || 0}</strong></>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 4 Stat Cards with Dynamic Fame vs Shame Metrics */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            {wallMode === 'fame' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="glass-panel p-3.5 rounded-xl border-rose-500/30 bg-rose-500/[0.04] hover:border-rose-500/50 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-rose-400 font-medium uppercase tracking-wider">Revision Debt</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">{activityData.stats.activeDebtCount || 0} <span className="text-xs font-normal text-rose-400">items</span></p>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">Overdue Problems</p>
                </div>

                <div className="glass-panel p-3.5 rounded-xl border-rose-500/30 bg-rose-500/[0.04] hover:border-rose-500/50 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-rose-400 font-medium uppercase tracking-wider">Slacking</span>
                    <Skull className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">{activityData.stats.currentSlackedStreak || 0} <span className="text-xs font-normal text-rose-400">days</span></p>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">Consecutive Idle</p>
                </div>

                <div className="glass-panel p-3.5 rounded-xl border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-amber-500 dark:text-amber-400 font-medium uppercase tracking-wider">Worst Slump</span>
                    <Hourglass className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{activityData.stats.longestSlackedStreak || 0} <span className="text-xs font-normal text-amber-400">days</span></p>
                  <p className="text-[11px] text-amber-500/80 mt-0.5">Longest Drought</p>
                </div>

                <div className="glass-panel p-3.5 rounded-xl border-rose-500/20 bg-rose-500/[0.04] hover:border-rose-500/40 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-rose-400 font-medium uppercase tracking-wider">Total Ghosted</span>
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">{activityData.stats.totalSlackedDays || 0} <span className="text-xs font-normal text-rose-400">days</span></p>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">Slacked Since Start</p>
                </div>
              </>
            )}
          </div>

          {/* Right Contribution Heatmap Matrix with 3D Flip */}
          <div className="lg:col-span-8 perspective-container">
            <div 
              style={{
                transform: isWallFlipping ? 'rotateX(90deg)' : 'rotateX(0deg)',
              }}
              className={`glass-panel p-4 rounded-xl flex flex-col justify-between flip-panel transition-all duration-500 ${
                wallMode === 'shame' 
                  ? 'border-rose-500/40 shame-pulse bg-gradient-to-br from-rose-950/[0.06] via-transparent to-red-950/[0.08]' 
                  : 'hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
                <span className="flex items-center gap-1.5 font-semibold">
                  {wallMode === 'fame' ? (
                    <>
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Revision Heatmap (Past 24 Weeks)</span>
                    </>
                  ) : (
                    <>
                      <Skull className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-600 dark:text-rose-400">Accountability Mirror // Slacking Severity</span>
                    </>
                  )}
                </span>
                
                {/* Legend */}
                <div className="flex items-center gap-1.5">
                  {wallMode === 'fame' ? (
                    <>
                      <span className="text-[10px]">Less</span>
                      <div className="w-2.5 h-2.5 bg-slate-200/60 dark:bg-slate-800/40 rounded-sm border border-slate-300/30 dark:border-white/[0.04]" title="0 solved/reviewed"></div>
                      <div className="w-2.5 h-2.5 bg-emerald-200/80 dark:bg-emerald-950 rounded-sm border border-emerald-300/40 dark:border-emerald-900/40" title="1 problem/review"></div>
                      <div className="w-2.5 h-2.5 bg-emerald-400 dark:bg-emerald-700 rounded-sm border border-emerald-500 dark:border-emerald-600/40" title="2 problems/reviews"></div>
                      <div className="w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-500 rounded-sm border border-emerald-600 dark:border-emerald-400" title="3+ problems/reviews"></div>
                      <span className="text-[10px]">More</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-emerald-500 font-semibold">Clean</span>
                      <div className="w-2.5 h-2.5 bg-slate-200/60 dark:bg-slate-800/40 rounded-sm border border-slate-300/30 dark:border-white/[0.04]" title="Active/Disciplined or Prior"></div>
                      <div className="w-2.5 h-2.5 bg-amber-400/35 dark:bg-amber-950/70 rounded-sm border border-amber-500/50" title="Idle (1 Day)"></div>
                      <div className="w-2.5 h-2.5 bg-rose-500/60 dark:bg-rose-900/70 rounded-sm border border-rose-500/70" title="Missed Repetition (2 Days)"></div>
                      <div className="w-2.5 h-2.5 bg-rose-600 dark:bg-rose-950 rounded-sm border border-rose-500 shadow-[0_0_6px_rgba(225,29,72,0.8)]" title="Critical Ghosting (3+ Days)"></div>
                      <span className="text-[10px] text-rose-500 font-bold">Ghosted</span>
                    </>
                  )}
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
                    const shameData = (activityData.shameActivity && activityData.shameActivity[dateStr]) || { shameLevel: 0, status: 'clean', label: 'Clean' };

                    let bgClass = "bg-slate-200/60 dark:bg-slate-800/40 border border-slate-300/30 dark:border-white/[0.03]";

                    if (wallMode === 'fame') {
                      const total = dayData.total;
                      if (total === 1) bgClass = "bg-emerald-200/80 dark:bg-emerald-950 border border-emerald-300/50 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-400";
                      else if (total === 2) bgClass = "bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600/60 text-white dark:text-emerald-100 shadow-[0_0_6px_rgba(16,185,129,0.3)]";
                      else if (total >= 3) bgClass = "bg-emerald-600 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]";
                    } else {
                      // Wall of Shame coloring
                      if (shameData.shameLevel === 1) {
                        bgClass = "bg-amber-400/25 dark:bg-amber-950/60 border border-amber-500/40 text-amber-300 shadow-[0_0_4px_rgba(245,158,11,0.2)]";
                      } else if (shameData.shameLevel === 2) {
                        bgClass = "bg-rose-500/60 dark:bg-rose-900/70 border border-rose-500/70 text-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
                      } else if (shameData.shameLevel >= 3) {
                        bgClass = "bg-rose-600 dark:bg-rose-950 border border-rose-500 text-white shadow-[0_0_12px_rgba(225,29,72,0.7)] animate-pulse";
                      }
                    }

                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHoveredCell({ date: dateStr, data: dayData, shame: shameData })}
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
                  wallMode === 'fame' ? (
                    <>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{hoveredCell.date}</span>
                      <div className="flex gap-4">
                        <span>Solved: <strong className="text-slate-900 dark:text-slate-100">{hoveredCell.data?.newCount || 0}</strong></span>
                        <span>Recalls: <strong className="text-emerald-600 dark:text-emerald-400">{hoveredCell.data?.recallCount || 0}</strong></span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{hoveredCell.date}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          hoveredCell.shame?.shameLevel === 3
                            ? 'bg-rose-600 text-white font-bold animate-pulse'
                            : hoveredCell.shame?.shameLevel === 2
                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                            : hoveredCell.shame?.shameLevel === 1
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {hoveredCell.shame?.shameLevel === 3 ? 'CRITICAL GHOSTING' : hoveredCell.shame?.shameLevel === 2 ? 'MISSED RECALL' : hoveredCell.shame?.shameLevel === 1 ? 'IDLE DAY' : 'DISCIPLINED'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[340px]">
                        {hoveredCell.shame?.label}
                      </span>
                    </>
                  )
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    {wallMode === 'fame'
                      ? 'Hover over any day cell to view daily activity metrics'
                      : 'Hover over any day cell to inspect accountability and missed streak details'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- REVALGO BROWSER COMPANION BANNER --- */}
      <section className="mb-6 glass-panel rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/[0.12] via-purple-950/[0.08] to-emerald-950/[0.1] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Revalgo Browser Companion
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 font-mono uppercase font-semibold">
                Edge &amp; Chrome
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-mono">
                LeetCode &amp; GFG
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tired of copy-pasting? Log questions, editor code, and AI variable summaries directly from LeetCode &amp; GeeksforGeeks in 1 click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <a
            href="/revalgo-companion-extension.zip"
            download="revalgo-companion-extension.zip"
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Extension (.zip)</span>
          </a>
          <button
            onClick={() => setShowExtensionModal(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 glass-input hover:border-indigo-500/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <span>Install Guide &amp; Benefits</span>
          </button>
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

              {/* SMART IMPORT OMNIBOX & LINK AUTO-SCRAPER */}
              <div className="relative p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/[0.08] via-purple-500/[0.05] to-emerald-500/[0.08] border border-indigo-500/25">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Smart Import (LeetCode, GFG, or Search by #)</span>
                  </div>
                  {importSuccess && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> {importSuccess}
                    </span>
                  )}
                  {importError && (
                    <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                      {importError}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {smartInput.includes('http') ? <Link2 className="w-3.5 h-3.5 text-indigo-500" /> : <Search className="w-3.5 h-3.5" />}
                    </div>
                    <input
                      type="text"
                      placeholder="Paste LeetCode / GFG link, or type problem number (e.g. 739, LRU Cache)..."
                      value={smartInput}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (smartInput.includes('http') || smartInput.includes('leetcode.com') || smartInput.includes('geeksforgeeks.org')) {
                            handleImportFromUrl(smartInput);
                          }
                        }
                      }}
                      className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
                    />

                    {/* LIVE AUTOCOMPLETE DROPDOWN */}
                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 glass-panel rounded-xl shadow-2xl border border-indigo-500/30 overflow-hidden divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectSearchResult(item)}
                            className="p-2.5 hover:bg-indigo-600/10 cursor-pointer flex items-center justify-between transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{item.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({item.tags.slice(0, 2).join(', ')})</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              item.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                              item.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {item.difficulty}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isImportingUrl || !smartInput.trim()}
                    onClick={() => handleImportFromUrl(smartInput)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    {isImportingUrl ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Fetch</span>
                      </>
                    )}
                  </button>
                </div>
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

              {/* Intuition Notes Textarea with AI Code-Summarizer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Intuition &amp; Key Notes</label>
                  {code.trim() && (
                    <button
                      type="button"
                      disabled={isSummarizingCode}
                      onClick={handleSummarizeCode}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-mono transition-colors active:scale-95"
                      title="Use AI to summarize your intuition directly from your pasted code"
                    >
                      {isSummarizingCode ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Analyzing Your Code...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>✨ Auto-Fill Notes from Code</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="Summarize the core insight, approach, and edge cases in your own words (or paste your code below and click 'Auto-Fill Notes from Code')..."
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
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Code className="w-4 h-4" /> Solution Code
                      </label>
                      {detectedLangBadge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 font-mono">
                          Auto-detected: {detectedLangBadge.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400">Language:</span>
                      <select
                        value={codeLanguage}
                        onChange={(e) => {
                          setCodeLanguage(e.target.value);
                          setDetectedLangBadge(null);
                        }}
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
                    onChange={(e) => handleCodeChange(e.target.value)}
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
                  <span>
                    {viewMode === 'due' 
                      ? 'Due for Review Today' 
                      : viewMode === 'recent'
                      ? 'Recently Logged Questions'
                      : 'All Solved Problems'}
                  </span>
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
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'due' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Questions scheduled for repetition today"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revision ({dueQuestions.length || questions.length})</span>
                </button>
                <button
                  onClick={() => setViewMode('recent')}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'recent' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Questions ordered by newly logged first"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recently Logged ({allQuestions.length})</span>
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'all' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="All solved questions across all topics"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All ({allQuestions.length})</span>
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
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {viewMode === 'due' 
                      ? 'All Caught Up for Today!' 
                      : viewMode === 'recent'
                      ? 'No Questions Logged Yet'
                      : 'No Problems Found'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {viewMode === 'due' 
                      ? "You've mastered all problems in your daily revision queue. Solid consistency!" 
                      : viewMode === 'recent'
                      ? "You haven't logged any questions yet. Use the Smart Importer or Browser Companion above to log your first question!"
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
                            {q.createdAt && (
                              <span 
                                className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1"
                                title={`Logged on ${new Date(q.createdAt).toLocaleString()}`}
                              >
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{formatTimeAgo(q.createdAt)}</span>
                              </span>
                            )}
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
                              <div className="mt-2.5 p-3.5 rounded-xl bg-slate-200/30 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 max-h-72 overflow-y-auto leading-relaxed">
                                {noteViewMode[q._id] === 'raw' ? (
                                  <p className="whitespace-pre-wrap font-sans">{q.notes}</p>
                                ) : (
                                  <ReactMarkdown
                                    components={{
                                      h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1.5 flex items-center gap-1.5 tracking-wide first:mt-0" {...props} />,
                                      p: ({ node, ...props }) => <p className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed text-xs" {...props} />,
                                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2 text-slate-700 dark:text-slate-300 text-xs" {...props} />,
                                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-700 dark:text-slate-300 text-xs" {...props} />,
                                      li: ({ node, ...props }) => <li className="text-xs leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
                                      strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                                      code: ({ node, inline, ...props }) => 
                                        inline 
                                          ? <code className="bg-slate-200/80 dark:bg-base-900 px-1 py-0.5 rounded font-mono text-indigo-600 dark:text-cyan-300 text-[11px]" {...props} />
                                          : <code className="block bg-[#0e121e] p-2.5 rounded-lg font-mono text-cyan-300 text-[11px] overflow-x-auto my-2" {...props} />
                                    }}
                                  >
                                    {cleanMarkdownNotes(q.enhancedNotes || q.notes)}
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
                  <ReactMarkdown>{cleanMarkdownNotes(gradeResult.feedback)}</ReactMarkdown>
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

      {/* --- MULTI-USER AUTHENTICATION & PEER SWITCHER MODAL --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/40 dark:border-white/[0.08] relative">
            {/* Close button only visible if user is already logged in */}
            {currentUser && (
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {currentUser ? (
              /* --- LOGGED IN PROFILE VIEW --- */
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-500/20">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {currentUser.displayName || currentUser.username}
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{currentUser.username}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Your questions, spaced repetition intervals, and streak heatmaps are securely isolated to this account.
                  </span>
                </div>

                {/* Personal Extension API Token Box */}
                <div className="p-3 rounded-xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block font-mono">Browser Extension Token</span>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300">••••••••••••••••••••••••</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="px-3 py-1.5 rounded-lg glass-input text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    title="Copy token to paste into Revalgo Browser Extension config"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
                  </button>
                </div>

                {/* Password update collapsible inside profile */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 py-1.5 hover:text-indigo-500 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Security & Password
                    </span>
                    {showChangePassword ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showChangePassword && (
                    <form onSubmit={handleChangePassword} className="space-y-2.5 mt-2.5 p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                      {changePasswordSuccess && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                          {changePasswordSuccess}
                        </div>
                      )}
                      {changePasswordError && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                          {changePasswordError}
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Current password"
                          value={changeCurrentPassword}
                          onChange={(e) => setChangeCurrentPassword(e.target.value)}
                          className="w-full glass-input px-3 py-1.5 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password (min 6 chars)</label>
                        <input
                          type="password"
                          required
                          placeholder="New password"
                          value={changeNewPassword}
                          onChange={(e) => setChangeNewPassword(e.target.value)}
                          className="w-full glass-input px-3 py-1.5 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={changePasswordLoading || !changeNewPassword}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {changePasswordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Update Password
                      </button>
                    </form>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthUsername('');
                      setAuthPassword('');
                      setAuthDisplayName('');
                      setAuthError('');
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    New Peer
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* --- SIGN IN / REGISTER / FORGOT FORM --- */
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-2">
                    <BrainCircuit className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {authMode === 'login' && 'Welcome to Revalgo'}
                    {authMode === 'register' && 'Create Peer Account'}
                    {authMode === 'forgot' && 'Reset Account Password'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {authMode === 'login' && 'Sign in to access your spaced repetition queue & algorithm notes'}
                    {authMode === 'register' && 'Get your own isolated revision queue & personalized AI buddy'}
                    {authMode === 'forgot' && 'Recover access using your account username and recovery key'}
                  </p>
                </div>

                {/* Tab Switcher (Only visible for login / register) */}
                {authMode !== 'forgot' && (
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      className={`py-1.5 rounded-lg transition-all ${authMode === 'login' ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      className={`py-1.5 rounded-lg transition-all ${authMode === 'register' ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    {authError}
                  </div>
                )}

                {/* FORGOT PASSWORD FORM */}
                {authMode === 'forgot' ? (
                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                      <Key className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        Enter your username, recovery key, and your desired new password.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. allen"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Account Recovery Key
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. allen-recovery-2026"
                        value={authRecoveryKey}
                        onChange={(e) => setAuthRecoveryKey(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={authNewPassword}
                        onChange={(e) => setAuthNewPassword(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
                    >
                      {authLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          Reset Password &amp; Sign In
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(''); }}
                        className="text-xs text-indigo-500 hover:text-indigo-400 font-medium inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" /> Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STANDARD LOGIN / REGISTER FORM */
                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                    {authMode === 'register' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Allen or Sarah"
                          value={authDisplayName}
                          onChange={(e) => setAuthDisplayName(e.target.value)}
                          className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. allen or bob"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Password
                        </label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot');
                              setAuthError('');
                              setAuthRecoveryKey('');
                              setAuthNewPassword('');
                            }}
                            className="text-[11px] text-indigo-500 hover:text-indigo-400 font-medium hover:underline transition-all"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
                    >
                      {authLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          {authMode === 'login' ? 'Sign In' : 'Create Peer Account'}
                        </>
                      )}
                    </button>

                    {/* Google OAuth Section */}
                    <div className="pt-2">
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200/80 dark:border-white/[0.08]"></div>
                        <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-400 tracking-wider">or continue with</span>
                        <div className="flex-grow border-t border-slate-200/80 dark:border-white/[0.08]"></div>
                      </div>

                      <div className="mt-2 flex flex-col items-center justify-center min-h-[44px]">
                        <div id="googleSignInBtn" className="w-full flex justify-center"></div>

                        {/* Fallback Google button if client ID is not yet defined in environment */}
                        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                          <button
                            type="button"
                            onClick={() => setShowGoogleConfigModal(true)}
                            className="w-full py-2.5 px-4 rounded-xl border border-slate-300/80 dark:border-white/[0.1] bg-white/80 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99]"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Continue with Google
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 1-Click Guest Demo Exploration Button */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] mt-3">
                      <button
                        type="button"
                        onClick={handleLaunchDemo}
                        disabled={demoActionLoading}
                        className="w-full py-2.5 px-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-emerald-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] group"
                      >
                        {demoActionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                            <span>Explore Live Demo Account (Zero Setup)</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAuthModalOpen(false);
                            setShowVisitorModal(true);
                          }}
                          className="text-[11px] text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" /> Platform Tour &amp; Feature Overview
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- GOOGLE OAUTH SETUP MODAL --- */}
      {showGoogleConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200/40 dark:border-white/[0.08] relative">
            <button
              onClick={() => setShowGoogleConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Google Sign-In</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Quick 2-minute OAuth configuration</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>To enable official 1-click Google Sign-In for you and your friends:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Google Cloud Console &rarr; Credentials</a>.</li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                <li>Add your Vercel domain and <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">http://localhost:5173</code> to <strong>Authorized JavaScript origins</strong>.</li>
                <li>Copy the Client ID and add it in your Vercel project environment variables as <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code>.</li>
              </ol>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px]">
                The backend is already fully equipped to verify tokens via Google&apos;s tokeninfo endpoint and auto-provision user accounts!
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGoogleConfigModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BROWSER EXTENSION INSTALLATION & BENEFITS MODAL --- */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/40 dark:border-white/[0.08] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowExtensionModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Revalgo Browser Companion
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    v1.0.0
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">1-Click LeetCode &amp; GeeksforGeeks Logger for Edge, Chrome &amp; Brave</p>
              </div>
            </div>

            {/* Quick Action Download Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-emerald-500/15 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Direct Download Package</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">revalgo-companion-extension.zip (17 KB)</span>
              </div>
              <a
                href="/revalgo-companion-extension.zip"
                download="revalgo-companion-extension.zip"
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download .zip</span>
              </a>
            </div>

            {/* Core Advantages */}
            <div className="mb-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Why use the extension? (Core Advantages)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">🚀 Zero Tab-Switching</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Log problems directly while on LeetCode or GFG without having to switch windows or copy URLs.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">🧠 Automatic Code Grab</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Captures your exact solution code from Monaco/Ace editor, including your custom variables.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-0.5">✨ AI Variable Recall Notes</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    1-Click prompts AI to summarize your approach using your actual variable names (`left`, `st`, etc.).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">📅 Instant SM-2 Scheduling</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Saves directly to your personal Revalgo account and queues the question for review tomorrow.
                  </p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Installation */}
            <div className="space-y-3 mb-5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Installation Steps for Microsoft Edge &amp; Chrome (~30 seconds)
              </h4>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-500 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <span><strong>Download &amp; Extract</strong> the <code className="bg-slate-200/70 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">revalgo-companion-extension.zip</code> file onto your computer.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-500 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <span>In <strong>Microsoft Edge</strong>, visit <code className="bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono select-all">edge://extensions</code> (or <code className="bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono select-all">chrome://extensions</code> in Chrome) in your address bar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-500 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                  <span>Turn on <strong>&quot;Developer mode&quot;</strong> (in Edge it&apos;s a toggle in the left sidebar; in Chrome it&apos;s in the top-right corner).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-500 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">4</span>
                  <span>Click <strong>&quot;Load unpacked&quot;</strong> and select the extracted folder. The Revalgo icon will appear in your toolbar!</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-500 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">5</span>
                  <span>Click the extension on any LeetCode/GFG problem page, click <strong>⚙ Config</strong>, and paste your Token below:</span>
                </li>
              </ol>

              {/* 1-Click Token Copy Box */}
              <div className="p-3 rounded-xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] flex items-center justify-between gap-3 mt-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block font-mono">Your Account API Token</span>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">••••••••••••••••••••••••</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3.5 py-1.5 rounded-lg glass-input text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Token Copied!' : 'Copy Token'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
              <button
                onClick={() => setShowExtensionModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 1ST-TIME VISITOR WELCOME MODAL --- */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-indigo-500/30 dark:border-indigo-500/20 relative my-8">
            {/* Brand Header */}
            <div className="text-center space-y-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-emerald-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Interactive Algorithmic Practice Workspace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome to <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 bg-clip-text text-transparent">Revalgo</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                Stop blindly grinding hundreds of problems. Revalgo combines <strong>active spaced repetition</strong>, <strong>AI conceptual recall</strong>, and a <strong>live code playground</strong> so you never blank on patterns in interviews.
              </p>
            </div>

            {/* 4 Superpower Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Feature 1 */}
              <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] hover:border-indigo-500/30 transition-all group">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Spaced Repetition (SM-2)</h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Optimal review intervals scheduled algorithmically. Solve once, review at the point of forgetting, and retain patterns permanently.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] hover:border-purple-500/30 transition-all group">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI Natural Recall Grading</h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Test your conceptual grasp in natural English. AI evaluates your mental model and pinpoints gaps before you glance at solutions.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Code className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Code Space &amp; Test Cases</h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  In-browser code playground with C++, Python &amp; Java syntax, custom test case execution, and automated Big-O complexity analysis.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] hover:border-amber-500/30 transition-all group">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Browser Companion</h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Capture problems and AI code summaries directly from LeetCode and GeeksforGeeks with our Edge/Chrome companion extension.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLaunchDemo}
                disabled={demoActionLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {demoActionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Launch Live Demo Account (Zero Setup)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowVisitorModal(false);
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 font-medium transition-colors"
                >
                  Already have an account? <span className="underline">Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowVisitorModal(false);
                    setAuthMode('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 font-medium transition-colors"
                >
                  Create New Peer Account &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 5-STEP GUIDED FEATURE TOUR MODAL --- */}
      {showFeatureTourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 sm:p-7 shadow-2xl border border-indigo-500/30 dark:border-white/[0.08] relative my-8">
            {/* Top Close Button */}
            <button
              onClick={() => setShowFeatureTourModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              title="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Stepper Content */}
            {(() => {
              const currentStep = FEATURE_TOUR_STEPS[tourStep] || FEATURE_TOUR_STEPS[0];
              const StepIcon = currentStep.icon;

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${currentStep.iconColor} shadow-sm shrink-0`}>
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 font-mono">
                          Step {tourStep + 1} of {FEATURE_TOUR_STEPS.length} &bull; {currentStep.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {currentStep.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentStep.description}
                  </p>

                  {/* Highlight Points */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                    {currentStep.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">{h.label}:</strong>{' '}
                          <span className="text-slate-600 dark:text-slate-400">{h.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pro Tip Box */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-800 dark:text-amber-200">Interactive Action:</span>{' '}
                      <span>{currentStep.proTip}</span>
                    </div>
                  </div>

                  {/* Stepper Navigation Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
                    {/* Stepper Progress Dots */}
                    <div className="flex items-center gap-1.5">
                      {FEATURE_TOUR_STEPS.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTourStep(idx)}
                          className={`h-2 rounded-full transition-all ${idx === tourStep ? 'bg-indigo-500 w-6' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 w-2'}`}
                          title={`Go to step ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFeatureTourModal(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                      >
                        Skip Tour
                      </button>

                      {tourStep > 0 && (
                        <button
                          type="button"
                          onClick={() => setTourStep(prev => Math.max(0, prev - 1))}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Previous
                        </button>
                      )}

                      {tourStep < FEATURE_TOUR_STEPS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setTourStep(prev => Math.min(FEATURE_TOUR_STEPS.length - 1, prev + 1))}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                        >
                          <span>Next</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowFeatureTourModal(false)}
                          className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                        >
                          <span>Start Practicing</span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
    </>
  );
}

export default App;
