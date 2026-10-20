import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { catchError } from 'vanta-api';
import userRoutes from './routes/userRoutes.js';
import timeRoutes from './routes/timeRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';

dotenv.config();

const app = express();

// Enable CORS for frontend access
app.use(cors());

app.use(express.json());

// Swagger Documentation with Great UI
const swaggerOptions = {
  customCss: `
    body { background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .swagger-ui .topbar { background-color: #2c3e50; color: #fff; }
    .swagger-ui .info .title { color: #2c3e50; font-weight: bold; }
    .swagger-ui .opblock { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 15px; }
    .swagger-ui .opblock-summary-method { border-radius: 4px; font-weight: bold; }
    .swagger-ui .opblock-summary-description { font-size: 14px; }
    .swagger-ui .opblock-summary-tag { background: #3498db; color: white; border-radius: 4px; padding: 2px 8px; }
    .swagger-ui .btn-execute { background-color: #27ae60; color: white; border-radius: 4px; border: none; }
    .swagger-ui .btn-execute:hover { background-color: #2ecc71; }
  `,
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    bufferTimeoutMS: 120000, // 120 seconds
    serverSelectionTimeoutMS: 60000, // 60 seconds
    connectTimeoutMS: 60000, // 60 seconds
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) =>
    console.error("MongoDB connection error:", err)
  );
// Routes
app.use('/api/users', userRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/search', searchRoutes);
app.get('/health', (req, res) => {

  res.status(200).json({message: 
    'Time Management API is running...',
  lastUpdate:"15:35"});
});
// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Time Management API is running...');
});

// Global Error Handler from Vanta API
app.use(catchError);

export default app;
