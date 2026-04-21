function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;

    try {
        const parsed = new URL(url);

        // 🔥 allow only http/https
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function isValidAlias(alias) {
    if (!alias || typeof alias !== 'string') return false;

    const trimmed = alias.trim();

    // 🔥 enforce length + allowed characters
    const regex = /^[a-zA-Z0-9_-]{4,10}$/;
    return regex.test(trimmed);
}

module.exports = { isValidUrl, isValidAlias };