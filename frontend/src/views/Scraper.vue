<template>
  <div class="page-wrapper">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Maps Scraper</h1>
        <p class="page-subtitle">Extract business contacts from Google Maps</p>
      </div>
    </div>

    <!-- Scraper Input Card -->
    <div class="card mb-6">
      <form @submit.prevent="runScraper" class="scrape-form">
        <div class="field-group flex-1">
          <label class="field-label">Search Query</label>
          <div class="input-wrapper">
            <SearchIcon :size="16" class="input-icon" />
            <input
              type="text"
              class="field-input with-icon"
              v-model="scrapeQuery"
              placeholder="e.g. Coffee Shop in Yogyakarta"
              :disabled="isScraping"
              required
            />
          </div>
        </div>
        <div class="field-group" style="width: 140px;">
          <label class="field-label">Max Results</label>
          <input
            type="number"
            class="field-input"
            v-model="scrapeLimit"
            min="1" max="60"
            :disabled="isScraping"
          />
        </div>
        <button type="submit" class="btn-primary-solid" :disabled="isScraping">
          <LoaderIcon :size="16" v-if="isScraping" class="spin" />
          <MapPinIcon :size="16" v-else />
          {{ isScraping ? 'Scraping...' : 'Start Scraping' }}
        </button>
      </form>
    </div>

    <!-- Live Log Terminal -->
    <div class="card mb-6 terminal-card" v-if="isScraping || logs.length > 0">
      <div class="terminal-header">
        <div class="d-flex align-center gap-2">
          <TerminalIcon :size="15" />
          <span class="terminal-title">Live Progress</span>
        </div>
        <div class="terminal-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
      </div>
      <div class="terminal-body" ref="logContainer">
        <div
          v-for="(log, i) in logs"
          :key="i"
          class="log-line"
          :class="'log-' + log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-prefix">{{ logPrefix(log.type) }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        <div v-if="isScraping && logs.length === 0" class="log-line log-info">
          <span class="log-time">--:--:--</span>
          <span class="log-prefix">[ INFO ]</span>
          <span class="log-msg">Connecting to Google Maps...</span>
        </div>
        <div v-if="isScraping" class="log-cursor">▋</div>
      </div>
    </div>

    <!-- Main Content: History + Details -->
    <div class="split-layout">

      <!-- History List -->
      <div class="card history-panel">
        <div class="card-header">
          <div class="d-flex align-center gap-2">
            <DatabaseIcon :size="16" />
            <span class="card-title">Saved Batches</span>
          </div>
          <button class="btn-icon" @click="loadBatches" title="Refresh">
            <RefreshCwIcon :size="14" />
          </button>
        </div>

        <div class="batch-list">
          <div
            v-for="batch in batches"
            :key="batch.id"
            class="batch-item"
            :class="{ active: selectedBatch?.id === batch.id }"
            @click="selectBatch(batch)"
          >
            <div class="d-flex justify-between align-center">
              <span class="batch-query">{{ batch.query }}</span>
              <div class="d-flex align-center gap-2">
                <span class="contact-chip">{{ batch._count.contacts }}</span>
                <button class="delete-batch-btn" @click="deleteBatch(batch.id, $event)" title="Delete batch">
                  <Trash2Icon :size="13" />
                </button>
              </div>
            </div>
            <span class="batch-date">{{ formatDate(batch.createdAt) }}</span>
          </div>
          <div v-if="batches.length === 0" class="empty-state">
            <DatabaseIcon :size="32" class="empty-icon" />
            <p>No batches yet</p>
          </div>
        </div>
      </div>

      <!-- Contact Table -->
      <div class="card detail-panel">
        <div class="card-header">
          <div class="d-flex align-center gap-2">
            <UsersIcon :size="16" />
            <span class="card-title">
              {{ selectedBatch ? selectedBatch.query : 'Select a batch' }}
            </span>
            <span v-if="selectedBatch" class="contact-chip">{{ batchContacts.length }} contacts</span>
            <span v-if="selectedBatch" class="coverage-chip" title="Data completeness of this batch">
              {{ phoneCount }} phone · {{ emailCount }} email · {{ websiteCount }} web
            </span>
          </div>
          <router-link v-if="selectedBatch" to="/blaster" class="btn-secondary-solid">
            <SendIcon :size="14" />
            Open in CRM
          </router-link>
        </div>

        <div v-if="!selectedBatch" class="empty-state large">
          <MousePointerClickIcon :size="40" class="empty-icon" />
          <p>Click a batch from the left panel to view its contacts</p>
        </div>

        <div v-else-if="batchContacts.length === 0" class="empty-state large">
          <LoaderIcon :size="32" class="empty-icon spin" />
          <p>Loading contacts...</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Website</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(contact, idx) in batchContacts" :key="contact.id || idx">
                <td class="text-muted" style="width:40px;">{{ idx + 1 }}</td>
                <td class="contact-name">
                  <a
                    v-if="contact.mapsUrl"
                    :href="contact.mapsUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="maps-link"
                    title="Open in Google Maps"
                  >{{ contact.name }}</a>
                  <template v-else>{{ contact.name }}</template>
                </td>
                <td class="contact-phone" :class="{ 'is-empty': !hasVal(contact.phone) }">{{ display(contact.phone) }}</td>
                <td class="contact-address" :class="{ 'is-empty': !hasVal(contact.address) }" :title="contact.address">{{ display(contact.address) }}</td>
                <td>
                  <a
                    v-if="contact.website && contact.website !== 'N/A'"
                    :href="contact.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="website-link"
                    :title="contact.website"
                  >
                    <GlobeIcon :size="13" />
                    <span class="website-domain">{{ extractDomain(contact.website) }}</span>
                  </a>
                  <span class="text-muted" v-else>—</span>
                </td>
                <td>
                  <a
                    v-if="contact.email && contact.email !== 'N/A'"
                    :href="`mailto:${contact.email}`"
                    class="email-link"
                    :title="contact.email"
                  >
                    <MailIcon :size="13" />
                    <span class="email-text">{{ contact.email }}</span>
                  </a>
                  <span class="text-muted" v-else>—</span>
                </td>
                <td>
                  <span class="rating-badge" v-if="contact.rating && contact.rating !== 'N/A'">
                    <StarIcon :size="11" />{{ contact.rating }}
                  </span>
                  <span class="text-muted" v-else>—</span>
                </td>
                <td>
                  <button class="action-btn-danger" @click="deleteContact(contact.id)" title="Delete contact" style="padding: 4px 8px; font-size: 11px; border-radius: 6px;">
                    <Trash2Icon :size="12" />
                  </button>
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
import { ref, computed, nextTick, onUnmounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import {
  SearchIcon, MapPinIcon, LoaderIcon, TerminalIcon,
  DatabaseIcon, UsersIcon, RefreshCwIcon, SendIcon,
  MousePointerClickIcon, StarIcon, Trash2Icon, GlobeIcon, MailIcon
} from '@lucide/vue';

const toast = useToast();
const confirm = useConfirm();

const scrapeQuery = ref('');
const scrapeLimit = ref(20);
const isScraping = ref(false);

const batches = ref<any[]>([]);
const selectedBatch = ref<any>(null);
const batchContacts = ref<any[]>([]);

const logs = ref<{ type: string; msg: string; time: string }[]>([]);
const logContainer = ref<HTMLElement | null>(null);

let eventSource: EventSource | null = null;

const logPrefix = (type: string) => {
  const map: Record<string, string> = {
    start: '[ START ]',
    info: '[ INFO  ]',
    progress: '[ SCROLL]',
    phone: '[ PHONE ]',
    done: '[ DONE  ]',
    error: '[ ERROR ]',
  };
  return map[type] || '[ LOG   ]';
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const extractDomain = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// ─── Cell display helpers (everything is saved, empty values just show "—" ) ──
const hasVal = (v: any) => !!(v && v !== 'N/A');
const display = (v: any) => (hasVal(v) ? v : '—');

const phoneCount = computed(() => batchContacts.value.filter((c: any) => hasVal(c.phone)).length);
const emailCount = computed(() => batchContacts.value.filter((c: any) => hasVal(c.email)).length);
const websiteCount = computed(() => batchContacts.value.filter((c: any) => hasVal(c.website)).length);

const appendLog = async (data: { type: string; msg: string }) => {
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  logs.value.push({ ...data, time: now });
  await nextTick();
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
};

const startSSE = () => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token = localStorage.getItem('adminToken') || '';
  eventSource = new EventSource(`${apiBase}/scrape/logs?token=${token}`);
  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    appendLog(data);
    if (data.type === 'done') {
      isScraping.value = false;
      closeSSE();
      loadBatches();
    }
  };
  eventSource.onerror = () => {
    closeSSE();
  };
};

const closeSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
};

