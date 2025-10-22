// This variable will act as our request counter.
let requestCount = 0;

// This is our logger middleware function.
const logger = (req, res, next) => {
    // --- 📥 INCOMING REQUEST LOGIC ---
    requestCount++;
    const startTime = process.hrtime();
    const { method, url } = req;
    const requestId = requestCount;

    console.log(`\n🚀 [Request #${requestId}] - Incoming Request`);
    console.log(`➡️  ${method} ${url}`);
    
    // --- 📤 OUTGOING RESPONSE LOGIC ---
    res.on('finish', () => {
        const duration = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1e6).toFixed(2);
        const { statusCode } = res;
        const statusEmoji = statusCode >= 400 ? '❌' : '✅';

        console.log(`\n🏁 [Request #${requestId}] - Response Sent`);
        console.log(`${statusEmoji}  Status: ${statusCode}`);
        console.log(`⏱️   Duration: ${duration}ms`);
        console.log('-----------------------------------------');
    });
    
    // --- PASS IT ON ---
    next();
};

module.exports = logger;