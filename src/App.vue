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
    }
  },
  methods: {
    
    performSearch() {
      console.log(this.store.searchQuery)
    }
  }
}
</script>

<template>
  <!-- Header с кнопками и поиском -->
  <header class="bg-light py-3">
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
        </div>
    </div>
  </header>

  <!-- Модальные окна -->
  <PlacementModal :show="showPlacementModal" @close="showPlacementModal = false"/>
  <IssueModal :show="showIssueModal" @close="showIssueModal = false"/>

  <!-- navbar -->
  <nav class="navbar navbar-warning bg-warning">
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
  <footer class="bg-warning text-dark">
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
