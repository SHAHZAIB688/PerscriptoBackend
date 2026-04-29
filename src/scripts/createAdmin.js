require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin!@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin!@gmail.com',
      phone: '0000000000',
      password: 'admin!123',
      role: 'admin',
      status: 'approved'
    });

    console.log('Admin user created successfully:', admin.email);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