onUnmounted(() => closeSSE());

const loadBatches = async () => {
  try {
    const data = await fetchApi('/scrape/batches');
    batches.value = data;
    if (selectedBatch.value) {
      const updated = data.find((b: any) => b.id === selectedBatch.value.id);
      if (updated) selectedBatch.value = updated;
    }
  } catch (error) {
    console.error('Failed to load batches', error);
  }
};

const deleteBatch = async (batchId: string, event: Event) => {
  event.stopPropagation();
  confirm.show({
    title: 'Delete Scrape Batch',
    message: 'Are you sure you want to permanently delete this scrape batch and all associated contacts?',
    confirmText: 'Delete',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/scrape/batches/${batchId}`, {
          method: 'DELETE'
        });
        if (selectedBatch.value?.id === batchId) {
          selectedBatch.value = null;
          batchContacts.value = [];
        }
        await loadBatches();
        toast.success('Scrape batch deleted successfully.');
      } catch (error: any) {
        toast.error('Failed to delete batch: ' + error.message);
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
        await loadBatches();
        toast.success('Contact deleted successfully.');
      } catch (error: any) {
        toast.error('Failed to delete contact: ' + error.message);
      }
    }
  });
};

const selectBatch = async (batch: any) => {
  selectedBatch.value = batch;
  batchContacts.value = [];
  try {
    const data = await fetchApi(`/scrape/batches/${batch.id}`);
    batchContacts.value = data;
  } catch (error) {
    console.error('Failed to load contacts', error);
  }
};

const runScraper = async () => {
  if (!scrapeQuery.value) return;
  isScraping.value = true;
  logs.value = [];
  startSSE();
  try {
    const newBatch = await fetchApi('/scrape', {
      method: 'POST',
      body: JSON.stringify({ query: scrapeQuery.value, limit: scrapeLimit.value })
    });
    
    // Automatically load the fresh lists and select the new batch
    await loadBatches();
    selectBatch(newBatch);
    toast.success('Scraping completed!');
    
  } catch (error: any) {
    appendLog({ type: 'error', msg: error.message });
  } finally {
    isScraping.value = false;
    closeSSE();
  }
};

loadBatches();
</script>

<style scoped>
.page-wrapper { padding-bottom: 40px; }

.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #888; }

/* Scraper Form */
.scrape-form { display: flex; gap: 12px; align-items: flex-end; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; font-weight: 500; color: #666; }
.input-wrapper { position: relative; }
.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
}
.field-input.with-icon { padding-left: 36px; }

/* Terminal */
.terminal-card { padding: 0; overflow: hidden; }
.terminal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: #1C1C1E;
  border-radius: 13px 13px 0 0;
}
.terminal-title { font-size: 12px; font-weight: 500; color: #888; }
.terminal-dots { display: flex; gap: 6px; }
.dot { width: 12px; height: 12px; border-radius: 6px; }
.dot-red { background: #FF5F57; }
.dot-yellow { background: #FEBC2E; }
.dot-green { background: #28C840; }

.terminal-body {
  background: #1C1C1E;
  padding: 16px;
  min-height: 120px;
  max-height: 260px;
  overflow-y: auto;
  border-radius: 0 0 13px 13px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
}

.log-line { display: flex; gap: 10px; }
.log-time { color: #555; min-width: 65px; }
.log-prefix { min-width: 70px; font-weight: 600; }
.log-msg { color: #d4d4d4; }
.log-start .log-prefix { color: #FF5C35; }
.log-info .log-prefix { color: #60AFFF; }
.log-progress .log-prefix { color: #FEBC2E; }
.log-phone .log-prefix { color: #28C840; }
.log-done .log-prefix { color: #28C840; }
.log-error .log-prefix { color: #FF5F57; }
.log-cursor { color: #ddd; animation: blink 1s step-end infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* Split layout */
.split-layout { display: flex; gap: 16px; }
.history-panel { width: 280px; flex-shrink: 0; padding: 16px; }
.detail-panel { flex: 1; overflow: hidden; }

@media (max-width: 992px) {
  .split-layout {
    flex-direction: column;
    align-items: stretch;
  }
  .history-panel {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .scrape-form {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .scrape-form > div {
    width: 100% !important;
  }
  .scrape-form button {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
  }
}

/* Batch List */
.batch-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 480px; }
.batch-item {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: #FAFAFA;
  cursor: pointer;
  transition: all 0.15s;
}
.batch-item:hover { background: #f0f0f0; }
.batch-item.active { background: #FFF0ED; border-color: #FF5C35; }
.batch-query { font-size: 13px; font-weight: 500; color: #111; }
.batch-date { font-size: 11px; color: #aaa; margin-top: 4px; display: block; }
.contact-chip {
  font-size: 11px; font-weight: 600;
  background: #111; color: #fff;
  padding: 2px 8px; border-radius: 20px;
}
.batch-item.active .contact-chip { background: #FF5C35; }
.coverage-chip {
  font-size: 11px;
  color: #888;
  background: #F5F5F5;
  border: 1px solid #EBEBEB;
  padding: 2px 8px;
  border-radius: 20px;
}

.delete-batch-btn {
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
}
.delete-batch-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: var(--danger);
}
.batch-item.active .delete-batch-btn {
  color: rgba(255, 92, 53, 0.7);
}
.batch-item.active .delete-batch-btn:hover {
  color: var(--danger);
  background: rgba(255, 59, 48, 0.15);
}

.action-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #FFF0ED;
  color: #FF3B30;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn-danger:hover {
  background: #FFDED9;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #aaa;
  font-size: 13px;
}
.empty-state.large { padding: 60px 20px; }
.empty-icon { margin: 0 auto 12px; display: block; opacity: 0.3; }

/* Table */
.table-wrapper { overflow: auto; max-height: 500px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #F0F0F0;
  position: sticky; top: 0; background: #fff;
}
.data-table td {
  padding: 12px 14px;
  font-size: 13px;
  border-bottom: 1px solid #F8F8F8;
  vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #FAFAFA; }
.contact-name { font-weight: 500; color: #111; }
.contact-phone { font-family: monospace; color: #444; }
.maps-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed #ccc;
}
.maps-link:hover { color: #FF5C35; border-bottom-color: #FF5C35; }
.is-empty { color: #c4c4c4; }
.contact-address {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
}

.website-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #3B82F6;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  transition: all 0.15s;
  max-width: 130px;
  overflow: hidden;
}
.website-link:hover {
  background: #DBEAFE;
  color: #1D4ED8;
}
.website-domain {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  display: inline-block;
}
.email-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #059669;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  transition: all 0.15s;
  max-width: 170px;
  overflow: hidden;
}
.email-link:hover {
  background: #D1FAE5;
  color: #047857;
}
.email-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  display: inline-block;
}

.rating-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 500;
  background: #FFF8E7; color: #B8860B;
  padding: 2px 8px; border-radius: 6px;
}
.text-muted { color: #bbb; }

/* Utility */
.d-flex { display: flex; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
.flex-1 { flex: 1; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
