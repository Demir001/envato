import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { initDb } from './config/database';
import { notFound, errorHandler } from './middleware/errorHandler';
import apiV1 from './api';

// Load environment variables
dotenv.config();

// Initialize Database
try {
  initDb();
  console.log('Database initialized successfully.');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1); // Exit if DB connection fails
}

const app: Express = express();
const PORT = process.env.PORT || 5001;

// --- Core Middlewares ---

// Enable CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'YOUR_PRODUCTION_DOMAIN_HERE' // TODO: Update for production
        : 'http://localhost:3000', // Allow dev frontend
    credentials: true,
  }),
);

// Secure HTTP headers
app.use(helmet());

// JSON body parser
app.use(express.json());

// URL-encoded body parser
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- API Routes ---
app.use('/api/v1', apiV1);

// --- Static Assets (if needed) ---
// In production, frontend is served by Nginx, but this can be useful.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Default/Test Route ---
app.get('/', (_req: Request, res: Response) => {
  res.send('ClinicAdmin API is running...');
});

// --- Error Handling Middlewares ---
// 404 Not Found handler
app.use(notFound);
// Global error handler (must be last)
app.use(errorHandler);

// --- Start Server ---
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app; // Export for testing