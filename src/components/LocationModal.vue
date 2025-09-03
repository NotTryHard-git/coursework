<script>
import { useCounterStore } from '@/store';
import { ref, computed, onMounted, watch } from 'vue';

export default {
  name: 'LocationModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      default: null
    },
    flag: {
      type: Boolean,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useCounterStore();
    const selectedLocations = ref([]);
    const sectionCapacities = ref({});
    const isLoading = ref(false);
    const allSections = ref([]);

    // Загружаем все секции с полной информацией
    const loadAllSections = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/section/');
        const data = await response.json();
        allSections.value = data.results || [];
      } catch (error) {
        console.error('Error loading sections:', error);
        allSections.value = [];
      }
    };

    const calculateSectionCapacity = async (shelve, section, product) => {
      if (!product || !section) return 0;

      try {
        // Находим полную информацию о секции
        const fullSection = allSections.value.find(s => s.id === section.id);
        if (!fullSection) return 0;

        // Получаем размещения для этой секции
        const placementsResponse = await fetch(`http://localhost:8000/api/placement/`);
        const placementsData = await placementsResponse.json();
        const placements = placementsData.results || [];

        // Фильтруем размещения только для этой секции
        const sectionPlacements = placements.filter(p => p.section === section.id);

        // Рассчитываем занятый объем в секции
        let usedVolume = 0;
        sectionPlacements.forEach(placement => {
          // Используем размеры из размещения (они должны включать размеры товара)
          const placementVolume = placement.width * placement.height * placement.length;
          usedVolume += placementVolume * placement.quantity;
        });

        // Общий объем секции
        const sectionVolume = fullSection.width * fullSection.height * fullSection.length;
        
        // Объем одного товара
        const productVolume = product.width * product.height * product.length;
        
        if (productVolume <= 0) {
          console.warn('Product volume is 0 or negative:', product);
          return 0;
        }

        // Доступный объем
        const availableVolume = Math.max(0, sectionVolume - usedVolume);
        
        // Максимальное количество товаров, которое можно разместить
        const maxCapacity = Math.floor(availableVolume / productVolume);
        return Math.max(0, maxCapacity);
      } catch (error) {
        console.error('Error calculating capacity for section:', section.id, error);
        return 0;
      }
    };

    const loadSectionCapacities = async () => {
      if (!props.product) return;

      isLoading.value = true;
      sectionCapacities.value = {};

      try {
        await loadAllSections();

        for (const shelve of store.shelving) {
          for (const section of shelve.sections) {
            const capacity = await calculateSectionCapacity(shelve, section, props.product);
            const key = `${shelve.id}-${section.id}`;
            sectionCapacities.value[key] = capacity;
          }
        }
      } catch (error) {
        console.error('Error loading capacities:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const getSectionCapacity = (shelveId, sectionId) => {
      const key = `${shelveId}-${sectionId}`;
      const capacity = sectionCapacities.value[key] || 0;
      return capacity;
    };

    const getRemainingQuantity = computed(() => {
      if (!props.product) return 0;
      const allocated = selectedLocations.value.reduce((sum, loc) => sum + loc.quantity, 0);
      return Math.max(0, props.product.quantity - allocated);
    });

    const canAddLocation = (shelve, section) => {
      const capacity = getSectionCapacity(shelve.id, section.id);
      const isAvailable = capacity > 0 && getRemainingQuantity.value > 0 && !section.is_occupied;      
      return isAvailable;
    };

    const addLocation = (shelve, section) => {
      if (!canAddLocation(shelve, section)) {
        return;
      }

      const capacity = getSectionCapacity(shelve.id, section.id);
      const existingLocation = selectedLocations.value.find(
        loc => loc.shelvingId === shelve.id && loc.sectionId === section.id
      );

      if (!existingLocation) {
        const quantityToAdd = Math.min(capacity, getRemainingQuantity.value);
        
        selectedLocations.value.push({
          shelvingId: shelve.id,
          shelvingName: shelve.name,
          sectionId: section.id,
          sectionName: section.name || `Секция ${section.id}`,
          quantity: quantityToAdd,
          maxCapacity: capacity
        });

      }
    };

    const removeLocation = (index) => {
      const removed = selectedLocations.value.splice(index, 1);
    };

    const updateLocationQuantity = (index, newQuantity) => {
      const quantity = parseInt(newQuantity);
      if (isNaN(quantity)) return;

      const location = selectedLocations.value[index];
      const maxAllowed = Math.min(location.maxCapacity, getRemainingQuantity.value + location.quantity);
      
      if (quantity >= 1 && quantity <= maxAllowed) {
        location.quantity = quantity;
      }
    };

    const confirmLocations = () => {
      if (props.product && selectedLocations.value.length > 0) {
        emit('locations-selected', [...selectedLocations.value]);
        emit('close');
      }
    };

    const closeModal = () => {
      selectedLocations.value = [];
      emit('close');
    };

    // Дебаг информация
    const debugInfo = computed(() => {
      return {
        product: props.product,
        shelving: store.shelving,
        sections: allSections.value,
        capacities: sectionCapacities.value,
        selectedLocations: selectedLocations.value
      };
    });

    watch(() => props.show, (isVisible) => {
      if (isVisible && props.product) {
        selectedLocations.value = props.product.locations || [];
        loadSectionCapacities();
      }
    });

    watch(() => props.product, (newProduct) => {
      if (newProduct) {
        selectedLocations.value = newProduct.locations || [];
        loadSectionCapacities();
      }
    });

    return {
      store,
      selectedLocations,
      sectionCapacities,
      isLoading,
      getSectionCapacity,
      getRemainingQuantity,
      canAddLocation,
      addLocation,
      removeLocation,
      updateLocationQuantity,
      confirmLocations,
      closeModal,
      debugInfo
    };
  },
  methods: {
  getSectionTooltip(shelve, section) {
    const capacity = this.getSectionCapacity(shelve.id, section.id);
    if (section.is_occupied) return 'Секция полностью занята';
    if (capacity === 0) return 'Нет свободного места';
    return `Доступно мест: ${capacity}`;
  },
  async confirmPlacement() {
      if (this.flag) {
        try {                
          // Создаем размещения для каждой выбранной секции
          if (this.selectedLocations && this.selectedLocations.length > 0) {
            for (const location of this.selectedLocations) {
              const placementData = {
                product: this.product.id,
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
              
              if (placementData) {
                await this.store.createOperationLog({
                  action: 'placement',
                  product: placementData.product,
                  quantity: placementData.quantity,
                  new_location: placementData.section
                });
                
              }           
              // Обновляем логи после операции
              await this.store.fetchOperationLogs();
              if (!placementResponse.ok) {
                throw new Error('Ошибка при создании размещения');
              }
            }
          }
                      
          // Обновляем данные
          await this.store.fetchProducts();
          await this.store.fetchPlacement();
          this.$emit('close');
          
        } catch (error) {
          console.error('Error confirming placement:', error);
          alert('Ошибка при размещении товаров: ' + error.message);
        }
      }
       else {this.confirmLocations();}      
      
    },
}
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-light">
          <h5 class="modal-title">Выбор локаций для товара: {{ product?.name }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        
        <div class="modal-body">
          <!-- Дебаг информация (можно скрыть в production) -->
          <details class="mb-3" v-if="false">
            <summary>Debug Info</summary>
            <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
          </details>

          <div v-if="isLoading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-2">Расчет вместимости секций...</p>
          </div>

          <div v-else>
            <!-- Информация о товаре -->
            <div class="alert alert-info mb-3">
              <div class="row">
                <div class="col-md-3">
                  <strong>Товар:</strong> {{ product?.name }}
                </div>
                <div class="col-md-3">
                  <strong>Размер:</strong> {{ product?.width }}×{{ product?.height }}×{{ product?.length }}
                </div>
                <div class="col-md-2">
                  <strong>Количество:</strong> {{ product?.quantity }}
                </div>
                <div class="col-md-2">
                  <strong>Распределено:</strong> {{ product?.quantity - getRemainingQuantity }}
                </div>
                <div class="col-md-2">
                  <strong>Осталось:</strong> 
                  <span :class="{ 
                    'text-danger': getRemainingQuantity > 0, 
                    'text-success': getRemainingQuantity === 0 
                  }">
                    {{ getRemainingQuantity }}
                  </span>
                </div>
              </div>
              <div class="mt-2 small">
                <strong>Объем товара:</strong> 
                {{ (product?.width * product?.height * product?.length).toFixed(2) }} м³
              </div>
            </div>

            <!-- Выбранные локации -->
            <div v-if="selectedLocations.length > 0" class="mb-4">
              <h6>Выбранные локации:</h6>
              <div class="selected-locations">
                <div v-for="(location, index) in selectedLocations" :key="index" class="card mb-2">
                  <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="flex-grow-1">
                        <strong>Стеллаж {{ location.shelvingName }} - Секция {{ location.sectionName }}</strong>
                        <div class="text-muted small">
                          Максимум: {{ location.maxCapacity }} шт. | 
                          Выбрано: {{ location.quantity }} шт.
                        </div>
                      </div>
                      <div class="d-flex align-items-center">
                        <input 
                          type="number" 
                          v-model.number="location.quantity" 
                          :max="Math.min(location.maxCapacity, getRemainingQuantity + location.quantity)"
                          :min="1"
                          class="form-control form-control-sm me-2"
                          style="width: 80px;"
                          @change="updateLocationQuantity(index, $event.target.value)"
                        >
                        <button class="btn btn-sm btn-danger" @click="removeLocation(index)">
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Список стеллажей -->
            <h6>Доступные секции:</h6>
            <div class="shelving-list">
              <div v-for="shelve in store.shelving" :key="shelve.id" class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span>Стеллаж {{ shelve.name }}</span>
                  <small class="text-muted">{{ shelve.sections?.length || 0 }} секций</small>
                </div>
                <div class="card-body">
                  <div class="row" v-if="shelve.sections && shelve.sections.length > 0">
                    <div v-for="section in shelve.sections" :key="section.id" class="col-md-3 mb-2">
                      <div 
                        class="section-card"
                        :class="{
                          'available': canAddLocation(shelve, section),
                          'unavailable': !canAddLocation(shelve, section),
                          'selected': selectedLocations.some(loc => loc.sectionId === section.id),
                          'occupied': section.is_occupied
                        }"
                        @click="addLocation(shelve, section)"
                        :title="getSectionTooltip(shelve, section)"
                      >
                        <div class="section-header">
                          Секция {{ section.name || section.id }}
                        </div>
                        <div class="section-info">
                          <small>
                            <div>Доступно: {{ getSectionCapacity(shelve.id, section.id) }} шт.</div>
                            <div v-if="section.is_occupied" class="text-danger">Занята</div>
                            <div v-else-if="getSectionCapacity(shelve.id, section.id) === 0" class="text-warning">
                              Нет места
                            </div>
                          </small>
                        </div>
                        <div 
                          v-if="getSectionCapacity(shelve.id, section.id) > 0"
                          class="section-usage" 
                          :style="{ 
                            width: Math.min(100, (getSectionCapacity(shelve.id, section.id) / Math.max(1, product.quantity)) * 50) + '%' 
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-muted">
                    Нет секций
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Закрыть
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="confirmPlacement" 
            :disabled="getRemainingQuantity > 0 || selectedLocations.length === 0"
            :title="getRemainingQuantity > 0 ? `Осталось распределить ${getRemainingQuantity} шт.` : 'Все товары распределены'"
          >
            Подтвердить ({{ product?.quantity - getRemainingQuantity }}/{{ product?.quantity }})
          </button>
        </div>
      </div>
    </div>
  </div>
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
  z-index: 1050;
}

.section-card {
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  min-height: 80px;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.section-card.available {
  background-color: #f0fff4;
  border-color: #38a169;
}

.section-card.available:hover {
  border-color: #2f855a;
}

.section-card.unavailable {
  background-color: #fed7d7;
  border-color: #e53e3e;
  cursor: not-allowed;
  opacity: 0.7;
}

.section-card.selected {
  background-color: #ebf8ff;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px #3182ce;
}

.section-card.occupied {
  background-color: #fff5f5;
  border-color: #c53030;
}

.section-header {
  font-weight: bold;
  margin-bottom: 6px;
  color: #2d3748;
  font-size: 0.9em;
}

.section-info {
  font-size: 0.75em;
  color: #718096;
}

.section-usage {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background-color: #38a169;
  transition: width 0.3s ease;
}

.selected-locations .card {
  border-left: 4px solid #3182ce;
  background-color: #f7fafc;
}
</style>