<script >
import { useCounterStore } from '@/store';

export default {
  data() {
    return {
      
      store: useCounterStore()
    }},
  methods: {
    // Метод для фильтрации товаров
    filterProducts(event){
      const button = event.target.closest('.btn');
      if (!button) return;
      store.setProductFilter(button.dataset.filt);
    },

    // Метод для фильтрации операций
    filterOperations(event){
      const button = event.target.closest('.btn');
      if (!button) return;
      store.setOperationFilter(button.dataset.filt);
    }
  }
}
</script>

<template>
    <div class="container table-container">
    <div class="row">
      <!-- Таблица "Хранилище" -->
      <div class="col-12 col-xl-6 mb-4 mb-xl-0">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
          <h3 class="mb-3 mb-md-0">Хранилище</h3>
          <div class="filter-buttons d-flex flex-wrap justify-content-center" @click="filterProducts">
            <button class="btn" :class="{'btn-primary': store.activeProductFilter === 'material', 'btn-outline-primary': store.activeProductFilter !== 'material'}" 
                    data-filt="material" id="constructionMaterialsBtn">Стройматериалы</button>
            <button class="btn ms-2" :class="{'btn-primary': store.activeProductFilter === 'tool', 'btn-outline-primary': store.activeProductFilter !== 'tool'}" 
                    data-filt="tool" id="toolsBtn">Инструменты</button>
            <button class="btn ms-2" :class="{'btn-primary': store.activeProductFilter === 'all', 'btn-outline-primary': store.activeProductFilter !== 'all'}" 
                    data-filt="all" id="allGoodsBtn">Все</button>
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
                <td>{{ product.dimensions }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.quantity }}</td>
                <td>{{ product.location.id +' - '+ product.location.section }}</td>
                <td>
                  <button class="btn btn-primary btn-sm" @click="store.addToIssue(product)">
                    Добавить к выдаче
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Таблица "Журнал операций" -->
      <div class="col-12 col-xl-6">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
          <h3 class="mb-3 mb-md-0">Журнал операций</h3>
          <div class="filter-buttons d-flex flex-wrap justify-content-center" @click="filterOperations">
            <button class="btn" :class="{'btn-primary': store.activeOperationFilter === 'issue', 'btn-outline-primary': store.activeOperationFilter !== 'issue'}" 
                    data-filt="issue" id="issueFilterBtn">Выдача</button>
            <button class="btn ms-2" :class="{'btn-primary': store.activeOperationFilter === 'placement', 'btn-outline-primary': store.activeOperationFilter !== 'placement'}" 
                    data-filt="placement" id="placementFilterBtn">Размещение</button>
            <button class="btn ms-2" :class="{'btn-primary': store.activeOperationFilter === 'all', 'btn-outline-primary': store.activeOperationFilter !== 'all'}" 
                    data-filt="all" id="allOperationsBtn">Все</button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-bordered">
            <thead class="table-warning">
              <tr>
                <th>Операция</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(op, index) in store.filteredOperations" :key="index">
                <td>{{ op.action === 'placement' ? 'Размещение ' : 'Выдача' }} товара {{ op.id }}: {{ op.quantity }} шт {{ op.action === 'placement' ? 'стеллаж ' + op.location.id+' - '+op.location.section : '' }}</td>
                <td>{{ op.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

