const { Profile, User } = require('../../models');
const { v4: uuidv4 } = require('uuid');

// --- CREATE OR UPDATE A USER'S PROFILE ---
// This single function handles both creating a new profile and updating an existing one.
exports.createOrUpdateProfile = async (req, res) => {
    try {
        // 1. Get the data from the request body and uploaded file.
        const { bio, skills, experience, location } = req.body;
        
        // 2. Handle uploaded file (if any)
        let profileImagePath = null;
        if (req.file) {
            // Generate the URL path for the uploaded file
            profileImagePath = `/uploads/profile-images/${req.file.filename}`;
            console.log('📸 Profile image uploaded:', profileImagePath);
        }

        // 2. Get the logged-in user's ID from the 'req.user' object,
        //    which was attached by our authMiddleware. This is secure.
        const userId = req.user.id;

        // 3. Prepare the data object with the fields we want to save.
        const profileData = {
            userId: userId, // Ensure the profile is linked to the correct user
            bio,
            skills,
            experience,
            location
        };
        
        // Only update profileImage if a new file was uploaded
        if (profileImagePath) {
            profileData.profileImage = profileImagePath;
        }
        
        // 4. Look for an existing profile for this user.
        let profile = await Profile.findOne({ where: { userId } });

        if (profile) {
            // If a profile exists, UPDATE it.
            // The 'await profile.update()' command saves the changes to the database.
            profile = await profile.update(profileData);
            console.log('✅ Profile Updated');
        } else {
            // If no profile exists, CREATE a new one.
            // Generate a UUID for the profile ID since database expects CHAR(36)
            profileData.id = uuidv4();
            // The 'await Profile.create()' command creates and saves a new row in the 'profiles' table.
            profile = await Profile.create(profileData);
            console.log('✨ Profile Created');
        }

        // 5. Send a success response with the newly created or updated profile data.
        res.status(200).json({
            message: "Profile saved successfully!2",
            profile: profile
        });

    } catch (error) {
        console.error("Profile Save Error:", error);
        res.status(500).json({ message: "Something went wrong on our end." });
    }
};

// --- GET THE LOGGED-IN USER'S PROFILE ---
exports.getMyProfile = async (req, res) => {
    try {
        // 1. Get the logged-in user's ID from our secure middleware.
        const userId = req.user.id;

        // 2. Find the profile associated with that userId.
        //    We also use 'include' to fetch the associated User's data (like their username and email)
        //    in a single, efficient database query. This is the power of relationships!
        const profile = await Profile.findOne({
            where: { userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'email', 'role'] // Only include these safe fields
            }]
        });

        // 3. If no profile has been created yet for this user, send a helpful message.
        if (!profile) {
            return res.status(404).json({ 
                message: 'Profile not found. Please create one.',
                hasProfile: false,
                user: {
                    id: userId,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role
                }
            });
        }

        // 4. Send the found profile back to the user with enhanced response format.
        res.status(200).json({
            message: 'Profile retrieved successfully',
            hasProfile: true,
            profile: {
                id: profile.id,
                userId: profile.userId,
                bio: profile.bio,
                skills: profile.skills,
                experience: profile.experience,
                location: profile.location,
                profileImage: profile.profileImage,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
                user: profile.user
            }
        });

    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Something went wrong on our end." });
    }
};

// --- UPDATE EXISTING PROFILE (PUT METHOD) ---
exports.updateProfile = async (req, res) => {
    try {
        // 1. Get the data from the request body and uploaded file.
        const { bio, skills, experience, location } = req.body;
        
        // 2. Handle uploaded file (if any)
        let profileImagePath = null;
        if (req.file) {
            // Generate the URL path for the uploaded file
            profileImagePath = `/uploads/profile-images/${req.file.filename}`;
            console.log('📸 Profile image uploaded:', profileImagePath);
        }

        // 3. Get the logged-in user's ID from the 'req.user' object
        const userId = req.user.id;

        // 4. Find existing profile (required for PUT)
        let profile = await Profile.findOne({ where: { userId } });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found. Please create a profile first using POST /api/profile",
                hasProfile: false
            });
        }

        // 5. Prepare the update data object
        const updateData = {};
        
        // Only update fields that are provided
        if (bio !== undefined) updateData.bio = bio;
        if (skills !== undefined) updateData.skills = skills;
        if (experience !== undefined) updateData.experience = experience;
        if (location !== undefined) updateData.location = location;
        
        // Only update profileImage if a new file was uploaded
        if (profileImagePath) {
            updateData.profileImage = profileImagePath;
        }

        // 6. Update the profile
        profile = await profile.update(updateData);
        console.log('✅ Profile Updated via PUT');

        // 7. Get updated profile with user data
        const updatedProfile = await Profile.findOne({
            where: { userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'email', 'role']
            }]
        });

        // 8. Send success response
        res.status(200).json({
            message: "Profile updated successfully!",
            profile: {
                id: updatedProfile.id,
                userId: updatedProfile.userId,
                bio: updatedProfile.bio,
                skills: updatedProfile.skills,
                experience: updatedProfile.experience,
                location: updatedProfile.location,
                profileImage: updatedProfile.profileImage,
                createdAt: updatedProfile.createdAt,
                updatedAt: updatedProfile.updatedAt,
                user: updatedProfile.user
            }
        });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: "Something went wrong during profile update." });
    }
};

// --- UPLOAD PROFILE IMAGE ONLY ---
exports.uploadProfileImage = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No image file uploaded. Please select an image.' 
            });
        }

        const userId = req.user.id;
        const profileImagePath = `/uploads/profile-images/${req.file.filename}`;

        // Find existing profile
        let profile = await Profile.findOne({ where: { userId } });

        if (profile) {
            // Update existing profile with new image
            profile = await profile.update({ profileImage: profileImagePath });
        } else {
            // Create new profile with just the image
            const profileData = {
                id: uuidv4(),
                userId: userId,
                profileImage: profileImagePath
            };
            profile = await Profile.create(profileData);
        }

        res.status(200).json({
            message: "Profile image uploaded successfully!",
            profileImage: profileImagePath,
            profile: profile
        });

    } catch (error) {
        console.error("Profile Image Upload Error:", error);
        res.status(500).json({ message: "Something went wrong during image upload." });
    }
};
