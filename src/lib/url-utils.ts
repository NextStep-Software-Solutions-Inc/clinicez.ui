/**
 * Update a URL search parameter and push the new URL to history
 * @param key - The parameter key to update
 * @param value - The parameter value (empty string or undefined to delete)
 */
export const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
        params.set(key, value);
    } else {
        params.delete(key);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
};
