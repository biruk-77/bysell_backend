const { DataTypes } = require('sequelize');
const sequelize = require('../core/config/db');

const Profile = sequelize.define('Profile', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    skills: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    experience: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    profileImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'default_avatar_url.png'
    },
    company: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Company name for employers'
    },
    jobTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Current job title'
    },
    education: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Educational background (JSON string)'
    },
    certifications: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Professional certifications (JSON string)'
    },
    portfolio: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Portfolio links (JSON string)'
    },
    languages: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Languages spoken (JSON string)'
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    maritalStatus: {
        type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'),
        allowNull: true,
        comment: 'For matchmaking purposes'
    },
    religion: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Religious preference for matchmaking'
    },
    ethnicity: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ethnic background for matchmaking'
    },
    profession: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Current profession'
    },
    interests: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Personal interests and hobbies (JSON string)'
    },
    businessLicense: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Business license document URL for sellers/service providers'
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Personal or business website'
    },
    socialMedia: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Social media links (JSON string)'
    },
    averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Average rating from reviews'
    },
    totalReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total number of reviews received'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether profile is verified by admin'
    },
    verificationDocuments: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URLs to verification documents (JSON string)'
    }
}, {
    tableName: 'profiles',
    timestamps: true,
});

module.exports = Profile;
