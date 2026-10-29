<template>
  <div class="history-view">

    <header class="page-header">
      <h1>Historial de Citas</h1>
      <p class="subtitle">Todas tus citas médicas anteriores.</p>
    </header>

    <!-- Cargando -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>Cargando historial...</p>
    </div>

    <!-- Sin historial -->
    <div v-else-if="history.length === 0" class="state-box">
      <p>No tenés citas anteriores registradas.</p>
    </div>

    <!-- Tabla -->
    <div v-else class="card">
      <div class="card-header">
        <h2>{{ history.length }} cita{{ history.length !== 1 ? 's' : '' }} realizadas</h2>
      </div>
      <div class="table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Especialidad</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Reservado el</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in history" :key="apt.id">
              <td class="td-doctor">
                <div class="avatar">{{ initials(apt.doctor_name) }}</div>
                {{ apt.doctor_name }}
              </td>
              <td><span class="badge">{{ apt.specialty }}</span></td>
              <td>{{ formatDate(apt.appointment_date) }}</td>
              <td>{{ formatTime(apt.appointment_time) }}</td>
              <td class="td-muted">{{ formatDateTime(apt.booked_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

interface Apt {
  id: number;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  booked_at: string;
}

const authStore = useAuthStore();
const BASE = import.meta.env.VITE_API_URL ?? '';
const loading = ref(false);
const history = ref<Apt[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(`${BASE}/api/appointments/history`, {
      params: { userId: authStore.user!.id }
    });
    history.value = data.data ?? [];
  } catch { history.value = []; }
  finally { loading.value = false; }
});

const formatDate = (s: string) => {
  const [y, m, d] = s.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};
const formatTime = (t: string) => {
  const [h, m] = t.split(':');
  return `${h}:${m} hs`;
};
const formatDateTime = (s: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
const initials = (name: string) => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? '').toUpperCase() + ((p.length >= 3 ? p[2] : p[1])?.[0] ?? '').toUpperCase();
};
</script>

<style scoped>
.history-view { width: 100%; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.35rem; font-weight: 600; color: #111827; margin-bottom: 0.2rem; }
.subtitle { font-size: 0.85rem; color: #6b7280; }

.state-box { display: flex; flex-direction: column; align-items: center; gap: 0.65rem; padding: 3rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px; color: #9ca3af; font-size: 0.9rem; }

.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; }
.card-header h2 { font-size: 0.9rem; font-weight: 600; color: #374151; }

.table-wrap { overflow-x: auto; }
.history-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 560px; }
.history-table th { background: #f9fafb; color: #6b7280; font-weight: 600; text-align: left; padding: 0.65rem 1rem; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.history-table td { padding: 0.65rem 1rem; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.history-table tr:last-child td { border-bottom: none; }
.history-table tr:hover td { background: #f9fafb; }

.td-doctor { display: flex; align-items: center; gap: 0.6rem; font-weight: 500; white-space: nowrap; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 1px solid #bfdbfe; flex-shrink: 0; }
.badge { display: inline-block; background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.5rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; border: 1px solid #e2e8f0; }
.td-muted { color: #9ca3af; font-size: 0.82rem; }

.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
