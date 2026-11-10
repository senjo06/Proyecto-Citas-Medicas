// frontend/src/stores/doctor-schedule.store.ts
import { defineStore } from 'pinia';
import { 
  doctorScheduleService, 
  type DoctorSchedule, 
  type CreateScheduleData,
  type UpdateScheduleData 
} from '../services/doctor-schedule.service';

export const useDoctorScheduleStore = defineStore('doctorSchedule', {
  state: () => ({
    schedules: [] as DoctorSchedule[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    getSchedulesByDoctor: (state) => (doctorId: number) => {
      return state.schedules.filter(s => s.doctor_id === doctorId);
    },

    getSchedulesByDay: (state) => (dayOfWeek: number) => {
      return state.schedules.filter(s => s.day_of_week === dayOfWeek);
    }
  },

  actions: {
    async fetchAllSchedules() {
      this.loading = true;
      this.error = null;
      try {
        this.schedules = await doctorScheduleService.getAllSchedules();
      } catch (err: any) {
        this.error = err.message;
        console.error('Error fetching schedules:', err);
      } finally {
        this.loading = false;
      }
    },

    async fetchSchedulesByDoctor(doctorId: number) {
      this.loading = true;
      this.error = null;
      try {
        const schedules = await doctorScheduleService.getSchedulesByDoctor(doctorId);
        // Reemplazar horarios del doctor en el estado
        this.schedules = [
          ...this.schedules.filter(s => s.doctor_id !== doctorId),
          ...schedules
        ];
        return schedules;
      } catch (err: any) {
        this.error = err.message;
        console.error('Error fetching doctor schedules:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createSchedule(data: CreateScheduleData) {
      this.loading = true;
      this.error = null;
      try {
        const newSchedule = await doctorScheduleService.createSchedule(data);
        this.schedules.push(newSchedule);
        return newSchedule;
      } catch (err: any) {
        this.error = err.message;
        console.error('Error creating schedule:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateSchedule(id: number, data: UpdateScheduleData) {
      this.loading = true;
      this.error = null;
      try {
        const updated = await doctorScheduleService.updateSchedule(id, data);
        const index = this.schedules.findIndex(s => s.id === id);
        if (index !== -1) {
          this.schedules[index] = updated;
        }
        return updated;
      } catch (err: any) {
        this.error = err.message;
        console.error('Error updating schedule:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteSchedule(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await doctorScheduleService.deleteSchedule(id);
        this.schedules = this.schedules.filter(s => s.id !== id);
      } catch (err: any) {
        this.error = err.message;
        console.error('Error deleting schedule:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
