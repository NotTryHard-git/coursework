<template>
  <div class="login-container d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div class="card shadow-sm" style="width: 100%; max-width: 400px;">
      <div class="card-body p-4">
        <h2 class="card-title text-center mb-4">Вход в систему</h2>
        
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="username" class="form-label">Имя пользователя</label>
            <input
              type="text"
              class="form-control"
              id="username"
              v-model="credentials.username"
              required
              :disabled="isLoading"
            >
          </div>
          
          <div class="mb-3">
            <label for="password" class="form-label">Пароль</label>
            <input
              type="password"
              class="form-control"
              id="password"
              v-model="credentials.password"
              required
              :disabled="isLoading"
            >
          </div>
          
          <div v-if="error" class="alert alert-danger mb-3">
            {{ error }}
          </div>
          
          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            Войти
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { useCounterStore } from '../store.js'

export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      isLoading: false,
      error: ''
    }
  },
  setup() {
    const store = useCounterStore()
    return { store }
  },
  methods: {
    async handleLogin() {
      this.isLoading = true
      this.error = ''
      
      const result = await this.store.login(this.credentials)
      
      if (result.success) {
        this.$router.push('/')
      } else {
        this.error = result.error.non_field_errors?.[0] || 'Ошибка входа'
      }
      
      this.isLoading = false
    }
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>