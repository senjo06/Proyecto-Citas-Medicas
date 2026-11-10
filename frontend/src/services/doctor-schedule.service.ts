// frontend/src/services/doctor-schedule.service.ts
const API_URL = 'http://localhost:3000/api/doctor-schedules';

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  doctor_name?: string;
  specialty?: string;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at?: string;
}

export interface TimeSlot {
  doctor_id: string;
  date: string;
  day_of_week: number;
  day_name: string;
  slots: string[];
}

export interface CreateScheduleData {
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
}

export interface UpdateScheduleData {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  is_active?: boolean;
}

export const doctorScheduleService = {
  // Obtener todos los horarios
  async getAllSchedules(): Promise<DoctorSchedule[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener horarios');
    return response.json();
  },

  // Obtener horarios de un doctor específico
  async getSchedulesByDoctor(doctorId: number): Promise<DoctorSchedule[]> {
    const response = await fetch(`${API_URL}/doctor/${doctorId}`);
    if (!response.ok) throw new Error('Error al obtener horarios del doctor');
    return response.json();
  },

  // Obtener slots de tiempo disponibles para un doctor en una fecha
  async getAvailableSlots(doctorId: number, date: string): Promise<TimeSlot> {
    const response = await fetch(`${API_URL}/doctor/${doctorId}/slots/${date}`);
    if (!response.ok) throw new Error('Error al obtener slots disponibles');
    return response.json();
  },

  // Crear un nuevo horario
  async createSchedule(data: CreateScheduleData): Promise<DoctorSchedule> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear horario');
    return response.json();
  },

  // Actualizar un horario
  async updateSchedule(id: number, data: UpdateScheduleData): Promise<DoctorSchedule> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar horario');
    return response.json();
  },

  // Eliminar un horario
  async deleteSchedule(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar horario');
  }
};
