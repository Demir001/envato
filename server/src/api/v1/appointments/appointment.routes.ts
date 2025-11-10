import { Router } from 'express';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment,
} from './appointment.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import {
  appointmentIdSchema,
  createAppointmentSchema,
  listAppointmentsSchema,
  updateAppointmentSchema,
} from './appointment.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation) to all routes
router.use(protect, checkTenant);

// All roles (admin, doctor, reception) can view the calendar and appointment details
const viewRoles = ['admin', 'doctor', 'reception'];
// Only admin and reception can create, update, or delete appointments
const manageRoles = ['admin', 'reception'];

/**
 * @route   GET /api/v1/appointments
 * @desc    List appointments for the calendar (FullCalendar)
 * @access  Private (Admin, Doctor, Reception)
 */
router.get(
  '/',
  authorize(...viewRoles),
  validateRequest(listAppointmentsSchema),
  listAppointments,
);

/**
 * @route   POST /api/v1/appointments
 * @desc    Create a new appointment
 * @access  Private (Admin, Reception)
 */
router.post(
  '/',
  authorize(...manageRoles),
  validateRequest(createAppointmentSchema),
  createAppointment,
);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get a single appointment by ID
 * @access  Private (Admin, Doctor, Reception)
 */
router.get(
  '/:id',
  authorize(...viewRoles),
  validateRequest(appointmentIdSchema),
  getAppointmentById,
);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    Update an appointment (drag-drop, status change)
 * @access  Private (Admin, Reception)
 */
router.put(
  '/:id',
  authorize(...manageRoles),
  validateRequest(updateAppointmentSchema),
  updateAppointment,
);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    Delete (cancel) an appointment
 * @access  Private (Admin, Reception)
 * @note    We might just set status to 'cancelled' instead of hard delete,
 * but for this API, DELETE means hard delete.
 */
router.delete(
  '/:id',
  authorize(...manageRoles),
  validateRequest(appointmentIdSchema),
  deleteAppointment,
);

export default router;