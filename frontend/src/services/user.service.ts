// frontend/src/services/user.service.ts
import axios from 'axios';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UserUpdate {
  name: string;
  email: string;
  phone?: string;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
}

// Usa el proxy de Vite en desarrollo (/api → localhost:3000/api)
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const API_URL = `${BASE_URL}/api/users`;

export const UserService = {
  async fetchAll(): Promise<UserListResponse> {
    const response = await axios.get<UserListResponse>(API_URL);
    return response.data;
  },

  async fetchById(id: number): Promise<UserResponse> {
    const response = await axios.get<UserResponse>(`${API_URL}/${id}`);
    return response.data;
  },

  async create(payload: UserInput): Promise<UserResponse> {
    const response = await axios.post<UserResponse>(API_URL, payload);
    return response.data;
  },

  async update(id: number, payload: UserUpdate): Promise<UserResponse> {
    const response = await axios.put<UserResponse>(`${API_URL}/${id}`, payload);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  }
};
