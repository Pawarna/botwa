<template>
  <div class="pd-wrapper">

    <!-- Back Button -->
    <div class="pd-topbar">
      <button class="back-btn" @click="$router.push('/projects')">
        <ArrowLeftIcon :size="14" /> Kembali ke Projects
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="center-state">
      <LoaderIcon :size="24" class="spin" />
      <span>Memuat proyek...</span>
    </div>

    <!-- Not found -->
    <div v-else-if="!project" class="center-state">
      <AlertCircleIcon :size="24" style="color:#EF4444" />
      <span>Proyek tidak ditemukan.</span>
    </div>

    <template v-else>

      <!-- Header -->
      <div class="pd-card header-card">
        <div class="header-left">
          <div class="header-icon">
            <component :is="currentStageIcon" :size="18" />
          </div>
          <div>
            <h1 class="header-name">{{ project.name }}</h1>
            <div class="header-meta">
              <span class="source-tag" :class="'src-' + project.source">{{ project.source }}</span>
              <span class="meta-text"><CalendarIcon :size="11" /> {{ formatDate(project.createdAt) }}</span>
              <span class="auto-badge" v-if="project.lead"><ZapIcon :size="10" /> Dari Scraping</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-ghost" @click="openEdit">
            <EditIcon :size="13" /> Edit
          </button>
          <button class="btn-ghost danger" @click="confirmDelete">
            <Trash2Icon :size="13" /> Hapus
          </button>
        </div>
      </div>

      <!-- Progress -->
      <div class="pd-card">
        <div class="progress-header">
          <div class="ph-left">
            <div class="ph-title-group">
              <span class="section-title">Progress</span>
              <span class="stage-pill" :class="'pill-' + project.status.toLowerCase()">
                {{ currentStageLabel }}
              </span>
            </div>
            <div class="progress-sub">
              {{ doneTasks }}/{{ tasks.length }} tugas selesai
              <template v-if="project.status === 'ON_HOLD'"> · On Hold</template>
            </div>
          </div>
          <div class="ph-right">
            <span class="pct-value">{{ progressPct }}</span><span class="pct-symbol">%</span>
          </div>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: progressPct + '%' }"
            :class="'fill-' + project.status.toLowerCase()"
          ></div>
        </div>

        <!-- Per-stage cards (klik untuk ubah status) -->
        <div class="stage-grid">
          <div
            v-for="st in stageDetails"
            :key="st.status"
            class="stage-card"
            :class="{ 'st-done': st.isComplete, 'st-active': project.status === st.status }"
            @click="changeStatus(st.status)"
            :title="'Klik untuk ubah status ke ' + st.label"
          >
            <div class="st-top">
              <div class="st-left">
                <div class="st-icon">
                  <CheckIcon :size="11" v-if="st.isComplete" />
                  <component :is="st.icon" :size="11" v-else />
                </div>
                <span class="st-name">{{ st.label }}</span>
              </div>
              <span class="st-pct">{{ st.pct }}%</span>
            </div>
            <div class="st-bar">
              <div class="st-bar-fill" :style="{ width: st.pct + '%' }"></div>
            </div>
            <div class="st-foot">
              <span>{{ st.doneCount }}/{{ st.totalCount }} task</span>
              <span v-if="st.isComplete" class="st-badge-done"><CheckIcon :size="10" /> Selesai</span>
              <span v-else-if="project.status === st.status" class="st-badge-active">Aktif</span>
            </div>
          </div>
        </div>

        <!-- Advance suggestion -->
        <div v-if="canAdvanceStage" class="hint-banner">
          <div class="hint-text">
            <ZapIcon :size="15" />
            <span>Semua tugas {{ currentStageLabel }} selesai — lanjut ke <u>{{ nextStageLabel }}</u>?</span>
          </div>
          <button class="btn-advance" @click="advanceToNextStage">
            Lanjut <ArrowRightIcon :size="13" />
          </button>
        </div>

        <!-- All complete -->
        <div v-else-if="isAllProjectsComplete && project.status === 'COMPLETED'" class="hint-banner done">
          <div class="hint-text">
            <SparklesIcon :size="15" />
            <span>Seluruh tahapan proyek telah tuntas 100%! 🎉</span>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="main-grid">

        <!-- Left: Info klien + catatan + timeline -->
        <div class="info-col">
          <div class="pd-card">
            <div class="card-title"><UserIcon :size="13" /> Informasi Klien</div>
            <div class="info-row">
              <span class="info-key">Nama</span>
              <span class="info-val fw">{{ project.clientName }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">No. HP</span>
              <a v-if="project.clientPhone" :href="'https://wa.me/' + project.clientPhone.replace(/[^0-9]/g,'')" target="_blank" class="info-link">
                <PhoneIcon :size="11" /> {{ project.clientPhone }}
              </a>
              <span v-else class="info-val muted">—</span>
            </div>
            <div class="info-row">
              <span class="info-key">Email</span>
              <a v-if="project.clientEmail" :href="'mailto:' + project.clientEmail" class="info-link">
                <MailIcon :size="11" /> {{ project.clientEmail }}
              </a>
              <span v-else class="info-val muted">—</span>
            </div>
            <div class="info-row" v-if="project.lead">
              <span class="info-key">Lead Asal</span>
              <span class="info-val">{{ project.lead.batchQuery || 'Manual' }}</span>
            </div>
          </div>

          <div class="pd-card">
            <div class="card-title"><FileTextIcon :size="13" /> Catatan Proyek</div>
            <p class="notes-text" v-if="plainNotes">{{ plainNotes }}</p>
            <p class="notes-empty" v-else>Belum ada catatan.</p>
          </div>

          <div class="pd-card">
            <div class="card-title"><ClockIcon :size="13" /> Timeline</div>
            <div class="info-row">
              <span class="info-key">Dibuat</span>
              <span class="info-val">{{ formatDateFull(project.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Diperbarui</span>
              <span class="info-val">{{ formatDateFull(project.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Checklist tugas -->
        <div class="tasks-col">
          <div class="pd-card">

            <!-- Header -->
            <div class="tasks-header">
              <div class="card-title"><CheckSquareIcon :size="14" /> Checklist Tugas</div>
              <button class="btn-ghost sm" @click="resetDefaultTasks" title="Kembalikan ke template bawaan">
                <RotateCcwIcon :size="11" /> Reset Template
              </button>
            </div>

            <!-- Filter tahap -->
            <div class="stage-tabs">
              <button
                class="stage-tab"
                :class="{ active: selectedTaskStage === 'ALL' }"
                @click="selectedTaskStage = 'ALL'"
              >
                Semua <span class="tab-badge">{{ doneTasks }}/{{ tasks.length }}</span>
              </button>
              <button
                v-for="st in stageDetails"
                :key="st.status"
                class="stage-tab"
                :class="{ active: selectedTaskStage === st.status, 'is-current': project.status === st.status }"
                @click="selectedTaskStage = st.status"
              >
                <component :is="st.icon" :size="11" />
                <span>{{ st.label }}</span>
                <span class="tab-badge" :class="{ 'badge-done': st.isComplete }">{{ st.doneCount }}/{{ st.totalCount }}</span>
              </button>
            </div>

            <!-- Input tugas manual -->
            <div class="add-task-row">
              <select v-model="newTaskStage" class="task-stage-select">
                <option v-for="s in stages" :key="s.status" :value="s.status">{{ s.label }}</option>
              </select>
              <input
                v-model="newTaskText"
                @keydown.enter="addTask"
                type="text"
                :placeholder="'Tambah tugas ke tahap ' + getStageLabel(newTaskStage) + '... (Enter)'"
                class="task-input"
              />
              <button class="btn-add" @click="addTask" :disabled="!newTaskText.trim()">
                <PlusIcon :size="13" /> Tambah
              </button>
            </div>

            <!-- Grup tugas per tahap -->
            <div class="task-groups" v-if="tasks.length">
              <div
                v-for="stage in filteredTaskStages"
                :key="stage.status"
                class="task-group"
                :class="{ 'is-current': project.status === stage.status }"
              >
                <div class="tg-header">
                  <div class="tg-title">
                    <component :is="stage.icon" :size="12" />
                    <span>{{ stage.label }}</span>
                    <span v-if="project.status === stage.status" class="tg-current">Aktif</span>
                  </div>
                  <div class="tg-actions">
                    <span class="tg-progress">{{ stage.doneCount }}/{{ stage.totalCount }} ({{ stage.pct }}%)</span>
                    <button
                      class="btn-mini"
                      @click="loadTemplateForStage(stage.status)"
                      title="Muat template tugas tahap ini (item yang belum ada)"
                    >
                      + Template
                    </button>
                    <button
                      v-if="stage.totalCount > 0"
                      class="btn-mini"
                      @click="toggleAllStageTasks(stage.status)"
                    >
                      {{ stage.isComplete ? 'Uncheck' : 'Centang Semua' }}
                    </button>
                  </div>
                </div>

                <div class="tg-bar">
                  <div class="tg-bar-fill" :style="{ width: stage.pct + '%' }" :class="{ 'bg-done': stage.isComplete }"></div>
                </div>

                <div class="task-list" v-if="tasksByStage(stage.status).length > 0">
                  <div
                    class="task-item"
                    v-for="(task, i) in tasksByStage(stage.status)"
                    :key="i"
                    :class="{ 'task-done': task.done }"
                  >
                    <label class="task-label">
                      <input type="checkbox" v-model="task.done" @change="toggleTask(task)" class="task-checkbox" />
                      <span class="custom-check">
                        <CheckIcon :size="10" v-if="task.done" />
                      </span>
                      <span class="task-text">{{ task.text }}</span>
                    </label>
                    <button class="task-del" @click="removeTask(task)" title="Hapus tugas">
                      <XIcon :size="12" />
                    </button>
                  </div>
                </div>
                <div v-else class="tsg-empty">
                  Belum ada tugas. Muat template atau tambah manual di atas.
                </div>
              </div>
            </div>

            <div class="tasks-empty" v-else>
              <CheckSquareIcon :size="20" style="opacity:0.2" />
              <span>Belum ada tugas. Tambahkan manual atau muat template.</span>
            </div>

          </div>
        </div>

      </div>
    </template>

    <!-- Modal: Edit Project -->
    <div class="modal-overlay" v-if="showEditModal" @click.self="showEditModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3><EditIcon :size="16" /> Edit Proyek</h3>
          <button class="modal-close" @click="showEditModal = false"><XIcon :size="16" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field-group" style="grid-column: 1 / -1;">
              <label>Nama Proyek <span class="req">*</span></label>
              <input v-model="editForm.name" type="text" class="field-input" placeholder="Nama proyek" />
            </div>
            <div class="field-group">
              <label>Nama Klien <span class="req">*</span></label>
              <input v-model="editForm.clientName" type="text" class="field-input" placeholder="Nama klien" />
            </div>
            <div class="field-group">
              <label>Status</label>
              <select v-model="editForm.status" class="field-input">
                <option v-for="s in allStatuses" :key="s.status" :value="s.status">{{ s.label }}</option>
              </select>
            </div>
            <div class="field-group">
              <label>No. HP Klien</label>
              <input v-model="editForm.clientPhone" type="text" class="field-input" placeholder="628xxx" />
            </div>
            <div class="field-group">
              <label>Email Klien</label>
              <input v-model="editForm.clientEmail" type="email" class="field-input" placeholder="email@..." />
            </div>
            <div class="field-group">
              <label>Sumber</label>
              <select v-model="editForm.source" class="field-input">
                <option value="manual">Manual</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="scraper">Scraper</option>
              </select>
            </div>
          </div>
          <div class="field-group mt-3">
            <label>Deskripsi / Catatan</label>
            <textarea v-model="editForm.notes" class="field-input" rows="3" placeholder="Deskripsi proyek..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showEditModal = false">Batal</button>
          <button class="btn-primary" @click="submitEdit" :disabled="isSaving">
            <LoaderIcon :size="14" class="spin" v-if="isSaving" />
            <CheckIcon :size="14" v-else />
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import {
  ArrowLeftIcon, LoaderIcon, AlertCircleIcon, CalendarIcon, ZapIcon,
  EditIcon, Trash2Icon, UserIcon, PhoneIcon, MailIcon, FileTextIcon,
  ClockIcon, CheckSquareIcon, CheckIcon, PlusIcon, XIcon,
  ClipboardListIcon, CodeIcon, EyeIcon, CheckCircleIcon, PauseCircleIcon,
  ArrowRightIcon, SparklesIcon, RotateCcwIcon,
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const project = ref<any>(null);
const loading = ref(true);
const showEditModal = ref(false);
const isSaving = ref(false);

// ── Stages (pipeline tanpa ON_HOLD) ────────────────────────────────────────
const stages = [
  { status: 'PLANNING',    label: 'Planning',    icon: markRaw(ClipboardListIcon) },
  { status: 'DEVELOPMENT', label: 'Development', icon: markRaw(CodeIcon) },
  { status: 'REVIEW',      label: 'Review',      icon: markRaw(EyeIcon) },
  { status: 'COMPLETED',   label: 'Completed',   icon: markRaw(CheckCircleIcon) },
];
const allStatuses = [
  ...stages,
  { status: 'ON_HOLD', label: 'On Hold', icon: markRaw(PauseCircleIcon) },
];

const stageIndex = computed(() => stages.findIndex(s => s.status === project.value?.status));

const currentStageIcon = computed(() => {
  const found = allStatuses.find(s => s.status === project.value?.status);
  return found?.icon || ClipboardListIcon;
});

const currentStageLabel = computed(() => {
  const found = allStatuses.find(s => s.status === project.value?.status);
  return found?.label || 'Planning';
});

const nextStageLabel = computed(() => {
  if (stageIndex.value < 0 || stageIndex.value >= stages.length - 1) return '';
  return stages[stageIndex.value + 1].label;
});

const nextStageStatus = computed(() => {
  if (stageIndex.value < 0 || stageIndex.value >= stages.length - 1) return null;
  return stages[stageIndex.value + 1].status;
});

const currentStageTasks = computed(() => {
  if (!project.value) return [];
  return tasks.value.filter(t => t.stage === project.value.status);
});

const currentStageComplete = computed(() => {
  if (currentStageTasks.value.length === 0) return false;
  return currentStageTasks.value.every(t => t.done);
});

const canAdvanceStage = computed(() => {
  return (
    project.value?.status !== 'ON_HOLD' &&
    project.value?.status !== 'COMPLETED' &&
    currentStageComplete.value &&
    nextStageStatus.value !== null
  );
});

const isAllProjectsComplete = computed(() => {
  if (!tasks.value.length) return false;
  return tasks.value.every(t => t.done);
});

const stageDetails = computed(() => {
  return stages.map((s, idx) => {
    const sTasks = tasks.value.filter(t => t.stage === s.status);
    const doneCount = sTasks.filter(t => t.done).length;
    const totalCount = sTasks.length;
    let pct = 0;
    if (totalCount > 0) {
      pct = Math.round((doneCount / totalCount) * 100);
    } else if (stageIndex.value > idx && project.value?.status !== 'ON_HOLD') {
      pct = 100;
    }
    const isComplete = totalCount > 0 ? doneCount === totalCount : (stageIndex.value > idx && project.value?.status !== 'ON_HOLD');

    return { status: s.status, label: s.label, icon: s.icon, doneCount, totalCount, pct, isComplete };
  });
});

const progressPct = computed(() => {
  if (!project.value) return 0;
  if (project.value.status === 'ON_HOLD') return 0;

  if (tasks.value.length === 0) {
    const pcts = [25, 50, 75, 100];
    return pcts[stageIndex.value] ?? 0;
  }

  let total = 0;
  stages.forEach((s, idx) => {
    const sTasks = tasks.value.filter(t => t.stage === s.status);
    if (sTasks.length > 0) {
      const done = sTasks.filter(t => t.done).length;
      total += (done / sTasks.length) * 25;
    } else if (stageIndex.value > idx) {
      total += 25;
    }
  });

  return Math.min(100, Math.round(total));
});

// ── Template tugas per tahap ───────────────────────────────────────────────
type Task = { text: string; done: boolean; stage: string };

const TASK_TEMPLATES: Record<string, string[]> = {
  PLANNING: [
    'Inisiasi Proyek & Discussion Kickoff dengan Klien',
    'Penyusunan BRD (Business Requirements Document)',
    'Penyusunan PRD & Wireframe UI',
    'Setup Repository Git, Environment & Arsitektur Project',
  ],
  DEVELOPMENT: [
    'Slicing UI & Development Komponen Frontend',
    'Setup Database Schema & Backend API Services',
    'Integrasi API Frontend & Backend',
    'Internal Feature Testing & Code Review',
  ],
  REVIEW: [
    'Pengujian Internal QA & Test Scenarios',
    'UAT (User Acceptance Testing) bersama Klien',
    'Bug Fixing, Feedback Revision & Optimasi Performa',
    'Client Approval & Formal Sign-off',
  ],
  COMPLETED: [
    'Deployment Server Production & Konfigurasi Domain',
    'Handover Source Code & Dokumentasi Panduan',
    'Training & Demo Penggunaan Sistem',
    'Garansi Maintenance & Support Technical',
  ],
};

// Template bawaan = gabungan seluruh tahap
const DEFAULT_TASKS: Task[] = Object.entries(TASK_TEMPLATES).flatMap(([stage, texts]) =>
  texts.map(text => ({ stage, text, done: false }))
);

const tasks = ref<Task[]>([]);
const newTaskText = ref('');
const selectedTaskStage = ref<string>('ALL');
const newTaskStage = ref<string>('PLANNING');

const doneTasks = computed(() => tasks.value.filter(t => t.done).length);

const getStageLabel = (status: string) =>
  stages.find(s => s.status === status)?.label || 'Planning';

const tasksByStage = (stageStatus: string) =>
  tasks.value.filter(t => t.stage === stageStatus);

const filteredTaskStages = computed(() => {
  if (selectedTaskStage.value === 'ALL') return stageDetails.value;
  return stageDetails.value.filter(st => st.status === selectedTaskStage.value);
});

// ── Tasks disimpan sebagai suffix __TASKS__[...] di project.notes ──────────
const MARKER = '__TASKS__';

const parseNotesAndTasks = (raw: string | null): { notes: string; tasks: Task[] } => {
  if (!raw) return { notes: '', tasks: [] };
  const idx = raw.indexOf(MARKER);
  if (idx === -1) return { notes: raw, tasks: [] };
  try {
    let parsedTasks = JSON.parse(raw.slice(idx + MARKER.length));
    parsedTasks = parsedTasks.map((t: any) => ({ ...t, stage: t.stage || 'PLANNING' }));
    return { notes: raw.slice(0, idx).trim(), tasks: parsedTasks };
  } catch {
    return { notes: raw, tasks: [] };
  }
};

const plainNotes = computed(() => parseNotesAndTasks(project.value?.notes).notes);

const buildNotesWithTasks = (n: string, t: Task[]) =>
  t.length ? `${n}${MARKER}${JSON.stringify(t)}` : n;

// ── Aksi tugas ─────────────────────────────────────────────────────────────
const addTask = () => {
  const text = newTaskText.value.trim();
  if (!text) return;
  const stage = newTaskStage.value || (project.value?.status === 'ON_HOLD' ? 'PLANNING' : (project.value?.status || 'PLANNING'));
  tasks.value.push({ text, done: false, stage });
  newTaskText.value = '';
  saveTasks();
};

const removeTask = (taskToRemove: Task) => {
  const index = tasks.value.indexOf(taskToRemove);
  if (index !== -1) {
    tasks.value.splice(index, 1);
    saveTasks();
  }
};

const toggleTask = (task: Task) => {
  saveTasks();
  if (task.done && currentStageComplete.value && canAdvanceStage.value) {
    toast.success(`🎉 Semua tugas di tahap ${currentStageLabel.value} selesai! Siap lanjut ke ${nextStageLabel.value}.`);
  }
};

const toggleAllStageTasks = (stageStatus: string) => {
  const stageTasks = tasks.value.filter(t => t.stage === stageStatus);
  if (stageTasks.length === 0) return;
  const allDone = stageTasks.every(t => t.done);
  stageTasks.forEach(t => t.done = !allDone);
  saveTasks();
  if (!allDone && currentStageComplete.value && canAdvanceStage.value) {
    toast.success(`🎉 Semua tugas di tahap ${currentStageLabel.value} selesai! Siap lanjut ke ${nextStageLabel.value}.`);
  }
};

// Muat template tahap (hanya item yang belum ada)
const loadTemplateForStage = (stageStatus: string) => {
  const templates = TASK_TEMPLATES[stageStatus];
  if (!templates || templates.length === 0) {
    toast.warning('Tidak ada template untuk tahap ini.');
    return;
  }
  const existing = new Set(tasks.value.filter(t => t.stage === stageStatus).map(t => t.text));
  const toAdd = templates.filter(text => !existing.has(text));
  if (toAdd.length === 0) {
    toast.info('Template tahap ini sudah dimuat semua.');
    return;
  }
  toAdd.forEach(text => tasks.value.push({ text, done: false, stage: stageStatus }));
  saveTasks();
  toast.success(`Template ${getStageLabel(stageStatus)} dimuat (${toAdd.length} tugas).`);
};

const resetDefaultTasks = () => {
  confirm.show({
    title: 'Reset Template Tugas',
    message: 'Kembalikan seluruh checklist ke template bawaan? Tugas yang ada akan diganti.',
    confirmText: 'Reset',
    type: 'warning',
    onConfirm: () => {
      tasks.value = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      saveTasks();
      toast.success('Checklist di-reset ke template bawaan.');
    }
  });
};

const advanceToNextStage = async () => {
  if (!nextStageStatus.value) return;
  await changeStatus(nextStageStatus.value);
};

const saveTasks = async () => {
  if (!project.value) return;
  const combined = buildNotesWithTasks(plainNotes.value, tasks.value);
  try {
    await fetchApi(`/projects/${project.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: combined }),
    });
    project.value.notes = combined;
  } catch (e: any) {
    toast.error('Gagal simpan task: ' + e.message);
  }
};

// ── Edit form ──────────────────────────────────────────────────────────────
const editForm = ref({ name: '', clientName: '', clientPhone: '', clientEmail: '', status: '', source: '', notes: '' });

const openEdit = () => {
  editForm.value = {
    name: project.value.name,
    clientName: project.value.clientName,
    clientPhone: project.value.clientPhone || '',
    clientEmail: project.value.clientEmail || '',
    status: project.value.status,
    source: project.value.source,
    notes: plainNotes.value,
  };
  showEditModal.value = true;
};

const submitEdit = async () => {
  if (!editForm.value.name || !editForm.value.clientName) {
    toast.warning('Nama proyek dan klien wajib diisi.');
    return;
  }
  isSaving.value = true;
  try {
    const combined = buildNotesWithTasks(editForm.value.notes, tasks.value);
    const updated = await fetchApi(`/projects/${project.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...editForm.value, notes: combined }),
    });
    project.value = updated;
    tasks.value = parseNotesAndTasks(updated.notes).tasks;
    showEditModal.value = false;
    toast.success('Proyek berhasil diperbarui!');
  } catch (e: any) {
    toast.error('Gagal: ' + e.message);
  } finally {
    isSaving.value = false;
  }
};

// ── Change status ──────────────────────────────────────────────────────────
const changeStatus = async (status: string) => {
  if (!project.value || project.value.status === status) return;
  try {
    const updated = await fetchApi(`/projects/${project.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    project.value = updated;
    tasks.value = parseNotesAndTasks(updated.notes).tasks;
    toast.success(`Status → ${allStatuses.find(s => s.status === status)?.label}`);
  } catch (e: any) {
    toast.error('Gagal update status: ' + e.message);
  }
};

// ── Delete ─────────────────────────────────────────────────────────────────
const confirmDelete = () => {
  confirm.show({
    title: 'Hapus Proyek',
    message: `Yakin ingin menghapus proyek "${project.value?.name}"?`,
    confirmText: 'Hapus',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(`/projects/${project.value.id}`, { method: 'DELETE' });
        toast.success('Proyek dihapus.');
        router.push('/projects');
      } catch (e: any) {
        toast.error(e.message);
      }
    },
  });
};

// ── Load ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const data = await fetchApi(`/projects/${route.params.id}`);
    project.value = data;
    const parsed = parseNotesAndTasks(data.notes);

    // Template bawaan bila belum ada tugas tersimpan
    if (parsed.tasks.length === 0) {
      tasks.value = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      saveTasks();
    } else {
      tasks.value = parsed.tasks;
    }
  } catch {
    project.value = null;
  } finally {
    loading.value = false;
  }
});

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatDateFull = (d: string) =>
  new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<style scoped>
.pd-wrapper { padding-bottom: 40px; }

/* Top bar */
.pd-topbar { margin-bottom: 16px; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 12px; font-weight: 500; color: #555;
  cursor: pointer; transition: background 0.15s;
}
.back-btn:hover { background: #F5F5F5; color: #111; }

.center-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px;
  min-height: 180px; color: #BBB; font-size: 13px;
}

/* Kartu dasar */
.pd-card {
  background: #fff; border: 1px solid #EEEEEE; border-radius: 12px;
  padding: 18px 20px; margin-bottom: 16px;
}
.card-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; color: #111;
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px;
}
.section-title { font-size: 14px; font-weight: 700; color: #111; }

/* Header */
.header-card { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #FFF1EC; color: #FF5C35;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.header-name { font-size: 17px; font-weight: 700; color: #111; margin-bottom: 6px; }
.header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.meta-text { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #999; }
.header-actions { display: flex; gap: 8px; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 8px;
  background: #fff; border: 1px solid #E5E5E5;
  font-size: 12px; font-weight: 600; color: #555;
  cursor: pointer; transition: all 0.15s;
}
.btn-ghost:hover { background: #F7F7F7; color: #111; }
.btn-ghost.danger { color: #EF4444; border-color: #FBD5D5; }
.btn-ghost.danger:hover { background: #FEF2F2; }
.btn-ghost.sm { padding: 5px 9px; font-size: 11px; }

/* Progress */
.progress-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
.ph-left { display: flex; flex-direction: column; gap: 4px; }
.ph-title-group { display: flex; align-items: center; gap: 9px; }
.stage-pill {
  padding: 3px 9px; border-radius: 20px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
}
.pill-planning    { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
.pill-development { background: #FFF7ED; color: #EA580C; border: 1px solid #FED7AA; }
.pill-review      { background: #FEFCE8; color: #D97706; border: 1px solid #FDE68A; }
.pill-completed   { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
.pill-on_hold     { background: #F3F4F6; color: #4B5563; border: 1px solid #E5E7EB; }
.progress-sub { font-size: 12px; color: #888; }
.ph-right { display: flex; align-items: baseline; gap: 2px; }
.pct-value { font-size: 28px; font-weight: 800; line-height: 1; color: #111; letter-spacing: -0.02em; }
.pct-symbol { font-size: 15px; font-weight: 700; color: #FF5C35; }

.progress-track {
  width: 100%; height: 8px;
  background: #F4F4F5; border-radius: 99px; overflow: hidden;
}
.progress-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
.fill-planning    { background: #3B82F6; }
.fill-development { background: #F97316; }
.fill-review      { background: #F59E0B; }
.fill-completed   { background: #22C55E; }
.fill-on_hold     { background: #9CA3AF; }

/* Kartu tahap */
.stage-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.stage-card {
  background: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 10px;
  padding: 12px 13px; cursor: pointer;
  display: flex; flex-direction: column; gap: 9px;
  transition: border-color 0.15s;
}
.stage-card:hover { border-color: #D4D4D8; }
.stage-card.st-active { background: #fff; border-color: #FF5C35; }
.stage-card.st-done { background: #F6FDF9; border-color: #DCFCE7; }

.st-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.st-left { display: flex; align-items: center; gap: 7px; }
.st-icon {
  width: 24px; height: 24px; border-radius: 7px;
  background: #EDEDED; color: #71717A;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.st-active .st-icon { background: #FFF1EC; color: #FF5C35; }
.st-done .st-icon { background: #22C55E; color: #fff; }
.st-name { font-size: 12px; font-weight: 600; color: #3F3F46; }
.st-active .st-name { color: #111; font-weight: 700; }
.st-done .st-name { color: #15803D; }
.st-pct { font-size: 11px; font-weight: 700; color: #888; }
.st-active .st-pct { color: #FF5C35; }
.st-done .st-pct { color: #16A34A; }

.st-bar { width: 100%; height: 5px; background: #E4E4E7; border-radius: 99px; overflow: hidden; }
.st-bar-fill { height: 100%; border-radius: 99px; background: #FF5C35; transition: width 0.3s; }
.st-done .st-bar-fill { background: #22C55E; }

.st-foot { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #888; }
.st-badge-done { color: #16A34A; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
.st-badge-active { color: #FF5C35; font-weight: 700; }

/* Banner hint */
.hint-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: #FFFBF5; border: 1px solid #FFE4D6; border-radius: 10px;
  padding: 12px 14px;
}
.hint-banner.done { background: #F0FDF4; border-color: #DCFCE7; }
.hint-text { display: flex; align-items: center; gap: 9px; font-size: 12px; color: #71717A; }
.hint-text u { color: #111; font-weight: 600; }
.hint-text svg { color: #FF5C35; flex-shrink: 0; }
.hint-banner.done .hint-text svg { color: #16A34A; }
.btn-advance {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 8px;
  background: #111; color: #fff; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.btn-advance:hover { background: #333; }

/* Grid */
.main-grid { display: grid; grid-template-columns: 310px 1fr; gap: 16px; align-items: start; }
.info-col, .tasks-col { min-width: 0; }

/* Info rows */
.info-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 7px 0; border-bottom: 1px solid #F5F5F5; gap: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-key { font-size: 12px; color: #888; flex-shrink: 0; }
.info-val { font-size: 13px; color: #18181B; text-align: right; word-break: break-word; }
.info-val.fw { font-weight: 600; }
.info-val.muted { color: #CCC; }
.info-link {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; color: #FF5C35; text-decoration: none;
  text-align: right; word-break: break-word;
}
.info-link:hover { text-decoration: underline; }
.notes-text { font-size: 13px; color: #444; line-height: 1.6; margin: 0; white-space: pre-wrap; }
.notes-empty { font-size: 13px; color: #AAA; font-style: italic; margin: 0; }

/* Tasks header */
.tasks-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; margin-bottom: 14px; flex-wrap: wrap;
}
.tasks-header .card-title { margin-bottom: 0; }

/* Stage tabs */
.stage-tabs {
  display: flex; gap: 6px; margin-bottom: 14px;
  overflow-x: auto; padding-bottom: 6px;
  border-bottom: 1px solid #F4F4F5;
}
.stage-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 11px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 12px; font-weight: 500; color: #555;
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.stage-tab:hover { background: #FAFAFA; }
.stage-tab.active { background: #111; border-color: #111; color: #fff; font-weight: 600; }
.stage-tab.is-current:not(.active) { border-color: #FF5C35; color: #FF5C35; background: #FFF8F6; }
.tab-badge {
  font-size: 10px; font-weight: 700; padding: 1px 6px;
  border-radius: 9px; background: #F1F1F1; color: inherit;
}
.stage-tab.active .tab-badge { background: rgba(255,255,255,0.2); }
.tab-badge.badge-done { background: #DCFCE7; color: #16A34A; }
.stage-tab.active .tab-badge.badge-done { background: #22C55E; color: #fff; }

/* Input tambah tugas */
.add-task-row {
  display: flex; gap: 8px; align-items: center;
  background: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 10px;
  padding: 9px; margin-bottom: 16px;
}
.task-stage-select {
  padding: 7px 9px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 12px; font-weight: 600; color: #3F3F46;
  outline: none; cursor: pointer;
}
.task-input {
  flex: 1; min-width: 0;
  padding: 7px 11px; border-radius: 8px;
  border: 1px solid #E5E5E5; background: #fff;
  font-size: 13px; color: #111; outline: none;
  transition: border-color 0.15s;
}
.task-input:focus { border-color: #FF5C35; }
.btn-add {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 8px;
  background: #FF5C35; border: none; color: #fff;
  font-size: 12px; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: opacity 0.15s;
}
.btn-add:disabled { background: #E4E4E7; color: #A1A1AA; cursor: not-allowed; }
.btn-add:not(:disabled):hover { background: #E84F2A; }

/* Grup tugas */
.task-groups { display: flex; flex-direction: column; gap: 12px; }
.task-group {
  border: 1px solid #F0F0F0; border-radius: 10px;
  padding: 13px; background: #fff;
  display: flex; flex-direction: column; gap: 9px;
}
.task-group.is-current { border-color: #FFE4D6; background: #FFFCFB; }
.tg-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.tg-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; color: #18181B;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.tg-current {
  font-size: 9px; font-weight: 700; color: #FF5C35;
  background: #FFF1EC; border: 1px solid #FFE4D6;
  padding: 1px 6px; border-radius: 6px; text-transform: none;
}
.tg-actions { display: flex; align-items: center; gap: 10px; }
.tg-progress { font-size: 11px; font-weight: 600; color: #888; }
.btn-mini {
  background: transparent; border: none;
  font-size: 11px; font-weight: 600; color: #3B82F6;
  cursor: pointer; padding: 2px 4px; border-radius: 4px;
}
.btn-mini:hover { text-decoration: underline; }

.tg-bar { width: 100%; height: 4px; background: #F4F4F5; border-radius: 99px; overflow: hidden; }
.tg-bar-fill { height: 100%; border-radius: 99px; background: #FF5C35; transition: width 0.3s; }
.tg-bar-fill.bg-done { background: #22C55E; }

/* Item tugas */
.task-list { display: flex; flex-direction: column; gap: 4px; }
.task-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 7px 9px; border-radius: 8px;
  background: #FAFAFA; border: 1px solid #F4F4F5;
  transition: background 0.15s;
}
.task-item:hover { background: #F4F4F5; }
.task-label { display: flex; align-items: center; gap: 9px; cursor: pointer; flex: 1; min-width: 0; }
.task-checkbox { display: none; }
.custom-check {
  width: 17px; height: 17px; border-radius: 5px;
  border: 2px solid #D4D4D8; background: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: #fff; transition: all 0.15s;
}
.task-done .custom-check { background: #22C55E; border-color: #22C55E; }
.task-text { font-size: 13px; color: #27272A; line-height: 1.4; transition: color 0.15s; }
.task-done .task-text { color: #A1A1AA; text-decoration: line-through; }
.task-del {
  width: 24px; height: 24px; border-radius: 6px;
  border: none; background: transparent; color: #D4D4D8;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all 0.15s;
}
.task-del:hover { background: #FEF2F2; color: #EF4444; }

.tsg-empty { font-size: 12px; color: #A1A1AA; font-style: italic; padding: 6px 0; }
.tasks-empty {
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  padding: 28px 16px; color: #CCC; font-size: 12px;
}

/* Badges */
.source-tag {
  display: inline-block; padding: 2px 7px; border-radius: 5px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
}
.src-manual       { background: #F3F4F6; color: #6B7280; }
.src-scraper      { background: #FFF4E0; color: #B8700A; }
.src-referral     { background: #EFF6FF; color: #3B82F6; }
.src-social_media { background: #F0FDF4; color: #16A34A; }
.auto-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 600;
  color: #7C3AED; background: #F5F3FF;
  padding: 2px 7px; border-radius: 5px;
}

/* Modal */
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
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px 0; }
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
.mt-3 { margin-top: 12px; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  background: #111; color: #fff; font-size: 12px; font-weight: 600;
  border: none; cursor: pointer; transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #333; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  background: #fff; color: #333; font-size: 12px; font-weight: 600;
  border: 1px solid #E5E5E5; cursor: pointer; transition: background 0.15s;
}
.btn-secondary:hover { background: #F5F5F5; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .main-grid { grid-template-columns: 1fr; }
  .stage-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .header-card { flex-direction: column; align-items: flex-start; }
  .stage-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .add-task-row { flex-wrap: wrap; }
}
</style>
