<template>
  <div class="bell-wrapper" ref="bellRef">

    <!-- Botón campana -->
    <button class="bell-btn" @click="togglePanel" :aria-label="`${unread} notificaciones`">
      <!-- Icono campana SVG -->
      <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="unread > 0" class="bell-badge">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <!-- Panel desplegable -->
    <transition name="panel">
      <div v-if="open" class="notif-panel" role="dialog" aria-label="Notificaciones">

        <div class="panel-header">
          <h3>Notificaciones</h3>
          <div class="panel-actions">
            <button v-if="unread > 0" class="btn-read-all" @click="markAll">
              Marcar todas como leídas
            </button>
            <button class="btn-close-panel" @click="open = false">×</button>
          </div>
        </div>

        <!-- Cargando -->
        <div v-if="loading" class="notif-state">
          <div class="spinner-sm"></div> Cargando...
        </div>

        <!-- Sin notificaciones -->
        <div v-else-if="notifications.length === 0" class="notif-state">
          Sin notificaciones
        </div>

        <!-- Lista -->
        <ul v-else class="notif-list">
          <li
            v-for="n in notifications"
            :key="n.id"
            class="notif-item"
            :class="{ unread: !n.is_read }"
            @click="markOne(n.id)"
          >
            <div class="notif-dot" v-if="!n.is_read"></div>
            <div class="notif-body">
              <p class="notif-msg">{{ n.message }}</p>
              <span class="notif-time">{{ formatTime(n.created_at) }}</span>
            </div>
          </li>
        </ul>

      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

interface Notification {
  id: number;
  user_id: number;
  user_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const BASE = import.meta.env.VITE_API_URL ?? '';
const open = ref(false);
const loading = ref(false);
const notifications = ref<Notification[]>([]);
const unread = ref(0);
const bellRef = ref<HTMLElement | null>(null);

// Carga notificaciones al montar y cada 15s (polling simple)
let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  fetchNotifications();
  interval = setInterval(fetchNotifications, 15000);
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  clearInterval(interval);
  document.removeEventListener('click', handleOutsideClick);
});

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(`${BASE}/api/notifications`);
    notifications.value = data.data;
    unread.value = data.unread;
  } catch { /* silencioso */ }
  finally { loading.value = false; }
};

const togglePanel = () => {
  open.value = !open.value;
  if (open.value) fetchNotifications();
};

const markOne = async (id: number) => {
  await axios.patch(`${BASE}/api/notifications/${id}/read`);
  fetchNotifications();
};

const markAll = async () => {
  await axios.patch(`${BASE}/api/notifications/read-all`);
  fetchNotifications();
};

const handleOutsideClick = (e: MouseEvent) => {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    open.value = false;
  }
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};
</script>

<style scoped>
.bell-wrapper { position: relative; }

/* Botón campana */
.bell-btn {
  position: relative;
  background: rgba(255,255,255,0.1);
  border: 1.5px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 0.45rem 0.7rem;
  cursor: pointer;
  transition: background 0.18s;
  display: flex; align-items: center;
}
.bell-btn:hover { background: rgba(255,255,255,0.2); }

.bell-icon {
  width: 20px;
  height: 20px;
  color: white;
  display: block;
}

.bell-badge {
  position: absolute;
  top: -6px; right: -6px;
  background: #e53935;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px; height: 18px;
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  border: 2px solid #1b1b2f;
  animation: popIn 0.3s ease;
}
@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }

/* Panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
  z-index: 300;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}
.panel-header h3 { font-size: 0.95rem; color: #1a1a2e; margin: 0; }
.panel-actions { display: flex; align-items: center; gap: 0.5rem; }

.btn-read-all {
  font-size: 0.75rem; color: #1a73e8; background: transparent;
  border: none; cursor: pointer; font-weight: 600; padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
.btn-read-all:hover { background: #e8f0fe; }

.btn-close-panel {
  font-size: 1.1rem; color: #999; background: transparent;
  border: none; cursor: pointer; line-height: 1; padding: 0 0.2rem;
}
.btn-close-panel:hover { color: #333; }

/* Estado */
.notif-state {
  display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; padding: 2rem; color: #999; font-size: 0.88rem;
}

/* Lista */
.notif-list { list-style: none; max-height: 340px; overflow-y: auto; }

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #f8f9fa; }
.notif-item.unread { background: #fef9e7; }
.notif-item.unread:hover { background: #fef3cd; }

.notif-dot {
  width: 8px; height: 8px; flex-shrink: 0;
  background: #f0c040; border-radius: 50%; margin-top: 5px;
}

.notif-body { flex: 1; }
.notif-msg { font-size: 0.86rem; color: #333; line-height: 1.4; margin-bottom: 0.25rem; }
.notif-time { font-size: 0.75rem; color: #aaa; }

/* Transición del panel */
.panel-enter-active, .panel-leave-active { transition: all 0.22s ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

/* Spinner */
.spinner-sm {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid #e0e0e0; border-top-color: #1a73e8;
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

