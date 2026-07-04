<template>
  <router-view></router-view>

  <!-- Global Toasts Container -->
  <div class="toasts-container">
    <TransitionGroup name="toast-slide">
      <div v-for="t in toasts" :key="t.id" class="toast-item" :class="'toast-' + t.type">
        <div class="toast-icon">
          <CheckCircleIcon :size="16" v-if="t.type === 'success'" />
          <AlertCircleIcon :size="16" v-else-if="t.type === 'error'" />
          <AlertTriangleIcon :size="16" v-else-if="t.type === 'warning'" />
          <InfoIcon :size="16" v-else />
        </div>
        <div class="toast-message">{{ t.message }}</div>
        <button class="toast-close" @click="remove(t.id)">&times;</button>
      </div>
    </TransitionGroup>
  </div>

  <!-- Global Confirm Modal -->
  <div class="confirm-modal-overlay" v-if="confirmState" @click.self="close">
    <div class="confirm-modal-card">
      <div class="confirm-modal-header">
        <div class="d-flex align-center gap-2">
          <AlertTriangleIcon :size="18" class="text-danger" v-if="confirmState.type === 'danger'" />
          <AlertCircleIcon :size="18" class="text-warning" v-else-if="confirmState.type === 'warning'" />
          <InfoIcon :size="18" class="text-primary" v-else />
          <h3 class="confirm-modal-title">{{ confirmState.title }}</h3>
        </div>
      </div>
      <div class="confirm-modal-body">
        <p>{{ confirmState.message }}</p>
      </div>
      <div class="confirm-modal-footer">
        <button class="btn btn-outline" @click="close" :disabled="confirmLoading">
          {{ confirmState.cancelText || 'Cancel' }}
        </button>
        <button 
          class="btn" 
          :class="confirmState.type === 'danger' ? 'btn-danger-solid' : 'btn-primary-solid'"
          @click="confirm" 
          :disabled="confirmLoading"
        >
          <LoaderIcon :size="14" class="spin" v-if="confirmLoading" />
          {{ confirmState.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast, useConfirm } from './composables/useNotification';
import { 
  CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, 
  InfoIcon, LoaderIcon 
} from '@lucide/vue';

const { toasts, remove } = useToast();
const { confirmState, confirmLoading, close, confirm } = useConfirm();
</script>

<style>
/* Global Toasts Styling */
.toasts-container {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
  max-width: 380px;
  width: calc(100% - 48px);
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px 14px 14px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
  color: var(--text-main);
  pointer-events: auto;
  position: relative;
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.toast-message {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  padding-top: 2px;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  margin-left: auto;
  line-height: 1;
  padding: 0 4px;
  transition: color 0.15s;
}
.toast-close:hover {
  color: var(--text-main);
}

/* Toast types theme */
.toast-success {
  border-left: 4px solid var(--success);
}
.toast-success .toast-icon {
  background: rgba(52, 199, 89, 0.1);
  color: var(--success);
}

.toast-error {
  border-left: 4px solid var(--danger);
}
.toast-error .toast-icon {
  background: rgba(255, 59, 48, 0.1);
  color: var(--danger);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}
.toast-warning .toast-icon {
  background: rgba(255, 149, 0, 0.1);
  color: var(--warning);
}

.toast-info {
  border-left: 4px solid var(--primary);
}
.toast-info .toast-icon {
  background: rgba(255, 92, 53, 0.1);
  color: var(--primary);
}

/* Toast Transitions */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(60px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Confirm Modal Styling */
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirm-modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border);
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.confirm-modal-body {
  margin-top: 12px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
}

.confirm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-modal-footer .btn {
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 8px;
}

.btn-danger-solid {
  background: var(--danger);
  color: #ffffff;
}
.btn-danger-solid:hover {
  background: #e03126;
}

.btn-primary-solid {
  background: var(--text-main);
  color: #ffffff;
}
.btn-primary-solid:hover {
  background: #333333;
}

.text-danger { color: var(--danger); }
.text-warning { color: var(--warning); }
.text-primary { color: var(--primary); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
