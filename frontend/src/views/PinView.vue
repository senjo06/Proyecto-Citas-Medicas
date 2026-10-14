<template>
  <div class="pin-page">
    <div class="pin-card">

      <!-- Ícono y título -->
      <div class="pin-icon">🔐</div>
      <h1 class="pin-title">Panel de Administración</h1>
      <p class="pin-subtitle">Ingresá el código de acceso para continuar</p>

      <!-- Puntos indicadores del PIN -->
      <div class="pin-dots" aria-hidden="true">
        <span
          v-for="i in PIN_LENGTH"
          :key="i"
          class="pin-dot"
          :class="{ filled: pin.length >= i, error: shakeError }"
        ></span>
      </div>

      <!-- Mensaje de error -->
      <transition name="fade-msg">
        <p v-if="errorMsg" class="pin-error">{{ errorMsg }}</p>
      </transition>

      <!-- Teclado numérico -->
      <div class="pin-keypad">
        <button
          v-for="key in keys"
          :key="key"
          class="key-btn"
          :class="{ 'key-wide': key === '⌫' }"
          @click="handleKey(key)"
          :disabled="pin.length >= PIN_LENGTH && key !== '⌫'"
        >
          {{ key }}
        </button>
      </div>

      <p class="pin-hint">Código por defecto: <code>1234</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '../stores/admin.store';

const router = useRouter();
const adminStore = useAdminStore();

const PIN_LENGTH = 4;
const pin = ref('');
const errorMsg = ref('');
const shakeError = ref(false);

const keys = ['1','2','3','4','5','6','7','8','9','0','⌫'];

const handleKey = (key: string) => {
  errorMsg.value = '';

  if (key === '⌫') {
    pin.value = pin.value.slice(0, -1);
    return;
  }

  if (pin.value.length >= PIN_LENGTH) return;

  pin.value += key;

  // Cuando se completan los 4 dígitos, verificar automáticamente
  if (pin.value.length === PIN_LENGTH) {
    setTimeout(() => verifyPin(), 150);
  }
};

const verifyPin = () => {
  const ok = adminStore.verifyPin(pin.value);
  if (ok) {
    router.push('/admin/reservados');
  } else {
    shakeError.value = true;
    errorMsg.value = 'Código incorrecto. Intentá de nuevo.';
    setTimeout(() => {
      pin.value = '';
      shakeError.value = false;
    }, 600);
  }
};
</script>

<style scoped>
.pin-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0d47a1 0%, #1a73e8 50%, #42a5f5 100%);
  padding: 1rem;
}

.pin-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 340px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
}

.pin-icon { font-size: 3rem; margin-bottom: 0.75rem; }

.pin-title {
  font-size: 1.3rem;
  color: #0d47a1;
  margin-bottom: 0.4rem;
}

.pin-subtitle {
  font-size: 0.88rem;
  color: #888;
  margin-bottom: 1.75rem;
}

/* Puntos indicadores */
.pin-dots {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #b0bec5;
  background: transparent;
  transition: all 0.15s ease;
}

.pin-dot.filled {
  background: #1a73e8;
  border-color: #1a73e8;
  transform: scale(1.15);
}

.pin-dot.error {
  background: #e53935;
  border-color: #e53935;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-5px); }
  40%       { transform: translateX(5px); }
  60%       { transform: translateX(-5px); }
  80%       { transform: translateX(5px); }
}

/* Error */
.pin-error {
  color: #e53935;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  min-height: 1.2rem;
}

.fade-msg-enter-active, .fade-msg-leave-active { transition: opacity 0.2s; }
.fade-msg-enter-from, .fade-msg-leave-to { opacity: 0; }

/* Teclado */
.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
}

.key-btn {
  padding: 1rem 0;
  background: #f0f4f8;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.12s ease;
  user-select: none;
}

.key-btn:hover:not(:disabled) {
  background: #e8f0fe;
  color: #1a73e8;
  transform: scale(1.05);
}

.key-btn:active:not(:disabled) {
  background: #1a73e8;
  color: white;
  transform: scale(0.97);
}

.key-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Tecla borrar ocupa toda la fila si está sola */
.key-wide {
  grid-column: span 3;
  font-size: 1.1rem;
  padding: 0.75rem;
  background: #fff3f3;
  color: #e53935;
}
.key-wide:hover:not(:disabled) {
  background: #ffcdd2;
  color: #c62828;
}

.pin-hint {
  font-size: 0.78rem;
  color: #bbb;
}
.pin-hint code {
  background: #f0f4f8;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #555;
}
</style>
