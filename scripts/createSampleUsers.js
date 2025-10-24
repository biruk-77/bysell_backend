// test-project/scripts/createSampleUsers.js
// Script to create sample users for testing connections
const { User, Profile } = require('../models');
const bcrypt = require('bcryptjs');

const sampleUsers = [
  {
    username: 'john_developer',
    email: 'john@example.com',
    password: 'password123',
    role: 'employee',
    location: 'New York',
    status: 'active',
    profile: {
      bio: 'Full-stack developer with 5 years experience in React and Node.js',
      skills: 'JavaScript, React, Node.js, Python, SQL',
      experience: '5 years',
      location: 'New York, NY'
    }
  },
  {
    username: 'sarah_designer',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'employee',
    location: 'Los Angeles',
    status: 'active',
    profile: {
      bio: 'Creative UI/UX designer passionate about user-centered design',
      skills: 'Figma, Adobe Creative Suite, UI/UX, Prototyping',
      experience: '3 years',
      location: 'Los Angeles, CA'
    }
  },
  {
    username: 'mike_manager',
    email: 'mike@example.com',
    password: 'password123',
    role: 'employer',
    location: 'Chicago',
    status: 'active',
    profile: {
      bio: 'Tech startup founder looking for talented developers',
      skills: 'Leadership, Product Management, Strategy',
      experience: '8 years',
      location: 'Chicago, IL'
    }
  },
  {
    username: 'lisa_consultant',
    email: 'lisa@example.com',
    password: 'password123',
    role: 'connector',
    location: 'Boston',
    status: 'active',
    profile: {
      bio: 'Business consultant specializing in tech recruitment',
      skills: 'Business Development, Networking, Consulting',
      experience: '6 years',
      location: 'Boston, MA'
    }
  },
  {
    username: 'david_seller',
    email: 'david@example.com',
    password: 'password123',
    role: 'seller',
    location: 'Seattle',
    status: 'active',
    profile: {
      bio: 'E-commerce specialist selling tech gadgets and accessories',
      skills: 'E-commerce, Digital Marketing, Sales',
      experience: '4 years',
      location: 'Seattle, WA'
    }
  },
  {
    username: 'anna_buyer',
    email: 'anna@example.com',
    password: 'password123',
    role: 'buyer',
    location: 'Miami',
    status: 'active',
    profile: {
      bio: 'Procurement manager for tech startups',
      skills: 'Procurement, Vendor Management, Negotiation',
      experience: '7 years',
      location: 'Miami, FL'
    }
  },
  {
    username: 'alex_freelancer',
    email: 'alex@example.com',
    password: 'password123',
    role: 'employee',
    location: 'Austin',
    status: 'active',
    profile: {
      bio: 'Freelance web developer and content creator',
      skills: 'Web Development, Content Creation, SEO',
      experience: '2 years',
      location: 'Austin, TX'
    }
  },
  {
    username: 'emma_recruiter',
    email: 'emma@example.com',
    password: 'password123',
    role: 'employer',
    location: 'San Francisco',
    status: 'active',
    profile: {
      bio: 'Tech recruiter at leading Silicon Valley companies',
      skills: 'Talent Acquisition, HR, Interview Process',
      experience: '5 years',
      location: 'San Francisco, CA'
    }
  }
];

async function createSampleUsers() {
  try {
    console.log('🚀 Starting to create sample users...');
    
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        where: { email: userData.email } 
      });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        location: userData.location,
        status: userData.status,
        isEmailVerified: true,
        lastLogin: new Date()
      });
      
      // Create profile
      await Profile.create({
        userId: user.id,
        bio: userData.profile.bio,
        skills: userData.profile.skills,
        experience: userData.profile.experience,
        location: userData.profile.location
      });
      
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }
    
    console.log('🎉 Sample users created successfully!');
    console.log('\n📋 You can now test connections with these users:');
    sampleUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.email}`);
    });
    console.log('\n🔑 All users have password: password123');
    
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createSampleUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createSampleUsers, sampleUsers };
