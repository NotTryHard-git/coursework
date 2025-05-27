<script>
import { useCounterStore } from '@/store';

export default {
  name: 'LocationModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useCounterStore();
    return { store };
  },
  data() {
    return {
      tempLocation: null,
    };
  },
  methods: {
    selectLocation(id, section) {
      const availableSpace = this.store.sectionCapacity - this.store.getSectionUsage(id, section);
      const neededSpace = this.store.selectedProductForPlacement?.quantity || 0;
      
      if (availableSpace >= neededSpace) {
        this.tempLocation = { id: id, section: section };
      }
    },
    
    confirmLocation() {
      if (this.tempLocation) {
        this.store.confirmProductLocation(this.tempLocation);
        this.$emit('close');
      }
    }
  }
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-light">
          <h5 class="modal-title">Выбор локации для товара</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        
        <div class="modal-body">
          <h6>Выберите стеллаж и секцию:</h6>
          
          <div class="shelving-list">
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
                        'selected': tempLocation?.id === shelve.id && tempLocation?.section === section,
                        'disabled': (store.sectionCapacity - store.getSectionUsage(shelve.id, section)) < (store.selectedProductForPlacement?.quantity || 0)
                     }"
                     @click="selectLocation(shelve.id, section)">
                  Секция {{ section }}
                  <div class="section-usage" :style="{ width: store.getSectionUsagePercent(shelve.id, section) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Закрыть
          </button>
          <button type="button" class="btn btn-primary" @click="confirmLocation" :disabled="!tempLocation">
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
