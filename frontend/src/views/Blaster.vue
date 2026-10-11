<template>
  <div class="page-wrapper">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">CRM & Broadcast</h1>
        <p class="page-subtitle">Manage contact database and send targeted broadcasts</p>
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

      <!-- Left: Queue Monitor (Small size) -->
      <div class="monitor-panel card">
        <div class="monitor-header">
          <div class="d-flex align-center gap-2">
            <ActivityIcon :size="16" />
            <span class="card-title">Queue Monitor</span>
            <div class="monitor-toggle">
              <button class="mt-btn" :class="{ active: monitorChannel === 'wa' }" @click="setMonitorChannel('wa')">WA</button>
              <button class="mt-btn" :class="{ active: monitorChannel === 'email' }" @click="setMonitorChannel('email')">Email</button>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button v-if="jobs.length > 0" class="action-btn-danger" @click="clearQueue" style="font-size: 11px; padding: 4px 8px; border-radius: 6px;">
              <Trash2Icon :size="12" />
              Clear
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in jobs" :key="job.id">
                <td>
                  <div class="mono" style="font-weight: 600; font-size: 11px; color: #111;">{{ job.targetJid || job.targetEmail }}</div>
                  <div class="msg-preview" :title="job.messageText" style="font-size: 11px; color: #888; max-width: 120px;">{{ job.messageText }}</div>
                </td>
                <td>
                  <span class="status-badge" :class="statusClass(job.status)">
                    {{ job.status }}
                  </span>
                </td>
                <td>
                  <button class="action-btn-danger" @click="deleteJob(job.id)" title="Delete job" style="padding: 4px 6px; font-size: 11px; border-radius: 6px;">
                    <Trash2Icon :size="12" />
                  </button>
                </td>
              </tr>
              <tr v-if="jobs.length === 0">
                <td colspan="3" class="empty-row" style="font-size: 12px; padding: 30px 10px !important;">
                  <LayoutListIcon :size="16" />
                  No jobs in queue.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Compose & Contact Selection Panel -->
      <div class="compose-panel card">

        <!-- Channel Selector: WhatsApp / Email -->
        <div class="section-label">
          <SendIcon :size="14" />
          Kirim Via
        </div>
        <div class="channel-toggle mb-5">
          <button class="ch-btn" :class="{ active: channel === 'wa' }" @click="switchChannel('wa')">
            <SmartphoneIcon :size="13" /> WhatsApp
          </button>
          <button class="ch-btn" :class="{ active: channel === 'email' }" @click="switchChannel('email')">
            <MailIcon :size="13" /> Email
          </button>
        </div>

        <template v-if="channel === 'wa'">
          <div class="section-label">
            <SmartphoneIcon :size="14" />
            Session
          </div>
          <div class="field-group mb-5">
            <div class="input-wrapper">
              <input type="text" class="field-input" value="Primary Session (Auto)" disabled />
            </div>
          </div>
        </template>

        <!-- BULK MODE: Contact Selector -->
        <template v-if="mode === 'bulk'">
          <div class="section-label">
            <DatabaseIcon :size="14" />
            Contacts
          </div>

          <div class="field-group mb-4">
            <select class="field-input" v-model="selectedBatchId" @change="loadBatchContacts()">
              <option value="" disabled>— Select a scrape batch —</option>
              <option v-for="b in batches" :key="b.id" :value="b.id">
                {{ b.query }} ({{ b._count.contacts }} contacts) · {{ formatDate(b.createdAt) }}
              </option>
            </select>
          </div>

          <!-- Per-contact selection table -->
          <div v-if="batchContacts.length > 0" class="contact-selector mb-5">

            <!-- Filter Bar -->
            <div class="filter-bar">
              <span class="filter-label">
                <FilterIcon :size="12" />
                Filter:
              </span>
              <label class="filter-chip" :class="{ active: filters.hasPhone }">
                <input type="checkbox" v-model="filters.hasPhone" />
                <PhoneCallIcon :size="11" />
                Punya Nomor
              </label>
              <label class="filter-chip" :class="{ active: filters.hasEmail }">
                <input type="checkbox" v-model="filters.hasEmail" />
                <MailIcon :size="11" />
                Punya Email
              </label>
              <label class="filter-chip" :class="{ active: filters.noWebsite }">
                <input type="checkbox" v-model="filters.noWebsite" />
                <GlobeIcon :size="11" />
                Tanpa Website
              </label>
            </div>

            <div class="selector-toolbar">
              <label class="checkbox-label">
                <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
                <span>{{ isAllSelected ? 'Deselect All' : 'Select All' }}</span>
              </label>
              <div class="d-flex align-center gap-2">
                <span class="text-muted" style="font-size: 11px;">{{ filteredContacts.length }} tampil</span>
                <span class="text-muted" style="font-size: 11px;" v-if="noPhoneCount > 0" title="Kontak tanpa nomor WhatsApp — tetap tersimpan, tapi dilewati saat blast">{{ noPhoneCount }} tanpa nomor</span>
                <span class="selection-count">{{ selectedContacts.length }} dipilih</span>
              </div>
            </div>

            <div class="contact-scroll-list">
              <div
                v-for="c in filteredContacts"
                :key="c.id"
                class="contact-row"
                :class="{ checked: selectedContactIds.has(c.id) }"
              >
                <label class="checkbox-label" style="flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0;">
                  <input
                    type="checkbox"
                    :checked="selectedContactIds.has(c.id)"
                    @change="toggleContact(c)"
                  />
                  <div class="contact-info">
                    <span class="c-name">{{ c.name }}</span>
                    <span class="c-phone" :class="{ 'c-no-phone': !hasPhone(c) }">{{ hasPhone(c) ? c.phone : 'tanpa nomor' }}</span>
                  </div>
                </label>

                <!-- Status badge: click to cycle -->
                <button
                  class="contact-status-btn"
                  :class="'cstatus-' + (c.contactStatus || 'unsent')"
                  @click.stop="cycleStatus(c)"
                  :title="c.contactedAt ? 'Terkirim: ' + formatDate(c.contactedAt) + ' — klik untuk ganti status' : 'Klik untuk ganti status'"
                >
                  <CheckCircleIcon v-if="(c.contactStatus || 'unsent') === 'received'" :size="11" />
                  <SendIcon v-else-if="(c.contactStatus || 'unsent') === 'sent'" :size="11" />
                  <CircleDotIcon v-else :size="11" />
                  {{ statusLabel(c.contactStatus || 'unsent') }}
                </button>

                <!-- Mini tags: email sent / email / website indicator -->
                <div class="contact-tags">
                  <span class="ctag ctag-emailsent" v-if="c.emailSentAt" :title="'Cold email terkirim ' + formatDate(c.emailSentAt)">
                    <CheckCircleIcon :size="9" />
                  </span>
                  <span class="ctag ctag-email" v-if="c.email && c.email !== 'N/A'" :title="c.email">
                    <MailIcon :size="9" />
                  </span>
                  <span class="ctag ctag-web" v-if="c.website && c.website !== 'N/A'" :title="c.website">
                    <GlobeIcon :size="9" />
                  </span>
                </div>

                <button type="button" class="delete-contact-btn" @click="deleteContact(c.id)" title="Delete contact">
                  <Trash2Icon :size="12" />
                </button>
              </div>
              <div v-if="filteredContacts.length === 0" class="filter-empty">
                <FilterIcon :size="14" /> Tidak ada kontak yang cocok filter aktif.
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
            <button type="button" class="var-chip" @click="insertVariable('{{website}}')">website</button>
            <button type="button" class="var-chip" @click="insertVariable('{{email}}')">email</button>
          </div>
        </template>

        <!-- ══════════ TEMPLATE VARIATIONS (GACHA) ══════════ -->
        <template v-if="channel === 'wa' || emailTemplate === 'plain'">
          <div class="section-label">
            <TagIcon :size="14" />
            🎲 Template Variations (Gacha)
          </div>
          <div class="gacha-card mb-5">
            <div class="gacha-row">
              <label class="gacha-toggle">
                <input type="checkbox" v-model="gachaEnabled" />
                <span>Aktifkan gacha variasi</span>
              </label>
              <span class="gacha-count">{{ activeTemplates.length }}/{{ templates.length }} aktif</span>
            </div>

            <p v-if="templates.length === 0" class="gacha-hint">
              Belum ada template. Tambah manual atau klik <b>Muat 10 contoh varian</b>.
            </p>

            <div v-if="templates.length" class="tpl-list">
              <div class="tpl-item" v-for="(t, i) in templates" :key="t.id">
                <div class="tpl-item-head">
                  <input type="checkbox" v-model="t.isActive" @change="() => saveTemplate(t)" />
                  <span class="tpl-no">#{{ i + 1 }}</span>
                  <button type="button" class="tpl-del" @click="deleteTemplate(t)" title="Hapus">✕</button>
                </div>
                <input
                  v-if="channel === 'email'"
                  class="ec-input"
                  v-model="t.subject"
                  @blur="saveTemplate(t)"
                  placeholder="Subject email (variasi)..."
                />
                <textarea
                  class="field-input field-textarea"
                  v-model="t.body"
                  @blur="saveTemplate(t)"
                  rows="3"
                  placeholder="Tulis template variasi..."
                ></textarea>
              </div>
            </div>

            <template v-if="addingTemplate">
              <textarea
                class="field-input field-textarea"
                v-model="newTplBody"
                rows="3"
                placeholder="Tulis template baru..."
              ></textarea>
              <input
                v-if="channel === 'email'"
                class="ec-input"
                v-model="newTplSubject"
                placeholder="Subject variasi..."
              />
            </template>

            <div class="gacha-actions">
              <button type="button" class="var-chip" @click="addingTemplate = !addingTemplate">{{ addingTemplate ? 'Batal' : '＋ Tambah' }}</button>
              <button type="button" class="var-chip" v-if="addingTemplate" @click="addTemplate">Simpan</button>
              <button type="button" class="var-chip" @click="loadSamples">Muat 10 contoh varian</button>
              <button type="button" class="var-chip" v-if="templates.length" @click="previewGacha">👁 Preview gacha</button>
            </div>

            <div v-if="gachaPreview" class="gacha-preview">
              <div class="gacha-preview-label">Preview varian gacha:</div>
              <div class="gacha-preview-body">{{ gachaPreview }}</div>
            </div>
          </div>
        </template>

        <!-- SINGLE MODE (WA): Manual phone -->
        <template v-if="mode === 'single' && channel === 'wa'">
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

        <!-- ══════════ EMAIL COMPOSER CARD ══════════ -->
        <div v-if="channel === 'email'" class="email-composer mb-5">
          <div class="ec-header">
            <span class="ec-title"><MailIcon :size="13" /> Tulis Email</span>
            <span class="ec-mode-badge">{{ mode === 'bulk' ? 'Bulk Blast' : 'Single' }}</span>
          </div>

          <!-- Template selector -->
          <div class="ec-row">
            <span class="ec-label">Tampilan</span>
            <div class="ec-tpl-toggle">
              <button class="tpl-btn" :class="{ active: emailTemplate === 'plain' }" @click="emailTemplate = 'plain'">
                Plain Text
              </button>
              <button class="tpl-btn" :class="{ active: emailTemplate === 'promo' }" @click="emailTemplate = 'promo'">
                🎨 Template Promo
              </button>
            </div>
          </div>

          <!-- To -->
          <div class="ec-row">
            <span class="ec-label">To</span>
            <div v-if="mode === 'bulk'" class="ec-to-static">
              <span class="ec-to-count">{{ selectedContacts.length }} kontak</span>
              <span class="ec-to-hint">dari batch terpilih — yang tanpa email otomatis dilewati</span>
            </div>
            <input v-else type="email" class="ec-input" v-model="singleEmail" placeholder="nama@email.com" />
          </div>

          <!-- Subject -->
          <div class="ec-row">
            <span class="ec-label">Subject</span>
            <input
              type="text"
              class="ec-input"
              v-model="emailSubject"
              :placeholder="mode === 'bulk' ? 'Penawaran untuk {{name}}...' : 'Subjek email...'"
            />
          </div>

          <!-- Promo template fields -->
          <template v-if="emailTemplate === 'promo'">
            <div class="ec-row">
              <span class="ec-label">Hero</span>
              <input type="text" class="ec-input ec-hero-1" v-model="promo.heroTitle" placeholder="Baris 1 (hitam)" />
              <input type="text" class="ec-input" v-model="promo.heroAccent" placeholder="Baris 2 (ungu)" />
            </div>
            <div class="ec-row">
              <span class="ec-label">Banner</span>
              <input type="url" class="ec-input" v-model="promo.bannerUrl" placeholder="URL gambar hero (opsional) https://..." />
            </div>
            <div class="ec-row">
              <span class="ec-label">CTA</span>
              <input type="text" class="ec-input ec-cta-text" v-model="promo.ctaText" placeholder="Teks tombol" />
              <input type="url" class="ec-input" v-model="promo.ctaUrl" placeholder="Link tombol https://..." />
            </div>
            <div class="ec-row ec-features-row">
              <span class="ec-label">Fitur</span>
              <div class="ec-features">
                <div class="ec-feature" v-for="(f, i) in promo.features" :key="i">
                  <input type="text" class="ec-input ec-f-icon" v-model="f.icon" maxlength="2" title="Emoji icon" />
                  <input type="text" class="ec-input ec-f-title" v-model="f.title" placeholder="Judul fitur" />
                  <input type="text" class="ec-input" v-model="f.desc" placeholder="Deskripsi singkat" />
                </div>
              </div>
            </div>
          </template>

          <!-- Body -->
          <textarea
            id="messageTemplate"
            class="ec-body"
            :class="{ 'ec-body-promo': emailTemplate === 'promo' }"
            v-model="form.messageTemplate"
            :placeholder="mode === 'bulk' ? 'Halo {{name}},\n\nSaya melihat bisnis Anda di {{address}} dan tertarik...' : 'Tulis isi email...'"
          ></textarea>

          <div class="ec-foot" v-if="mode === 'bulk'">
            <span class="ec-vars" v-text="'Variabel: {{name}} · {{email}} · {{phone}} · {{address}} · {{website}} · {{rating}}'"></span>
            <span>{{ form.messageTemplate.length }} karakter</span>
          </div>

          <!-- Live preview (promo template) -->
          <div class="ec-preview" v-if="emailTemplate === 'promo'">
            <div class="ec-preview-label">Preview — data kontak terpilih pertama</div>
            <iframe class="ec-preview-frame" :srcdoc="previewHtml" sandbox="" title="Preview Email"></iframe>
          </div>
        </div>

        <!-- Message (channel WhatsApp) -->
        <template v-if="channel === 'wa'">
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
              :placeholder="mode === 'single' ? 'Tulis pesan...' : 'Halo {{name}}, toko Anda di {{address}} menarik!'"
            ></textarea>
          </div>
        </template>

        <!-- Attachment (khusus WhatsApp) -->
        <template v-if="channel === 'wa'">
          <div class="section-label">
            <PaperclipIcon :size="14" />
            Attachment <span class="optional-tag">optional</span>
          </div>
          <div class="field-group mb-6">
            <input type="file" class="field-input" @change="handleFileSelect" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" />
          </div>
        </template>

        <button @click="queueBroadcast" class="btn-send" :disabled="isQueueing">
          <LoaderIcon :size="15" class="spin" v-if="isQueueing" />
          <SendIcon :size="15" v-else />
          <template v-if="mode === 'bulk'">
            {{ isQueueing ? 'Queueing...' : (channel === 'wa' ? `Blast to ${selectedContacts.length} Contacts` : `Email Blast ke ${selectedContacts.length} Contacts`) }}
          </template>
          <template v-else>
            {{ isQueueing ? 'Sending...' : (channel === 'wa' ? 'Send Message' : 'Send Email') }}
          </template>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import {
  UsersIcon, UserIcon, SmartphoneIcon, DatabaseIcon,
  TagIcon, PhoneIcon, PhoneCallIcon, MessageSquareIcon, PaperclipIcon,
  SendIcon, LoaderIcon, ActivityIcon, RefreshCwIcon, FilterIcon,
  LayoutListIcon, Trash2Icon, MailIcon, GlobeIcon, CheckCircleIcon, CircleDotIcon
} from '@lucide/vue';
import { SAMPLE_WA_BODIES, SAMPLE_EMAIL_TEMPLATES } from '../data/sampleTemplates';

