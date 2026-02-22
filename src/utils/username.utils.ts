/**
 * Generates a unique username based on first and last name with a random suffix.
 * Removes spaces and special characters, converts to lowercase.
 * Format: {firstName}{lastName}{4-digit random number}
 * Example: "johnsmith1234"
 */
export function generateUniqueUsername(firstName: string, lastName: string): string {
    // Remove spaces and special characters, keep only alphanumeric
    const sanitizedFirstName = firstName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const sanitizedLastName = lastName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${sanitizedFirstName}${sanitizedLastName}${randomSuffix}`;
}
