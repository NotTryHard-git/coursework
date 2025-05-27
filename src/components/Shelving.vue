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
      store: useCounterStore()
    }
  },
  methods: {
    openLocationModalForProduct(product) {
      this.store.setSelectedProduct(product)
      this.store.flag = 1
      this.showLocationModal = true
    },
    openSectionModal(shelving, section) {
      this.currentSection = { shelving, section }
      this.currentSectionItems = this.store.getItemsInSection(shelving, section)
      
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
    <div class="row">
      <div class="col-md-6">
        <h3>Стеллажи</h3>
        <div class="shelving-list table-responsive">
          <div v-for="shelve in store.shelvingWithUsage" :key="shelve.id" class="card mb-3">
            <div class="card-header">
              Стеллаж {{ shelve.id }} (Занято: {{ shelve.used }}/{{ shelve.capacity }})
            </div>
            <div class="card-body">
              <!--  :class= это динамический класс ,который в зависимости от значения булевых переменных перенимает определённые стили. 
                # если store.isSectionOccupied(shelve.id, section) true, то стиль occupied будет применён -->
              <div v-for="section in shelve.sections" :key="section" 
                   class="section" 
                   :class="{ 
                     'occupied': store.isSectionOccupied(shelve.id, section),
                     'full': store.isSectionFull(shelve.id, section),
                     'selected': selectedSection?.shelving === shelve.id && selectedSection?.section === section
                   }"
                   @click="openSectionModal(shelve.id, section)">
                Секция {{ section }}
                <div class="section-usage" :style="{ width: store.getSectionUsagePercent(shelve.id, section) + '%' }"></div>
                <div v-if="store.getItemsInSection(shelve.id, section).length > 0" class="product-count">
                  {{ store.getSectionUsage(shelve.id, section) }} шт.
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
              <span v-if="product.location">
                {{ product.location.id }} - {{ product.location.section }}
              </span>
              <span v-else class="text-muted">Не указана</span>
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
            <h5 class="modal-title">Содержимое секции {{ currentSection?.shelving }} - {{ currentSection?.section }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <table class="table" v-if="currentSectionItems.length > 0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Количество</th>
                  <th>Тип</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in currentSectionItems" :key="item.id">
                  <td>{{ item.id }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.type }}</td>
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
  
  <LocationModal :show="showLocationModal" @close="showLocationModal = false"/>
  </div>
</template>


