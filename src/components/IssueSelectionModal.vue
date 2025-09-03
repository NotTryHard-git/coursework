<script>
import { useCounterStore } from '@/store';
import { ref, computed } from 'vue';

export default {
  name: 'IssueSelectionModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useCounterStore();
    const quantities = ref({});

    // Доступные размещения для выдачи
    const availablePlacements = computed(() => {
      if (!props.product || !props.product.placements) return [];
      return props.product.placements.filter(p => p.quantity > 0);
    });

    // Общее доступное количество
    const totalAvailable = computed(() => {
      return availablePlacements.value.reduce((sum, p) => sum + p.quantity, 0);
    });

    

    // Инициализируем количества при открытии модалки
    const initQuantities = () => {
      quantities.value = {};
      availablePlacements.value.forEach(placement => {
        quantities.value[placement.id] = 0;
      });
    };

    // Добавляем выбранные размещения в issue
    const confirmSelection = () => {
      const itemsToIssue = [];
      
      for (const placementId in quantities.value) {
        const quantity = quantities.value[placementId];
        if (quantity > 0) {
          const placement = availablePlacements.value.find(p => p.id === parseInt(placementId));
          if (placement) {
            itemsToIssue.push({
              code: props.product.code,
              width: props.product.width,
              height: props.product.height,
              length: props.product.length,
              type_id: props.product.type_id,
              weight: props.product.weight,
              productId: props.product.id,
              productName: props.product.name,
              placementId: placement.id,
              sectionId:placement.section,
              shelvingName: placement.shelving_name,
              sectionName: placement.section_name,
              total_quantity: props.product.quantity,
              total_quantity_in_section: placement.quantity,
              quantity_to_issue: quantity
            });
            store.products.forEach(product => {
                if(product.id ===props.product.id){
                    product.quantity-=quantity;
                    product.placements.forEach(place => {
                        if(place.id===parseInt(placementId)){
                            place.quantity-=quantity
                        }
                    })
                }
            });
                
            }
          }
        
      }

      if (itemsToIssue.length > 0) {
        emit('issue-selected', itemsToIssue);
        emit('close');
      }
    };

    const closeModal = () => {
      emit('close');
    };

    return {
      store,
      availablePlacements,
      totalAvailable,
      quantities,
      confirmSelection,
      closeModal,
      initQuantities
    };
  },
  watch: {
    show(isVisible) {
      if (isVisible) {
        this.initQuantities();
      }
    }
  }
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-light">
          <h5 class="modal-title">Выдача товара: {{ product?.name }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        
        <div class="modal-body">
          <div class="alert alert-info mb-3">
            <div class="row">
              <div class="col-md-6">
                <strong>Товар:</strong> {{ product?.name }}
              </div>
              <div class="col-md-6">
                <strong>Доступно к выдаче:</strong> {{ totalAvailable }} шт.
              </div>
            </div>
          </div>

          <div v-if="availablePlacements.length === 0" class="text-center py-4">
            <p class="text-muted">Нет доступных размещений для выдачи</p>
          </div>

          <div v-else>
            <h6>Выберите откуда и сколько выдать:</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Стеллаж</th>
                    <th>Секция</th>
                    <th>Доступно</th>
                    <th>Количество для выдачи</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="placement in availablePlacements" :key="placement.id">
                    <td>{{ placement.shelving_name }}</td>
                    <td>{{ placement.section_name }}</td>
                    <td>{{ placement.quantity }} шт.</td>
                    <td>
                      <input
                        type="number"
                        v-model.number="quantities[placement.id]"
                        :max="placement.quantity"
                        min="0"
                        class="form-control form-control-sm"
                        @change="quantities[placement.id] = Math.min(Math.max(0, quantities[placement.id] || 0), placement.quantity)"
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            Отмена
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="confirmSelection"
            :disabled=" Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0) === 0"
          >
            Подтвердить выдачу
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

.modal-dialog {
  margin: 0;
  max-width: 90%;
}

input[type="number"] {
  width: 80px;
}
</style>