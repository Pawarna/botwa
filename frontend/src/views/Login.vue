<template>
  <div class="login-container animate-fade-in" style="display: flex; justify-content: center; align-items: center; min-height: 100vh; width: 100%;">
    <div class="glass-panel" style="width: 100%; max-width: 400px;">
      <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary);">WaBot Pro</h2>
      
      <div v-if="error" style="color: var(--danger); margin-bottom: 1rem; text-align: center; font-size: 14px;">
        {{ error }}
      </div>
      <div v-if="successMsg" style="color: var(--success); margin-bottom: 1rem; text-align: center; font-size: 14px;">
        {{ successMsg }}
      </div>

      <form @submit.prevent="isRegistering ? handleRegister() : handleLogin()">
        <div class="form-group mb-3">
          <label class="form-label">Email Address</label>
          <input 
            type="email" 
            class="form-control" 
            v-model="email" 
            placeholder="admin@wabot.pro" 
            required 
          />
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="password" 
            placeholder="••••••••" 
            required 
          />
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
          {{ loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Login') }}
        </button>
      </form>
      
      <div style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted);">
        {{ isRegistering ? 'Already have an account?' : 'Don\'t have an account?' }}
        <button type="button" @click="toggleMode" style="background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer;">
          {{ isRegistering ? 'Login' : 'Sign up' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const successMsg = ref('');
const isRegistering = ref(false);
const loading = ref(false);
const router = useRouter();

const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  error.value = '';
  successMsg.value = '';
};

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      router.push('/');
    }
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  error.value = '';
  successMsg.value = '';
  loading.value = true;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    
    successMsg.value = 'Registration successful! You can now login.';
    isRegistering.value = false;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
