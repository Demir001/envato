import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { PatientService } from './patient.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import {
  CreatePatientInput,
  ListPatientsQueryInput,
  UpdatePatientInput,
} from './patient.validation';

/**
 * @desc    List and search patients (paginated)
 * @route   GET /api/v1/patients
 * @access  Private (Admin, Doctor, Reception)
 */
export const listPatients = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const query = req.query as unknown as ListPatientsQueryInput;

    const result = await PatientService.list(tenantId, query);
    ApiResponse.ok(res, 'Patients fetched successfully', result);
  },
);

/**
 * @desc    Create a new patient
 * @route   POST /api/v1/patients
 * @access  Private (Admin, Reception)
 */
export const createPatient = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const patientData = req.body as CreatePatientInput;

    const newPatient = await PatientService.create(tenantId, patientData);
    ApiResponse.created(res, 'Patient created successfully', newPatient);
  },
);

/**
 * @desc    Get a single patient by ID
 * @route   GET /api/v1/patients/:id
 * @access  Private (Admin, Doctor, Reception)
 */
export const getPatientById = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const patientId = parseInt(req.params.id, 10);

    const patient = await PatientService.getById(tenantId, patientId);
    ApiResponse.ok(res, 'Patient fetched successfully', patient);
  },
);

/**
 * @desc    Update a patient
 * @route   PUT /api/v1/patients/:id
 * @access  Private (Admin, Reception)
 */
export const updatePatient = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const patientId = parseInt(req.params.id, 10);
    const patientData = req.body as UpdatePatientInput;

    const updatedPatient = await PatientService.update(
      tenantId,
      patientId,
      patientData,
    );
    ApiResponse.ok(res, 'Patient updated successfully', updatedPatient);
  },
);

/**
 * @desc    Delete a patient
 * @route   DELETE /api/v1/patients/:id
 * @access  Private (Admin)
 */
export const deletePatient = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const patientId = parseInt(req.params.id, 10);

    await PatientService.delete(tenantId, patientId);
    // Use 200 OK with a message instead of 204 No Content
    // to provide confirmation feedback to the user.
    ApiResponse.ok(res, 'Patient deleted successfully', { id: patientId });
  },
);