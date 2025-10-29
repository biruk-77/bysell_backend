// Ethiopian phone number validation and normalization utility

function isValidPhone(input) {
    if (!input || typeof input !== 'string') return false;
    
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Check various Ethiopian phone formats
    const patterns = [
        /^09\d{8}$/,        // 09XXXXXXXX (10 digits)
        /^07\d{8}$/,        // 07XXXXXXXX (10 digits)
        /^2519\d{8}$/,      // 2519XXXXXXXX (12 digits)
        /^2517\d{8}$/,      // 2517XXXXXXXX (12 digits)
        /^9\d{8}$/,         // 9XXXXXXXX (9 digits)
        /^7\d{8}$/          // 7XXXXXXXX (9 digits)
    ];
    
    return patterns.some(pattern => pattern.test(digits));
}

function normalizePhone(input) {
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid phone number input');
    }
    
    // Remove all non-digits
    let digits = input.replace(/\D/g, '');
    
    // Handle different Ethiopian phone formats and convert to E.164 (+251XXXXXXXXX)
    if (digits.length === 13 && digits.startsWith('2510')) {
        // Fix: +2510989271027 → remove the extra 0 → +251989271027
        digits = '251' + digits.slice(4);
    } else if (digits.length === 10 && (digits.startsWith('09') || digits.startsWith('07'))) {
        // 09XXXXXXXX → +2519XXXXXXXX
        digits = '251' + digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('251')) {
        // Already in correct format: 251XXXXXXXXX
        // Keep as is
    } else if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('7'))) {
        // 9XXXXXXXX → +2519XXXXXXXX
        digits = '251' + digits;
    } else {
        throw new Error('Invalid Ethiopian phone number format');
    }
    
    // Validate final format (should be 12 digits starting with 251)
    if (digits.length !== 12 || !digits.startsWith('251')) {
        throw new Error('Failed to normalize phone number to valid Ethiopian format');
    }
    
    return '+' + digits;
}

module.exports = {
    isValidPhone,
    normalizePhone
};
