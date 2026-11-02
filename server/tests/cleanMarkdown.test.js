import { describe, it, expect } from 'vitest';
import { cleanMarkdownNotes } from '../src/utils/cleanMarkdown.js';

describe('cleanMarkdownNotes Utility', () => {
  it('should unescape literal \\n and \\r to real newlines', () => {
    const input = '### Header\\n\\nParagraph line 1\\n- Item 1\\n- Item 2';
    const output = cleanMarkdownNotes(input);
    expect(output).toContain('\n\nParagraph line 1\n- Item 1');
    expect(output).not.toContain('\\n');
  });

  it('should decode 4-digit and 5-digit unicode escape sequences', () => {
    const input = '### \\u270e Core Intuition\\n\\n### \\u1f6e0 Steps\\n### \\u26a0 Edge Cases';
    const output = cleanMarkdownNotes(input);
    expect(output).toContain('✎ Core Intuition');
    expect(output).toContain('🛠 Steps');
    expect(output).toContain('⚠ Edge Cases');
    expect(output).not.toContain('\\u270e');
    expect(output).not.toContain('\\u1f6e0');
  });

  it('should handle double-escaped backslashes', () => {
    const input = '### \\\\u270e Core Intuition\\n\\nContent';
    const output = cleanMarkdownNotes(input);
    expect(output).toContain('✎ Core Intuition');
    expect(output).not.toContain('\\');
  });

  it('should leave already clean markdown unchanged', () => {
    const input = `### 💡 Core Intuition\n\nClean text.\n\n- Step 1\n- Step 2`;
    const output = cleanMarkdownNotes(input);
    expect(output).toBe(input);
  });

  it('should handle null, undefined, or empty inputs gracefully', () => {
    expect(cleanMarkdownNotes(null)).toBe('');
    expect(cleanMarkdownNotes(undefined)).toBe('');
    expect(cleanMarkdownNotes('')).toBe('');
  });
});
