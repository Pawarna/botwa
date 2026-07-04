<template>
  <div class="app-container">
    
    <!-- Collapsible Sidebar -->
    <aside class="sidebar" :class="{ expanded: isExpanded }">
      
      <!-- Logo area -->
      <router-link to="/" class="logo-container">
        <div class="logo-icon">W</div>
        <span class="logo-text">WaBot Pro</span>
      </router-link>
      
      <!-- Nav menu -->
      <nav class="nav-menu">
        <router-link to="/session" class="nav-item" active-class="active" title="Session Manager">
          <SmartphoneIcon :size="20" />
          <span class="nav-text">Sessions</span>
        </router-link>
        
        <router-link to="/auto-reply" class="nav-item" active-class="active" title="Auto Reply Rules">
          <MessageSquareIcon :size="20" />
          <span class="nav-text">Auto Reply</span>
        </router-link>
        
        <router-link to="/scraper" class="nav-item" active-class="active" title="Maps Scraper">
          <SearchIcon :size="20" />
          <span class="nav-text">Scraper</span>
        </router-link>
        
        <router-link to="/blaster" class="nav-item" active-class="active" title="Advanced Blaster">
          <SendIcon :size="20" />
          <span class="nav-text">Blaster</span>
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
      
      <!-- Top Navigation without pills -->
      <div class="top-nav">
        
        <!-- Welcome text / Page Title -->
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main);">Dashboard</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Manage your scraping and broadcast operations</p>
        </div>

        <div class="top-actions">
          <button class="icon-btn">
            <SearchIcon :size="18" />
          </button>
          <button class="icon-btn">
            <BellIcon :size="18" />
          </button>
          
          <!-- User Profile Dummy -->
          <div style="display: flex; align-items: center; gap: 10px; background: white; padding: 6px 12px 6px 6px; border-radius: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid var(--border);">
            <div style="width: 28px; height: 28px; border-radius: 14px; background: #FF5C35; color: white; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: 700;">A</div>
            <div style="display: flex; flex-direction: column;">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  SmartphoneIcon,
  MessageSquareIcon,
  SearchIcon,
  SendIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  BellIcon
} from '@lucide/vue';

const router = useRouter();

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
</script>

<style scoped>
/* Specific transitions handled in style.css */
</style>
