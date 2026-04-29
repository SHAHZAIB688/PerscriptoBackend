require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/prescripto';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin!@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
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
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    await mongoose.disconnect();
  }
};

createAdmin();
