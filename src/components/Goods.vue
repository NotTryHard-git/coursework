<script >
import { useCounterStore } from '@/store';
import IssueSelectionModal from '@/components/IssueSelectionModal.vue';

export default {
  components: { IssueSelectionModal},
  data() {
    return {
      isLoading: false,
      store: useCounterStore(),
      showIssueModal: false,
      selectedProduct: null
    }},
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

    filterProducts(event) {
      const button = event.target.closest('.btn');
      if (!button) return;
      this.store.setProductFilter(button.dataset.filt);
    },
    filterOperationLogs(filter) {
      this.store.setOperationLogsFilter(filter);
    },
    // Открываем модалку выбора количества
    openIssueSelection(product) {
      this.selectedProduct = product;
      this.showIssueModal = true;
    },

    // Обрабатываем выбранные позиции для выдачи
    handleIssueSelected(items) {
      items.forEach(item => {
        this.store.addToIssue(item);
      });
    },
    closeIssueModal() {
      this.showIssueModal = false;
      this.selectedProduct = null;
    },
    // Форматирование даты для логов
    formatDateTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU');
    },

    // Получение названия местоположения для лога
    getLocationText(log) {
      if (log.action === 'placement' && log.new_location_name) {
        return `➔ ${log.new_location_name}`;
      } else if (log.action === 'issue' && log.old_location_name) {
        return `← ${log.old_location_name}`;
      }
      return '-';
    },

    // Получение класса для действия
    getActionClass(action) {
      return {
        'text-success': action === 'placement',
        'text-warning': action === 'issue',
        'text-primary': action === 'create' || action === 'update'
      };
    },

    // Получение отображаемого названия действия
    getActionDisplay(action) {
      const actions = {
        'placement': 'Размещение',
        'issue': 'Выдача',
        'create': 'Создание',
        'update': 'Обновление',
        'placement_update': 'Изменение размещения',
        'placement_remove': 'Удаление размещения'
      };
      return actions[action] || action;
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
      <!-- Модальное окно выбора выдачи -->
      <IssueSelectionModal
        :show="showIssueModal"
        :product="selectedProduct"
        @issue-selected="handleIssueSelected"
        @close="closeIssueModal"
      />
      <!-- Таблица "Хранилище" -->
      <div class="col-12 col-xl-6 mb-4 mb-xl-0">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
          <h3 class="mb-3 mb-md-0">Хранилище</h3>
          <div class="filter-buttons d-flex flex-wrap justify-content-center" @click="filterProducts">
            <button class="btn" :class="{'btn-primary': store.activeProductFilter === 2, 'btn-outline-primary': store.activeProductFilter !== 2}" 
                    data-filt="2" id="constructionMaterialsBtn">Стройматериалы</button>
            <button class="btn ms-2" :class="{'btn-primary': store.activeProductFilter === 1, 'btn-outline-primary': store.activeProductFilter !== 1}" 
                    data-filt="1" id="toolsBtn">Инструменты</button>
            <button class="btn ms-2" :class="{'btn-primary': store.activeProductFilter === 0, 'btn-outline-primary': store.activeProductFilter !== 0}" 
                    data-filt="0" id="allGoodsBtn">Все</button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-bordered">
            <thead class="table-warning" style="position: sticky; top: 0;">
              <tr>
                <th>ID товара</th>
                <th>Габариты 1 единицы</th>
                <th>Название</th>
                <th>Кол-во</th>
                <th>Место нахождения</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in store.filteredProducts" :key="product.id">
                <td>{{ product.id }}</td>
                <td>{{ product.length + '*' + product.width + '*' + product.height }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.quantity }}</td>
                <td>
                  <div v-for="placement in product.placements" :key="placement.id" class="small">
                    {{ placement.shelving_name + ' - ' + placement.section + ' : ' + placement.quantity }} шт.
                  </div>
                  <div v-if="product.placements && product.placements.length === 0" class="text-muted small">
                    Не размещено
                  </div>
                  <div v-if="product.total_quantity_placed !=0 && product.placements.quantity!= product.total_quantity_placed " class="text-muted small">
                    {{product.quantity - product.total_quantity_placed}} не размещено
                  </div>
                </td>
                <td>
                   <button 
                    class="btn btn-primary btn-sm" 
                    @click="openIssueSelection(product)"
                    :disabled="!product.placements || product.placements.length === 0"
                    :title="!product.placements || product.placements.length === 0 ? 'Товар не размещен' : 'Выдать товар'"
                  >
                    Выдать
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
       <!-- Таблица "Журнал операций"  -->
      <div class="col-12 col-xl-6">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
          <h3 class="mb-3 mb-md-0">Журнал операций</h3>
          <div class="filter-buttons d-flex flex-wrap justify-content-center">
            <button class="btn" :class="{'btn-primary': store.operationLogsFilter === 'all', 'btn-outline-primary': store.operationLogsFilter !== 'all'}" 
                    @click="filterOperationLogs('all')">Все</button>
            <button class="btn ms-2" :class="{'btn-primary': store.operationLogsFilter === 'placement', 'btn-outline-primary': store.operationLogsFilter !== 'placement'}" 
                    @click="filterOperationLogs('placement')">Размещение</button>
            <button class="btn ms-2" :class="{'btn-primary': store.operationLogsFilter === 'issue', 'btn-outline-primary': store.operationLogsFilter !== 'issue'}" 
                    @click="filterOperationLogs('issue')">Выдача</button>
          </div>
        </div>

        <!-- Индикатор загрузки логов -->
        <div v-if="store.operationLogsLoading" class="text-center py-3">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
          <p class="mt-2 small">Загрузка логов...</p>
        </div>

        <div v-else class="table-responsive operation-logs-container">
          <table class="table table-striped table-bordered">
            <thead class="table-warning" style="position: sticky; top: 0;">
              <tr>
                <th>Время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Товар</th>
                <th>Кол-во</th>
                <th>Местоположение</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in store.operationLogs" :key="log.id">
                <td class="small">{{ formatDateTime(log.timestamp) }}</td>
                <td class="small">
                  <span v-if="log.user_name">{{ log.user_name }}</span>
                  <span v-else class="text-muted">Система</span>
                </td>
                <td>
                  <span :class="getActionClass(log.action)" class="small fw-bold">
                    {{ getActionDisplay(log.action) }}
                  </span>
                </td>
                <td class="small">
                  {{ log.product_name }}
                  <br>
                  <small class="text-muted">({{ log.product_code }})</small>
                </td>
                <td class="small">{{ log.quantity }} шт.</td>
                <td class="small">
                  <span :class="{'text-success': log.action === 'placement', 'text-warning': log.action === 'issue'}">
                    {{ getLocationText(log) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="store.operationLogs.length === 0" class="text-center py-4">
            <p class="text-muted">Нет записей в журнале операций</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>

.small {
  font-size: 0.85rem;
}

.text-success {
  color: #198754 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-primary {
  color: #0d6efd !important;
}

</style>

