// frontend/src/stores/user.store.ts
import { defineStore } from 'pinia';
import { UserService, type User, type UserInput, type UserUpdate } from '../services/user.service';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    users: [],
    loading: false,
    error: null,
    successMessage: null,
  }),

  actions: {
    clearMessages() {
      this.error = null;
      this.successMessage = null;
    },

    async loadUsers() {
      this.loading = true;
      this.clearMessages();
      try {
        const response = await UserService.fetchAll();
        this.users = response.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'No se pudo cargar la lista de usuarios.';
      } finally {
        this.loading = false;
      }
    },

    async addUser(payload: UserInput) {
      this.loading = true;
      this.clearMessages();
      try {
        await UserService.create(payload);
        this.successMessage = 'Usuario creado correctamente.';
        await this.loadUsers();
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al crear el usuario.';
      } finally {
        this.loading = false;
      }
    },

    async editUser(id: number, payload: UserUpdate) {
      this.loading = true;
      this.clearMessages();
      try {
        await UserService.update(id, payload);
        this.successMessage = 'Usuario actualizado correctamente.';
        await this.loadUsers();
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al actualizar el usuario.';
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(id: number) {
      this.loading = true;
      this.clearMessages();
      try {
        await UserService.remove(id);
        this.successMessage = 'Usuario eliminado correctamente.';
        await this.loadUsers();
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al eliminar el usuario.';
      } finally {
        this.loading = false;
      }
    }
  }
});
