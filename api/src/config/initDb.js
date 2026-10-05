import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Group from '../models/group.model.js';
import logger from './logger.js';

export const initDatabase = async () => {
  try {
    // Check if database has any collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    if (collections.length === 0) {
      logger.info('Initializing database with sample data...');

      // Create sample users
      const sampleUsers = [
        {
          username: 'manager1',
          email: 'manager@example.com',
          password: 'password123',
          firstName: 'کاربر',
          lastName: 'مدیر',
          role: 'manager',
          isActive: true,
        },
        {
          username: 'employee1',
          email: 'employee1@example.com',
          password: 'password123',
          firstName: 'امین',
          lastName: 'کارگر',
          role: 'user',
          isActive: true,
        },
        {
          username: 'employee2',
          email: 'employee2@example.com',
          password: 'password123',
          firstName: 'Fatemeh',
          lastName: 'عامل',
          role: 'user',
          isActive: true,
        },
      ];

      await User.insertMany(sampleUsers);
      logger.info('Sample users created');

      // Get users for group creation
      const users = await User.find();
      const manager = users[0];
      const employees = users.slice(1);

      // Create sample groups
      const sampleGroups = [
        {
          name: 'گروه توسعه نرم‌افزار',
          description: 'گروه توسعه‌دهندگان نرم‌افزار',
          rate: 150000, // 150,000 IRR per hour
          currency: 'IRR',
          manager: manager._id,
          members: [manager._id, employees[0]._id],
        },
        {
          name: 'گروه طراحی گرافیک',
          description: 'گروه طراحان گرافیک',
          rate: 120000, // 120,000 IRR per hour
          currency: 'IRR',
          manager: manager._id,
          members: [manager._id, employees[1]._id],
        },
        {
          name: 'گروه آزمایش',
          description: 'گروه آزمایشی برای کاربران آزمایشی',
          rate: 100000, // 100,000 IRR per hour
          currency: 'IRR',
          manager: manager._id,
          members: [employees[0]._id, employees[1]._id],
        },
      ];

      await Group.insertMany(sampleGroups);
      logger.info('Sample groups created');

      logger.info('Database initialization completed successfully');
    } else {
      logger.info('Database already initialized');
    }
  } catch (error) {
    logger.error('Error initializing database', { error: error.message });
    throw error;
  }
};

export default initDatabase;