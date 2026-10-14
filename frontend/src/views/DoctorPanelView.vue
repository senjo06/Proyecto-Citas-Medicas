<template>
  <div class="doctor-panel">

    <header class="page-header">
      <h1>Panel de Citas de Hoy</h1>
      <p class="subtitle">{{ todayLabel }} — resumen de todos los turnos del día por especialista.</p>
    </header>

    <!-- Alertas -->
    <transition name="slide-alert">
      <div v-if="error" class="alert alert-error">
        {{ error }}
        <button class="alert-close" @click="error = null">×</button>
      </div>
    </transition>

    <!-- Cargando -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>Cargando agenda del día...</p>
    </div>

    <!-- Sin datos -->
    <div v-else-if="doctors.length === 0" class="state-box">
      <p>No hay turnos programados para hoy.</p>
      <button class="btn-outline" @click="loadToday()">Refrescar</button>
    </div>

    <!-- Resumen general -->
    <div v-else>
      <div class="summary-bar">
        <div class="summary-card">
          <span class="summary-number">{{ totalSlots }}</span>
          <span class="summary-label">Turnos totales</span>
        </div>
        <div class="summary-card booked">
          <span class="summary-number">{{ totalBooked }}</span>
          <span class="summary-label">Reservados</span>
        </div>
        <div class="summary-card free">
          <span class="summary-number">{{ totalFree }}</span>
          <span class="summary-label">Disponibles</span>
        </div>
        <div class="summary-card doctors-count">
          <span class="summary-number">{{ doctors.length }}</span>
          <span class="summary-label">Especialistas</span>
        </div>
        <button class="btn-refresh" @click="loadToday()">Refrescar</button>
      </div>

      <!-- Panel por doctor -->
      <div class="doctors-panels">
        <div v-for="doctor in doctors" :key="doctor.name" class="doctor-panel-card">

          <!-- Encabezado del doctor -->
          <div class="dp-header">
            <div class="dp-avatar">{{ initials(doctor.name) }}</div>
            <div class="dp-info">
              <h2 class="dp-name">{{ doctor.name }}</h2>
              <span class="specialty-badge">{{ doctor.specialty }}</span>
            </div>
            <div class="dp-stats">
              <span class="stat booked">{{ doctor.booked }} reservados</span>
              <span class="stat free">{{ doctor.free }} libres</span>
            </div>
            <!-- Barra de progreso -->
            <div class="dp-progress-wrap">
              <div
                class="dp-progress-bar"
                :style="{ width: doctor.percent + '%' }"
              ></div>
            </div>
          </div>

          <!-- Tabla de turnos del día -->
          <div class="dp-table-wrap">
            <table class="dp-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Paciente</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="slot in doctor.slots"
                  :key="slot.id"
                  :class="{ 'row-booked': slot.is_booked, 'row-free': !slot.is_booked }"
                >
                  <td class="td-time">{{ formatTime(slot.appointment_time) }}</td>
                  <td>
                    <span :class="slot.is_booked ? 'badge-booked' : 'badge-free'">
                      {{ slot.is_booked ? 'Reservado' : 'Disponible' }}
                    </span>
                  </td>
                  <td class="td-patient">
                    <template v-if="slot.is_booked && slot.patient_name">
                      <div class="mini-avatar">{{ initials(slot.patient_name) }}</div>
                      {{ slot.patient_name }}
                    </template>
                    <span v-else class="td-empty">—</span>
                  </td>
                  <td class="td-phone">{{ slot.patient_phone ?? '—' }}</td>
                  <td class="td-email">{{ slot.patient_email ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface TodaySlot {
  id: number;
  doctor_name: string;
  specialty: string;
  appointment_time: string;
  is_booked: boolean;
  patient_name: string | null;
  patient_email: string | null;
  patient_phone: string | null;
}

interface DoctorGroup {
  name: string;
  specialty: string;
  slots: TodaySlot[];
  booked: number;
  free: number;
  percent: number;
}

const BASE = import.meta.env.VITE_API_URL ?? '';
const loading = ref(false);
const error = ref<string | null>(null);
const slots = ref<TodaySlot[]>([]);

// Fecha de hoy formateada
const todayLabel = computed(() => {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
});

// Agrupar slots por doctor
const doctors = computed<DoctorGroup[]>(() => {
  const map = new Map<string, DoctorGroup>();
  slots.value.forEach(s => {
    if (!map.has(s.doctor_name)) {
      map.set(s.doctor_name, {
        name: s.doctor_name,
        specialty: s.specialty,
        slots: [],
        booked: 0,
        free: 0,
        percent: 0
      });
    }
    const g = map.get(s.doctor_name)!;
    g.slots.push(s);
    if (s.is_booked) g.booked++; else g.free++;
  });
  // Calcular porcentaje de ocupación
  map.forEach(g => {
    g.percent = g.slots.length > 0 ? Math.round((g.booked / g.slots.length) * 100) : 0;
  });
  return Array.from(map.values());
});

const totalSlots  = computed(() => slots.value.length);
const totalBooked = computed(() => slots.value.filter(s => s.is_booked).length);
const totalFree   = computed(() => slots.value.filter(s => !s.is_booked).length);

onMounted(() => loadToday());

const loadToday = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await axios.get(`${BASE}/api/appointments/today`);
    slots.value = data.data;
  } catch {
    error.value = 'No se pudo cargar la agenda del día.';
  } finally {
    loading.value = false;
  }
};

