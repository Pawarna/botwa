<template>
  <div class="page-wrapper">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Message Blaster</h1>
        <p class="page-subtitle">Send personalized WhatsApp messages at scale</p>
      </div>
    </div>

    <!-- Mode Tabs -->
    <div class="mode-tabs mb-6">
      <button class="mode-tab" :class="{ active: mode === 'bulk' }" @click="mode = 'bulk'">
        <UsersIcon :size="15" />
        Bulk Send
      </button>
      <button class="mode-tab" :class="{ active: mode === 'single' }" @click="mode = 'single'">
        <UserIcon :size="15" />
        Single Send
      </button>
    </div>

    <div class="main-layout">

      <!-- Left: Compose Panel -->
      <div class="compose-panel card">

        <div class="section-label">
          <SmartphoneIcon :size="14" />
          Session
        </div>
        <div class="field-group mb-5">
          <div class="input-wrapper">
            <input
              type="text"
              class="field-input with-icon"
              v-model="form.sessionId"
              list="session-list"
              placeholder="Session ID (e.g. default)"
              @change="fetchQueueJobs"
            />
            <datalist id="session-list">
              <option v-for="s in savedSessions" :key="s" :value="s"></option>
            </datalist>
          </div>
        </div>

        <!-- BULK MODE: Contact Selector -->
        <template v-if="mode === 'bulk'">
          <div class="section-label">
            <DatabaseIcon :size="14" />
            Contacts
          </div>

          <div class="field-group mb-4">
            <select class="field-input" v-model="selectedBatchId" @change="loadBatchContacts">
              <option value="" disabled>— Select a scrape batch —</option>
              <option v-for="b in batches" :key="b.id" :value="b.id">
                {{ b.query }} ({{ b._count.contacts }} contacts) · {{ formatDate(b.createdAt) }}
              </option>
            </select>
          </div>

          <!-- Per-contact selection table -->
          <div v-if="batchContacts.length > 0" class="contact-selector mb-5">
            <div class="selector-toolbar">
              <label class="checkbox-label">
                <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
                <span>{{ isAllSelected ? 'Deselect All' : 'Select All' }}</span>
              </label>
              <span class="selection-count">{{ selectedContacts.length }} selected</span>
            </div>
            <div class="contact-scroll-list">
              <div
                v-for="c in batchContacts"
                :key="c.id"
                class="contact-row"
                :class="{ checked: selectedContactIds.has(c.id) }"
                style="display: flex; align-items: center; justify-content: space-between;"
              >
                <label class="checkbox-label" style="flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0;">
                  <input
                    type="checkbox"
                    :checked="selectedContactIds.has(c.id)"
                    @change="toggleContact(c)"
                  />
                  <div class="contact-info" style="display: flex; flex-direction: column;">
                    <span class="c-name" style="font-size: 12px; font-weight: 500; color: #111;">{{ c.name }}</span>
                    <span class="c-phone" style="font-size: 11px; color: #888; font-family: monospace;">{{ c.phone }}</span>
                  </div>
                </label>
                <span class="c-address" :title="c.address" style="font-size: 11px; color: #aaa; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: 8px; margin-right: 8px;">{{ c.address }}</span>
                <button type="button" class="delete-contact-btn" @click="deleteContact(c.id)" title="Delete contact">
                  <Trash2Icon :size="12" />
                </button>
              </div>
            </div>
          </div>

          <div class="section-label">
            <TagIcon :size="14" />
            Variables
          </div>
          <div class="var-chips mb-5">
            <button type="button" class="var-chip" @click="insertVariable('{{name}}')">name</button>
            <button type="button" class="var-chip" @click="insertVariable('{{phone}}')">phone</button>
            <button type="button" class="var-chip" @click="insertVariable('{{address}}')">address</button>
            <button type="button" class="var-chip" @click="insertVariable('{{rating}}')">rating</button>
          </div>
        </template>

        <!-- SINGLE MODE: Manual phone -->
        <template v-else>
          <div class="section-label">
            <PhoneIcon :size="14" />
            Recipient
          </div>
          <div class="field-group mb-5">
            <input
              type="text"
              class="field-input"
              v-model="singlePhone"
              placeholder="628123456789"
            />
          </div>
        </template>

        <!-- Message -->
        <div class="section-label">
          <MessageSquareIcon :size="14" />
          Message
        </div>
        <div class="field-group mb-5">
          <textarea
            id="messageTemplate"
            class="field-input field-textarea"
            v-model="form.messageTemplate"
            rows="6"
            :placeholder="mode === 'bulk' ? 'Halo {{name}}, toko Anda di {{address}} menarik!' : 'Tulis pesan...'"
          ></textarea>
        </div>

        <!-- Attachment -->
        <div class="section-label">
          <PaperclipIcon :size="14" />
          Attachment <span class="optional-tag">optional</span>
        </div>
        <div class="field-group mb-6">
          <input type="file" class="field-input" @change="handleFileSelect" accept="image/*,.pdf" />
        </div>

        <button @click="queueBroadcast" class="btn-send" :disabled="isQueueing">
          <LoaderIcon :size="15" class="spin" v-if="isQueueing" />
          <SendIcon :size="15" v-else />
          <template v-if="mode === 'bulk'">
            {{ isQueueing ? 'Queueing...' : `Blast to ${selectedContacts.length} Contacts` }}
          </template>
          <template v-else>
            {{ isQueueing ? 'Sending...' : 'Send Message' }}
          </template>
        </button>
      </div>

      <!-- Right: Queue Monitor -->
      <div class="monitor-panel card">
        <div class="monitor-header">
          <div class="d-flex align-center gap-2">
            <ActivityIcon :size="16" />
            <span class="card-title">Queue Monitor</span>
          </div>
          <div class="d-flex gap-2">
            <button v-if="jobs.length > 0" class="action-btn-danger" @click="clearQueue" style="font-size: 11px; padding: 5px 10px; border-radius: 8px;">
              <Trash2Icon :size="12" />
              Clear All
            </button>
            <button class="btn-icon" @click="fetchQueueJobs" title="Refresh">
              <RefreshCwIcon :size="14" />
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stat-row mb-5" v-if="stats">
          <div class="stat-block sent">
            <div class="stat-num">{{ stats.SENT || 0 }}</div>
            <div class="stat-label">Sent</div>
          </div>
          <div class="stat-block pending">
            <div class="stat-num">{{ stats.PENDING || 0 }}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-block failed">
            <div class="stat-num">{{ stats.FAILED || 0 }}</div>
            <div class="stat-label">Failed</div>
          </div>
        </div>

        <!-- Jobs Table -->
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Target</th>
                <th>Message</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in jobs" :key="job.id">
                <td class="mono">{{ job.targetJid }}</td>
                <td class="msg-preview" :title="job.messageText">{{ job.messageText }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(job.status)">
                    {{ job.status }}
                  </span>
                </td>
                <td class="text-muted time-cell">{{ new Date(job.createdAt).toLocaleTimeString() }}</td>
                <td>
                  <button class="action-btn-danger" @click="deleteJob(job.id)" title="Delete job" style="padding: 4px 8px; font-size: 11px; border-radius: 6px;">
                    <Trash2Icon :size="12" />
                  </button>
                </td>
              </tr>
              <tr v-if="jobs.length === 0">
                <td colspan="5" class="empty-row">
                  <LayoutListIcon :size="20" />
                  No jobs yet. Enter a Session ID to load.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import {
  UsersIcon, UserIcon, SmartphoneIcon, DatabaseIcon,
  TagIcon, PhoneIcon, MessageSquareIcon, PaperclipIcon,
  SendIcon, LoaderIcon, ActivityIcon, RefreshCwIcon,
  LayoutListIcon, Trash2Icon
} from '@lucide/vue';

const toast = useToast();
const confirm = useConfirm();

const mode = ref<'bulk' | 'single'>('bulk');

const savedSessions = ref<string[]>([]);
const isQueueing = ref(false);
const form = ref({ sessionId: 'default', messageTemplate: '', mediaUrl: '', mediaType: '' });

const batches = ref<any[]>([]);
const selectedBatchId = ref('');
const batchContacts = ref<any[]>([]);

// Per-contact selection using a Set of IDs
const selectedContactIds = ref<Set<string>>(new Set());

const selectedContacts = computed(() =>
  batchContacts.value.filter(c => selectedContactIds.value.has(c.id))
);

const isAllSelected = computed(() =>
  batchContacts.value.length > 0 && selectedContactIds.value.size === batchContacts.value.length
);

const toggleContact = (c: any) => {
  const ids = new Set(selectedContactIds.value);
  if (ids.has(c.id)) ids.delete(c.id);
  else ids.add(c.id);
  selectedContactIds.value = ids;
};

const toggleAll = () => {
  if (isAllSelected.value) {
    selectedContactIds.value = new Set();
  } else {
    selectedContactIds.value = new Set(batchContacts.value.map((c: any) => c.id));
  }
};

const singlePhone = ref('');
const stats = ref<any>(null);
const jobs = ref<any[]>([]);
let pollInterval: number | null = null;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

const statusClass = (s: string) => ({
  'status-sent': s === 'SENT',
  'status-pending': s === 'PENDING' || s === 'PROCESSING',
  'status-failed': s === 'FAILED',
});

const fetchSessions = async () => {
  try {
    const data = await fetchApi('/sessions');
    savedSessions.value = data.map((s: any) => s.id);
  } catch {}
};

const loadBatches = async () => {
  try {
    batches.value = await fetchApi('/scrape/batches');
  } catch {}
};

const deleteJob = async (jobId: string) => {
  confirm.show({
    title: 'Delete Job',
    message: 'Are you sure you want to delete this broadcast job from history?',
    confirmText: 'Delete',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/broadcast/jobs/${jobId}`, {
          method: 'DELETE'
        });
        jobs.value = jobs.value.filter(j => j.id !== jobId);
        if (form.value.sessionId) {
          stats.value = await fetchApi(`/broadcast/${form.value.sessionId}/stats`);
        }
        toast.success('Job deleted from queue history.');
      } catch (error: any) {
        toast.error('Failed to delete job: ' + error.message);
      }
    }
  });
};

const clearQueue = async () => {
  if (!form.value.sessionId) return;
  confirm.show({
    title: 'Clear Queue History',
    message: 'Are you sure you want to clear the entire queue history for this session?',
    confirmText: 'Clear All',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/broadcast/${form.value.sessionId}/clear`, {
          method: 'DELETE'
        });
        jobs.value = [];
        stats.value = { PENDING: 0, PROCESSING: 0, SENT: 0, FAILED: 0, total: 0 };
        toast.success('Queue history cleared successfully.');
      } catch (error: any) {
        toast.error('Failed to clear queue: ' + error.message);
      }
    }
  });
};

