import { defineStore } from "pinia";

export const useCounterStore = defineStore('counter', {
  state: () => ({
    // Товары в хранилище
    products: [
      { id: '771955', dimensions: '1×0.4×3',     name: 'Отбойный молоток', quantity: 1  ,  location: { id: 'A', section: 2 }, type: 'tool' },
      { id: '423689', dimensions: '1×0.4×3',     name: 'Отбойный молоток', quantity: 1  ,  location: { id: 'A', section: 2 }, type: 'tool' },
      { id: '991911', dimensions: '1×0.4×3',     name: 'Отбойный молоток', quantity: 1  ,  location: { id: 'A', section: 2 }, type: 'tool' },
      { id: '896981', dimensions: '1×0.4×3',     name: 'Бур',              quantity: 3  ,  location: { id: 'A', section: 1 }, type: 'tool' },
      { id: '837348', dimensions: '1×0.4×3',     name: 'Бур',              quantity: 3  ,  location: { id: 'A', section: 1 }, type: 'tool' },
      { id: '767487', dimensions: '1×0.4×3',     name: 'Отбойный молоток', quantity: 1  ,  location: { id: 'A', section: 1 }, type: 'tool' },
      { id: '792856', dimensions: '1×0.4×3',     name: 'Бур',              quantity: 3  ,  location: { id: 'A', section: 1 }, type: 'tool' },
      { id: '484741', dimensions: '1×0.4×3',     name: 'Отбойный молоток', quantity: 1  ,  location: { id: 'A', section: 1 }, type: 'tool' },
      { id: '385287', dimensions: '1×0.4×3',     name: 'Бур',              quantity: 3  ,  location: { id: 'A', section: 3 }, type: 'tool' },
      { id: '444467', dimensions: '1×0.4×3',     name: 'Отбойный молоток', quantity: 1  ,  location: { id: 'A', section: 3 }, type: 'tool' },
      { id: '111111', dimensions: '2×1×0.5',     name: 'Цемент',           quantity: 10 ,  location: { id: 'A', section: 3 }, type: 'material' },
      { id: '333333', dimensions: '0.5×0.5×0.5', name: 'Кирпич',           quantity: 49 ,  location: { id: 'A', section: 5 }, type: 'material' }
    ],

    // Журнал операций
    operations: [
      { action: 'issue',     id: '00001',  quantity: 40, location: { id: 'A', section: 3 }, date: '20.01.2024 18:00' },
      { action: 'placement', id: '000018', quantity: 20, location: { id: 'A', section: 3 }, date: '20.02.2024 19:56' },
      { action: 'issue',     id: '111111', quantity: 40, location: { id: 'A', section: 3 }, date: '20.02.2024 19:50' },
      { action: 'placement', id: '000020', quantity: 20, location: { id: 'A', section: 3 }, date: '22.04.2024 19:56' }
    ],

    // Товары для выдачи
    issueItems: [
      { id: '1001', dimensions: '1×0.4×3', name: 'Ноутбук Dell XPS', quantity: 2, location: { id: 'A', section: 3 }, type: 'tool' },
      { id: '1002', dimensions: '1×0.4×3', name: 'Мышь Logitech MX', quantity: 5, location: { id: 'A', section: 3 }, type: 'tool' },
      { id: '1003', dimensions: '1×0.4×3', name: 'Клавиатура Razer', quantity: 3, location: { id: 'A', section: 3 }, type: 'tool' }
    ],

    // Временные списки для окна выдачи
    tempIssueItems: [],
    tempRemoveIssueItems: [],

    // Флаг для разной работы LocalModal
    flag: 0,

    //вместимость одной секции 
    sectionCapacity: 50, 

    // Товары для размещения
    placementItems: [],
    tempPlacementItems: [],

    //строки для поиска
    searchQuery: '',
    searchQueryIssue: '',

    // Товары без размещения
    unplacedItems: [],

    // Текущий товар для размещения
    selectedProductForPlacement: null,

    // Активные фильтры
    activeProductFilter: 'all',
    activeOperationFilter: 'all',
    // Стеллажи и их характеристики
    shelving: [
      { id: 'A', sections: 10 },
      { id: 'B', sections: 5 },
      { id: 'C', sections: 8  }
    ],
  }),

  getters: {
    
    // подсчёт используемого места и общей вместимости, зная , что каждая секция имеет фиксированное количество мест 50
    shelvingWithUsage() {
      return this.shelving.map(shelve => ({...shelve,
        capacity: shelve.sections*this.sectionCapacity,
        used: (()=>{
          let total=0;
          for (let index = 1; index < shelve.sections+1; index++) {
            total+=this.getSectionUsage(shelve.id,index)
          }
        return total})()// Без двух последниъ скобочек не работатет. Они делают из функции немедленно вызываемаю
      }));
      },

    

    formatDateTime() {
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    },
    // Фильтрованные товары
    filteredProducts: (state) => {
      if (state.searchQuery != '') {
        const query = state.searchQuery.toLowerCase()
        return state.products.filter(p =>
          p.id.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query))
      }
      else {
        return state.activeProductFilter === 'all'
          ? state.products
          : state.products.filter(product => product.type === state.activeProductFilter);
      }

    },

    // Фильтрованные операции
    filteredOperations: (state) => {
      if (state.searchQuery != '') {
        const query = state.searchQuery.toLowerCase()
        return state.operations.filter(p =>
          p.id.toLowerCase().includes(query))
      }
      else {
        return state.activeOperationFilter === 'all'
          ? state.operations
          : state.operations.filter(op => op.action === state.activeOperationFilter);
      }

    },
    // Фильтрованная выдача
    filteredIssueItems: (state) => {
      if (state.searchQueryIssue != '') {
        const query = state.searchQueryIssue.toLowerCase()
        return state.issueItems.filter(p =>
          p.id.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query))
      }
      else {
        return state.issueItems;
      }

    },
    // Фильтрованные товары без размещения
    filteredUnplacedItems: (state) => {
      if (state.searchQuery != '') {
        const query = state.searchQuery.toLowerCase()
        return state.unplacedItems.filter(p =>
          p.id.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query))
      }
      else {
        return state.unplacedItems;
      }

    },
  },

  actions: {

    //СТЕЛЛАЖИ
    // Получить количество товаров в секции
    getSectionUsage (shelvingId, section) {
      let itemsCount = 0;
      [...this.products, ...this.issueItems].filter(
        p => p.location?.id === shelvingId && p.location?.section === section
      ).forEach(p => {
        itemsCount+=p.quantity
      }); 
      return itemsCount;
    },
    // Получить процент заполнения секции
    getSectionUsagePercent (shelvingId, section){
      const term= this.getSectionUsage(shelvingId, section)
      return term/this.sectionCapacity * 100;
    },
    // проверяет занята ли секция стеллажа
    isSectionOccupied(id, section) {
      return [...this.products, ...this.issueItems].some(p =>
          p.location?.id === id && p.location?.section === section
        );
    },
    
    // Выводит все товары в секции
    getItemsInSection(id, section){
      return [...this.products, ...this.issueItems].filter(
        p => p.location?.id === id && p.location?.section === section
      );
    },
    // проверяет полностью ли заполнена секция
    isSectionFull(id, section) {
      if(this.tempPlacementItems){
        let term=0
        this.tempPlacementItems.forEach(p => {
          term+= p.quantity 
          ? p.location.id===id && p.location.section===section
          : term+=0
        });
        return this.getSectionUsage(id, section)+term >= this.sectionCapacity;
      }
      return this.getSectionUsage(id, section) >= this.store.sectionCapacity;
    },

    //ФИЛЬТРЫ

    // Установка фильтра товаров
    setProductFilter(filter) {
      this.activeProductFilter = filter;
    },

    // Установка фильтра операций
    setOperationFilter(filter) {
      this.activeOperationFilter = filter;
    },

    //ВСЯ ВЫДАЧА

    // Добавление товара к выдаче
    addToIssue(product) {
      this.issueItems.push({ id: product.id, dimensions: product.dimensions, name: product.name, quantity: product.quantity, location: product.location, type: product.type });
      this.products.splice(product, 1);
    },
    // временное выдача товара из выдачи
    tempGiveIssueItem(product) {
      this.tempIssueItems.push({ id: product.id, dimensions: product.dimensions, name: product.name, quantity: product.quantity, location: product.location, type: product.type });
      this.issueItems.splice(product, 1);
    },

    // временное удаления товара из выдачи
    tempRemoveIssueItem(product) {
      this.tempRemoveIssueItems.push({ id: product.id, dimensions: product.dimensions, name: product.name, quantity: product.quantity, location: product.location, type: product.type });
      this.issueItems.splice(product, 1);
    },

    // подтверждения выдачи
    confirmIssue() {
      this.tempIssueItems.forEach(p => {
        this.operations.push({ action: 'issue', id: p.id, quantity: p.quantity, location: p.location, date: this.formatDateTime });

      });
      this.tempIssueItems = [];
      this.tempRemoveIssueItems.forEach(p => {
        this.products.push({ id: p.id, dimensions: p.dimensions, name: p.name, quantity: p.quantity, location: p.location, type: p.type });

      });
      this.tempRemoveIssueItems = [];
    },

    // отмена выдачи
    cancelIssue() {
      this.issueItems = this.issueItems.concat(this.tempIssueItems).concat(this.tempRemoveIssueItems)
      this.tempIssueItems = [];
      this.tempRemoveIssueItems = []
    },

    //ВСЁ РАЗМЕЩЕНИЕ

    // Добавление товара для размещения (временное)
    addTempPlacementProduct() {
      this.tempPlacementItems.push({ id: '', name: '', dimensions: '', quantity: 1, location: '', type: '' });
    },

    // Удаление товара из временного размещения
    removeTempPlacementProduct(index) {
      this.tempPlacementItems.splice(index, 1);
    },

    // Отмена размещения
    cancelPlacement() {
      this.tempPlacementItems = [];
    },

    // Устанавливает текущий товар для размещения
    setSelectedProduct(product) {
      this.selectedProductForPlacement = product;
    },
    // Очищает текущий товар для размещения
    clearSelectedProduct() {
      this.selectedProductForPlacement = null;
    },
    // Подтверждение локации товара работает в 2 режимах
    confirmProductLocation(location) {
      if (!this.selectedProductForPlacement) return;
      // первый режим при вызове из окна Placement
      this.selectedProductForPlacement.location = location;
      // второй режим при вызове с Shelving
      if (this.flag) {
        this.flag = 0;
        const p = this.selectedProductForPlacement
        this.products.push(p);
        this.unplacedItems.splice(this.selectedProductForPlacement, 1)
        this.operations.push({
          action: 'placement',
          id: p.id,
          quantity: p.quantity,
          location: p.location,
          date: this.formatDateTime
        });
      }
    },

    // Подтверждение размещения
    confirmPlacement() {
      // проверка на то, чтобы все необходимые поля были заполнены isValid=false если всё хорошо иначе true
      const isValid = this.tempPlacementItems.every(p =>
        p.id &&
        p.name &&
        p.dimensions &&
        p.quantity > 0 &&
        p.type
      );

      if (!isValid) {
        throw new Error('Не все обязательные поля заполнены');
      }

      
      // Переносим временные данные в основные
      this.placementItems = [...this.tempPlacementItems];
      this.tempPlacementItems = [];

      // Добавляем новые товары в хранилище или в unplacedItems
      this.placementItems.forEach(p => {
        if (p.id && p.name && p.dimensions && p.quantity && p.location && p.type) {
          this.products.push(p);
          this.operations.push({
            action: 'placement',
            id: p.id,
            quantity: p.quantity,
            location: p.location,
            date: this.formatDateTime
          });
        } else {
          this.unplacedItems.push(p);
        };
        this.placementItems = [];
      })
    }
  }
});