// Shared cleanup applied to both HTML-derived and plain-text email bodies.
// Removes invisible tracker characters and bare standalone URLs.
function stripJunk(text: string): string {
  let cleaned = text;

  // Remove zero-width and invisible Unicode characters used as email trackers
  // e.g. ‌ (U+200C zero-width non-joiner) and similar invisible padding characters
  cleaned = cleaned.replace(/[\u00ad\u200b\u200c\u200d\u200e\u200f\u2028\u2029\uFEFF]/g, '');

  // Remove bare standalone URLs on their own line (no surrounding text)
  cleaned = cleaned.replace(/^\s*https?:\/\/\S+\s*$/gm, '');

  return cleaned;
}

// Regex-based fallback used only if DOMParser is unavailable (non-browser env).
function extractPlainTextRegex(rawBody: string): string {
  let text = rawBody.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<[^>]*>/g, ' ');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  text = stripJunk(text);
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// Converts an HTML email body into clean readable text. Uses the browser's
// DOMParser, which reliably ignores <style>, <script>, <head>, and HTML
// comments (including Outlook conditional-comment CSS) that regex stripping
// tends to leak. Entities are decoded automatically by the parser.
export function extractPlainText(rawBody: string): string {
  if (typeof DOMParser === 'undefined') {
    return extractPlainTextRegex(rawBody);
  }

  const doc = new DOMParser().parseFromString(rawBody, 'text/html');
  doc.querySelectorAll('style, script, head, noscript, title').forEach((el) => el.remove());

  let text = doc.body?.textContent ?? '';

  // Strip invisible tracker chars and bare URLs that survive in text nodes
  text = stripJunk(text);

  // Collapse multiple whitespace/newlines into single spaces or newlines
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

// Cleans up auto-generated text/plain parts that contain leaked CSS, inline
// tracker URLs, and other HTML-generator artifacts.
export function sanitizePlainText(text: string): string {
  // Remove CSS selector blocks: .class { ... } or #id { ... } or tag { ... }
  // These appear when an email generator copies its <style> block into text/plain
  let cleaned = text.replace(/[.#]?[\w-]+(?:\s*,\s*[.#]?[\w-]+)*\s*\{[^}]*\}/g, '');

  // Remove inline tracker URLs formatted as "Link Text (https://...)" — keep
  // the link text but strip the long URL in parens that follows it
  cleaned = cleaned.replace(/\s*\(https?:\/\/[^\)\n]{20,}\)/g, '');

  // Remove lines that are only a bare URL wrapped in parens ( http://... )
  // These are how HTML anchor tags get encoded in auto-generated plain text
  cleaned = cleaned.replace(/^\s*\(\s*https?:\/\/\S+\s*\)\s*$/gm, '');

  // Shared cleanup: invisible tracker chars + bare standalone URL lines
  cleaned = stripJunk(cleaned);

  // Remove standalone short numeric tokens on their own line (e.g. "96" from image pixel dims)
  cleaned = cleaned.replace(/^\s*\d{1,5}\s*$/gm, '');

  // Collapse runs of blank lines left behind by the removals above
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

// Truncates text to maxChars for the AI prompt to avoid token limits
export function truncateForAI(text: string, maxChars = 3000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Email was shortened for AI processing]';
}