const toast = useToast();
const confirm = useConfirm();

const mode = ref<'bulk' | 'single'>('bulk');
const channel = ref<'wa' | 'email'>('wa');
const emailSubject = ref('');
const singleEmail = ref('');

const switchChannel = (ch: 'wa' | 'email') => {
  channel.value = ch;
  // Channel email: auto-aktifkan filter "Punya Email" supaya list langsung relevan
  if (ch === 'email') filters.hasEmail = true;
};

const savedSessions = ref<{id: string, status: string}[]>([]);
const isQueueing = ref(false);
const form = ref({ sessionId: '', messageTemplate: '', mediaUrl: '', mediaType: '', mediaName: '' });

const batches = ref<any[]>([]);
const selectedBatchId = ref('');
const batchContacts = ref<any[]>([]);

// ─── Filters ─────────────────────────────────────────────────────────────────
const filters = reactive({ hasPhone: false, hasEmail: false, noWebsite: false });

const filteredContacts = computed(() => {
  return batchContacts.value.filter(c => {
    if (filters.hasPhone && (!c.phone || c.phone === 'N/A')) return false;
    if (filters.hasEmail && (!c.email || c.email === 'N/A')) return false;
    if (filters.noWebsite && c.website && c.website !== 'N/A') return false;
    return true;
  });
});

