<template>
  <div class="login-container d-flex align-center justify-between animate-fade-in" style="justify-content: center; min-height: 100vh;">
    <div class="glass-panel" style="width: 100%; max-width: 400px;">
      <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary);">WhatsApp Bot Admin</h2>
      
      <div v-if="error" style="color: var(--danger); margin-bottom: 1rem; text-align: center;">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Admin Secret Key</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="secret" 
            placeholder="Enter admin secret" 
            required 
          />
        </div>
        <button type="submit" class="btn btn-primary mt-4" style="width: 100%;">
          Login to Dashboard
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '../services/api';

const secret = ref('');
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
  error.value = '';
  // Simply test the token by making a health check or a session check request
  // But wait, we can just save it and redirect to dashboard, and let the dashboard fail if invalid.
  localStorage.setItem('adminToken', secret.value);
  
  try {
    // Try hitting a protected route to verify
    // Using a fake session id just to test auth middleware
    await fetchApi('/sessions/verify-auth-test');
    router.push('/');
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      error.value = 'Invalid Admin Secret';
      localStorage.removeItem('adminToken');
    } else {
      // It might be a 404 or other error if route doesn't exist, but it passed Auth
      router.push('/');
    }
  }
};
</script>
