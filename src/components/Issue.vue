<script>
import { useCounterStore } from '@/store';

export default {
  name: 'IssueModal',
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
      showIssueModal: false,
    }
  },
  methods: {
    closeModal() {
      this.showIssueModal = false;
      this.store.cancelIssue(); // Отменяем все изменения
      this.$emit('close');
    },
    confirmIssue() {
      this.store.confirmIssue(); // Подтверждаем изменения
      this.showIssueModal = false;
      this.$emit('close');
    }
  }
}
</script>

<template>
  <div>
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Товары для выдачи</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="search-container">
          <form class="d-flex" >
            <input 
              class="form-control me-2" 
              type="search" 
              placeholder="Поиск..." 
              aria-label="Search"
              v-model="store.searchQueryIssue"
            >
            
          </form>
        </div>
          <div class="modal-body">
            <div class="modal-table">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Выдать</th>
                    <th>ID товара</th>
                    <th>Название</th>
                    <th>Кол-во</th>
                    <th>Стеллаж</th>
                    <th>Удалить из выдачи</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in store.filteredIssueItems" :key="index">
                    <td>
                      <button class="btn btn-sm btn-primary" @click="store.tempGiveIssueItem(product)">
                        <i class="bi bi-trash"></i> Выдать
                      </button>
                    </td>
                    <td>{{ product.id }}</td>
                    <td>{{ product.name }}</td>
                    <td>{{ product.quantity }}</td>
                    <td>{{ product.location.id +' - '+ product.location.section }}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" @click="store.tempRemoveIssueItem(product)">
                        <i class="bi bi-trash"></i> Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Отмена
            </button>
            <button type="button" class="btn btn-primary" @click="confirmIssue">
              Подтвердить выдачу
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
