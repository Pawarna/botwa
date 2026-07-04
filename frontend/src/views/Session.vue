<template>
  <div class="session-manager">
    
    <!-- Page Header -->
    <div class="page-header mb-6">
      <h1 class="page-title">Session Manager</h1>
      <p class="page-subtitle">Configure and authenticate WhatsApp instances</p>
    </div>

    <div class="split-layout">
      <!-- Add New Session Card -->
      <div class="card compose-panel">
        <div class="section-label">
          <PlusIcon :size="14" />
          Create Session
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
          Add a new WhatsApp instance. You will scan a QR code to link your phone.
        </p>
        <form @submit.prevent="startSession">
          <div class="form-group mb-5">
            <label class="form-label">Session ID</label>
            <input 
              type="text" 
              class="field-input" 
              v-model="newSessionId" 
              placeholder="e.g. marketing-dept"
              required
            />
          </div>
          <button type="submit" class="btn-primary-solid" style="width: 100%; justify-content: center;" :disabled="loading">
            <LoaderIcon :size="14" class="spin" v-if="loading" />
            <PlusIcon :size="14" v-else />
            {{ loading ? 'Starting...' : 'Create Session' }}
          </button>
        </form>
      </div>

      <!-- Session List Card -->
      <div class="card monitor-panel">
        <div class="card-header">
          <div class="d-flex align-center gap-2">
            <SmartphoneIcon :size="16" />
            <span class="card-title">Active Instances</span>
          </div>
          <button class="btn-icon" @click="fetchSessions" title="Refresh list">
            <RefreshCwIcon :size="14" />
          </button>
        </div>
        
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in savedSessions" :key="session.id">
                <td><strong class="mono">{{ session.id }}</strong></td>
                <td>
                  <span class="status-badge" :class="getStatusClass(session.status)" :title="session.error">
                    {{ session.status === 'qr' ? 'Pending Scan' : (session.status === 'error' ? 'Connection Error ⓘ' : session.status) }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <button v-if="session.status === 'qr'" class="action-btn-primary" @click="showQr(session.id)">
                      <QrCodeIcon :size="13" />
                      Scan QR
                    </button>
                    <button v-if="session.status === 'offline' || session.status === 'error'" class="action-btn-primary" @click="reconnectSession(session.id)">
                      <LinkIcon :size="13" />
                      Connect
                    </button>
                    <button class="action-btn-danger" @click="deleteSession(session.id)">
                      <Trash2Icon :size="13" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="savedSessions.length === 0">
                <td colspan="3" class="empty-row">
                  <SmartphoneIcon :size="20" style="opacity: 0.3;" />
                  No sessions found. Create one on the left.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- QR Modal / Connecting Modal -->
    <div v-if="activeQrSession" class="qr-modal-overlay" @click.self="closeQr">
      <div class="qr-modal-content card">
        <div class="d-flex justify-between align-center mb-4">
          <h3 style="font-size: 16px; font-weight: 600; color: var(--text-main);">Link WhatsApp Instance</h3>
          <button class="btn-icon" @click="closeQr" style="border:none;">
            <XIcon :size="16" />
          </button>
        </div>
        
        <template v-if="activeQr">
          <p class="text-muted mb-4" style="font-size: 13px;">
            Scan this QR code using WhatsApp on your phone (Linked Devices > Link a Device).
          </p>
          <div class="qr-container">
            <img :src="activeQr" alt="QR Code" />
          </div>
          <div class="d-flex align-center justify-center gap-2 mt-4" style="color: var(--primary); font-weight: 600; font-size: 13px;">
            <LoaderIcon :size="14" class="spin" />
            Waiting for authorization...
          </div>
        </template>
        
        <template v-else>
          <div class="d-flex flex-column align-center justify-center py-6" style="min-height: 200px; gap: 16px;">
            <LoaderIcon :size="32" class="spin" style="color: var(--primary);" />
            <div style="text-align: center;">
              <h4 style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Initializing WhatsApp...</h4>
              <p class="text-muted" style="font-size: 12px;">Connecting to servers and generating secure QR code.</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import {
  SmartphoneIcon, PlusIcon, RefreshCwIcon, QrCodeIcon,
  LinkIcon, Trash2Icon, LoaderIcon, XIcon
} from '@lucide/vue';

const toast = useToast();
const confirm = useConfirm();

const newSessionId = ref('');
const loading = ref(false);
const savedSessions = ref<{id: string, status: string, error?: string}[]>([]);
let pollInterval: number | null = null;

const activeQr = ref('');
const activeQrSession = ref('');

const fetchSessions = async () => {
  try {
    const data = await fetchApi('/sessions');
    savedSessions.value = data;
    
    if (activeQrSession.value) {
      const activeSession = data.find((s: any) => s.id === activeQrSession.value);
      if (activeSession && activeSession.status === 'qr') {
        const qrData = await fetchApi(`/sessions/${activeQrSession.value}`);
        if (qrData.qr) activeQr.value = qrData.qr;
      } else if (activeSession && activeSession.status === 'connected') {
        const connectedId = activeQrSession.value;
        closeQr();
        toast.success(`WhatsApp session "${connectedId}" is now connected!`);
      } else if (activeSession && activeSession.status === 'error') {
        const errorId = activeQrSession.value;
        closeQr();
        toast.error(`Connection failed for "${errorId}": ${activeSession.error || 'Connection Failure'}`);
      }
    }
  } catch (error) {
    console.error('Failed to fetch sessions', error);
  }
};

const getStatusClass = (status: string) => {
  if (status === 'connected') return 'status-sent';
  if (status === 'qr' || status === 'connecting') return 'status-pending';
  return 'status-failed';
};

const startSession = async () => {
  if (!newSessionId.value) return;
  loading.value = true;
  try {
    await fetchApi('/sessions', {
      method: 'POST',
      body: JSON.stringify({ sessionId: newSessionId.value }),
    });
    activeQrSession.value = newSessionId.value;
    newSessionId.value = '';
    await fetchSessions();
    toast.info('Initializing session... Preparing QR code.');
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    loading.value = false;
  }
};

const reconnectSession = async (id: string) => {
  try {
    await fetchApi('/sessions', {
      method: 'POST',
      body: JSON.stringify({ sessionId: id }),
    });
    activeQrSession.value = id;
    await fetchSessions();
    toast.info(`Connecting to session "${id}"...`);
  } catch (error: any) {
    toast.error(error.message);
  }
};

const deleteSession = async (id: string) => {
  confirm.show({
    title: 'Delete Session',
    message: `Are you sure you want to permanently delete WhatsApp session "${id}"?`,
    confirmText: 'Delete',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/sessions/${id}`, {
          method: 'DELETE',
        });
        await fetchSessions();
        toast.success(`Session "${id}" deleted successfully.`);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  });
};

const showQr = async (id: string) => {
  activeQrSession.value = id;
  await fetchSessions();
};

const closeQr = () => {
  activeQr.value = '';
  activeQrSession.value = '';
};

onMounted(() => {
  fetchSessions();
  pollInterval = window.setInterval(fetchSessions, 3000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #888; }

/* Layout */
.compose-panel { width: 340px; flex-shrink: 0; }
.monitor-panel { flex: 1; }

/* Table styles */
.table-wrapper { overflow: auto; max-height: 480px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #F0F0F0;
  position: sticky; top: 0; background: #fff;
}
.data-table td {
  padding: 12px;
  font-size: 13px;
  border-bottom: 1px solid #F8F8F8;
  vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #FAFAFA; }
.mono { font-family: monospace; font-size: 13px; }

/* Status Badges */
.status-badge {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}
.status-sent { background: #E8F8EE; color: #2D7A4A; }
.status-pending { background: #FFF4E0; color: #B8700A; }
.status-failed { background: #FDECEA; color: #C0392B; }

/* Action Buttons */
.action-btn-primary {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px; border-radius: 6px;
  background: #111; color: #fff;
  font-size: 12px; font-weight: 500;
  border: none; cursor: pointer;
  transition: background 0.2s;
}
.action-btn-primary:hover { background: #333; }

.action-btn-danger {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px; border-radius: 6px;
  background: #FFF0ED; color: #FF3B30;
  font-size: 12px; font-weight: 500;
  border: none; cursor: pointer;
  transition: all 0.2s;
}
.action-btn-danger:hover { background: #FFDED9; }

.empty-row {
  text-align: center; color: #ccc;
  padding: 40px 20px !important;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  font-size: 13px;
}

/* Modal */
.qr-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.qr-modal-content {
  width: 100%;
  max-width: 400px;
  padding: 24px;
}
.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f7;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
}
.qr-container img {
  max-width: 240px;
  width: 100%;
  height: auto;
  display: block;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.d-flex { display: flex; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 8px; }
</style>
