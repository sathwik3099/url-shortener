function success(data, meta = {}) {
    return {
        success: true,
        data,
        ...(Object.keys(meta).length && { meta })
    };
}

function error(message, code = null) {
    return {
        success: false,
        error: message,
        ...(code && { code })
    };
}

module.exports = { success, error };