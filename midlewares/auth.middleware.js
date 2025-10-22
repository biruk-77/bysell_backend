// We need the jsonwebtoken library to verify the token
const jwt = require('jsonwebtoken');

// Middleware is a function that runs between the request and the controller.
// It has access to the request (req), the response (res), and the 'next' function.
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get the full Authorization header from the incoming request.
        const authHeader = req.headers['authorization'];

        // 2. Check if the header exists and if it follows the "Bearer <token>" format.
        //    If not, the user is unauthorized.
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided or token is malformed.' });
        }

        // 3. Extract ONLY the token part.
        //    'authHeader.split(' ')' splits the string "Bearer eyJ..." into an array: ['Bearer', 'eyJ...']
        //    '[1]' gets the second item from that array, which is the actual token.
        const token = authHeader.split(' ')[1];

        // 4. Verify the token. 'jwt.verify' will check the signature and expiration date.
        //    If it's invalid, it will throw an error, and our code will jump to the 'catch' block.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. IMPORTANT: Attach the decoded payload (the user's ID, role, etc.) to the request object.
        //    Now, any future function that handles this request can access 'req.user' to see who is logged in.
        req.user = decoded;

        // 6. If everything is valid, call 'next()' to pass control to the next function in the chain (our controller).
        next();

    } catch (error) {
        // This block runs if jwt.verify() fails (e.g., token is expired or signature is invalid).
        console.error('Authentication error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;