// frontend/src/stores/appointment.store.ts
import { defineStore } from 'pinia';
import axios from 'axios';
import { AppointmentService, type AppointmentSlot, type Doctor } from '../services/appointment.service';

const BASE = import.meta.env.VITE_API_URL ?? '';

function fmtDate(dateStr: string): string {
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function fmtTime(t: string): string {
  const [h, m] = t.split(':');
  return `${h}:${m} hs`;
}

interface AppointmentState {
  slots: AppointmentSlot[];
  doctors: Doctor[];
  myAppointments: AppointmentSlot[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  conflictExistingId: number | null;
  conflictVisible: boolean;
}

export const useAppointmentStore = defineStore('appointment', {
  state: (): AppointmentState => ({
    slots: [],
    doctors: [],
    myAppointments: [],
    loading: false,
    error: null,
    successMessage: null,
    conflictExistingId: null,
    conflictVisible: false
  }),

  actions: {
    async loadAvailableSlots() {
      this.loading = true;
      this.error = null;
      try {
        const response = await AppointmentService.fetchAvailableSlots();
        this.slots = response.data;
        this.doctors = response.doctors ?? [];
      } catch {
        this.error = 'No se pudo cargar la agenda médica.';
      } finally {
        this.loading = false;
      }
    },

    async loadMyAppointments(userId: number) {
      try {
        const response = await AppointmentService.fetchMyAppointments(userId);
        this.myAppointments = response.data;
      } catch {
        this.myAppointments = [];
      }
    },

    async reserveSlot(appointmentId: number, userId: number) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      this.conflictVisible = false;
      try {
        const response = await AppointmentService.bookSlot(appointmentId, userId);
        this.successMessage = response.message;
        // Solo quitamos el slot reservado del array local — sin recargar todo
        this.slots = this.slots.filter(s => s.id !== appointmentId);
        // Recargamos mis citas (liviano)
        await this.loadMyAppointments(userId);
      } catch (err: any) {
        const data = err.response?.data;
        if (data?.code === 'YA_TIENE_TURNO') {
          this.conflictExistingId = data.existingId;
          this.conflictVisible = true;
        } else {
          this.error = data?.error || 'Error al procesar la reserva.';
        }
      } finally {
        this.loading = false;
      }
    },

    async cancelMySlot(appointmentId: number, userId: number) {
      this.loading = true;
      this.error = null;
      try {
        const slot = this.myAppointments.find(s => s.id === appointmentId);
        await AppointmentService.cancelBooking(appointmentId);

        // Notificar al admin
        if (slot) {
          const { useAuthStore } = await import('./auth.store');
          const userName = useAuthStore().user?.name ?? 'Un paciente';
          await axios.post(`${BASE}/api/notifications`, {
            userId,
            userName,
            message: `${userName} canceló su turno con ${slot.doctor_name} (${slot.specialty}) del ${fmtDate(slot.appointment_date)} a las ${fmtTime(slot.appointment_time)}.`
          });
          // Devolver el slot al array local sin recargar todo
          this.slots.push(slot);
          this.slots.sort((a, b) =>
            a.appointment_date.localeCompare(b.appointment_date) ||
            a.appointment_time.localeCompare(b.appointment_time)
          );
        }

        this.myAppointments = this.myAppointments.filter(s => s.id !== appointmentId);
        this.successMessage = 'Turno cancelado correctamente.';
        this.conflictVisible = false;
        this.conflictExistingId = null;
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Error al cancelar el turno.';
      } finally {
        this.loading = false;
      }
    },

    dismissConflict() {
      this.conflictVisible = false;
      this.conflictExistingId = null;
    }
  }
});
