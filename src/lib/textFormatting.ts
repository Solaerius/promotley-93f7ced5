/**
 * Text formatting utilities for Promotely
 * Handles emoji stripping and safe text rendering
 */

/**
 * Removes all emojis from input text
 * Supports most common emoji Unicode ranges
 */
export function stripEmojis(input: string): string {
  if (!input) return "";
  return input.replace(
    /([\u2700-\u27BF]|[\u1F1E6-\u1F1FF]|[\u1F300-\u1F5FF]|[\u1F600-\u1F64F]|[\u1F680-\u1F6FF]|[\u1F900-\u1F9FF]|\uFE0F)/g,
    ""
  );
}

/**
 * Converts Markdown text to plain text
 * Removes all formatting characters while preserving content
 * Used for AI analysis, templates, and exports
 */
export function toPlainText(s: string): string {
  if (!s) return "";
  
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1")           // Bold
    .replace(/\*(.*?)\*/g, "$1")               // Italic
    .replace(/`{1,3}[^`]*`{1,3}/g, "")         // Code blocks
    .replace(/^>.+$/gm, "")                    // Quotes
    .replace(/^#{1,6}\s+/gm, "")               // Headers
    .replace(/<[^>]+>/g, "")                   // HTML tags
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 – $2") // Links
    .trim();
}

/**
 * Processes text based on context:
 * - Chat: keeps safe Markdown (bold, italic, lists, links)
 * - Analysis/Templates/Exports: converts to plain text
 */
export function formatText(text: string, context: 'chat' | 'analysis' | 'template' | 'export'): string {
  const stripped = stripEmojis(text);
  
  if (context === 'chat') {
    return stripped; // Will be rendered with safe Markdown
  }
  
  return toPlainText(stripped);
}
