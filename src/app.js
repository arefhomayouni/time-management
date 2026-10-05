import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { catchError } from 'vanta-api';
import userRoutes from './routes/userRoutes.js';
import timeRoutes from './routes/timeRoutes.js';
import groupRoutes from './routes/groupRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/groups', groupRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Time Management API is running...');
});

// Global Error Handler from Vanta API
app.use(catchError);

export default app;
