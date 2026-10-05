import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { catchError } from 'vanta-api';
import userRoutes from './routes/userRoutes.js';
import timeRoutes from './routes/timeRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';

dotenv.config();

const app = express();

app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Time Management API is running...');
});

// Global Error Handler from Vanta API
app.use(catchError);

export default app;
