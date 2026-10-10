// frontend/src/services/appointment.service.ts
import axios from 'axios';

// Estructura estricta del contrato de un turno médico (Sin usar 'any')
export interface AppointmentSlot {
  id: number;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  is_booked?: boolean;
  user_id?: number | null;
}

export interface AppointmentListResponse {
  data: AppointmentSlot[];
}

export interface BookAppointmentResponse {
  message: string;
  data: AppointmentSlot;
}

// Usa el proxy de Vite en desarrollo (/api → localhost:3000/api)
// En producción se puede sobreescribir con VITE_API_URL
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const API_URL = `${BASE_URL}/api/appointments`;

export const AppointmentService = {
  // Obtiene los turnos médicos libres
  async fetchAvailableSlots(): Promise<AppointmentListResponse> {
    const response = await axios.get<AppointmentListResponse>(`${API_URL}/available`);
    return response.data;
  },

  // Envía la solicitud para reservar bloqueando la fila con SELECT FOR UPDATE
  async bookSlot(appointmentId: number, userId: number): Promise<BookAppointmentResponse> {
    const response = await axios.post<BookAppointmentResponse>(`${API_URL}/book`, {
      appointmentId,
      userId
    });
    return response.data;
  }
};
