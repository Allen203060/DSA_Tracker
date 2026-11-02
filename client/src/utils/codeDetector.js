/**
 * Utility function to auto-detect programming language from student's solution code snippet.
 * Supports C++, Python, Java, JavaScript, and Go.
 */
export const detectCodeLanguage = (code) => {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();
  if (!trimmed) return null;

  // C++ indicators
  if (/#include\s*<|std::|vector\s*<|unordered_map\s*<|cout\s*<<|int\s+main\s*\(|->\s*val|\bauto\b|nullptr|class\s+Solution\s*\{\s*public:/.test(trimmed)) {
    return 'cpp';
  }

  // Python indicators
  if (/def\s+[a-zA-Z0-9_]+\s*\(|class\s+Solution\s*:|import\s+math|from\s+collections\s+import|elif\s+|None\b|True\b|False\b|self\.[a-zA-Z0-9_]+/.test(trimmed)) {
    return 'python';
  }

  // Java indicators
  if (/public\s+class|public\s+static\s+void|System\.out\.println|ArrayList\s*<|HashMap\s*<|String\[\]\s*args|boolean\[\]|int\[\]/.test(trimmed)) {
    return 'java';
  }

  // Go indicators
  if (/package\s+[a-zA-Z0-9_]+|func\s+[a-zA-Z0-9_]+\s*\(|fmt\.Print|make\(\[\]|\*TreeNode/.test(trimmed)) {
    return 'go';
  }

  // JavaScript / TypeScript indicators
  if (/function\s+[a-zA-Z0-9_]+\s*\(|const\s+[a-zA-Z0-9_]+\s*=|let\s+[a-zA-Z0-9_]+\s*=|console\.log|=>|module\.exports|export\s+default|var\s+[a-zA-Z0-9_]+\s*=/.test(trimmed)) {
    return 'javascript';
  }

  return null;
};
