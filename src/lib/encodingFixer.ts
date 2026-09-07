export const detectMojibake = (text: string): boolean => {
    if (!text) return false;
    // Common mojibake patterns for UTF-8 interpreted as Windows-1252/ISO-8859-1
    const patterns = [
        'Ã¼', 'Ã¤', 'Ã¶', 'ÃŸ', 'Ã„', 'Ã–', 'Ãœ',
        'Ã©', 'Ã¨', 'Ãª', 'Ã', 'Ã¡', 'Ã¢', 'Ã±',
        'â‚¬', 'â„¢', 'â€œ', 'â€', 'â€˜', 'â€™'
    ];
    return patterns.some(pattern => text.includes(pattern));
};

export const fixMojibake = (text: string): string => {
    if (!text) return text;
    try {
        // This trick converts Windows-1252/ISO-8859-1 misinterpretations of UTF-8 back to correct UTF-8
        return decodeURIComponent(escape(text));
    } catch (e) {
        // If it fails (e.g., malformed URI component), fallback to manual replacement for common German ones
        console.warn("decodeURIComponent failed, using fallback replacement", e);
        let fixed = text;
        const replacements: Record<string, string> = {
            'Ã¼': 'ü', 'Ã¤': 'ä', 'Ã¶': 'ö', 'ÃŸ': 'ß',
            'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü',
            'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã': 'í', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã±': 'ñ',
            'â‚¬': '€', 'â„¢': '™', 'â€œ': '“', 'â€': '”', 'â€˜': '‘', 'â€™': '’'
        };
        for (const [bad, good] of Object.entries(replacements)) {
            fixed = fixed.split(bad).join(good);
        }
        return fixed;
    }
};
