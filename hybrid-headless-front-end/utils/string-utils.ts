/**
 * Utility functions for string manipulation
 */

/**
 * Clean HTML entities from a string
 * @param text The text to clean
 * @returns Cleaned text with HTML entities decoded
 */
export function cleanHtmlEntities(text?: string | null): string {
  if (!text) return '';
  
  // Create a temporary element to decode HTML entities
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const decoded = doc.body.textContent || '';
  
  // Replace common problematic patterns
  return decoded
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
