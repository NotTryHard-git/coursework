<script>
import { useCounterStore } from '@/store'
import { Modal } from 'bootstrap'
import LocationModal from '@/components/LocationModal.vue'

export default {
  components: {
    LocationModal
  },
  data() {
    return {
      selectedSection: null,
      currentSection: null,
      currentSectionItems: [],
      showLocationModal: false,
      sectionModal: null,
      store: useCounterStore(),
      isLoading: false,
    }
  },
  async mounted() {
    await this.loadData();
    
  },
  methods: {
    async loadData() {
      this.isLoading = true;
      try {
        await this.store.loadAllData();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        this.isLoading = false;
      }
    },
    openLocationModalForProduct(product) {
      this.store.setSelectedProduct(product)
      this.store.flag = 1
      this.showLocationModal = true
    },
    openSectionModal(shelvingID, sectionID) {
      this.currentSection = { shelving_id: shelvingID, section_id: sectionID }
      this.currentSectionItems = this.store.getItemsInSection(shelvingID, sectionID)
      
      if (!this.sectionModal) {
        this.sectionModal = new Modal(document.getElementById('sectionModal'))
      }
      this.sectionModal.show()
    }
  }
}
</script>

<template>
  <div class="container table-container">
    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="mt-2">Загрузка данных...</p>
    </div>

    <div v-else class="row">
      <div class="col-md-6">
        <h3>Стеллажи</h3>
        <div class="shelving-list table-responsive">
          <div v-for="shelve in store.shelvingWithUsage" :key="shelve.id" class="card mb-3">
            <div class="card-header">
              Стеллаж {{ shelve.name }} (Занято: {{ shelve.used }}%)
            </div>
            <div class="card-body">
              <!--  :class= это динамический класс ,который в зависимости от значения булевых переменных перенимает определённые стили. 
                # если store.isSectionOccupied(shelve.id, section) true, то стиль occupied будет применён -->
              <div v-for="section in shelve.sections" :key="section" >
                <div class="section" 
                   :class="{ 
                     'occupied': store.isSectionOccupied(shelve.id, section),
                     'full': section.is_occupied,
                     'selected': selectedSection?.shelving === shelve.id && selectedSection?.section === section
                   }"
                   @click="openSectionModal(shelve.id, section.id)">
                Секция {{ section.name }}
                <div class="section-usage" :style="{ width: store.getSectionUsagePercent(shelve.id, section) + '%' }"></div>
                <div v-if="store.getItemsInSection(shelve.id, section.id).length > 0" class="product-count">
                  {{ store.getSectionUsagePercent(shelve.id, section)}} %
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <h3>Товары без размещения</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Количество</th>
              <th>Действие</th>
            </tr>
          </thead>
          
          <tbody>
            <tr v-for="product in store.filteredUnplacedItems" :key="product.id">
              <td>{{ product.id }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.quantity }}</td>
              <td>
              <button class="btn btn-sm btn-primary" @click="openLocationModalForProduct(product)">
                Выбрать
              </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модальное окно для просмотра содержимого секции -->
    <div class="modal fade" id="sectionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Содержимое секции  {{ currentSection?.section_id }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <table class="table" v-if="currentSectionItems.length > 0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in currentSectionItems" :key="item.id">
                  <td>{{ item.product }}</td>
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else>
              Секция пуста
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  <LocationModal 
    :show="showLocationModal" 
    :product="this.store.selectedProductForPlacement"
    :flag="true"
    @close="showLocationModal = false"
    @locations-selected="handleLocationsSelected"
  />
  </div>
</template>


