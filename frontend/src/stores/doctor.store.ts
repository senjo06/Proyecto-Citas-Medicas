import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DoctorService, type Doctor, type DoctorInput } from '../services/doctor.service';

export const useDoctorStore = defineStore('doctor', () => {
  const doctors = ref<Doctor[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const loadDoctors = async () => {
    loading.value = true;
    error.value = null;
    try {
      doctors.value = await DoctorService.fetchAll();
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Error al cargar doctores.';
    } finally {
      loading.value = false;
    }
  };

  const addDoctor = async (payload: DoctorInput) => {
    loading.value = true;
    error.value = null;
    try {
      await DoctorService.create(payload);
      successMessage.value = 'Doctor creado correctamente.';
      await loadDoctors();
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Error al crear doctor.';
    } finally {
      loading.value = false;
    }
  };

  const editDoctor = async (id: number, payload: DoctorInput) => {
    loading.value = true;
    error.value = null;
    try {
      await DoctorService.update(id, payload);
      successMessage.value = 'Doctor actualizado correctamente.';
      await loadDoctors();
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Error al actualizar doctor.';
    } finally {
      loading.value = false;
    }
  };

  const deleteDoctor = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await DoctorService.remove(id);
      successMessage.value = 'Doctor eliminado correctamente.';
      await loadDoctors();
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Error al eliminar doctor.';
    } finally {
      loading.value = false;
    }
  };

  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };

  return { doctors, loading, error, successMessage, loadDoctors, addDoctor, editDoctor, deleteDoctor, clearMessages };
});
