/**
 * Sanitizes and unescapes AI-generated Markdown notes for client-side ReactMarkdown rendering.
 * Converts literal escaped characters ('\n', '\uXXXX') into genuine formatting.
 *
 * @param {string} str - Raw markdown string
 * @returns {string} - Clean, unescaped markdown string with true newlines
 */
export function cleanMarkdownNotes(str) {
  if (!str || typeof str !== 'string') return '';
  let cleaned = str;

  // Unescape unicode sequences (e.g., \u270e, \u1f6e0, \u{1f6e0}, \\u270e)
  cleaned = cleaned.replace(/\\+u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
  });
  cleaned = cleaned.replace(/\\+u([0-9a-fA-F]{5,6})/g, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
  });
  cleaned = cleaned.replace(/\\+u([0-9a-fA-F]{4})/g, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
  });

  // Convert literal escaped control characters to actual characters
  cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');

  // Strip stray backslashes before or after markdown headers
  cleaned = cleaned.replace(/^\\+(#+)/gm, '$1');
  cleaned = cleaned.replace(/(#+)\s*\\+/g, '$1 ');

  return cleaned.trim();
}