// Blastable = the contact actually has a WhatsApp number.
// Contacts without one are still kept & listed — they just can't be messaged.
const hasPhone = (c: any) =>
  !!(c.phone && c.phone !== 'N/A' && String(c.phone).replace(/\D/g, '').length >= 9);

const hasEmailAddr = (c: any) =>
  !!(c.email && c.email !== 'N/A' && /.+@.+\..+/.test(String(c.email)));

// Render {{variabel}} di template pesan/subject
const renderTemplate = (tpl: string, c: any) =>
  tpl
    .replace(/\{\{name\}\}/g, c.name || '')
    .replace(/\{\{phone\}\}/g, hasPhone(c) ? c.phone : '')
    .replace(/\{\{address\}\}/g, (c.address && c.address !== 'N/A') ? c.address : '')
    .replace(/\{\{rating\}\}/g, (c.rating && c.rating !== 'N/A') ? c.rating : '')
    .replace(/\{\{website\}\}/g, (c.website && c.website !== 'N/A') ? c.website : '')
    .replace(/\{\{email\}\}/g, (c.email && c.email !== 'N/A') ? c.email : '');

// ─── Email Template Promo (HTML, table-based + inline CSS) ─────────────────
const emailTemplate = ref<'plain' | 'promo'>('plain');
const promo = reactive({
  heroTitle: 'Tingkatkan Bisnis Anda dengan',
  heroAccent: 'Website Profesional',
  ctaText: 'Mulai Sekarang',
  ctaUrl: '',
  bannerUrl: '',
  features: [
    { icon: '🚀', title: 'Development Cepat', desc: 'Website & aplikasi dibangun dengan teknologi modern dan proses efisien.' },
    { icon: '🎨', title: 'Desain Premium', desc: 'Tampilan modern yang membuat brand Anda terlihat profesional.' },
    { icon: '📈', title: 'SEO & Performa', desc: 'Optimasi kecepatan & mesin pencari agar mudah ditemukan klien.' },
    { icon: '🛡️', title: 'Support Penuh', desc: 'Garansi maintenance dan dukungan teknis setelah launching.' },
  ] as { icon: string; title: string; desc: string }[],
});

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type FeatureItem = { icon: string; title: string; desc: string };

