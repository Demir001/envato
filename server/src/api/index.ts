import { Router, Request, Response } from 'express';
import authRoutes from './v1/auth/auth.routes';
import patientRoutes from './v1/patients/patient.routes';
import appointmentRoutes from './v1/appointments/appointment.routes';
import userRoutes from './v1/users/user.routes';
import billingRoutes from './v1/billing/billing.routes';
import inventoryRoutes from './v1/inventory/inventory.routes';
import dashboardRoutes from './v1/dashboard/dashboard.routes';
import settingsRoutes from './v1/settings/settings.routes';

const router = Router();

// --- Health Check ---
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- V1 Routes ---
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/users', userRoutes);
router.use('/billing', billingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export default router;