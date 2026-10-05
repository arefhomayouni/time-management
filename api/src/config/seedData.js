import User from '../models/user.model.js';
import Group from '../models/group.model.js';
import TimeEntry from '../models/timeEntry.model.js';
import Payment from '../models/payment.model.js';
import logger from './logger.js';

export const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Group.deleteMany();
    await TimeEntry.deleteMany();
    await Payment.deleteMany();
    logger.info('Cleared existing data');

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
      {
        username: 'employee3',
        email: 'employee3@example.com',
        password: 'password123',
        firstName: 'علی',
        lastName: 'تکنسینگ',
        role: 'user',
        isActive: true,
      },
      {
        username: 'employee4',
        email: 'employee4@example.com',
        password: 'password123',
        firstName: 'سارا',
        lastName: 'طراح',
        role: 'user',
        isActive: true,
      },
    ];

    const users = await User.insertMany(sampleUsers);
    logger.info('Created sample users');

    // Create sample groups
    const sampleGroups = [
      {
        name: 'گروه توسعه نرم‌افزار',
        description: 'گروه توسعه‌دهندگان نرم‌افزار',
        rate: 150000, // 150,000 IRR per hour
        currency: 'IRR',
        manager: users[0]._id,
        members: [users[0]._id, users[1]._id, users[3]._id],
      },
      {
        name: 'گروه طراحی گرافیک',
        description: 'گروه طراحان گرافیک',
        rate: 120000, // 120,000 IRR per hour
        currency: 'IRR',
        manager: users[0]._id,
        members: [users[0]._id, users[2]._id, users[4]._id],
      },
      {
        name: 'گروه آزمایش',
        description: 'گروه آزمایشی برای کاربران آزمایشی',
        rate: 100000, // 100,000 IRR per hour
        currency: 'IRR',
        manager: users[0]._id,
        members: [users[1]._id, users[2]._id],
      },
    ];

    const groups = await Group.insertMany(sampleGroups);
    logger.info('Created sample groups');

    // Create sample time entries
    const timeEntries = [
      // Employee1 - Group Development
      {
        user: users[1]._id,
        date: new Date('2024-09-01T09:00:00.000Z'),
        hours: 8,
        description: 'کار روزانه در گروه توسعه',
        group: groups[0]._id,
        status: 'approved',
        approvedBy: users[0]._id,
        approvalDate: new Date('2024-09-02T10:00:00.000Z'),
      },
      {
        user: users[1]._id,
        date: new Date('2024-09-02T09:00:00.000Z'),
        hours: 7.5,
        description: 'ادامه پروژه‌های جاری',
        group: groups[0]._id,
        status: 'approved',
        approvedBy: users[0]._id,
        approvalDate: new Date('2024-09-03T10:00:00.000Z'),
      },
      // Employee2 - Group Design
      {
        user: users[2]._id,
        date: new Date('2024-09-01T09:30:00.000Z'),
        hours: 8,
        description: 'طراحی پروژه‌های گرافیکی',
        group: groups[1]._id,
        status: 'approved',
        approvedBy: users[0]._id,
        approvalDate: new Date('2024-09-02T10:00:00.000Z'),
      },
      // Employee3 - Group Development
      {
        user: users[3]._id,
        date: new Date('2024-09-01T10:00:00.000Z'),
        hours: 8,
        description: 'آموزش و پشتیبانی کاربران',
        group: groups[0]._id,
        status: 'approved',
        approvedBy: users[0]._id,
        approvalDate: new Date('2024-09-02T10:00:00.000Z'),
      },
      // Employee4 - Group Design
      {
        user: users[4]._id,
        date: new Date('2024-09-01T09:00:00.000Z'),
        hours: 8,
        description: 'آپلود فایل‌های طراحی',
        group: groups[1]._id,
        status: 'approved',
        approvedBy: users[0]._id,
        approvalDate: new Date('2024-09-02T10:00:00.000Z'),
      },
      // Cross-group entry
      {
        user: users[1]._id,
        date: new Date('2024-09-01T14:00:00.000Z'),
        hours: 2,
        description: 'جلسه هماهنگی در گروه آزمایش',
        group: groups[2]._id,
        status: 'approved',
        approvedBy: users[0]._id,
        approvalDate: new Date('2024-09-02T10:00:00.000Z'),
      },
    ];

    await TimeEntry.insertMany(timeEntries);
    logger.info('Created sample time entries');

    // Create sample payments for September 2024
    const payments = [
      {
        user: users[1]._id,
        group: groups[0]._id,
        period: '2024-09',
        totalHours: 15.5, // 8 + 7.5
        rate: 150000,
        basePayment: 2325000, // 15.5 * 150,000
        deductions: 232500, // 10% tax
        finalPayment: 2092500, // 2,325,000 - 232,500
        paymentDate: new Date('2024-10-01T00:00:00.000Z'),
        status: 'paid',
        processedBy: users[0]._id,
        transactionId: 'TXN_202409_001',
      },
      {
        user: users[2]._id,
        group: groups[1]._id,
        period: '2024-09',
        totalHours: 8,
        rate: 120000,
        basePayment: 960000, // 8 * 120,000
        deductions: 96000, // 10% tax
        finalPayment: 864000, // 960,000 - 96,000
        paymentDate: new Date('2024-10-01T00:00:00.000Z'),
        status: 'paid',
        processedBy: users[0]._id,
        transactionId: 'TXN_202409_002',
      },
      {
        user: users[3]._id,
        group: groups[0]._id,
        period: '2024-09',
        totalHours: 8,
        rate: 150000,
        basePayment: 1200000, // 8 * 150,000
        deductions: 120000, // 10% tax
        finalPayment: 1080000, // 1,200,000 - 120,000
        paymentDate: new Date('2024-10-01T00:00:00.000Z'),
        status: 'pending',
        processedBy: users[0]._id,
      },
      {
        user: users[4]._id,
        group: groups[1]._id,
        period: '2024-09',
        totalHours: 8,
        rate: 120000,
        basePayment: 960000, // 8 * 120,000
        deductions: 96000, // 10% tax
        finalPayment: 864000, // 960,000 - 96,000
        paymentDate: new Date('2024-10-01T00:00:00.000Z'),
        status: 'processing',
        processedBy: users[0]._id,
      },
    ];

    await Payment.insertMany(payments);
    logger.info('Created sample payments');

    logger.info('Seed data creation completed successfully');
  } catch (error) {
    logger.error('Error seeding data', { error: error.message });
    throw error;
  }
};

export default seedData;