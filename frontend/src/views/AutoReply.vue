<template>
  <div class="auto-reply">
    
    <!-- Page Header -->
    <div class="page-header mb-6">
      <h1 class="page-title">Auto Reply Rules</h1>
      <p class="page-subtitle">Configure automated responses for incoming WhatsApp messages</p>
    </div>

    <div class="split-layout">
      <!-- Add Rule Card -->
      <div class="card compose-panel">
        <div class="section-label">
          <PlusIcon :size="14" />
          Add New Rule
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
          Define a keyword that triggers an automated reply message.
        </p>
        <form @submit.prevent="addRule">
            <input type="text" class="field-input" value="Primary Session (Auto)" disabled />
          <div class="form-group mb-4">
            <label class="form-label">Keyword</label>
            <input type="text" class="field-input" v-model="form.keyword" required placeholder="e.g. price" />
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Match Type</label>
            <select class="field-input" v-model="form.isExact">
              <option :value="true">Exact Match</option>
              <option :value="false">Contains</option>
            </select>
          </div>
          <div class="form-group mb-5">
            <label class="form-label">Reply Text</label>
            <textarea class="field-input field-textarea" v-model="form.replyText" rows="4" required placeholder="Your automated response..."></textarea>
          </div>
          <button type="submit" class="btn-primary-solid" style="width: 100%; justify-content: center;">
            <PlusIcon :size="14" />
            Save Rule
          </button>
        </form>
      </div>

      <!-- Current Rules Card -->
      <div class="card monitor-panel">
        <div class="card-header">
          <div class="d-flex align-center gap-2">
            <MessageSquareIcon :size="16" />
            <span class="card-title">Rules List</span>
          </div>
          <div class="d-flex gap-2">

            <button class="btn-icon" @click="fetchRules" title="Refresh list">
              <RefreshCwIcon :size="14" />
            </button>
          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Match Type</th>
                <th>Reply</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in rules" :key="rule.id">
                <td><strong class="mono">{{ rule.keyword }}</strong></td>
                <td>
                  <span class="status-badge" :class="rule.isExact ? 'status-sent' : 'status-pending'">
                    {{ rule.isExact ? 'Exact' : 'Contains' }}
                  </span>
                </td>
                <td class="msg-preview" :title="rule.replyText">
                  {{ rule.replyText }}
                </td>
                <td>
                  <button class="action-btn-danger" @click="deleteRule(rule.id)">
                    <Trash2Icon :size="13" />
                    Delete
                  </button>
                </td>
              </tr>
              <tr v-if="rules.length === 0">
                <td colspan="4" class="empty-row">
                  <MessageSquareIcon :size="20" style="opacity: 0.3;" />
                  No rules found for this session. Add one on the left.
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
import { ref, onMounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import { PlusIcon, MessageSquareIcon, RefreshCwIcon, Trash2Icon } from '@lucide/vue';

const toast = useToast();
const confirm = useConfirm();

const rules = ref<any[]>([]);
const savedSessions = ref<{id: string, status: string}[]>([]);

const fetchSessions = async () => {
  try {
    const data = await fetchApi('/sessions');
    savedSessions.value = data;
  } catch (error) {
    console.error('Failed to fetch sessions', error);
  }
};

const form = ref({
  sessionId: 'default',
  keyword: '',
  isExact: true,
  replyText: ''
});

const fetchRules = async () => {
  try {
    const data = await fetchApi(`/autoreply/default`); // backend ignores the param anyway
    rules.value = data;
  } catch (error: any) {
    toast.error(error.message);
  }
};

const addRule = async () => {
  try {
    await fetchApi('/autoreply', {
      method: 'POST',
      body: JSON.stringify(form.value)
    });
    toast.success('Auto reply rule saved successfully.');
    form.value.keyword = '';
    form.value.replyText = '';
    
    if (true) {
      fetchRules();
    }
  } catch (error: any) {
    toast.error(error.message);
  }
};

const deleteRule = async (id: string) => {
  confirm.show({
    title: 'Delete Rule',
    message: 'Are you sure you want to delete this auto reply rule?',
    confirmText: 'Delete',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/autoreply/default/${id}`, {
          method: 'DELETE'
        });
        toast.success('Auto reply rule deleted.');
        fetchRules();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  });
};

onMounted(() => {
  fetchSessions();
  fetchRules();
});
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #888; }

/* Layout */
.compose-panel { width: 340px; flex-shrink: 0; }
.monitor-panel { flex: 1; }

@media (max-width: 992px) {
  .compose-panel {
    width: 100%;
  }
}

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
.msg-preview {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
}

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

/* Action Buttons */
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

.d-flex { display: flex; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
</style>
