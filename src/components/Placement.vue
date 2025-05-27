<script>
import { useCounterStore } from '@/store';
import { ref } from 'vue';
import LocationModal from '@/components/LocationModal.vue';

export default {
  emits: ['close'],// без этого ругался браузер
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
    return { store ,
      showValidation
    };
  },
  data() {
    return {
      showLocationModal: false,
    };
  },
  methods: {
    SpecialValidation(product){
      if (!product.location) return;
      const availableSpace = this.store.sectionCapacity - this.store.getSectionUsage(product.location.id, product.location.section);
      const neededSpace = product.quantity;
      if(availableSpace-neededSpace<0){
        alert('Не хватает места в секции');
        this.showValidation = true;
        product.quantity=0;
        throw new Error('Превышен лимит мест в секции');      
      }
    },
    clearValidation() {
      this.showValidation = false;
    },
    validateForm() {
      this.showValidation = true;
      return this.store.tempPlacementItems.every(p => 
        p.id && 
        p.name && 
        p.dimensions && 
        p.quantity > 0 &&
        p.type
      );
    },
    confirmPlacement() {
      if (!this.validateForm()) {
        return;
      }
      this.store.confirmPlacement();
      this.showValidation = false;
      this.$emit('close');
    },     
    openLocationModal(index) {
      this.store.setSelectedProduct(this.store.tempPlacementItems[index]);
      console.log(this.store.selectedProductForPlacement.quantity);
      this.showLocationModal = true;
    },    
    cancelPlacement() {
      this.store.cancelPlacement();
      this.showValidation = false;
      this.$emit('close');
    }
  }
}
</script>

<template>
  <!-- Modal form для размещения-->
  <div v-if="show" class="modal-overlay" @click.self="cancelPlacement">
    <div class="modal-container" >
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
                  <th>ID товара</th>
                  <th>Название</th>
                  <th>Габариты</th>
                  <th>Кол-во</th>
                  <th>Локация</th>
                  <th>Тип</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in store.tempPlacementItems" :key="index">
            <td>
              <input 
                v-model="product.id" 
                class="form-control form-control-sm"
                :class="{ 'is-invalid': !product.id && showValidation }"
                @input="clearValidation"
              >
              <div v-if="!product.id && showValidation" class="invalid-feedback">
                Поле обязательно для заполнения
              </div>
            </td>
            <td>
              <input 
                v-model="product.name" 
                class="form-control form-control-sm"
                :class="{ 'is-invalid': !product.name && showValidation }"
                @input="clearValidation"
              >
              <div v-if="!product.name && showValidation" class="invalid-feedback">
                Поле обязательно для заполнения
              </div>
            </td>
            <td>
              <input 
                v-model="product.dimensions" 
                class="form-control form-control-sm"
                :class="{ 'is-invalid': !product.dimensions && showValidation }"
                @input="clearValidation"
              >
              <div v-if="!product.dimensions && showValidation" class="invalid-feedback">
                Поле обязательно для заполнения
              </div>
            </td>
            <td>
              <input 
                v-model="product.quantity" 
                type="number" 
                class="form-control form-control-sm" 
                min="1"
                :class="{ 'is-invalid': (!product.quantity || product.quantity < 1) && showValidation }"
                @input="clearValidation"
                @change="SpecialValidation(product)"
              >
              <div v-if="(!product.quantity || product.quantity < 1) && showValidation" class="invalid-feedback">
                Введите корректное количество
              </div>
            </td>
            <td>
              <span v-if="product.location">
                {{ product.location.id }} - {{ product.location.section }}
              </span>
              <span v-else class="text-muted">Не указана</span>
              <button class="btn btn-sm btn-outline-primary ms-2" @click="openLocationModal(index)">
                Выбрать
              </button>
            </td>
            <td>
              <select 
                v-model="product.type" 
                class="form-select form-select-sm"
                :class="{ 'is-invalid': !product.type && showValidation }"
                @change="clearValidation"
              >
                <option value="" disabled selected>Выберите тип</option>
                <option value="tool">Инструмент (tool)</option>
                <option value="material">Материал (material)</option>
              </select>
              <div v-if="!product.type && showValidation" class="invalid-feedback">
                Поле обязательно для заполнения
              </div>
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

  <LocationModal :show="showLocationModal" @close="showLocationModal = false"/>
</template>
