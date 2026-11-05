import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? '';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  created_at?: string;
}

export interface DoctorInput {
  name: string;
  specialty: string;
}

export const DoctorService = {
  async fetchAll() {
    const { data } = await axios.get(`${BASE}/api/doctors`);
    return data.data as Doctor[];
  },

  async fetchById(id: number) {
    const { data } = await axios.get(`${BASE}/api/doctors/${id}`);
    return data.data as Doctor;
  },

  async create(payload: DoctorInput) {
    const { data } = await axios.post(`${BASE}/api/doctors`, payload);
    return data.data as Doctor;
  },

  async update(id: number, payload: DoctorInput) {
    const { data } = await axios.put(`${BASE}/api/doctors/${id}`, payload);
    return data.data as Doctor;
  },

  async remove(id: number) {
    await axios.delete(`${BASE}/api/doctors/${id}`);
  }
};
