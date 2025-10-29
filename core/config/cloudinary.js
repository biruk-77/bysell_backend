const safeRequire = (p) => { try { return require(p); } catch (e) { return undefined; } };

module.exports = safeRequire('../../../config/cloudinary') || {};
