<template>
  <div class="blast-queue">
    <div class="d-flex justify-between align-center mb-4">
      <h2>Blast Queue (Broadcast)</h2>
    </div>

    <div class="d-flex gap-4">
      <!-- Form to Queue Broadcasts -->
      <div class="glass-panel flex-1" style="max-width: 400px; height: fit-content;">
        <h3>Queue Broadcast</h3>
        <form @submit.prevent="queueBroadcast">
          <div class="form-group">
            <label class="form-label">Session ID</label>
            <select class="form-control" v-model="form.sessionId" required>
              <option value="" disabled>— Select Session —</option>
              <option v-for="s in savedSessions" :key="s.id" :value="s.id">{{ s.id }} ({{ s.status }})</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Target Numbers (Comma separated, country code prefix, e.g. 628xxx)</label>
            <textarea class="form-control" v-model="rawNumbers" rows="3" required placeholder="6281234, 6285678"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Message Text</label>
            <textarea class="form-control" v-model="form.messageText" rows="5" required placeholder="Promo message here..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Media Attachment (Image/PDF) - Optional</label>
            <input type="file" class="form-control" @change="handleFileSelect" accept="image/*,.pdf" />
          </div>
          
          <button type="submit" class="btn btn-primary mt-2" style="width: 100%;" :disabled="loading">
            {{ loading ? 'Queueing...' : 'Add to Queue' }}
          </button>
        </form>
      </div>

      <!-- Live Monitoring -->
      <div class="glass-panel" style="flex: 2;">
        <div class="d-flex justify-between mb-4 align-center">
          <h3>Live Monitoring</h3>
          <div class="d-flex gap-2">
            <select class="form-control" v-model="viewSessionId" style="width: 200px; padding: 6px 12px; margin-bottom: 0;">
              <option value="" disabled>Filter by Session</option>
              <option v-for="s in savedSessions" :key="s.id" :value="s.id">{{ s.id }}</option>
            </select>
          </div>
        </div>

        <div class="stats-grid mt-4">
          <div class="stat-card">
            <h4>Total</h4>
            <span class="value">{{ stats.total }}</span>
          </div>
          <div class="stat-card pending">
            <h4>Pending</h4>
            <span class="value">{{ stats.PENDING }}</span>
          </div>
          <div class="stat-card processing">
            <h4>Processing</h4>
            <span class="value">{{ stats.PROCESSING }}</span>
          </div>
          <div class="stat-card sent">
            <h4>Sent</h4>
            <span class="value">{{ stats.SENT }}</span>
          </div>
          <div class="stat-card failed">
            <h4>Failed</h4>
            <span class="value">{{ stats.FAILED }}</span>
          </div>
        </div>
        
        <p class="mt-4" style="font-size: 14px; text-align: center;">
          Data is auto-refreshing every 5 seconds.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { fetchApi } from '../services/api';

const viewSessionId = ref('default');
const rawNumbers = ref('');
const loading = ref(false);
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
  messageText: ''
});

const stats = ref({
  PENDING: 0,
  PROCESSING: 0,
  SENT: 0,
  FAILED: 0,
  total: 0
});

let pollInterval: number | null = null;

const fetchStats = async () => {
  if (!viewSessionId.value) return;
  try {
    const data = await fetchApi(`/broadcast/${viewSessionId.value}/stats`);
    stats.value = data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

const selectedFile = ref<File | null>(null);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  } else {
    selectedFile.value = null;
  }
};

const queueBroadcast = async () => {
  if (!rawNumbers.value) return;
  
  const numbers = rawNumbers.value.split(',').map(n => n.trim()).filter(n => n);
  if (numbers.length === 0) return;

  loading.value = true;
  try {
    let mediaUrl = undefined;
    let mediaType = undefined;

    if (selectedFile.value) {
      const formData = new FormData();
      formData.append('file', selectedFile.value);
      
      const token = localStorage.getItem('adminToken');
      // Using native fetch because fetchApi sends application/json by default
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();
      mediaUrl = uploadData.mediaUrl;
      mediaType = uploadData.mediaType;
    }

    const jobs = numbers.map(num => ({
      targetJid: num,
      messageText: form.value.messageText,
      ...(mediaUrl ? { mediaUrl, mediaType } : {})
    }));

    await fetchApi('/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: form.value.sessionId,
        jobs
      })
    });
    
    // Clear form except session
    rawNumbers.value = '';
    form.value.messageText = '';
    selectedFile.value = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    // Immediate fetch
    if (viewSessionId.value === form.value.sessionId) {
      fetchStats();
    }
    
    alert(`Successfully queued ${jobs.length} messages.`);
  } catch (error: any) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSessions();
  fetchStats();
  pollInterval = window.setInterval(fetchStats, 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

watch(viewSessionId, () => {
  fetchStats();
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(1, 4, 9, 0.5);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.stat-card h4 {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-card .value {
  font-size: 32px;
  font-weight: 700;
}

.stat-card.pending .value { color: var(--warning); }
.stat-card.processing .value { color: var(--primary); }
.stat-card.sent .value { color: var(--success); }
.stat-card.failed .value { color: var(--danger); }
</style>