const deleteContact = async (contactId: string) => {
  confirm.show({
    title: 'Delete Contact',
    message: 'Are you sure you want to delete this contact from the database?',
    confirmText: 'Delete',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/scrape/contacts/${contactId}`, {
          method: 'DELETE'
        });
        batchContacts.value = batchContacts.value.filter(c => c.id !== contactId);
        const updatedIds = new Set(selectedContactIds.value);
        updatedIds.delete(contactId);
        selectedContactIds.value = updatedIds;
        loadBatches();
        toast.success('Contact deleted successfully.');
      } catch (error: any) {
        toast.error('Failed to delete contact: ' + error.message);
      }
    }
  });
};

const loadBatchContacts = async () => {
  if (!selectedBatchId.value) return;
  batchContacts.value = [];
  selectedContactIds.value = new Set();
  try {
    const data = await fetchApi(`/scrape/batches/${selectedBatchId.value}`);
    batchContacts.value = data;
    // Auto select all
    selectedContactIds.value = new Set(data.map((c: any) => c.id));
  } catch {}
};

const fetchQueueJobs = async () => {
  if (!form.value.sessionId) return;
  try {
    stats.value = await fetchApi(`/broadcast/${form.value.sessionId}/stats`);
    jobs.value = await fetchApi(`/broadcast/${form.value.sessionId}/jobs`);
  } catch {}
};

onMounted(() => {
  fetchSessions();
  loadBatches();
  pollInterval = window.setInterval(fetchQueueJobs, 3000);
});

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval); });

const insertVariable = (variable: string) => {
  const textarea = document.getElementById('messageTemplate') as HTMLTextAreaElement;
  if (!textarea) return;
  const s = textarea.selectionStart;
  const e = textarea.selectionEnd;
  form.value.messageTemplate =
    form.value.messageTemplate.substring(0, s) + variable + form.value.messageTemplate.substring(e);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(s + variable.length, s + variable.length);
  }, 10);
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  const file = target.files[0];
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, { method: 'POST', body: formData });
    const data = await response.json();
    if (response.ok) { 
      form.value.mediaUrl = data.url; 
      form.value.mediaType = file.type; 
      toast.success('Media file uploaded successfully.');
    }
    else throw new Error(data.error);
  } catch (err: any) {
    toast.error('Upload failed: ' + err.message);
    target.value = '';
  }
};

const queueBroadcast = async () => {
  if (!form.value.messageTemplate) {
    toast.warning('Please write a message template.');
    return;
  }
  isQueueing.value = true;
  try {
    let payloadJobs: any[] = [];

    if (mode.value === 'bulk') {
      if (selectedContacts.value.length === 0) throw new Error('No contacts selected');
      payloadJobs = selectedContacts.value.map(c => {
        let text = form.value.messageTemplate
          .replace(/\{\{name\}\}/g, c.name || '')
          .replace(/\{\{phone\}\}/g, c.phone || '')
          .replace(/\{\{address\}\}/g, c.address || '')
          .replace(/\{\{rating\}\}/g, c.rating || '');
        return { targetJid: c.phone, messageText: text, mediaUrl: form.value.mediaUrl || undefined, mediaType: form.value.mediaType || undefined };
      });
    } else {
      if (!singlePhone.value) throw new Error('Please enter a phone number');
      payloadJobs = [{ targetJid: singlePhone.value, messageText: form.value.messageTemplate, mediaUrl: form.value.mediaUrl || undefined, mediaType: form.value.mediaType || undefined }];
    }

    await fetchApi('/broadcast', {
      method: 'POST',
      body: JSON.stringify({ sessionId: form.value.sessionId, jobs: payloadJobs }),
    });

    toast.success(`${payloadJobs.length} message(s) successfully queued!`);
    if (mode.value === 'single') singlePhone.value = '';
    form.value.messageTemplate = '';
    await fetchQueueJobs();
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    isQueueing.value = false;
  }
};
</script>

<style scoped>
.page-wrapper { padding-bottom: 40px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #888; }
.mb-5 { margin-bottom: 18px; }
.mb-6 { margin-bottom: 20px; }

/* Mode Tabs */
.mode-tabs { display: flex; gap: 8px; }
.mode-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 18px; border-radius: 10px;
  border: 1px solid #E0E0E0; background: #fafafa;
  font-size: 13px; font-weight: 500; color: #666;
  cursor: pointer; transition: all 0.2s;
}
.mode-tab.active { background: #111; color: #fff; border-color: #111; }
.mode-tab:hover:not(.active) { background: #f0f0f0; }

/* Layout */
.compose-panel { width: 380px; flex-shrink: 0; }
.monitor-panel { flex: 1; }
.contact-selector {
  border: 1px solid #E8E8E8;
  border-radius: 10px;
  overflow: hidden;
}
.selector-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; background: #FAFAFA;
  border-bottom: 1px solid #EEEEEE;
}
.checkbox-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 500; color: #555;
  cursor: pointer;
}
.selection-count { font-size: 12px; color: #FF5C35; font-weight: 600; }
.contact-scroll-list {
  max-height: 200px; overflow-y: auto;
  display: flex; flex-direction: column;
}
.contact-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; cursor: pointer;
  border-bottom: 1px solid #F5F5F5;
  transition: background 0.15s;
}
.contact-row:last-child { border-bottom: none; }
.contact-row:hover, .contact-row.checked { background: #FFF5F3; }
.contact-info { display: flex; flex-direction: column; flex: 0 0 auto; min-width: 100px; }
.c-name { font-size: 12px; font-weight: 500; color: #111; }
.c-phone { font-size: 11px; color: #888; font-family: monospace; }
.c-address {
  font-size: 11px; color: #aaa; flex: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.delete-contact-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.delete-contact-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: var(--danger);
}

/* Variable chips */
.var-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.var-chip {
  padding: 4px 12px; border-radius: 20px;
  border: 1px solid #E0E0E0; background: #F5F5F5;
  font-size: 12px; font-family: monospace; color: #444;
  cursor: pointer; transition: all 0.15s;
}
.var-chip:hover { background: #111; color: #fff; border-color: #111; }

.optional-tag {
  font-size: 10px; color: #bbb;
  text-transform: none; letter-spacing: 0; font-weight: 400;
}

/* Send button */
.btn-send {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 20px; border-radius: 10px;
  background: #FF5C35; color: #fff;
  font-size: 14px; font-weight: 600;
  border: none; cursor: pointer; transition: background 0.2s;
}
.btn-send:hover:not(:disabled) { background: #e54e2b; }
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

/* Monitor */
.monitor-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.card-title { font-size: 14px; font-weight: 600; color: #111; }

/* Stats */
.stat-row { display: flex; gap: 12px; }
.stat-block {
  flex: 1; padding: 16px; border-radius: 12px;
  text-align: center;
}
.stat-block.sent { background: #FF5C35; color: #fff; }
.stat-block.pending { background: #F5F5F5; color: #111; }
.stat-block.failed { background: #111; color: #fff; }
.stat-num { font-size: 26px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 12px; opacity: 0.75; margin-top: 4px; }

/* Table */
.table-wrapper { overflow: auto; max-height: 440px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; padding: 10px 12px;
  font-size: 11px; font-weight: 600; color: #aaa;
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid #F0F0F0;
  position: sticky; top: 0; background: #fff;
}
.data-table td {
  padding: 12px; font-size: 13px;
  border-bottom: 1px solid #F8F8F8; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #FAFAFA; }
.mono { font-family: monospace; font-size: 12px; }
.msg-preview {
  max-width: 160px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; color: #666;
}
.time-cell { font-size: 11px; color: #bbb; }
.empty-row {
  text-align: center; color: #ccc;
  padding: 40px 20px !important;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.status-badge {
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.status-sent { background: #E8F8EE; color: #2D7A4A; }
.status-pending { background: #FFF4E0; color: #B8700A; }
.status-failed { background: #FDECEA; color: #C0392B; }

.text-muted { color: #bbb; }

.btn-icon {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid #E0E0E0; background: transparent;
  cursor: pointer; color: #666; transition: all 0.2s;
}
.btn-icon:hover { background: #f5f5f5; color: #111; }

.d-flex { display: flex; }
.align-center { align-items: center; }
.gap-2 { gap: 8px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
