// test-project/utils/logger.js
// Enhanced comprehensive logger that tells EVERYTHING
let requestCount = 0;

// Helper function to safely stringify objects
const safeStringify = (obj, maxLength = 500) => {
    try {
        const str = JSON.stringify(obj, null, 2);
        return str.length > maxLength ? str.substring(0, maxLength) + '...[truncated]' : str;
    } catch (e) {
        return '[Unable to stringify]';
    }
};

// Get real client IP address
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'Unknown IP';
};

// Get human-readable status messages
const getStatusMessage = (code) => {
    const statusMessages = {
        200: 'OK', 201: 'Created', 204: 'No Content',
        301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
        400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
        500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable'
    };
    return statusMessages[code] || 'Unknown Status';
};

// This logger tells you EVERYTHING that's happening
const logger = (req, res, next) => {
    // --- 📥 INCOMING REQUEST - TELL EVERYTHING ---
    requestCount++;
    const startTime = process.hrtime();
    const timestamp = new Date().toISOString();
    const { method, url, headers, query, body, params } = req;
    const requestId = requestCount;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    const contentType = req.headers['content-type'] || 'Not specified';
    const contentLength = req.headers['content-length'] || '0';
    const protocol = req.protocol || 'unknown';
    const hostname = req.hostname || req.headers['host'] || 'unknown';
    
    console.log(`\n🚀 ========== [Request #${requestId}] INCOMING REQUEST ========== 🚀`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`🌐 ${method} ${protocol.toUpperCase()}://${hostname}${url}`);
    console.log(`🎯 ENDPOINT: ${method} ${req.originalUrl || url}`);
    console.log(`🛤️  BASE URL: ${req.baseUrl || 'Not set'}`);
    console.log(`📂 PATH: ${req.path || url}`);
    console.log(`🔧 ROUTE MATCHED: ${req.route ? req.route.path : 'No specific route'}`);
    console.log(`📍 Client IP: ${clientIP}`);
    console.log(`🖥️  User Agent: ${userAgent}`);
    console.log(`🔗 Referer: ${referer}`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log(`📦 Content-Length: ${contentLength} bytes`);
    
    // Tell everything about query parameters
    if (query && Object.keys(query).length > 0) {
        console.log(`🔍 Query Parameters:`);
        console.log(safeStringify(query));
    } else {
        console.log(`🔍 Query Parameters: None`);
    }
    
    // Tell everything about URL parameters
    if (params && Object.keys(params).length > 0) {
        console.log(`🎯 URL Parameters:`);
        console.log(safeStringify(params));
    }
    
    // Tell everything about request body
    if (body && Object.keys(body).length > 0) {
        console.log(`📝 Request Body:`);
        console.log(safeStringify(body));
    } else {
        console.log(`📝 Request Body: Empty`);
    }
    
    // Tell everything about headers (hiding sensitive ones)
    console.log(`📋 Request Headers:`);
    const safeHeaders = { ...headers };
    ['authorization', 'cookie', 'x-api-key', 'x-auth-token'].forEach(header => {
        if (safeHeaders[header]) {
            safeHeaders[header] = '[HIDDEN FOR SECURITY]';
        }
    });
    console.log(safeStringify(safeHeaders));
    
    // Tell everything about session
    if (req.session) {
        console.log(`🎫 Session Info: Available (ID: ${req.session.id || 'No ID'})`);
    } else {
        console.log(`🎫 Session Info: Not available`);
    }
    
    // Tell everything about cookies
    if (req.cookies && Object.keys(req.cookies).length > 0) {
        console.log(`🍪 Cookies: ${Object.keys(req.cookies).length} found`);
        console.log(safeStringify(req.cookies));
    } else {
        console.log(`🍪 Cookies: None`);
    }
    
    // Tell everything about the endpoint being hit
    console.log(`🎯 ========== ENDPOINT ANALYSIS ==========`);
    
    console.log(` ========== REQUEST #${requestId} PROCESSING... ========== `);
    
    // --- OUTGOING RESPONSE - TELL EVERYTHING ---
    // Capture response body
    let responseBody = '';
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Override send method to capture response
    res.send = function(body) {
        responseBody = typeof body === 'object' ? JSON.stringify(body) : body;
        return originalSend.call(this, body);
    };
    
    // Override json method to capture response
    res.json = function(body) {
        responseBody = JSON.stringify(body);
        return originalJson.call(this, body);
    };
    
    // Override end method to capture response
    res.end = function(chunk, encoding) {
        if (chunk && !responseBody) {
            responseBody = typeof chunk === 'object' ? JSON.stringify(chunk) : chunk;
        }
        return originalEnd.call(this, chunk, encoding);
    };
    
    res.on('finish', () => {
        const endTime = process.hrtime(startTime);
        const duration = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2);
        const { statusCode } = res;
        const statusEmoji = statusCode >= 500 ? '💥' : 
                           statusCode >= 400 ? '❌' : 
                           statusCode >= 300 ? '🔄' : '✅';
        const responseSize = res.get('content-length') || 'Unknown';
        const responseType = res.get('content-type') || 'Not specified';
        const endTimestamp = new Date().toISOString();
        
        // Tell everything about performance
        const timeCategory = duration < 100 ? '🚀 Lightning Fast' :
                           duration < 500 ? '⚡ Fast' :
                           duration < 1000 ? '🐢 Slow' :
                           duration < 5000 ? '🐌 Very Slow' : '💀 Extremely Slow';
        
        console.log(`\n🏁 ========== [Request #${requestId}] RESPONSE COMPLETE ========== 🏁`);
        console.log(`⏰ End Timestamp: ${endTimestamp}`);
        console.log(`${statusEmoji} Status Code: ${statusCode} (${getStatusMessage(statusCode)})`);
        console.log(`⏱️  Duration: ${duration}ms (${timeCategory})`);
        console.log(`📊 Response Size: ${responseSize} bytes`);
        console.log(`📄 Response Type: ${responseType}`);
        
        // Tell everything about the response body
        console.log(`📝 ========== RESPONSE BODY ==========`);
        if (responseBody) {
            try {
                // Try to parse as JSON for better formatting
                const parsedBody = JSON.parse(responseBody);
                console.log(`📋 Response Body (JSON):`);
                console.log(safeStringify(parsedBody, 1000));
            } catch (e) {
                // Not JSON, show as text
                console.log(`📄 Response Body (Text):`);
                const truncatedBody = responseBody.length > 1000 ? 
                    responseBody.substring(0, 1000) + '...[truncated]' : responseBody;
                console.log(truncatedBody);
            }
        } else {
            console.log(` Response Body: Empty or not captured`);
        }
        
        // Tell everything about what endpoint was processed
        console.log(` ========== ENDPOINT PROCESSING COMPLETE ==========`);
        console.log(` You are hitting: ${method} ${req.originalUrl || url}`);
        console.log(`  Route pattern: ${req.route ? req.route.path : 'Dynamic/No pattern'}`);
        console.log(`  Full request URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
        
        console.log(` ========== REQUEST #${requestId} PROCESSING... ========== `);

        // Tell everything about response headers
        const responseHeaders = res.getHeaders();
        if (Object.keys(responseHeaders).length > 0) {
            console.log(` Response Headers:`);
            console.log(safeStringify(responseHeaders));
        }
        
        // Tell everything about system performance
        const memoryUsage = process.memoryUsage();
        console.log(`💾 Memory Usage: RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        
        console.log(`🏁 ========== REQUEST #${requestId} FINISHED ========== 🏁`);
        console.log(`${'='.repeat(60)}\n`);
    });
    
    // --- PASS IT ON ---
    next();
};

module.exports = logger;
