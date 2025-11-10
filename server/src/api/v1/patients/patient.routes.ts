import { Router } from 'express';
import {
  createPatient,
  deletePatient,
  getPatientById,
  listPatients,
  updatePatient,
} from './patient.controller';
import {
  protect,
  authorize,
  checkTenant,
} from '../../../middleware/authMiddleware';
import { validateRequest } from '../../../middleware/validationMiddleware';
import {
  createPatientSchema,
  listPatientsSchema,
  patientIdSchema,
  updatePatientSchema,
} from './patient.validation';

const router = Router();

// Apply 'protect' (authentication) and 'checkTenant' (isolation) to all patient routes
router.use(protect, checkTenant);

/**
 * @route   GET /api/v1/patients
 * @desc    List and search patients (paginated)
 * @access  Private (Admin, Doctor, Reception)
 */
router.get(
  '/',
  authorize('admin', 'doctor', 'reception'),
  validateRequest(listPatientsSchema),
  listPatients,
);

/**
 * @route   POST /api/v1/patients
 * @desc    Create a new patient
 * @access  Private (Admin, Reception)
 */
router.post(
  '/',
  authorize('admin', 'reception'),
  validateRequest(createPatientSchema),
  createPatient,
);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    Get a single patient by ID
 * @access  Private (Admin, Doctor, Reception)
 */
router.get(
  '/:id',
  authorize('admin', 'doctor', 'reception'),
  validateRequest(patientIdSchema),
  getPatientById,
);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    Update a patient
 * @access  Private (Admin, Reception)
 */
router.put(
  '/:id',
  authorize('admin', 'reception'),
  validateRequest(updatePatientSchema),
  updatePatient,
);

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    Delete a patient
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authorize('admin'),
  validateRequest(patientIdSchema),
  deletePatient,
);

export default router;