const formatTime = (t: string) => {
  const [h, m] = t.split(':');
  return `${h}:${m} hs`;
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() ?? '';
  const last  = (parts.length >= 3 ? parts[2] : parts[1])?.[0]?.toUpperCase() ?? '';
  return first + last;
};
</script>

<style scoped>
.doctor-panel { width: 100%; }
.page-header { margin-bottom: 1.75rem; text-align: center; }
.page-header h1 { font-size: 1.9rem; color: #0d47a1; margin-bottom: 0.4rem; }
.subtitle { color: #666; font-size: 0.92rem; text-transform: capitalize; }

/* Alertas */
.alert { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.93rem; font-weight: 500; }
.alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f1b0b7; }
.alert-close { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: inherit; opacity: 0.6; }
.alert-close:hover { opacity: 1; }
.slide-alert-enter-active, .slide-alert-leave-active { transition: all 0.25s ease; }
.slide-alert-enter-from, .slide-alert-leave-to { opacity: 0; transform: translateY(-8px); }

/* Estado */
.state-box { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; background: white; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); color: #777; }

/* Resumen */
.summary-bar {
  display: flex; align-items: center; gap: 1rem;
  background: white; border-radius: 14px;
  padding: 1.1rem 1.5rem; margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  border: 1px solid #e8ecf0; flex-wrap: wrap;
}
.summary-card { display: flex; flex-direction: column; align-items: center; min-width: 80px; }
.summary-number { font-size: 1.8rem; font-weight: 800; color: #0d47a1; line-height: 1; }
.summary-label { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.2rem; }
.summary-card.booked .summary-number { color: #e53935; }
.summary-card.free .summary-number { color: #34a853; }
.summary-card.doctors-count .summary-number { color: #1a73e8; }

.btn-refresh {
  margin-left: auto; padding: 0.45rem 1rem;
  background: #f0f4f8; color: #333; border: 1px solid #ddd;
  border-radius: 7px; font-size: 0.85rem; cursor: pointer; transition: background 0.18s;
}
.btn-refresh:hover { background: #e2e6ea; }

/* Panels por doctor */
.doctors-panels { display: flex; flex-direction: column; gap: 1.5rem; }

.doctor-panel-card {
  background: white; border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  border: 1px solid #e8ecf0; overflow: hidden;
}

/* Header del doctor */
.dp-header {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: linear-gradient(135deg, #f8f9fa, #f0f4f8);
  border-bottom: 1px solid #e8ecf0;
  flex-wrap: wrap; position: relative;
}
.dp-avatar {
  width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  color: white; font-size: 1.1rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.dp-info { flex: 1; }
.dp-name { font-size: 1.05rem; color: #0d47a1; margin-bottom: 0.3rem; }
.dp-stats { display: flex; gap: 0.75rem; }
.stat { font-size: 0.8rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px; }
.stat.booked { background: #ffeef0; color: #c62828; }
.stat.free   { background: #d4edda; color: #155724; }

.dp-progress-wrap {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 4px; background: #e9ecef;
}
.dp-progress-bar {
  height: 100%; background: linear-gradient(90deg, #1a73e8, #34a853);
  transition: width 0.5s ease; border-radius: 2px;
}

/* Tabla */
.dp-table-wrap { overflow-x: auto; }
.dp-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 560px; }
.dp-table th { background: #f8f9fa; color: #555; font-weight: 600; text-align: left; padding: 0.65rem 1rem; border-bottom: 2px solid #e9ecef; white-space: nowrap; }
.dp-table td { padding: 0.6rem 1rem; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
.dp-table tr:last-child td { border-bottom: none; }
.dp-table tr.row-booked td { background: #fafffe; }
.dp-table tr.row-free td { background: #fafafa; }
.dp-table tr:hover td { background: #f0f4ff; }

.td-time { font-weight: 700; color: #0d47a1; white-space: nowrap; }
.td-patient { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; white-space: nowrap; }
.td-phone, .td-email { color: #777; font-size: 0.83rem; }
.td-empty { color: #ccc; }

.mini-avatar {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #34a853, #1b5e20);
  color: white; font-size: 0.65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.badge-booked {
  display: inline-block; background: #ffeef0; color: #c62828;
  border: 1px solid #ef9a9a; font-size: 0.75rem; font-weight: 700;
  padding: 0.15rem 0.6rem; border-radius: 20px; white-space: nowrap;
}
.badge-free {
  display: inline-block; background: #d4edda; color: #155724;
  border: 1px solid #b7dfbc; font-size: 0.75rem; font-weight: 700;
  padding: 0.15rem 0.6rem; border-radius: 20px; white-space: nowrap;
}

.specialty-badge {
  display: inline-block; background: #e8f0fe; color: #1557b0;
  font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.6rem;
  border-radius: 20px; text-transform: uppercase; letter-spacing: 0.4px;
}

/* Botón outline */
.btn-outline { padding: 0.5rem 1rem; background: white; color: #1a73e8; border: 1.5px solid #1a73e8; border-radius: 7px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
.btn-outline:hover { background: #e8f0fe; }

/* Spinner */
.spinner { width: 38px; height: 38px; border: 4px solid #e0e0e0; border-top-color: #1a73e8; border-radius: 50%; animation: spin 0.75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
