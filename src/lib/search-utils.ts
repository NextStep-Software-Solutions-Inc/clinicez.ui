/**
 * Search utility functions for flexible text matching
 */

/**
 * Flexible search that matches text in multiple ways:
 * 1. Substring match: "acne" matches "Acne"
 * 2. Fuzzy match: "ance" matches "Acne" (all chars present)
 * 3. Abbreviation match: "hbp" matches "High Blood Pressure" (character presence)
 * 
 * @param text The text to search in
 * @param search The search term
 * @returns true if the search term matches the text
 * 
 * @example
 * matchesSearch("Acne", "ance") // true
 * matchesSearch("Diabetes", "diab") // true
 * matchesSearch("High Blood Pressure", "hbp") // true
 */
export function matchesSearch(text: string, search: string): boolean {
  if (!search) return true
  
  const textLower = text.toLowerCase()
  const searchLower = search.toLowerCase()
  
  // First try exact substring match (fastest and most intuitive)
  if (textLower.includes(searchLower)) return true
  
  // Then try flexible fuzzy matching using character frequency map
  // Check if all search characters exist in the text
  const charCount = new Map<string, number>()
  
  // Count characters in the text
  for (const char of textLower) {
    charCount.set(char, (charCount.get(char) || 0) + 1)
  }
  
  // Check if all search characters are available
  for (const searchChar of searchLower) {
    const count = charCount.get(searchChar) || 0
    if (count === 0) {
      return false // Character not found or already used up
    }
    charCount.set(searchChar, count - 1)
  }
  
  return true
}
