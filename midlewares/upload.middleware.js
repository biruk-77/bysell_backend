const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profile-images');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: userId_timestamp_uuid.extension
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const uniqueId = uuidv4().split('-')[0]; // First part of UUID
        const extension = path.extname(file.originalname);
        const filename = `${userId}_${timestamp}_${uniqueId}${extension}`;
        
        console.log(`📸 Uploading file: ${filename}`);
        cb(null, filename);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    console.log(`🔍 Checking file type: ${file.mimetype}`);
    
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Middleware for single profile image upload
const uploadProfileImage = upload.single('profileImage');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File too large. Maximum size is 5MB.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                message: 'Unexpected field. Use "profileImage" as field name.' 
            });
        }
    }
    
    if (error && error.message === 'Only image files are allowed!') {
        return res.status(400).json({ 
            message: 'Only image files (JPG, PNG, GIF, etc.) are allowed.' 
        });
    }
    
    // If it's not a multer error, pass it to the next error handler
    if (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ 
            message: 'File upload failed.' 
        });
    }
    
    next();
};

module.exports = {
    uploadProfileImage,
    handleUploadError
};
