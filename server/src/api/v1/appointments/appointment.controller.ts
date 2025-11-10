import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { AppointmentService } from './appointment.service';
import { AuthRequest } from '../../../middleware/authMiddleware';
import { ApiResponse } from '../../../utils/ApiResponse';
import {
  ListAppointmentsQueryInput,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from './appointment.validation';

/**
 * @desc    List appointments for the calendar
 * @route   GET /api/v1/appointments
 * @access  Private (Admin, Doctor, Reception)
 */
export const listAppointments = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const query = req.query as unknown as ListAppointmentsQueryInput;

    const appointments = await AppointmentService.list(tenantId, query);
    ApiResponse.ok(res, 'Appointments fetched successfully', appointments);
  },
);

/**
 * @desc    Create a new appointment
 * @route   POST /api/v1/appointments
 * @access  Private (Admin, Reception)
 */
export const createAppointment = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const receptionistId = req.user!.id; // The user creating the appointment
    const data = req.body as CreateAppointmentInput;

    // --- DÜZELTME BAŞLANGIÇ ---
    // 'data' (req.body) 'notes' veya 'title' için 'undefined' içerebilir.
    // 'ICreateAppointmentPayload' (Adım 32'de düzeltildi) 'string | null' bekler.
    // 'undefined' değerini 'null'a çevirerek tip hatasını (TS2345) düzeltiriz.
    const payload = {
      ...data,
      title: data.title || null, // 'undefined' ise 'null' yap
      notes: data.notes || null, // 'undefined' ise 'null' yap
    };
    // --- DÜZELTME SONU ---

    const newAppointment = await AppointmentService.create(
      tenantId,
      receptionistId,
      payload, // Düzeltilmiş payload'u kullan
    );
    ApiResponse.created(
      res,
      'Appointment created successfully',
      newAppointment,
    );
  },
);

/**
 * @desc    Get a single appointment by ID
 * @route   GET /api/v1/appointments/:id
 * @access  Private (Admin, Doctor, Reception)
 */
export const getAppointmentById = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const appointmentId = parseInt(req.params.id, 10);

    const appointment = await AppointmentService.getById(
      tenantId,
      appointmentId,
    );
    ApiResponse.ok(res, 'Appointment fetched successfully', appointment);
  },
);

/**
 * @desc    Update an appointment (drag-drop, status change)
 * @route   PUT /api/v1/appointments/:id
 * @access  Private (Admin, Reception)
 */
export const updateAppointment = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const appointmentId = parseInt(req.params.id, 10);
    const data = req.body as UpdateAppointmentInput;

    const updatedAppointment = await AppointmentService.update(
      tenantId,
      appointmentId,
      data,
    );
    ApiResponse.ok(res, 'Appointment updated successfully', updatedAppointment);
  },
);

/**
 * @desc    Delete an appointment
 * @route   DELETE /api/v1/appointments/:id
 * @access  Private (Admin, Reception)
 */
export const deleteAppointment = expressAsyncHandler(
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const appointmentId = parseInt(req.params.id, 10);

    await AppointmentService.delete(tenantId, appointmentId);
    ApiResponse.ok(res, 'Appointment deleted successfully', {
      id: appointmentId,
    });
  },
);