const buildEmailHtml = (d: {
  heroTitle: string; heroAccent: string; body: string;
  ctaText: string; ctaUrl: string; bannerUrl: string; features: FeatureItem[];
}) => {
  const hasCta = d.ctaText.trim() && d.ctaUrl.trim();
  const ctaUrl = escapeHtml(d.ctaUrl.trim() || '#');

  const banner = d.bannerUrl.trim()
    ? `<tr><td align="center" style="padding:18px 32px 0;"><img src="${escapeHtml(d.bannerUrl.trim())}" alt="" width="500" style="display:block;width:100%;max-width:500px;height:auto;border-radius:12px;"></td></tr>`
    : '';

  const heroCta = hasCta
    ? `<tr><td align="center" style="padding:20px 0 6px;"><a href="${ctaUrl}" target="_blank" style="display:inline-block;background:#1E1B2E;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:9px;">${escapeHtml(d.ctaText.trim())} →</a></td></tr>`
    : '';

  const bodyBlock = d.body.trim()
    ? `<tr><td align="center" style="padding:6px 44px 4px;"><p style="margin:0;font-size:12.5px;line-height:1.7;color:#555555;">${escapeHtml(d.body).replace(/\n/g, '<br>')}</p></td></tr>`
    : '';

  const featureCell = (f: FeatureItem) => `
    <td width="50%" style="padding:6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EFE8FB;border-radius:12px;">
        <tr><td align="center" style="padding:20px 14px 18px;">
          <div style="width:44px;height:44px;border-radius:50%;background:#F3E8FF;font-size:20px;line-height:44px;text-align:center;">${f.icon}</div>
          <div style="margin-top:10px;font-size:13px;font-weight:800;color:#7C3AED;">${escapeHtml(f.title)}</div>
          <div style="margin-top:6px;font-size:11px;line-height:1.55;color:#666666;">${escapeHtml(f.desc)}</div>
          ${hasCta ? `<a href="${ctaUrl}" target="_blank" style="display:inline-block;margin-top:12px;background:#1E1B2E;color:#ffffff;font-size:11px;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:7px;">${escapeHtml(f.title)} →</a>` : ''}
        </td></tr>
      </table>
    </td>`;

  const featureRows = `
    <tr><td style="padding:14px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>${featureCell(d.features[0])}${featureCell(d.features[1])}</tr></table></td></tr>
    <tr><td style="padding:0 28px 6px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>${featureCell(d.features[2])}${featureCell(d.features[3])}</tr></table></td></tr>`;

  const darkBannerBtn = hasCta
    ? `<a href="${ctaUrl}" target="_blank" style="display:inline-block;margin-top:12px;background:#7C3AED;color:#ffffff;font-size:11px;font-weight:700;text-decoration:none;padding:9px 18px;border-radius:7px;">Pelajari →</a>`
    : '';

  const helpLink = hasCta
    ? `<a href="${ctaUrl}" target="_blank" style="color:#7C3AED;font-weight:700;text-decoration:none;">Hubungi Kami →</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E9D5FF;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#E9D5FF" style="background:linear-gradient(180deg,#E9D5FF 0%,#C084FC 100%);">
<tr><td align="center" style="padding:30px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #EDE9FE;">

    <!-- Logo -->
    <tr><td align="center" style="padding:22px 0 4px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="background:#7C3AED;border-radius:8px;width:26px;height:26px;text-align:center;color:#ffffff;font-size:13px;font-weight:800;line-height:26px;">C</td>
        <td style="padding-left:8px;font-size:15px;font-weight:800;color:#111111;">Concern</td>
      </tr></table>
    </td></tr>

    <!-- Hero -->
    <tr><td align="center" style="padding:14px 32px 4px;">
      <div style="font-size:25px;font-weight:800;color:#111111;line-height:1.25;letter-spacing:-0.02em;">${escapeHtml(d.heroTitle)}</div>
      <div style="font-size:25px;font-weight:800;color:#7C3AED;line-height:1.25;letter-spacing:-0.02em;">${escapeHtml(d.heroAccent)}</div>
    </td></tr>
    ${banner}
    ${heroCta}

    <!-- Section title -->
    <tr><td align="center" style="padding:26px 32px 4px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid #E9E4F5;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:0 14px;white-space:nowrap;font-size:14px;font-weight:800;color:#1E1B2E;">Mari mulai perjalanan digital Anda</td>
        <td style="border-top:1px solid #E9E4F5;font-size:0;line-height:0;">&nbsp;</td>
      </tr></table>
    </td></tr>
    ${bodyBlock}

    <!-- Features 2x2 -->
    ${featureRows}

    <!-- Dark promo banner -->
    <tr><td style="padding:14px 28px 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1E1B2E;border-radius:14px;">
        <tr><td style="padding:22px 26px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="56" style="vertical-align:middle;">
              <div style="width:52px;height:52px;border-radius:50%;background:#7C3AED;text-align:center;line-height:52px;font-size:22px;">📈</div>
            </td>
            <td style="vertical-align:middle;padding-left:14px;">
              <div style="color:#ffffff;font-size:15px;font-weight:800;">Dibangun untuk bantu bisnismu naik level</div>
              <div style="color:#B9B3D9;font-size:11px;margin-top:4px;line-height:1.5;">Tim kami siap membantu dari konsultasi awal hingga launching & maintenance.</div>
              ${darkBannerBtn}
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>

    <!-- Help row -->
    <tr><td style="padding:16px 32px 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="30" style="vertical-align:middle;"><div style="width:26px;height:26px;border-radius:50%;background:#F3E8FF;text-align:center;line-height:26px;font-size:12px;">💬</div></td>
        <td style="vertical-align:middle;padding-left:9px;font-size:11px;color:#777777;"><b style="color:#1E1B2E;">Butuh bantuan?</b><br>Tim kami siap menjawab pertanyaan Anda.</td>
        <td align="right" style="vertical-align:middle;font-size:11px;">${helpLink}</td>
      </tr></table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:20px 32px 26px;border-top:1px solid #F0EBFA;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="background:#7C3AED;border-radius:6px;width:20px;height:20px;text-align:center;color:#ffffff;font-size:10px;font-weight:800;line-height:20px;">C</td>
        <td style="padding-left:6px;font-size:12px;font-weight:800;color:#111111;">Concern</td>
      </tr></table>
      <div style="margin-top:10px;font-size:10px;color:#AAAAAA;">© 2026 Concern. All rights reserved.</div>
      <div style="margin-top:6px;font-size:10px;line-height:1.6;color:#BBBBBB;">Anda menerima email ini karena data Anda terdaftar sebagai kontak kami.<br>Abaikan email ini bila tidak berminat.</div>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
};

const buildPromoHtmlFor = (c: any) => buildEmailHtml({
  heroTitle: renderTemplate(promo.heroTitle, c),
  heroAccent: renderTemplate(promo.heroAccent, c),
  body: renderTemplate(form.value.messageTemplate, c),
  ctaText: promo.ctaText,
  ctaUrl: promo.ctaUrl,
  bannerUrl: promo.bannerUrl,
  features: promo.features.map(f => ({
    icon: f.icon,
    title: renderTemplate(f.title, c),
    desc: renderTemplate(f.desc, c),
  })),
});

const previewHtml = computed(() => {
  const sample = selectedContacts.value[0] || {
    name: 'Budi Santoso', phone: '628123456789',
    address: 'Jl. Merdeka No. 10, Jakarta', rating: '4.8',
    website: 'tokobudi.com', email: 'budi@email.com',
  };
  return buildPromoHtmlFor(sample);
});

const noPhoneCount = computed(() => batchContacts.value.filter((c: any) => !hasPhone(c)).length);

// ─── Contact Status (persisten di database via ScrapedContact.contactStatus) ─
type ContactStatusVal = 'unsent' | 'sent' | 'received';
const STATUS_CYCLE: ContactStatusVal[] = ['unsent', 'sent', 'received'];

async function cycleStatus(c: any) {
  const cur: ContactStatusVal = c.contactStatus || 'unsent';
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
  try {
    const updated = await fetchApi(`/scrape/contacts/${c.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    c.contactStatus = updated.contactStatus;
    c.contactedAt = updated.contactedAt;
  } catch (e: any) {
    toast.error('Gagal update status kontak: ' + e.message);
  }
}
function statusLabel(s: string) {
  return s === 'sent' ? 'Terkirim' : s === 'received' ? 'Diterima' : 'Belum';
}

