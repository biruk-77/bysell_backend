const { Profile } = require('../../models');

class ProfileService {
    // Get profile by user ID
    async getProfileByUserId(userId) {
        return await Profile.findOne({ userId }).populate('userId', 'email username');
    }

    // Create or update profile
    async createOrUpdateProfile(userId, profileData) {
        let profile = await Profile.findOne({ userId });
        
        if (profile) {
            // Update existing profile
            profile = await Profile.findOneAndUpdate(
                { userId },
                profileData,
                { new: true, runValidators: true }
            ).populate('userId', 'email username');
            
            // Profile updated
        } else {
            // Create new profile
            profile = await Profile.create({
                userId,
                ...profileData
            });
            
            profile = await Profile.findById(profile._id).populate('userId', 'email username');
            // Profile created
        }

        return profile;
    }

    // Delete profile
    async deleteProfile(userId) {
        const profile = await Profile.findOneAndDelete({ userId });
        if (profile) {
            // Profile deleted
        }
        return profile;
    }

    // Search profiles
    async searchProfiles(searchQuery, limit = 10, skip = 0) {
        const query = {
            $or: [
                { firstName: { $regex: searchQuery, $options: 'i' } },
                { lastName: { $regex: searchQuery, $options: 'i' } },
                { bio: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        return await Profile.find(query)
            .populate('userId', 'email username')
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
    }
}

module.exports = new ProfileService();
