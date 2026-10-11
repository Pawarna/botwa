<template>
  <div class="app-container">
    
    <!-- Sidebar backdrop for mobile overlay -->
    <div 
      class="sidebar-backdrop" 
      :class="{ visible: isMobileOpen }" 
      @click="isMobileOpen = false"
    ></div>

    <!-- Collapsible Sidebar -->
    <aside class="sidebar" :class="{ expanded: isExpanded, 'mobile-open': isMobileOpen }">
      
      <!-- Logo area -->
      <router-link to="/" class="logo-container" @click="isMobileOpen = false">
        <div class="logo-icon">C</div>
        <span class="logo-text">Concern Ecosystem</span>
      </router-link>
      
      <!-- Nav menu -->
      <nav class="nav-menu">
        <router-link to="/session" class="nav-item" active-class="active" title="Session Manager" @click="isMobileOpen = false">
          <SmartphoneIcon :size="20" />
          <span class="nav-text">Sessions</span>
        </router-link>
        
        <router-link to="/auto-reply" class="nav-item" active-class="active" title="Auto Reply Rules" @click="isMobileOpen = false">
          <MessageSquareIcon :size="20" />
          <span class="nav-text">Auto Reply</span>
        </router-link>
        
        <router-link to="/scraper" class="nav-item" active-class="active" title="Maps Scraper" @click="isMobileOpen = false">
          <SearchIcon :size="20" />
          <span class="nav-text">Scraper</span>
        </router-link>
        
        <router-link to="/blaster" class="nav-item" active-class="active" title="CRM" @click="isMobileOpen = false">
          <SendIcon :size="20" />
          <span class="nav-text">CRM</span>
        </router-link>

        <router-link to="/projects" class="nav-item" active-class="active" title="Project Management" @click="isMobileOpen = false">
          <KanbanIcon :size="20" />
          <span class="nav-text">Projects</span>
        </router-link>
      </nav>
      
      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        
        <!-- Toggle button -->
        <button @click="toggleSidebar" class="nav-item" :title="isExpanded ? 'Collapse' : 'Expand'">
          <ChevronRightIcon :size="20" v-if="!isExpanded" />
          <ChevronLeftIcon :size="20" v-else />
          <span class="nav-text">Collapse Menu</span>
        </button>
        
        <!-- Logout button -->
        <button @click="logout" class="nav-item" style="color: var(--danger);" title="Logout">
          <LogOutIcon :size="20" />
          <span class="nav-text">Logout</span>
        </button>
        
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      
      <!-- Top Navigation -->
      <div class="top-nav">
        
        <!-- Hamburger Menu Button (visible on mobile only) -->
        <button class="mobile-menu-btn" @click="isMobileOpen = true" title="Open Menu">
          <MenuIcon :size="20" />
        </button>

        <!-- Dynamic Page Title & Subtitle -->
        <div class="page-title-group" style="flex: 1;">
          <h2 class="top-nav-title" style="font-size: 20px; font-weight: 700; color: var(--text-main);">{{ pageTitle }}</h2>
          <p class="top-nav-subtitle" style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">{{ pageSubtitle }}</p>
        </div>

        <div class="top-actions">
          <button class="icon-btn">
            <SearchIcon :size="18" />
          </button>
          <button class="icon-btn">
            <BellIcon :size="18" />
          </button>
          
          <!-- Session Status Indicator -->
          <div class="session-status-pill">
            <div 
              style="width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;" 
              :style="{ background: getSessionColor(navSessionStatus) }"
            ></div>
            <span class="session-status-label" style="font-size: 12px; font-weight: 600; color: var(--text-main); white-space: nowrap;">
              Primary Session
            </span>
            <span class="session-status-text" style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">
              {{ navSessionStatus }}
            </span>
          </div>
          
          <!-- User Profile Dummy -->
          <div class="profile-pill">
            <div class="profile-avatar">A</div>
            <div class="profile-info">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-main);">Admin User</span>
              <span style="font-size: 9px; color: var(--text-muted);">admin@wabot.pro</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Page Content -->
      <div class="animate-fade-in" style="flex: 1;">
        <router-view></router-view>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  SmartphoneIcon,
  MessageSquareIcon,
  SearchIcon,
  SendIcon,
  KanbanIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  BellIcon,
  MenuIcon
} from '@lucide/vue';
import { fetchApi } from '../services/api';

const router = useRouter();
const route = useRoute();

// Mobile sidebar open state
const isMobileOpen = ref(false);

// Retrieve initial state from localStorage if exists
const isExpanded = ref(localStorage.getItem('sidebar_expanded') === 'true');

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
  localStorage.setItem('sidebar_expanded', String(isExpanded.value));
};

const logout = () => {
  localStorage.removeItem('adminToken');
  router.push('/login');
};

// Auto close mobile drawer on route change
watch(() => route.path, () => {
  isMobileOpen.value = false;
});

// Dynamic Title & Subtitle based on active route
const pageTitle = computed(() => {
  const name = route.name;
  if (name === 'Session') return 'Session Manager';
  if (name === 'AutoReply') return 'Auto Reply Rules';
  if (name === 'Scraper') return 'Maps Scraper';
  if (name === 'Blaster') return 'CRM & Broadcast';
  if (name === 'Projects') return 'Project Management';
  return 'Concern Ecosystem';
});

const pageSubtitle = computed(() => {
  const name = route.name;
  if (name === 'Session') return 'Configure and authenticate WhatsApp instances';
  if (name === 'AutoReply') return 'Configure automated responses for incoming WhatsApp messages';
  if (name === 'Scraper') return 'Extract business contacts from Google Maps';
  if (name === 'Blaster') return 'Manage contact database and send targeted broadcasts';
  if (name === 'Projects') return 'Track leads and manage project progress — Concern Ecosystem';
  return 'Manage your scraping and broadcast operations';
});

// --- Navbar Session Indicator Logic ---
const navSessions = ref<{id: string, status: string}[]>([]);
let dashboardPoll: number | null = null;

const fetchNavSessions = async () => {
  try {
    const data = await fetchApi(`/sessions?t=${Date.now()}`);
    navSessions.value = data;
  } catch {}
};

const navSessionStatus = computed(() => {
  if (navSessions.value.length > 0) {
    return navSessions.value[0].status;
  }
  return 'offline';
});

const getSessionColor = (status: string) => {
  if (status === 'connected') return '#34C759'; // green
  if (status === 'qr' || status === 'connecting') return '#FF9500'; // orange
  return '#FF3B30'; // red
};

onMounted(() => {
  fetchNavSessions();
  dashboardPoll = window.setInterval(fetchNavSessions, 5000);
});

onUnmounted(() => {
  if (dashboardPoll) clearInterval(dashboardPoll);
});
</script>

<style scoped>
/* Specific transitions handled in style.css */
</style>