// ─── Selection (based on filtered list) ──────────────────────────────────────
const selectedContactIds = ref<Set<string>>(new Set());

const selectedContacts = computed(() =>
  filteredContacts.value.filter(c => selectedContactIds.value.has(c.id))
);

const isAllSelected = computed(() =>
  filteredContacts.value.length > 0 && filteredContacts.value.every(c => selectedContactIds.value.has(c.id))
);

const toggleContact = (c: any) => {
  const ids = new Set(selectedContactIds.value);
  if (ids.has(c.id)) ids.delete(c.id);
  else ids.add(c.id);
  selectedContactIds.value = ids;
};

const toggleAll = () => {
  if (isAllSelected.value) {
    const ids = new Set(selectedContactIds.value);
    filteredContacts.value.forEach(c => ids.delete(c.id));
    selectedContactIds.value = ids;
  } else {
    const ids = new Set(selectedContactIds.value);
    filteredContacts.value.forEach(c => ids.add(c.id));
    selectedContactIds.value = ids;
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
    savedSessions.value = data;
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
        await fetchApi(monitorChannel.value === 'wa' ? `/broadcast/jobs/${jobId}` : `/email-blast/jobs/${jobId}`, {
          method: 'DELETE'
        });
        jobs.value = jobs.value.filter(j => j.id !== jobId);
        stats.value = await fetchApi(monitorChannel.value === 'wa' ? `/broadcast/default/stats` : `/email-blast/stats`);
        toast.success('Job deleted from queue history.');
      } catch (error: any) {
        toast.error('Failed to delete job: ' + error.message);
      }
    }
  });
};

