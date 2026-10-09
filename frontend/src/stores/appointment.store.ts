// frontend/src/stores/appointment.store.ts
import { defineStore } from 'pinia';
import { AppointmentService, type AppointmentSlot } from '../services/appointment.service';

interface AppointmentState {
  slots: AppointmentSlot[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

export const useAppointmentStore = defineStore('appointment', {
  state: (): AppointmentState => ({
    slots: [],
    loading: false,
    error: null,
    successMessage: null
  }),

  actions: {
    // Carga los turnos libres del backend
    async loadAvailableSlots() {
      this.loading = true;
      this.error = null;
      try {
        const response = await AppointmentService.fetchAvailableSlots();
        this.slots = response.data;
      } catch (err: any) {
        this.error = 'No se pudo cargar la agenda médica.';
      } finally {
        this.loading = false;
      }
    },

    // Intenta reservar un turno capturando condiciones de carrera (Error 409)
    async reserveSlot(appointmentId: number, userId: number) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      try {
        const response = await AppointmentService.bookSlot(appointmentId, userId);
        this.successMessage = response.message;
        // Refrescamos la lista de turnos disponibles de inmediato
        await this.loadAvailableSlots();
      } catch (err: any) {
        // Captura el error de bloqueo SELECT FOR UPDATE si alguien más ganó el turno
        this.error = err.response?.data?.error || 'Error al procesar la reserva.';
      } finally {
        this.loading = false;
      }
    }
  }
});
