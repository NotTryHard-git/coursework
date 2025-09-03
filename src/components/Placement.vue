<script>
import { useCounterStore } from '@/store';
import { ref } from 'vue';
import LocationModal from '@/components/LocationModal.vue';

export default {
  emits: ['close'],
  name: 'PlacementModal',
  components: { LocationModal },
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useCounterStore();
    const showValidation = ref(false);
    return { store, showValidation };
  },
  data() {
    return {
      showLocationModal: false,
      currentProductIndex: null
    };
  },
  methods: {
    async SpecialValidation(product) {
      if (!product.location) return;
      
      try {
        // Проверяем доступное место через API
        const response = await fetch(`http://localhost:8000/api/section/${product.location.sectionId}/`);
        const section = await response.json();
        
        // Получаем текущие размещения в секции
        const placementsResponse = await fetch(`http://localhost:8000/api/placement/?section=${product.location.sectionId}`);
        const placements = await placementsResponse.json();
        
        // Рассчитываем занятый объем
        let usedVolume = 0;
        placements.results.forEach(placement => {
          usedVolume += placement.product.width * placement.product.height * placement.product.length * placement.quantity;
        });
        
        const availableVolume = (section.width * section.height * section.length) - usedVolume;
        const neededVolume = product.width * product.height * product.length * product.quantity;
        
        if (availableVolume < neededVolume) {
          alert('Не хватает места в секции');
          this.showValidation = true;
          product.quantity = 0;
          throw new Error('Превышен лимит мест в секции');
        }
      } catch (error) {
        console.error('Error validating section capacity:', error);
        throw error;
      }
    },
    
    clearValidation() {
      this.showValidation = false;
    },
    
    validateForm() {
      this.showValidation = true;
      return this.store.tempPlacementItems.every(p => 
        p.code && 
        p.name && 
        p.width > 0 && 
        p.height > 0 && 
        p.length > 0 && 
        p.quantity > 0 &&
        p.type_id
      );
    },
    
    async confirmPlacement() {
      if (!this.validateForm()) {
        return;
      }
      
      try {
        // Для каждого товара создаем запись и размещение
        for (const product of this.store.tempPlacementItems) {
          // Создаем товар
          const productData = {
            code: product.code,
            name: product.name,
            width: product.width,
            height: product.height,
            length: product.length,
            quantity: product.quantity,
            type_id: product.type_id,
            weight: product.weight || 0
          };
          
          const productResponse = await fetch('http://localhost:8000/api/goods/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
          });
          
          if (!productResponse.ok) {
            throw new Error('Ошибка при создании товара');
          }
          
          const newProduct = await productResponse.json();
          
          // Создаем размещения для каждой выбранной секции
          if (product.locations && product.locations.length > 0) {
            for (const location of product.locations) {
              const placementData = {
                product: newProduct.id,
                section: location.sectionId,
                quantity: location.quantity
              };
              
              const placementResponse = await fetch('http://localhost:8000/api/placement/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(placementData)
              });
              // Создаем логи операций для каждого размещения
              for (const product of this.store.tempPlacementItems) {
                if (product.locations && product.locations.length > 0) {
                  for (const location of product.locations) {
                    await this.store.createOperationLog({
                      action: 'placement',
                      product: newProduct.id,
                      quantity: location.quantity,
                      new_location: location.sectionId
                    });
                  }
                }
              }
            
              // Обновляем логи после операции
              await this.store.fetchOperationLogs();
              if (!placementResponse.ok) {
                throw new Error('Ошибка при создании размещения');
              }
            }
          }
        }
        
        // Очищаем временные данные
        this.store.tempPlacementItems = [];
        this.showValidation = false;
        
        // Обновляем данные
        await this.store.fetchProducts();
        await this.store.fetchPlacement();
        
        this.$emit('close');
        
      } catch (error) {
        console.error('Error confirming placement:', error);
        alert('Ошибка при размещении товаров: ' + error.message);
      }
    },
    
    openLocationModal(index) {
      this.currentProductIndex = index;
      this.store.setSelectedProduct(this.store.tempPlacementItems[index]);
      this.showLocationModal = true;
    },
    
    cancelPlacement() {
      this.store.cancelPlacement();
      this.showValidation = false;
      this.$emit('close');
    },
    
    
  },
  
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="cancelPlacement">
    <div class="modal-container">
      <div class="modal-content">
        <div class="modal-header bg-light">
          <h5 class="modal-title">Товары для размещения</h5>
          <button type="button" class="btn-close" @click="cancelPlacement"></button>
        </div>
        
        <div class="modal-body">
          <div class="d-flex justify-content-between mb-3">
            <button class="btn btn-success" @click="store.addTempPlacementProduct()">
              Добавить товар
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Код товара</th>
                  <th>Название</th>
                  <th>Ширина</th>
                  <th>Высота</th>
                  <th>Длина</th>
                  <th>Кол-во</th>
                  <th>Локации</th>
                  <th>Тип</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in store.tempPlacementItems" :key="index">
                  <td>
                    <input 
                      v-model="product.code" 
                      class="form-control form-control-sm"
                      :class="{ 'is-invalid': !product.code && showValidation }"
                      @input="clearValidation"
                    >
                  </td>
                  <td>
                    <input 
                      v-model="product.name" 
                      class="form-control form-control-sm"
                      :class="{ 'is-invalid': !product.name && showValidation }"
                      @input="clearValidation"
                    >
                  </td>
                  <td>
                    <input 
                      v-model="product.width" 
                      type="number" 
                      step="0.01"
                      class="form-control form-control-sm"
                      :class="{ 'is-invalid': (!product.width || product.width <= 0) && showValidation }"
                      @input="clearValidation"
                    >
                  </td>
                  <td>
                    <input 
                      v-model="product.height" 
                      type="number" 
                      step="0.01"
                      class="form-control form-control-sm"
                      :class="{ 'is-invalid': (!product.height || product.height <= 0) && showValidation }"
                      @input="clearValidation"
                    >
                  </td>
                  <td>
                    <input 
                      v-model="product.length" 
                      type="number" 
                      step="0.01"
                      class="form-control form-control-sm"
                      :class="{ 'is-invalid': (!product.length || product.length <= 0) && showValidation }"
                      @input="clearValidation"
                    >
                  </td>
                  <td>
                    <input 
                      v-model="product.quantity" 
                      type="number" 
                      class="form-control form-control-sm" 
                      min="1"
                      :class="{ 'is-invalid': (!product.quantity || product.quantity < 1) && showValidation }"
                      @input="clearValidation"
                    >
                  </td>
                  <td>
                    <div v-if="product.locations && product.locations.length > 0">
                      <span v-for="(loc, i) in product.locations" :key="i" class="badge bg-secondary me-1">
                        {{ loc.shelvingName }} - {{ loc.sectionName }} ({{ loc.quantity }})
                      </span>
                    </div>
                    <span v-else class="text-muted">Не указаны</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" @click="openLocationModal(index)">
                      Выбрать
                    </button>
                  </td>
                  <td>
                    <select 
                      v-model="product.type_id" 
                      class="form-select form-select-sm"
                      :class="{ 'is-invalid': !product.type_id && showValidation }"
                      @change="clearValidation"
                    >
                      <option value="" disabled selected>Выберите тип</option>
                      <option value="1">Инструмент</option>
                      <option value="2">Материал</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-danger" @click="store.removeTempPlacementProduct(index)">
                      Удалить
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelPlacement">
            Отмена
          </button>
          <button type="button" class="btn btn-primary" @click="confirmPlacement">
            Подтвердить размещение
          </button>
        </div>
      </div>
    </div>
  </div>

  <LocationModal 
    :show="showLocationModal" 
    :product="currentProductIndex !== null ? store.tempPlacementItems[currentProductIndex] : null"
    :flag="false"
    @close="showLocationModal = false"
    @locations-selected="handleLocationsSelected"
  />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.badge {
  font-size: 0.75em;
}
</style>