const clearQueue = async () => {
  confirm.show({
    title: 'Clear Queue History',
    message: 'Are you sure you want to clear the entire queue history for this session?',
    confirmText: 'Clear All',
    type: 'danger',
    onConfirm: async () => {
      try {
        await fetchApi(monitorChannel.value === 'wa' ? `/broadcast/default/clear` : `/email-blast/clear`, {
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

const loadBatchContacts = async (preserveSelection = false) => {
  if (!selectedBatchId.value) return;
  const prevSelected = new Set(selectedContactIds.value);
  if (!preserveSelection) {
    batchContacts.value = [];
    selectedContactIds.value = new Set();
  }
  try {
    const data = await fetchApi(`/scrape/batches/${selectedBatchId.value}`);
    batchContacts.value = data;
    if (preserveSelection) {
      // Refresh (mis. setelah ada pesan SENT): pertahankan pilihan yang masih ada
      const existingIds = new Set(data.map((c: any) => c.id));
      selectedContactIds.value = new Set([...prevSelected].filter(id => existingIds.has(id)));
    } else {
      selectedContactIds.value = new Set(data.map((c: any) => c.id));
    }
  } catch {}
};

// ─── Queue Monitor (WA / Email) ─────────────────────────────────────────────
const monitorChannel = ref<'wa' | 'email'>('wa');
let lastSentCount: number | null = null;

const setMonitorChannel = (ch: 'wa' | 'email') => {
  if (monitorChannel.value === ch) return;
  monitorChannel.value = ch;
  lastSentCount = null;
  jobs.value = [];
  stats.value = null;
  fetchQueueJobs();
};

const fetchQueueJobs = async () => {
  try {
    if (monitorChannel.value === 'wa') {
      stats.value = await fetchApi(`/broadcast/default/stats`);
      jobs.value = await fetchApi(`/broadcast/default/jobs`);
    } else {
      stats.value = await fetchApi(`/email-blast/stats`);
      jobs.value = await fetchApi(`/email-blast/jobs`);
    }

    // Ada pesan/email yang baru SENT → refresh kontak supaya centang "Terkirim" muncul
    const sentNow = stats.value?.SENT ?? 0;
    if (lastSentCount !== null && sentNow !== lastSentCount && selectedBatchId.value) {
      await loadBatchContacts(true);
    }
    lastSentCount = sentNow;
  } catch {}
};

onMounted(() => {
  fetchSessions();
  loadBatches();
  loadTemplates();
  pollInterval = window.setInterval(fetchQueueJobs, 3000);
});

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval); });

// ─── Template Variations (Gacha) ──────────────────────────────────────────────
const gachaEnabled = ref(false);
const templates = ref<any[]>([]);
const addingTemplate = ref(false);
const newTplBody = ref('');
const newTplSubject = ref('');
const gachaPreview = ref('');

const activeTemplates = computed(() => templates.value.filter((t: any) => t.isActive));
const gachaReady = computed(() => gachaEnabled.value && activeTemplates.value.length > 0);

const loadTemplates = async () => {
  try { templates.value = await fetchApi(`/templates?channel=${channel.value}`); } catch {}
};
watch(channel, () => { gachaPreview.value = ''; loadTemplates(); });

const saveTemplate = async (t: any) => {
  try {
    await fetchApi(`/templates/${t.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body: t.body, subject: t.subject || null, isActive: !!t.isActive }),
    });
  } catch (e: any) { toast.error('Gagal simpan template: ' + e.message); }
};

const deleteTemplate = async (t: any) => {
  try {
    await fetchApi(`/templates/${t.id}`, { method: 'DELETE' });
    await loadTemplates();
  } catch (e: any) { toast.error(e.message); }
};

const addTemplate = async () => {
  if (!newTplBody.value.trim()) { toast.warning('Isi template dulu.'); return; }
  try {
    await fetchApi('/templates', {
      method: 'POST',
      body: JSON.stringify({
        channel: channel.value,
        templates: [{ body: newTplBody.value.trim(), subject: newTplSubject.value.trim() || undefined }],
      }),
    });
    newTplBody.value = ''; newTplSubject.value = ''; addingTemplate.value = false;
    await loadTemplates();
  } catch (e: any) { toast.error(e.message); }
};

const loadSamples = async () => {
  try {
    const templatesToAdd = channel.value === 'email'
      ? SAMPLE_EMAIL_TEMPLATES.map(t => ({ body: t.body, subject: t.subject }))
      : SAMPLE_WA_BODIES.map(b => ({ body: b }));
    await fetchApi('/templates', { method: 'POST', body: JSON.stringify({ channel: channel.value, templates: templatesToAdd }) });
    await loadTemplates();
    toast.success('10 contoh varian dimuat.');
  } catch (e: any) { toast.error(e.message); }
};

const previewGacha = () => {
  const list = activeTemplates.value.length > 0 ? activeTemplates.value : templates.value;
  if (!list.length) { toast.warning('Belum ada template.'); return; }
  const t = list[Math.floor(Math.random() * list.length)];
  const c = selectedContacts.value[0] || { name: 'Budi Santoso', phone: '628123456789', address: 'Jl. Merdeka No. 10, Jakarta', rating: '4.8', website: 'tokobudi.com', email: 'budi@email.com' };
  gachaPreview.value = renderTemplate(t.body, c);
};

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
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/upload`, { 
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData 
    });
    const data = await response.json();
    if (response.ok) { 
      form.value.mediaUrl = data.mediaUrl; 
      form.value.mediaType = data.mediaType;
      form.value.mediaName = data.fileName || file.name;
      toast.success('Media file uploaded successfully.');
    }
    else throw new Error(data.error);
  } catch (err: any) {
    toast.error('Upload failed: ' + err.message);
    target.value = '';
  }
};

const queueBroadcast = async () => {
  const isEmail = channel.value === 'email';
  const usingGacha = gachaReady.value;
  if (!usingGacha && !form.value.messageTemplate) {
    toast.warning(isEmail ? 'Please write an email body.' : 'Please write a message template.');
    return;
  }
  isQueueing.value = true;
  try {
    let payloadJobs: any[] = [];
    let skipped = 0;

    if (mode.value === 'bulk') {
      if (selectedContacts.value.length === 0) throw new Error('No contacts selected');

      // Kontak tanpa nomor/email tetap tersimpan di list — hanya dilewati saat blast.
      const sendable = selectedContacts.value.filter(isEmail ? hasEmailAddr : hasPhone);
      skipped = selectedContacts.value.length - sendable.length;
      if (sendable.length === 0) {
        throw new Error(isEmail
          ? 'Tidak ada kontak terpilih yang punya email.'
          : 'Tidak ada kontak terpilih yang punya nomor WhatsApp.');
      }
      if (isEmail && !emailSubject.value.trim()) throw new Error('Subjek email wajib diisi.');

      payloadJobs = sendable.map(c => isEmail
        ? {
            targetEmail: String(c.email).trim(),
            subject: usingGacha ? renderTemplate(activeTemplates.value[0].subject || emailSubject.value, c) : renderTemplate(emailSubject.value, c),
            body: usingGacha ? renderTemplate(activeTemplates.value[0].body, c) : renderTemplate(form.value.messageTemplate, c),
            subjectVariants: usingGacha ? activeTemplates.value.map(t => renderTemplate(t.subject || emailSubject.value, c)) : undefined,
            bodyVariants: usingGacha ? activeTemplates.value.map(t => renderTemplate(t.body, c)) : undefined,
            bodyHtml: emailTemplate.value === 'promo' ? buildPromoHtmlFor(c) : undefined,
            contactId: c.id,
          }
        : {
            targetJid: c.phone,
            messageText: usingGacha ? renderTemplate(activeTemplates.value[0].body, c) : renderTemplate(form.value.messageTemplate, c),
            messageVariants: usingGacha ? activeTemplates.value.map(t => renderTemplate(t.body, c)) : undefined,
            mediaUrl: form.value.mediaUrl || undefined,
            mediaType: form.value.mediaType || undefined,
            mediaName: form.value.mediaName || undefined,
            contactId: c.id,
          });
    } else {
      if (isEmail) {
        if (!singleEmail.value.trim()) throw new Error('Please enter an email address');
        if (!emailSubject.value.trim()) throw new Error('Subjek email wajib diisi.');
        payloadJobs = [{
          targetEmail: singleEmail.value.trim(),
          subject: usingGacha ? (activeTemplates.value[0].subject || emailSubject.value) : emailSubject.value,
          body: usingGacha ? activeTemplates.value[0].body : form.value.messageTemplate,
          subjectVariants: usingGacha ? activeTemplates.value.map(t => t.subject || emailSubject.value) : undefined,
          bodyVariants: usingGacha ? activeTemplates.value.map(t => t.body) : undefined,
        }];
      } else {
        if (!singlePhone.value) throw new Error('Please enter a phone number');
        payloadJobs = [{
          targetJid: singlePhone.value,
          messageText: usingGacha ? activeTemplates.value[0].body : form.value.messageTemplate,
          messageVariants: usingGacha ? activeTemplates.value.map(t => t.body) : undefined,
          mediaUrl: form.value.mediaUrl || undefined,
          mediaType: form.value.mediaType || undefined,
          mediaName: form.value.mediaName || undefined,
        }];
      }
    }

    if (isEmail) {
      await fetchApi('/email-blast', {
        method: 'POST',
        body: JSON.stringify({ jobs: payloadJobs }),
      });
    } else {
      await fetchApi('/broadcast', {
        method: 'POST',
        body: JSON.stringify({ sessionId: form.value.sessionId, jobs: payloadJobs }),
      });
    }

    toast.success(`${payloadJobs.length} ${isEmail ? 'email' : 'message'}(s) successfully queued!`);
    if (skipped > 0) {
      toast.warning(`${skipped} kontak ${isEmail ? 'tanpa email' : 'tanpa nomor'} dilewati.`);
    }
    if (mode.value === 'single') { singlePhone.value = ''; singleEmail.value = ''; }
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
.main-layout { display: flex; gap: 20px; align-items: flex-start; }
.monitor-panel { width: 330px; flex-shrink: 0; }
.compose-panel { flex: 1; min-width: 0; }
.contact-selector {
  border: 1px solid #E8E8E8;
  border-radius: 10px;
  overflow: hidden;
}

/* ── Filter Bar ─────────────────────────────────── */
.filter-bar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  padding: 10px 14px; background: #F8F8F8;
  border-bottom: 1px solid #EEEEEE;
}
.filter-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.04em;
  margin-right: 2px;
}
.filter-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  border: 1px solid #E0E0E0; background: #fff;
  font-size: 11px; font-weight: 500; color: #666;
  cursor: pointer; transition: all 0.2s; user-select: none;
}
.filter-chip input { display: none; }
.filter-chip:hover { border-color: #bbb; background: #f5f5f5; }
.filter-chip.active { border-color: #FF5C35; background: #FFF0ED; color: #FF5C35; }

/* ── Selector Toolbar ───────────────────────────── */
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

/* ── Contact Scroll List ────────────────────────── */
.contact-scroll-list {
  max-height: 240px; overflow-y: auto;
  display: flex; flex-direction: column;
}
.contact-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; cursor: pointer;
  border-bottom: 1px solid #F5F5F5;
  transition: background 0.15s;
}
.contact-row:last-child { border-bottom: none; }
.contact-row:hover, .contact-row.checked { background: #FFF5F3; }
.contact-info { display: flex; flex-direction: column; flex: 0 0 auto; min-width: 90px; }
.c-name { font-size: 12px; font-weight: 500; color: #111; }
.c-phone { font-size: 11px; color: #888; font-family: monospace; }
.c-no-phone {
  font-family: inherit;
  font-style: italic;
  color: #B8860B;
  background: #FFF8E7;
  border-radius: 4px;
  padding: 0 5px;
}

/* ── Contact Status Button ──────────────────────── */
.contact-status-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600; border: 1px solid transparent;
  cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
}
.cstatus-unsent  { background: #F5F5F5; color: #999; border-color: #E8E8E8; }
.cstatus-unsent:hover  { background: #EBEBEB; color: #555; }
.cstatus-sent    { background: #FFF4E0; color: #B8700A; border-color: #FDDEA0; }
.cstatus-sent:hover    { background: #FFE9AA; }
.cstatus-received { background: #E8F8EE; color: #1E7A4A; border-color: #A8DFC0; }
.cstatus-received:hover { background: #C8EDD8; }

/* ── Contact Mini Tags (email/website icon) ─────── */
.contact-tags { display: flex; gap: 4px; flex-shrink: 0; }
.ctag {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px;
}
.ctag-email { background: #EFF6FF; color: #3B82F6; }
.ctag-web   { background: #F0FDF4; color: #22C55E; }
.ctag-emailsent { background: #DCFCE7; color: #15803D; }

/* Monitor channel toggle (WA / Email) */
.monitor-toggle {
  display: inline-flex; gap: 2px; margin-left: 8px;
  background: #F1F1F1; border-radius: 7px; padding: 2px;
}
.mt-btn {
  border: none; background: transparent;
  font-size: 10px; font-weight: 700; padding: 3px 9px;
  border-radius: 5px; cursor: pointer; color: #888;
  transition: all 0.15s;
}
.mt-btn.active { background: #fff; color: #111; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

.filter-empty {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 20px 14px; font-size: 12px; color: #bbb;
}

.delete-contact-btn {
  background: transparent; border: none; color: var(--text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  padding: 4px; border-radius: 4px; transition: all 0.15s; flex-shrink: 0;
}
.delete-contact-btn:hover { background: rgba(255,59,48,0.1); color: var(--danger); }

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

/* ── Template Variations (Gacha) ──────────────────────── */
.gacha-card { border: 1px solid #E8E8E8; border-radius: 10px; padding: 12px; background: #fff; }
.gacha-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.gacha-toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: #333; cursor: pointer; }
.gacha-count { font-size: 11px; color: #888; }
.gacha-hint { font-size: 12px; color: #999; margin: 4px 0 8px; }
.tpl-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; max-height: 320px; overflow-y: auto; }
.tpl-item { border: 1px solid #EEE; border-radius: 8px; padding: 8px; }
.tpl-item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.tpl-no { font-size: 12px; font-weight: 700; color: #999; }
.tpl-del { margin-left: auto; background: none; border: none; color: #c00; font-size: 13px; cursor: pointer; }
.gacha-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.gacha-preview { margin-top: 10px; background: #FAFAFA; border: 1px dashed #DDD; border-radius: 8px; padding: 10px; }
.gacha-preview-label { font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.gacha-preview-body { font-size: 12px; color: #333; white-space: pre-wrap; line-height: 1.5; max-height: 180px; overflow-y: auto; }

/* ── Email Composer Card ─────────────────────────────── */
.email-composer {
  border: 1px solid #E5E5E5; border-radius: 12px;
  background: #fff; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.email-composer:focus-within {
  border-color: #FF5C35;
  box-shadow: 0 0 0 3px rgba(255, 92, 53, 0.08);
}
.ec-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #FAFAFA;
  border-bottom: 1px solid #EEEEEE;
}
.ec-title {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #111;
}
.ec-mode-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 2px 9px; border-radius: 10px;
  background: #FFF1EC; color: #FF5C35;
}
.ec-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-bottom: 1px solid #F4F4F5;
}
.ec-label {
  width: 56px; flex-shrink: 0;
  font-size: 10px; font-weight: 700; color: #AAA;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.ec-input {
  flex: 1; min-width: 0; border: none; outline: none;
  font-size: 13px; color: #111; background: transparent; padding: 2px 0;
}
.ec-input::placeholder { color: #C4C4C4; }
.ec-to-static { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ec-to-count {
  background: #111; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 2px 9px; border-radius: 10px;
}
.ec-to-hint { font-size: 11px; color: #AAA; }
.ec-body {
  display: block; width: 100%; min-height: 170px;
  border: none; outline: none; resize: vertical;
  padding: 13px 14px; box-sizing: border-box;
  font-size: 13px; line-height: 1.65; color: #111; font-family: inherit;
}
.ec-body::placeholder { color: #C4C4C4; }
.ec-foot {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  padding: 8px 14px; background: #FAFAFA; border-top: 1px solid #F4F4F5;
  font-size: 10px; color: #AAA;
}
.ec-vars { font-family: monospace; }

/* Template toggle di composer */
.ec-tpl-toggle {
  display: inline-flex; gap: 4px;
  background: #F1F1F1; padding: 3px; border-radius: 8px;
}
.tpl-btn {
  border: none; background: transparent;
  padding: 5px 12px; border-radius: 6px;
  font-size: 11px; font-weight: 600; color: #777;
  cursor: pointer; transition: all 0.15s;
}
.tpl-btn.active { background: #fff; color: #111; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.ec-cta-text { max-width: 170px; flex-shrink: 0; }
.ec-hero-1 { max-width: 180px; flex-shrink: 0; }
.ec-body-promo { min-height: 90px; }

/* Feature editor rows */
.ec-features-row { align-items: flex-start; }
.ec-features-row .ec-label { padding-top: 8px; }
.ec-features { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.ec-feature { display: flex; gap: 6px; align-items: center; }
.ec-feature .ec-input { background: #FAFAFA; border-radius: 6px; padding: 6px 9px; font-size: 12px; }
.ec-f-icon { max-width: 44px; text-align: center; flex-shrink: 0; }
.ec-f-title { max-width: 150px; flex-shrink: 0; }

/* Live preview */
.ec-preview {
  border-top: 1px solid #F0F0F0; background: #FAFAFA;
  padding: 12px 14px;
}
.ec-preview-label {
  font-size: 10px; font-weight: 700; color: #AAA;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.ec-preview-frame {
  width: 100%; height: 420px;
  border: 1px solid #E5E5E5; border-radius: 10px;
  background: #fff; box-sizing: border-box;
}

/* Channel toggle (WhatsApp / Email) */
.channel-toggle {
  display: inline-flex; gap: 4px;
  background: #F1F1F1; padding: 4px; border-radius: 10px;
}
.ch-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border: none; border-radius: 7px;
  background: transparent; font-size: 12px; font-weight: 600;
  color: #777; cursor: pointer; transition: all 0.15s;
}
.ch-btn.active { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

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

@media (max-width: 992px) {
  .monitor-panel {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .stat-row {
    flex-direction: column;
    gap: 10px;
  }
  .c-address {
    display: none !important;
  }
}
</style>
