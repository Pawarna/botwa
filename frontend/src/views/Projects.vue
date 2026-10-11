<template>
  <div class="page-wrapper">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Project Management</h1>
        <p class="page-subtitle">Track leads and project progress — Concern Ecosystem</p>
      </div>
      <div class="d-flex gap-3">
        <button class="tab-btn" :class="{ active: view === 'leads' }" @click="view = 'leads'">
          <UsersIcon :size="14" /> Client Leads
          <span class="count-badge" v-if="leads.length">{{ leads.length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: view === 'projects' }" @click="view = 'projects'">
          <KanbanIcon :size="14" /> Projects
          <span class="count-badge accent" v-if="projects.length">{{ projects.length }}</span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ LEADS VIEW -->
    <div v-if="view === 'leads'">

      <!-- Toolbar -->
      <div class="toolbar mb-5">
        <div class="d-flex gap-2 align-center">
          <button class="btn-primary" @click="showLeadForm = true">
            <PlusIcon :size="14" /> Tambah Lead Manual
          </button>
          <div class="search-box">
            <SearchIcon :size="14" class="search-icon" />
            <input v-model="leadSearch" type="text" placeholder="Cari lead..." class="search-input" />
          </div>
          <!-- Kalender filter tanggal kirim -->
          <div class="cal-wrap">
            <button class="date-filter cal-btn" @click.stop="showCalendar = !showCalendar">
              <CalendarIcon :size="13" />
              {{ calButtonLabel }}
            </button>
            <div class="cal-overlay" v-if="showCalendar" @click="showCalendar = false"></div>
            <div class="cal-pop" v-if="showCalendar" @click.stop>
              <div class="cal-head">
                <button class="cal-nav" @click="shiftMonth(-1)" title="Bulan sebelumnya"><ChevronLeftIcon :size="13" /></button>
                <span>{{ monthLabel }}</span>
                <button class="cal-nav" @click="shiftMonth(1)" title="Bulan berikutnya"><ChevronRightIcon :size="13" /></button>
              </div>
              <div class="cal-grid">
                <span class="cal-dow" v-for="d in ['Sn','Sl','Rb','Km','Jm','Sb','Mg']" :key="d">{{ d }}</span>
                <button
                  v-for="cell in calCells" :key="cell.key"
                  class="cal-day"
                  :class="{
                    other: !cell.inMonth,
                    today: cell.isToday,
                    selected: cell.dateStr === selectedDate,
                    'has-data': countOf(cell.dateStr) > 0,
                  }"
                  :title="countOf(cell.dateStr) ? countOf(cell.dateStr) + ' lead dikirim' : ''"
                  @click="pickDate(cell.dateStr)"
                >
                  {{ cell.day }}
                  <span v-if="countOf(cell.dateStr)" class="cal-dot">{{ countOf(cell.dateStr) }}</span>
                </button>
              </div>
              <div class="cal-foot">
                <button class="cal-link" :class="{ active: neverOnly }" @click="pickNever">Belum dihubungi</button>
                <button class="cal-link" @click="clearDate">Reset</button>
              </div>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button
            v-for="s in leadStatuses" :key="s.value"
            class="filter-pill"
            :class="{ active: leadFilter === s.value }"
            @click="leadFilter = leadFilter === s.value ? '' : s.value"
          >
            {{ s.label }}
            <span class="pill-count">{{ countByStatus(s.value) }}</span>
          </button>
        </div>
      </div>

      <!-- Lead Table -->
      <div class="card table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama / Kontak</th>
                <th>Sumber</th>
                <th>Website</th>
                <th>Status Pipeline</th>
                <th>Catatan</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in leadGroups" :key="group.key">
                <tr class="group-row">
                  <td colspan="7">
                    <CalendarIcon :size="11" /> {{ group.label }}
                    <span class="group-count">{{ group.items.length }}</span>
                  </td>
                </tr>
                <tr v-for="lead in group.items" :key="lead.id" :class="'row-' + lead.status.toLowerCase()">
                <td>
                  <div class="contact-cell">
                    <div class="contact-avatar">{{ lead.name.charAt(0) }}</div>
                    <div>
                      <div class="c-name">{{ lead.name }}</div>
                      <div class="c-sub">{{ lead.phone || lead.email || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="source-tag" :class="'src-' + lead.source">{{ lead.source }}</span>
                  <div class="c-sub" v-if="lead.batchQuery">{{ lead.batchQuery }}</div>
                </td>
                <td>
                  <a v-if="lead.website && lead.website !== 'N/A'" :href="lead.website" target="_blank" class="website-mini">
                    <GlobeIcon :size="11" /> {{ extractDomain(lead.website) }}
                  </a>
                  <span class="text-muted" v-else>—</span>
                </td>
                <td>
                  <select
                    class="status-select"
                    :class="'sel-' + lead.status.toLowerCase()"
                    :value="lead.status"
                    @change="changeLeadStatus(lead, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="s in leadStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                  <span class="auto-badge" v-if="lead.project">
                    <ZapIcon :size="10" /> Auto Project
                  </span>
                </td>
                <td>
                  <span class="note-text" :title="lead.notes">{{ lead.notes ? lead.notes.substring(0, 40) + (lead.notes.length > 40 ? '…' : '') : '—' }}</span>
                </td>
                <td class="text-muted date-cell">
                  {{ formatDate(lead.createdAt) }}
                  <div class="sent-time" v-if="lead.contactedAt">Dikirim {{ formatTime(lead.contactedAt) }}</div>
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <button class="icon-action" @click="deleteLead(lead.id)" title="Hapus">
                      <Trash2Icon :size="13" />
                    </button>
                    <button v-if="lead.project" class="icon-action btn-view-project" @click="router.push('/projects/' + lead.project.id)" title="Lihat Progress Project">
                      <ExternalLinkIcon :size="13" />
                    </button>
                  </div>
                </td>
              </tr>
              </template>
              <tr v-if="filteredLeads.length === 0">
                <td colspan="7" class="empty-row">
                  <UsersIcon :size="20" />
                  Belum ada leads. Tambah manual atau ubah status kontak di CRM menjadi Accepted.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════ PROJECTS VIEW -->
    <div v-else>

      <!-- Toolbar -->
      <div class="toolbar mb-5">
        <button class="btn-primary" @click="showProjectForm = true">
          <PlusIcon :size="14" /> Tambah Proyek Manual
        </button>
        <div class="d-flex gap-2 align-center">
          <span class="text-muted" style="font-size: 12px;">{{ projects.length }} proyek total</span>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        <div class="kanban-col" v-for="col in kanbanCols" :key="col.status">
          <div class="kanban-col-header" :class="'kh-' + col.status.toLowerCase()">
            <div class="d-flex align-center gap-2">
              <component :is="col.icon" :size="13" />
              <span>{{ col.label }}</span>
            </div>
            <span class="k-count">{{ projectsByStatus(col.status).length }}</span>
          </div>

          <div class="kanban-cards">
            <div
              class="kanban-card"
              v-for="p in projectsByStatus(col.status)"
              :key="p.id"
              @click="router.push('/projects/' + p.id)"
            >
              <div class="kc-header">
                <div class="kc-name">{{ p.name }}</div>
                <button class="kc-edit-btn" @click.stop="openEditModal(p)" title="Edit Proyek">
                  <EditIcon :size="12" />
                </button>
              </div>
              <div class="kc-client">
                <UserIcon :size="11" /> {{ p.clientName }}
              </div>
              <!-- Mini progress bar -->
              <div class="kc-progress-bar">
                <div class="kc-progress-fill" :class="'kpf-' + p.status.toLowerCase()" :style="{ width: getProjectProgress(p.status) + '%' }"></div>
              </div>
              <div class="kc-meta">
                <span class="source-tag" :class="'src-' + p.source" style="font-size: 10px;">{{ p.source }}</span>
                <span class="kc-date">{{ formatDate(p.createdAt) }}</span>
              </div>
              <div class="kc-footer" v-if="p.clientPhone || p.clientEmail">
                <span v-if="p.clientPhone" class="kc-contact"><PhoneIcon :size="10" /> {{ p.clientPhone }}</span>
                <span v-if="p.clientEmail" class="kc-contact"><MailIcon :size="10" /> {{ p.clientEmail }}</span>
              </div>
              <span class="auto-badge" v-if="p.lead">
                <ZapIcon :size="10" /> Dari Scraping
              </span>
            </div>

            <div class="kanban-empty" v-if="projectsByStatus(col.status).length === 0">
              <component :is="col.icon" :size="16" style="opacity: 0.25;" />
              <span>Kosong</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ MODAL: Add Lead -->
    <div class="modal-overlay" v-if="showLeadForm" @click.self="showLeadForm = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3><PlusIcon :size="16" /> Tambah Lead Manual</h3>
          <button class="modal-close" @click="showLeadForm = false"><XIcon :size="16" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field-group">
              <label>Nama <span class="req">*</span></label>
              <input v-model="leadForm.name" type="text" class="field-input" placeholder="Nama klien / bisnis" />
            </div>
            <div class="field-group">
              <label>Nomor HP</label>
              <input v-model="leadForm.phone" type="text" class="field-input" placeholder="628xxx" />
            </div>
            <div class="field-group">
              <label>Email</label>
              <input v-model="leadForm.email" type="email" class="field-input" placeholder="email@contoh.com" />
            </div>
            <div class="field-group">
              <label>Website</label>
              <input v-model="leadForm.website" type="url" class="field-input" placeholder="https://..." />
            </div>
            <div class="field-group">
              <label>Alamat</label>
              <input v-model="leadForm.address" type="text" class="field-input" placeholder="Alamat" />
            </div>
            <div class="field-group">
              <label>Sumber</label>
              <select v-model="leadForm.source" class="field-input">
                <option value="manual">Manual</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="scraper">Scraper</option>
              </select>
            </div>
          </div>
          <div class="field-group mt-3">
            <label>Catatan</label>
            <textarea v-model="leadForm.notes" class="field-input" rows="3" placeholder="Catatan tambahan..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showLeadForm = false">Batal</button>
          <button class="btn-primary" @click="submitLead" :disabled="isSubmitting">
            <LoaderIcon :size="14" class="spin" v-if="isSubmitting" />
            <PlusIcon :size="14" v-else />
            Simpan Lead
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════ MODAL: Add / Edit Project -->
    <div class="modal-overlay" v-if="showProjectForm || editingProject" @click.self="closeProjectModal()">
      <div class="modal-box">
        <div class="modal-header">
          <h3><KanbanIcon :size="16" /> {{ editingProject ? 'Edit Proyek' : 'Tambah Proyek Manual' }}</h3>
          <button class="modal-close" @click="closeProjectModal()"><XIcon :size="16" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field-group" style="grid-column: 1 / -1;">
              <label>Nama Proyek <span class="req">*</span></label>
              <input v-model="projectForm.name" type="text" class="field-input" placeholder="Nama proyek" />
            </div>
            <div class="field-group">
              <label>Nama Klien <span class="req">*</span></label>
              <input v-model="projectForm.clientName" type="text" class="field-input" placeholder="Nama klien" />
            </div>
            <div class="field-group">
              <label>Status</label>
              <select v-model="projectForm.status" class="field-input">
                <option v-for="col in kanbanCols" :key="col.status" :value="col.status">{{ col.label }}</option>
              </select>
            </div>
            <div class="field-group">
              <label>No. HP Klien</label>
              <input v-model="projectForm.clientPhone" type="text" class="field-input" placeholder="628xxx" />
            </div>
            <div class="field-group">
              <label>Email Klien</label>
              <input v-model="projectForm.clientEmail" type="email" class="field-input" placeholder="email@..." />
            </div>
            <div class="field-group">
              <label>Sumber</label>
              <select v-model="projectForm.source" class="field-input">
                <option value="manual">Manual</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="scraper">Scraper</option>
              </select>
            </div>
          </div>
          <div class="field-group mt-3">
            <label>Deskripsi / Catatan</label>
            <textarea v-model="projectForm.notes" class="field-input" rows="3" placeholder="Deskripsi proyek, scope, dll..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeProjectModal()">Batal</button>
          <button v-if="editingProject" class="btn-danger" @click="deleteProject(editingProject.id)" style="margin-right: auto;">
            <Trash2Icon :size="14" /> Hapus
          </button>
          <button class="btn-primary" @click="submitProject" :disabled="isSubmitting">
            <LoaderIcon :size="14" class="spin" v-if="isSubmitting" />
            <CheckIcon :size="14" v-else />
            {{ editingProject ? 'Simpan Perubahan' : 'Buat Proyek' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import {
  UsersIcon, KanbanIcon, PlusIcon, SearchIcon, Trash2Icon,
  GlobeIcon, ZapIcon, UserIcon, PhoneIcon, MailIcon, XIcon,
  LoaderIcon, CheckIcon, ClipboardListIcon, CodeIcon, EyeIcon,
  CheckCircleIcon, PauseCircleIcon, ExternalLinkIcon, EditIcon, CalendarIcon,
  ChevronLeftIcon, ChevronRightIcon
} from '@lucide/vue';

const toast = useToast();
const confirm = useConfirm();
const router = useRouter();

const view = ref<'leads' | 'projects'>('leads');
const leads = ref<any[]>([]);
const projects = ref<any[]>([]);

// ─── Lead statuses ────────────────────────────────────────────────────────────
const leadStatuses = [
  { value: 'SCRAPED',       label: 'Scraped',        color: '#888' },
  { value: 'CONTACTED',     label: 'Contacted',      color: '#3B82F6' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent',  color: '#F59E0B' },
  { value: 'ACCEPTED',      label: 'Accepted ✓',     color: '#22C55E' },
  { value: 'REJECTED',      label: 'Rejected',       color: '#EF4444' },
];

// ─── Kanban columns ───────────────────────────────────────────────────────────
const kanbanCols = [
  { status: 'PLANNING',    label: 'Planning',    icon: markRaw(ClipboardListIcon) },
  { status: 'DEVELOPMENT', label: 'Development', icon: markRaw(CodeIcon) },
  { status: 'REVIEW',      label: 'Review',      icon: markRaw(EyeIcon) },
  { status: 'COMPLETED',   label: 'Completed',   icon: markRaw(CheckCircleIcon) },
  { status: 'ON_HOLD',     label: 'On Hold',     icon: markRaw(PauseCircleIcon) },
];

// ─── Filters ──────────────────────────────────────────────────────────────────
const leadFilter = ref('');
const leadSearch = ref('');

// ─── Kalender filter tanggal kirim ───────────────────────────────────────────
const showCalendar = ref(false);
const selectedDate = ref('');   // 'yyyy-mm-dd'
const neverOnly = ref(false);
const calMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Data lead → peta jumlah per tanggal kirim (untuk indikator di kalender)
const leadCountByDate = computed(() => {
  const m = new Map<string, number>();
  for (const l of leads.value) {
    if (!l.contactedAt) continue;
    const k = toDateStr(new Date(l.contactedAt));
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
});
const countOf = (ds: string) => leadCountByDate.value.get(ds) || 0;

const monthLabel = computed(() =>
  calMonth.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
);

const shiftMonth = (n: number) => {
  calMonth.value = new Date(calMonth.value.getFullYear(), calMonth.value.getMonth() + n, 1);
};

const calCells = computed(() => {
  const y = calMonth.value.getFullYear();
  const m = calMonth.value.getMonth();
  const todayStr = toDateStr(new Date());
  const cells: { key: string; dateStr: string; day: number; inMonth: boolean; isToday: boolean }[] = [];

  const startDow = (new Date(y, m, 1).getDay() + 6) % 7; // Senin = 0
  const prevMonthDays = new Date(y, m, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, prevMonthDays - i);
    const ds = toDateStr(d);
    cells.push({ key: 'p' + i, dateStr: ds, day: d.getDate(), inMonth: false, isToday: ds === todayStr });
  }
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = toDateStr(new Date(y, m, d));
    cells.push({ key: 'm' + d, dateStr: ds, day: d, inMonth: true, isToday: ds === todayStr });
  }
  let n = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(y, m + 1, n);
    cells.push({ key: 'n' + n, dateStr: toDateStr(d), day: d.getDate(), inMonth: false, isToday: false });
    n++;
  }
  return cells;
});

const pickDate = (ds: string) => {
  if (selectedDate.value === ds) selectedDate.value = '';
  else { selectedDate.value = ds; neverOnly.value = false; }
};
const pickNever = () => {
  neverOnly.value = !neverOnly.value;
  if (neverOnly.value) selectedDate.value = '';
};
const clearDate = () => { selectedDate.value = ''; neverOnly.value = false; };

const calButtonLabel = computed(() => {
  if (selectedDate.value) {
    return new Date(selectedDate.value + 'T00:00:00')
      .toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (neverOnly.value) return 'Belum Dihubungi';
  return 'Semua Tanggal';
});

// ─── Filtered leads ──────────────────────────────────────────────────────────
const filteredLeads = computed(() => {
  return leads.value.filter(l => {
    if (leadFilter.value && l.status !== leadFilter.value) return false;
    if (leadSearch.value) {
      const q = leadSearch.value.toLowerCase();
      const matchSearch = l.name.toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.email || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // Filter tanggal kirim pesan (contactedAt)
    if (selectedDate.value) {
      if (!l.contactedAt) return false;
      if (toDateStr(new Date(l.contactedAt)) !== selectedDate.value) return false;
    } else if (neverOnly.value) {
      if (l.contactedAt) return false;
    }
    return true;
  });
});

const countByStatus = (status: string) => leads.value.filter(l => l.status === status).length;
const projectsByStatus = (status: string) => projects.value.filter(p => p.status === status);

// ─── Grouping lead per tanggal pesan terkirim ────────────────────────────────
const leadGroups = computed(() => {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayLabel = (d: Date) => {
    const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
    if (diff === 0) return 'Hari Ini';
    if (diff === 1) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groups: { key: string; label: string; items: any[] }[] = [];
  const map = new Map<string, { key: string; label: string; items: any[] }>();

  for (const l of filteredLeads.value) {
    const key = l.contactedAt ? new Date(l.contactedAt).toDateString() : '__none__';
    const label = l.contactedAt ? dayLabel(new Date(l.contactedAt)) : 'Belum Dihubungi';
    if (!map.has(key)) {
      const g = { key, label, items: [] as any[] };
      map.set(key, g);
      groups.push(g);
    }
    map.get(key)!.items.push(l);
  }
  return groups;
});

const getProjectProgress = (status: string) => {
  if (status === 'ON_HOLD') return 15;
  const idx = kanbanCols.findIndex(c => c.status === status);
  return [25, 50, 75, 100][idx] ?? 0;
};

// ─── Forms ────────────────────────────────────────────────────────────────────
const showLeadForm = ref(false);
const showProjectForm = ref(false);
const editingProject = ref<any>(null);
const isSubmitting = ref(false);

const defaultLeadForm = () => ({ name: '', phone: '', email: '', website: '', address: '', source: 'manual', notes: '' });
const defaultProjectForm = () => ({ name: '', clientName: '', clientPhone: '', clientEmail: '', status: 'PLANNING', source: 'manual', notes: '' });

const leadForm = ref(defaultLeadForm());
const projectForm = ref(defaultProjectForm());

// ─── Data loading ─────────────────────────────────────────────────────────────
const loadLeads = async () => {
  try { leads.value = await fetchApi('/leads'); } catch {}
};
const loadProjects = async () => {
  try { projects.value = await fetchApi('/projects'); } catch {}
};

onMounted(() => { loadLeads(); loadProjects(); });

// ─── Lead actions ─────────────────────────────────────────────────────────────
const changeLeadStatus = async (lead: any, newStatus: string) => {
  try {
    const updated = await fetchApi(`/leads/${lead.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    const idx = leads.value.findIndex(l => l.id === lead.id);
    if (idx !== -1) leads.value[idx] = updated;
    if (newStatus === 'ACCEPTED') {
      toast.success(`✓ Lead "${lead.name}" diterima! Project otomatis dibuat di tab Projects.`);
      await loadProjects();
    }
  } catch (e: any) {
    toast.error('Gagal update status: ' + e.message);
  }
};

const submitLead = async () => {
  if (!leadForm.value.name) { toast.warning('Nama lead wajib diisi.'); return; }
  isSubmitting.value = true;
  try {
    const newLead = await fetchApi('/leads', {
      method: 'POST',
      body: JSON.stringify(leadForm.value),
    });
    leads.value.unshift(newLead);
    leadForm.value = defaultLeadForm();
    showLeadForm.value = false;
    toast.success('Lead berhasil ditambahkan!');
  } catch (e: any) {
    toast.error('Gagal: ' + e.message);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteLead = (id: string) => {
  confirm.show({
    title: 'Hapus Lead',
    message: 'Yakin ingin menghapus lead ini?',
    confirmText: 'Hapus',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/leads/${id}`, { method: 'DELETE' });
        leads.value = leads.value.filter(l => l.id !== id);
        toast.success('Lead dihapus.');
      } catch (e: any) { toast.error(e.message); }
    },
  });
};

// ─── Project actions ──────────────────────────────────────────────────────────
const openEditModal = (p: any) => {
  editingProject.value = p;
  projectForm.value = {
    name: p.name,
    clientName: p.clientName,
    clientPhone: p.clientPhone || '',
    clientEmail: p.clientEmail || '',
    status: p.status,
    source: p.source,
    notes: p.notes || '',
  };
};

const closeProjectModal = () => {
  editingProject.value = null;
  showProjectForm.value = false;
  projectForm.value = defaultProjectForm();
};

const submitProject = async () => {
  if (!projectForm.value.name || !projectForm.value.clientName) {
    toast.warning('Nama proyek dan nama klien wajib diisi.');
    return;
  }
  isSubmitting.value = true;
  try {
    if (editingProject.value) {
      const updated = await fetchApi(`/projects/${editingProject.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify(projectForm.value),
      });
      const idx = projects.value.findIndex(p => p.id === editingProject.value.id);
      if (idx !== -1) projects.value[idx] = updated;
      toast.success('Proyek diperbarui!');
    } else {
      const newProject = await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(projectForm.value),
      });
      projects.value.unshift(newProject);
      toast.success('Proyek berhasil dibuat!');
    }
    closeProjectModal();
  } catch (e: any) {
    toast.error('Gagal: ' + e.message);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteProject = (id: string) => {
  confirm.show({
    title: 'Hapus Proyek',
    message: 'Yakin ingin menghapus proyek ini? Aksi ini tidak bisa dibatalkan.',
    confirmText: 'Hapus',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/projects/${id}`, { method: 'DELETE' });
        projects.value = projects.value.filter(p => p.id !== id);
        closeProjectModal();
        toast.success('Proyek dihapus.');
      } catch (e: any) { toast.error(e.message); }
    },
  });
};

// ─── Utils ────────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const extractDomain = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};
</script>

<style scoped>
.page-wrapper { padding-bottom: 40px; }

/* Header */
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.page-title { font-size: 18px; font-weight: 700; color: #111; }
.page-subtitle { font-size: 12px; color: #999; margin-top: 3px; }

/* Tabs */
.tab-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 12px; font-weight: 500; color: #666;
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.tab-btn:hover:not(.active) { background: #FAFAFA; }
.tab-btn.active { background: #111; color: #fff; border-color: #111; }
.count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 17px; height: 17px; padding: 0 5px;
  background: #F0F0F0; color: #666;
  border-radius: 9px; font-size: 10px; font-weight: 700;
}
.tab-btn.active .count-badge { background: rgba(255,255,255,0.2); color: #fff; }
.count-badge.accent { background: #FF5C35; color: #fff; }

/* Toolbar + buttons */
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  background: #111; color: #fff;
  font-size: 12px; font-weight: 600; border: none;
  cursor: pointer; transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #333; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  background: #fff; color: #333;
  font-size: 12px; font-weight: 600; border: 1px solid #E5E5E5;
  cursor: pointer; transition: background 0.15s;
}
.btn-secondary:hover { background: #F5F5F5; }
.btn-danger {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  background: #fff; color: #EF4444;
  font-size: 12px; font-weight: 600; border: 1px solid #FBD5D5;
  cursor: pointer; transition: background 0.15s;
}
.btn-danger:hover { background: #FEF2F2; }

/* Search */
.search-box { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #aaa; }
.search-input {
  padding: 8px 12px 8px 32px; border-radius: 8px;
  border: 1px solid #E5E5E5; font-size: 12px; color: #111;
  width: 190px; outline: none; transition: border-color 0.15s;
}
.search-input:focus { border-color: #111; }
.date-filter {
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 12px; color: #111; outline: none;
  cursor: pointer; transition: border-color 0.15s;
}
.date-filter:focus { border-color: #111; }

/* ── Kalender filter ─────────────────────────────────────────────────────── */
.cal-wrap { position: relative; }
.cal-btn { display: inline-flex; align-items: center; gap: 6px; }
.cal-overlay { position: fixed; inset: 0; z-index: 40; }
.cal-pop {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 50;
  background: #fff; border: 1px solid #E5E5E5; border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.12); padding: 12px; width: 268px;
}
.cal-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #111;
  text-transform: capitalize;
}
.cal-nav {
  width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid #E5E5E5; background: #fff; color: #666;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.cal-nav:hover { background: #F5F5F5; color: #111; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-dow {
  font-size: 9px; font-weight: 700; color: #AAA; text-align: center;
  padding: 4px 0; text-transform: uppercase;
}
.cal-day {
  position: relative; aspect-ratio: 1;
  border: none; background: transparent; border-radius: 7px;
  font-size: 11px; color: #333; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: background 0.12s;
}
.cal-day.other { color: #CCC; }
.cal-day:hover { background: #F5F5F5; }
.cal-day.today { font-weight: 800; color: #FF5C35; }
.cal-day.has-data { background: #FFF5F2; }
.cal-day.selected, .cal-day.selected:hover { background: #111; color: #fff; font-weight: 700; }
.cal-dot { font-size: 8px; font-weight: 700; color: #FF5C35; line-height: 1.2; }
.cal-day.selected .cal-dot { color: #FF8C66; }
.cal-foot {
  display: flex; justify-content: space-between;
  margin-top: 9px; padding-top: 8px; border-top: 1px solid #F0F0F0;
}
.cal-link {
  background: none; border: none; font-size: 11px; font-weight: 600;
  color: #666; cursor: pointer; padding: 3px 7px; border-radius: 5px;
}
.cal-link:hover { background: #F5F5F5; }
.cal-link.active { color: #FF5C35; }

/* Filter pills */
.filter-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 20px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 11px; font-weight: 500; color: #666;
  cursor: pointer; transition: border-color 0.15s, color 0.15s;
}
.filter-pill:hover:not(.active) { background: #FAFAFA; }
.filter-pill.active { border-color: #FF5C35; background: #FFF5F2; color: #FF5C35; }
.pill-count { font-size: 10px; color: inherit; opacity: 0.7; }

/* Table */
.table-card { overflow: hidden; }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; padding: 10px 14px;
  font-size: 11px; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid #EEE; background: #FAFAFA;
  white-space: nowrap;
}
.data-table td { padding: 11px 14px; font-size: 13px; border-bottom: 1px solid #F5F5F5; vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #FAFAFA; }

/* Row marker by status */
.row-accepted td:first-child { border-left: 3px solid #22C55E; }
.row-rejected td:first-child { border-left: 3px solid #EF4444; }
.row-proposal_sent td:first-child { border-left: 3px solid #F59E0B; }
.row-contacted td:first-child { border-left: 3px solid #3B82F6; }

/* Contact cell */
.contact-cell { display: flex; align-items: center; gap: 10px; }
.contact-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: #FF5C35; color: #fff;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.c-name { font-size: 13px; font-weight: 600; color: #111; }
.c-sub { font-size: 11px; color: #999; margin-top: 2px; font-family: monospace; }

/* Source tag */
.source-tag {
  display: inline-block; padding: 2px 7px; border-radius: 5px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
}
.src-manual       { background: #F3F4F6; color: #6B7280; }
.src-scraper      { background: #FFF4E0; color: #B8700A; }
.src-referral     { background: #EFF6FF; color: #3B82F6; }
.src-social_media { background: #F0FDF4; color: #16A34A; }

/* Status select */
.status-select {
  padding: 5px 8px; border-radius: 8px;
  border: 1px solid #E5E5E5; font-size: 12px; font-weight: 500;
  background: #fff; cursor: pointer; outline: none;
  width: 140px; transition: border-color 0.15s;
}
.sel-accepted      { border-color: #BBF7D0; color: #15803D; }
.sel-rejected      { border-color: #FECACA; color: #DC2626; }
.sel-proposal_sent { border-color: #FDE68A; color: #92400E; }
.sel-contacted     { border-color: #BFDBFE; color: #1D4ED8; }

/* Auto badge */
.auto-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 600;
  color: #7C3AED; background: #F5F3FF;
  padding: 2px 7px; border-radius: 5px; margin-top: 4px;
}

/* Website mini link */
.website-mini {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: #3B82F6; text-decoration: none;
  padding: 2px 7px; border-radius: 5px; background: #EFF6FF;
}
.website-mini:hover { background: #DBEAFE; }

.note-text { font-size: 12px; color: #666; }
.date-cell { font-size: 11px; white-space: nowrap; }

/* Group header per tanggal kirim */
.group-row td {
  background: #FAFAFA !important;
  font-size: 11px; font-weight: 700; color: #666;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 8px 14px !important;
  border-bottom: 1px solid #EEE;
}
.group-row td svg { vertical-align: -1px; margin-right: 4px; }
.group-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 17px; height: 17px; padding: 0 5px; margin-left: 6px;
  background: #E8E8E8; color: #666;
  border-radius: 9px; font-size: 10px; font-weight: 700;
}
.sent-time { font-size: 10px; color: #FF5C35; margin-top: 3px; font-weight: 600; }
.icon-action {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid #EDEDED; background: #fff; color: #BBB;
  cursor: pointer; transition: all 0.15s;
}
.icon-action:hover { background: #FEF2F2; color: #EF4444; border-color: #FECACA; }
.icon-action.btn-view-project:hover { background: #EFF6FF; color: #3B82F6; border-color: #BFDBFE; }

/* ── Kanban ──────────────────────────────────────────────────────────── */
.kanban-board {
  display: flex; gap: 14px; overflow-x: auto;
  padding-bottom: 14px; align-items: flex-start;
}
.kanban-col {
  min-width: 235px; flex-shrink: 0;
  background: #FAFAFA; border-radius: 12px;
  border: 1px solid #EEE; overflow: hidden;
}
.kanban-col-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 13px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid #EEE;
}
.kh-planning    { background: #EFF6FF; color: #1D4ED8; }
.kh-development { background: #FFF7ED; color: #C2410C; }
.kh-review      { background: #FFFBEB; color: #92400E; }
.kh-completed   { background: #F0FDF4; color: #15803D; }
.kh-on_hold     { background: #F5F5F5; color: #6B7280; }
.k-count {
  background: rgba(0,0,0,0.06); color: inherit;
  font-size: 11px; padding: 2px 7px; border-radius: 10px;
}
.kanban-cards { display: flex; flex-direction: column; gap: 9px; padding: 11px; }

.kanban-card {
  background: #fff; border-radius: 10px;
  border: 1px solid #EBEBEB; padding: 12px 13px;
  cursor: pointer; transition: border-color 0.15s;
}
.kanban-card:hover { border-color: #FF5C35; }
.kc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 5px; }
.kc-name { font-size: 13px; font-weight: 600; color: #111; line-height: 1.35; }
.kc-edit-btn {
  background: transparent; border: none; color: #CCC;
  padding: 2px; border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; flex-shrink: 0;
}
.kc-edit-btn:hover { color: #FF5C35; }
.kc-client { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #666; margin-bottom: 8px; }
.kc-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.kc-date { font-size: 10px; color: #BBB; }
.kc-footer { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
.kc-contact { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #888; font-family: monospace; }

.kc-progress-bar {
  height: 4px; background: #F0F0F0; border-radius: 4px;
  overflow: hidden; margin-bottom: 8px; width: 100%;
}
.kc-progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.kpf-planning    { background: #3B82F6; }
.kpf-development { background: #F97316; }
.kpf-review      { background: #F59E0B; }
.kpf-completed   { background: #22C55E; }
.kpf-on_hold     { background: #9CA3AF; }

.kanban-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 22px 12px; color: #CCC; font-size: 12px;
}

/* ── Modal ─────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(17,17,17,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.modal-box {
  background: #fff; border-radius: 14px; width: 100%; max-width: 560px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 22px 0;
}
.modal-header h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #111; }
.modal-close {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff; color: #666;
  cursor: pointer; transition: background 0.15s;
}
.modal-close:hover { background: #F5F5F5; color: #111; }

.modal-body { padding: 18px 22px; }
.modal-footer {
  display: flex; justify-content: flex-end; align-items: center; gap: 10px;
  padding: 14px 22px 18px; border-top: 1px solid #F0F0F0;
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 12px; font-weight: 500; color: #555; }
.field-input {
  padding: 8px 11px; border-radius: 8px;
  border: 1px solid #E5E5E5; font-size: 13px; color: #111;
  outline: none; transition: border-color 0.15s; width: 100%;
  background: #fff; box-sizing: border-box;
}
.field-input:focus { border-color: #111; }
textarea.field-input { resize: vertical; font-family: inherit; }
.req { color: #FF5C35; }

/* Utils */
.d-flex { display: flex; }
.align-center { align-items: center; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.mb-5 { margin-bottom: 18px; }
.mt-3 { margin-top: 12px; }
.text-muted { color: #BBB; }
.empty-row {
  text-align: center; color: #CCC; padding: 40px 20px !important;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .page-header { flex-direction: column; align-items: flex-start; }
}
</style>
