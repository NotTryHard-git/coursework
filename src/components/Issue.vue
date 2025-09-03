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
      this.store.cancelIssue(); 
      this.$emit('close');
    },
    async confirmIssue() {
      try {
        // 1. Создаем записи о выдаче 
        for (const product of this.store.tempIssueItems) {
          
          const issueData = {
            product: product.productId,
            section: product.sectionId,
            quantity: product.quantity_to_issue 
          };
          const response = await fetch('http://localhost:8000/api/issue/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(issueData)
          });
          // Создаем логи операций для каждой выдачи
          for (const product of this.store.tempIssueItems) {
            await this.store.createOperationLog({
              action: 'issue',
              product: product.productId,
              quantity: product.quantity_to_issue,
              old_location: product.sectionId
            });
          }

          // Обновляем логи после операции
          await this.store.fetchOperationLogs();
          if (!response.ok) {
            // Получаем детали ошибки от сервера
            const errorData = await response.json();
            console.error('Детали ошибки:', errorData);
            throw new Error(`Ошибка при создании записи выдачи: ${JSON.stringify(errorData)}`);
          }
          // 2. Обновляем количество в размещении (PUT или DELETE)
          const newQuantity = product.total_quantity_in_section - issueData.quantity;
          if (newQuantity > 0) {
            // Обновляем количество в существующем размещении
            const updateResponse = await fetch(`http://localhost:8000/api/placement/${product.placementId}/`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                quantity: newQuantity,
                product :product.productId,
                section: product.sectionId
                
              })
            });
          
            if (!updateResponse.ok) {
              throw new Error('Ошибка при обновлении размещения');
            }
            } else {
              // Удаляем размещение если количество стало 0
              const deleteResponse = await fetch(`http://localhost:8000/api/placement/${product.placementId}/`, {
                method: 'DELETE'
              });
          
            if (!deleteResponse.ok) {
              throw new Error('Ошибка при удалении размещения');
            }
            }
            const newtotalQuantity = product.total_quantity- issueData.quantity;
            if ( newtotalQuantity > 0 ) {
                // Обновляем количество в существующем размещении
                const updateResponse = await fetch(`http://localhost:8000/api/goods/${product.productId}/`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    code: product.code,
                    name: product.productName,
                    width:product.width,
                    height: product.height,
                    length: product.length,
                    type_id: product.type_id,
                    weight: product.weight,
                    quantity: newtotalQuantity
                  })
                });
              
                if (!updateResponse.ok) {
                  // Получаем детали ошибки от сервера
                  const errorData = await updateResponse.json();
                  console.error('Детали ошибки:', errorData);
                  throw new Error(`Ошибка при создании записи выдачи: ${JSON.stringify(errorData)}`);}
                
              } else {
                // Удаляем размещение если количество стало 0
                const deleteResponse = await fetch(`http://localhost:8000/api/goods/${product.productId}/`, {
                  method: 'DELETE'
                });
              
                if (!deleteResponse.ok) {
                  // Получаем детали ошибки от сервера
                  const errorData = await deleteResponse.json();
                  console.error('Детали ошибки:', errorData);
                  throw new Error(`Ошибка при создании записи выдачи: ${JSON.stringify(errorData)}`);}
        }}
            
      
          // 3. Обновляем данные после выдачи
          await this.store.fetchProducts();
          await this.store.fetchPlacement()
          // 4. Очищаем временные списки
          this.store.tempIssueItems = [];
          this.store.tempRemoveIssueItems.forEach(p => {
            this.store.products.push(p);
          });
          this.store.tempRemoveIssueItems = [];
          this.showIssueModal = false;
          this.$emit('close');
      } catch (error) {
        console.error('Error confirming issue:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
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
                    <th>Стеллаж - Секция</th>
                    <th>Удалить из выдачи</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in store.filteredIssueItems" :key="index">
                    <td>
                      <button class="btn btn-sm btn-primary" @click="store.tempGiveIssueItem(item)">
                        <i class="bi bi-trash"></i> Выдать
                      </button>
                    </td>
                    <td>{{ item.productId }}</td>
                    <td>{{ item.productName }}</td>
                    <td>{{ item.quantity_to_issue }}</td>
                    <td>{{ item.shelvingName }} - {{ item.sectionName }}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" @click="store.tempRemoveIssueItem(item)">
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