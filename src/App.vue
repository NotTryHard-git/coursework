<script>
import PlacementModal from './components/Placement.vue'
import IssueModal from './components/Issue.vue'
import { useCounterStore } from './store.js'

export default {
  components: {
    PlacementModal,
    IssueModal
  },
  setup() {
    const store = useCounterStore();
    return { store };
  },
  data() {
    return {
      showPlacementModal: false,
      showIssueModal: false,
      showUserMenu: false
    }
  },
  async mounted() {
    await this.store.checkAuth()
  },
  methods: {
    performSearch() {
      console.log(this.store.searchQuery)
    },
    
    async handleLogout() {
      try {
        const success = await this.store.logout()
        if (success) {
          console.log('Logout successful')
        } else {
          console.log('Logout completed with possible errors')
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.showUserMenu = false
        this.$router.push('/login')
      }
    }
  }
}
</script>

<template>
  <!-- Header с кнопками и поиском -->
  <header class="bg-light py-3" v-if="store.isAuthenticated">
    <div class="container">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-auto">
          <button class="btn btn-primary w-100" @click="showPlacementModal = true">Размещение</button>
        </div>
        <div class="col-12 col-md-auto">
          <button class="btn btn-primary w-100" @click="showIssueModal = true">Выдача</button>
        </div>
        <div class="col-12 col-md-4">
          <form class="d-flex">
            <input class="form-control" type="search" placeholder="Поиск..." aria-label="Search" v-model="store.searchQuery">
          </form>
        </div>
        
        <!-- Профиль пользователя -->
        <div class="col-12 col-md-auto ms-md-auto">
          <div class="d-flex align-items-center justify-content-end">
            <template v-if="store.authLoading">
              <div class="spinner-border spinner-border-sm text-primary me-2"></div>
            </template>
            <template v-else-if="store.isAuthenticated && store.user">
              <div class="dropdown">
                <button 
                  class="btn btn-outline-primary dropdown-toggle d-flex align-items-center"
                  type="button"
                  @click="showUserMenu = !showUserMenu"
                >
                  <span class="me-2">{{ store.user.first_name }} {{ store.user.last_name }}</span>
                  <i class="bi bi-person-circle"></i>
                </button>
                <ul 
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: showUserMenu }"
                >
                  <li><span class="dropdown-item-text small text-muted">{{ store.user.position }}</span></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button class="dropdown-item" @click="handleLogout">Выйти</button></li>
                </ul>
              </div>
            </template>
            <template v-else>
              <router-link to="/login" class="btn btn-outline-primary">
                Войти
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Модальные окна -->
  <PlacementModal :show="showPlacementModal" @close="showPlacementModal = false" v-if="store.isAuthenticated"/>
  <IssueModal :show="showIssueModal" @close="showIssueModal = false" v-if="store.isAuthenticated"/>

  <!-- navbar -->
  <nav class="navbar navbar-warning bg-warning" v-if="store.isAuthenticated">
    <div class="container-fluid p-0">
      <div class="row g-0 w-100 flex-column flex-md-row">
        <div class="col-12 col-md-6 text-center position-relative border-md-end border-secondary" style="--bs-border-opacity: 0.3;">
          <RouterLink to="/goods" class="d-block py-3 text-decoration-none text-dark fw-semibold position-relative" active-class="active-nav-item">
            Товары
          </RouterLink>
        </div>
        <div class="col-12 col-md-6 text-center">
          <RouterLink to="/shelving" class="d-block py-3 text-decoration-none text-dark fw-semibold position-relative" active-class="active-nav-item">
            Стеллажи
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>

  <main class="page-container">
    <RouterView />
  </main>

  <!-- Footer -->
  <footer class="bg-warning text-dark" v-if="store.isAuthenticated">
    <div class="container">
      <div class="row">
        <div class="col-md-4 text-center text-md-start">
          <h5>О нас</h5>
          <p>Краткое описание компании или сайта. Все права защищены.</p>
        </div>
        <div class="col-md-4 text-center text-md-start">
          <h5>Контакты</h5>
          <ul class="list-unstyled">
            <li>Email: info@example.com</li>
            <li>Телефон: +7 (123) 456-78-90</li>
            <li>Адрес: г. Томск, ул. Примерная, 123</li>
          </ul>
        </div>
        <div class="col-md-4 text-center text-md-start">
          <h5>Социальные сети</h5>
          <div class="social-links">
            <a href="#" class="text-dark me-2">Facebook</a>
            <a href="#" class="text-dark me-2">Twitter</a>
            <a href="#" class="text-dark">Instagram</a>
          </div>
        </div>
      </div>
      <div class="text-center mt-3">
        <p>&copy; 2025</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.dropdown-menu {
  position: absolute;
  right: 0;
  left: auto;
}

.min-vh-100 {
  min-height: 100vh;
}
</style>