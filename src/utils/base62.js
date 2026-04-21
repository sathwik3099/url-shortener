const CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = 62;

function encode(num) {
    if (num === 0) return "0";

    let str = "";

    while (num > 0) {
        const remainder = num % BASE;
        str = CHARSET[remainder] + str;
        num = Math.floor(num / BASE);
    }

    return str;
}

// 🔹 Optional: decode (useful for debugging / future features)
function decode(str) {
    let num = 0;

    for (let i = 0; i < str.length; i++) {
        num = num * BASE + CHARSET.indexOf(str[i]);
    }

    return num;
}

module.exports = { encode, decode };