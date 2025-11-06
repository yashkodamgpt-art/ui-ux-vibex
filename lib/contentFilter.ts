import { bannedWords } from './bannedWords';

// Create a single, case-insensitive regex from the banned words list.
// The `\b` assertions are word boundaries, which prevent matching substrings.
// For example, it prevents "hell" from being matched inside "hello".
const offensiveWordsRegex = new RegExp(`\\b(${bannedWords.join('|')})\\b`, 'i');

/**
 * Checks if a given string contains any of the globally banned words.
 * @param text The string to check.
 * @returns {boolean} True if the string contains offensive content, false otherwise.
 */
export const containsOffensiveContent = (text: string): boolean => {
  if (!text) {
    return false;
  }
  return offensiveWordsRegex.test(text);
};
