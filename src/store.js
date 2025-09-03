import { defineStore } from "pinia";

export const useCounterStore = defineStore('counter', {
  state: () => ({
    // Товары в хранилище
    products: [],

    // Журнал операций
    placement: [],
    operationLogs: [],
    operationLogsLoading: false,
    operationLogsFilter: 'all', // 'all', 'placement', 'issue'

    // Товары для выдачи
    issueItems: [],

    // Временные списки для окна выдачи
    tempIssueItems: [],
    tempRemoveIssueItems: [],

    // Флаг для разной работы LocalModal
    flag: 0,

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
    activeProductFilter: 0,
    activeOperationFilter: 'all',
    // Стеллажи и их характеристики
    shelving: [],
    sections: [],
    isDataLoaded: false, // Флаг загрузки данных
    isLoading: false,     // Флаг процесса загрузки

    selectedProductForPlacement: null,
    placementFlag: 0,

    user: null,
    isAuthenticated: false,
    authLoading: true,
    csrfToken: null
  }),

  getters: {
    shelvingWithUsage: (state) => {
      if (!state.isDataLoaded) return [];
      
      return state.shelving.map(shelve => {
        let usedVolume = 0;
        const totalVolume = shelve.width * shelve.height * shelve.length;
      
        // Суммируем занятый объем по всем секциям текущего стеллажа
        shelve.sections.forEach(section => {
          // Проверяем занята ли секция полностью
          if (section.is_occupied) {
            usedVolume += section.width * section.height * section.length;
          } else {
            // Суммируем объем товаров в секции
            const sectionPlacements = state.placement.filter(
              p => p.shelving_id === shelve.id && p.section_name === section.name
            );

            sectionPlacements.forEach(item => {
              usedVolume += item.width * item.height * item.length * item.quantity;
            });
          }
        });

        const usagePercent = totalVolume > 0 ? Math.round((usedVolume / totalVolume) * 100) : 0;

        return {
          ...shelve,
          used: usagePercent,
          usedVolume: usedVolume,
          totalVolume: totalVolume,
        };
      });
    },
    // Фильтрованные товары
    filteredProducts: (state) => {
      if (state.searchQuery != '') {
        const query = state.searchQuery.toLowerCase()
        return state.products.filter(p =>
          p.id.toString().toLowerCase().includes(query) ||
          p.name.toString().toLowerCase().includes(query) ||
          p.code.toString().toLowerCase().includes(query)||
          p.type_name.toString().toLowerCase().includes(query))  
      }
      else {
        return state.activeProductFilter === 0
          ? state.products
          : state.products.filter(product => product.type_id === state.activeProductFilter);
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
          p.id.toString().toLowerCase().includes(query) ||
          p.name.toString().toLowerCase().includes(query) ||
          p.code.toString().toLowerCase().includes(query)||
          p.type_name.toString().toLowerCase().includes(query)) 
      }
      else {
        return state.unplacedItems;
      }

    },
  },

  actions: {
    
    //Журнал операций
    // Загрузка логов операций
    async fetchOperationLogs() {
      this.operationLogsLoading = true;
      try {
        let url = 'http://localhost:8000/api/operation-logs/';
        
        if (this.operationLogsFilter !== 'all') {
          url += `?action=${this.operationLogsFilter}`;
        }

        const response = await fetch(url, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          this.operationLogs = data.results || data;
        }
      } catch (error) {
        console.error('Error fetching operation logs:', error);
      } finally {
        this.operationLogsLoading = false;
      }
    },

    // Установка фильтра логов
    setOperationLogsFilter(filter) {
      this.operationLogsFilter = filter;
      this.fetchOperationLogs();
    },

    // Создание лога операции
    async createOperationLog(logData) {
      try {
        await this.getCSRFToken();
        const logDataWithUser = {
        ...logData,
        user: this.user?.id // Добавляем ID пользователя из состояния
        };
        const response = await fetch('http://localhost:8000/api/operation-logs/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.csrfToken
          },
          body: JSON.stringify(logDataWithUser),
          credentials: 'include'
        });
        if (!response.ok) {
        // Получаем детали ошибки от сервера
        const errorData = await response.json();
        console.error('Детали ошибки:', errorData);
        throw new Error(`Ошибка при создании лога : ${JSON.stringify(errorData)}`);}
        return response.ok;
      } catch (error) {
        console.error('Error creating operation log:', error);
        return false;
      }
    },


    //Аунтефикация

    // Получение CSRF токена
    async getCSRFToken() {
      try {
        const response = await fetch('http://localhost:8000/api/auth/csrf/', {
          method: 'GET',
          credentials: 'include', // Важно для cookies
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.csrfToken = data.csrfToken;
          return true;
        } else {
          console.error('Failed to get CSRF token:', response.status);
        }
      } catch (error) {
        console.error('Error getting CSRF token:', error);
      }
      return false;
    },

    setUser(userData) {
      this.user = userData
      this.isAuthenticated = !!userData
    },

    clearUser() {
      this.user = null
      this.isAuthenticated = false
    },

    async checkAuth() {
      try {
        // Получаем CSRF токен перед проверкой аутентификации
        await this.getCSRFToken();
        
        const response = await fetch('http://localhost:8000/api/auth/current-user/', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-CSRFToken': this.csrfToken || ''
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.setUser(data.user)
        } else {
          this.clearUser()
        }
      } catch (error) {
        this.clearUser()
      } finally {
        this.authLoading = false
      }
    },

    async login(credentials) {
      // Получаем CSRF токен перед логином
      await this.getCSRFToken();
      
      try {
        const response = await fetch('http://localhost:8000/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.csrfToken || '',
            'Accept': 'application/json'
          },
          body: JSON.stringify(credentials),
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          this.setUser(data.user)
          // Обновляем CSRF токен после успешного входа
          await this.getCSRFToken();
          return { success: true, data }
        } else {
          const errorData = await response.json()
          return { success: false, error: errorData }
        }
      } catch (error) {
        return { success: false, error: 'Ошибка соединения с сервером' }
      }
    },

    async logout() {
      try {
        // Убедимся, что у нас есть актуальный CSRF токен
        if (!this.csrfToken) {
          await this.getCSRFToken();
        }
                
        const response = await fetch('http://localhost:8000/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.csrfToken || '',
            'Accept': 'application/json'
          },
          credentials: 'include'
        })
        
        if (response.ok) {
          this.clearUser()
          this.csrfToken = null; // Сбрасываем токен после выхода
          return true;
        } else {
          const errorData = await response.json();
          console.error('Logout failed:', errorData);
          // Попробуем альтернативный способ - очистка на клиенте
          this.clearUser();
          this.csrfToken = null;
          return false;
        }
      } catch (error) {
        console.error('Logout error:', error);
        // В случае ошибки все равно очищаем состояние
        this.clearUser();
        this.csrfToken = null;
        return false;
      }
    },



    // API методы
    // Общий метод для загрузки всех данных
    async loadAllData() {
      this.isLoading = true;
      try {
        await Promise.all([
          this.fetchProducts(),
          this.fetchPlacement(),
          this.fetchShelving(),
          this.fetchSection(),
          this.fetchOperationLogs()
        ]);
        this.isDataLoaded = true;
      } catch (error) {
        console.error('Error loading all data:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProducts() {
      try {
        const response = await fetch('http://localhost:8000/api/goods/');
        const data = await response.json();
        this.products=[];
        this.unplacedItems=[];  
        // Разделяем продукты по наличию локации
        data.results.forEach(product => {
          if (product.placements && product.placements.length > 0) {
            this.products.push(product);
          } else {
            this.unplacedItems.push(product);
          }
        });    
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    },

   
    async fetchPlacement() {
      try {
        const response = await fetch('http://localhost:8000/api/placement/');
        const data= await response.json();
        this.placement = data.results
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    },

    async fetchShelving() {
      try {
        const response = await fetch('http://localhost:8000/api/shelving/');
        const data= await response.json();
        this.shelving = data.results
      } catch (error) {
        console.error('Error fetching section:', error);
      }
    },

    async fetchSection() {
      try {
        const response = await fetch('http://localhost:8000/api/section/');
        const data= await response.json();
        this.sections=data.results
      } catch (error) {
        console.error('Error fetching unplaced items:', error);
      }
    },
    //СТЕЛЛАЖИ
    // Получить количество товаров в секции
    getSectionUsage(shelvingId, index) {
      if (!this.isDataLoaded) return 0;
      
      const section = this.sections.find(s => s.location === shelvingId && s.name === index);
      if (!section) return 0;

      let used_space = 0;

      if (section.is_occupied) {
        used_space = section.width * section.height * section.length;
      } else {
        this.placement
          .filter(p => p.shelving_id === shelvingId && p.section_name === index)
          .forEach(item => {
            used_space += item.width * item.height * item.length * item.quantity;
          });
      }
      
      return used_space;
    },
    getSectionUsagePercent(shelvingId, section) {
      if (!this.isDataLoaded) return 0;
      
      const usage = this.getSectionUsage(shelvingId, section.name);
      const total = section.width * section.length * section.height;
      return total > 0 ? Math.round(usage / total * 100) : 0;
    },

    getItemsInSection(id, section) {
      if (!this.isDataLoaded) return [];
      
      return this.placement.filter(
        p => p.section === section && p.shelving_id === id
      );
    },

    isSectionOccupied(id, section) {
      if (!this.isDataLoaded) return false;
      
      return this.placement.some(p =>
        p.shelving_id === id && p.section_name === section.name
      );
    },   

    //ФИЛЬТРЫ

    // Установка фильтра товаров
    setProductFilter(filter) {
      this.activeProductFilter = parseInt(filter);
    },

    // Установка фильтра операций
    setOperationFilter(filter) {
      this.activeOperationFilter = filter;
    },

    //ВСЯ ВЫДАЧА

    // Добавление товара к выдаче
    addToIssue(issueItem) {
      // Создаем уникальный ключ для каждого элемента выдачи
      const itemKey = `${issueItem.productId}-${issueItem.placementId}`;

      const existingItem = this.issueItems.find(item => 
        `${item.productId}-${item.placementId}` === itemKey
      );
    
      if (existingItem) {
        existingItem.quantity += issueItem.quantity;
      } else {
        this.issueItems.push({
          code: issueItem.code,
          width:issueItem.width,
          height: issueItem.height,
          length: issueItem.length,
          type_id: issueItem.type_id,
          weight: issueItem.weight,
          productId: issueItem.productId,
          productName: issueItem.productName,
          placementId: issueItem.placementId,
          sectionId: issueItem.sectionId,
          shelvingName: issueItem.shelvingName,
          sectionName: issueItem.sectionName,
          total_quantity: issueItem.total_quantity,
          total_quantity_in_section: issueItem.total_quantity_in_section,
          quantity_to_issue: issueItem.quantity_to_issue
        });
      }
    }, 
    // временное выдача товара из выдачи
    tempGiveIssueItem(item) {
      this.tempIssueItems.push(item);
      const index = this.issueItems.findIndex(i => 
        i.id === item.id && 
        i.placementId === item.placementId
      );
      if (index !== -1) {
        this.issueItems.splice(index, 1);
      }
    },
    // временное удаления товара из выдачи
    tempRemoveIssueItem(item) {
      this.tempRemoveIssueItems.push(item);
      const index = this.issueItems.findIndex(i => 
        i.id === item.id && 
        i.placementId === item.placementId
      );
      if (index !== -1) {
        this.issueItems.splice(index, 1);
      }
    },  

    // отмена выдачи
    cancelIssue() {
      this.issueItems = this.issueItems.concat(this.tempIssueItems).concat(this.tempRemoveIssueItems)
      this.tempIssueItems = [];
      this.tempRemoveIssueItems = []
    },

    //ВСЁ РАЗМЕЩЕНИЕ
    
    async createProduct(productData) {
      try {
        const response = await fetch('http://localhost:8000/api/goods/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });
      
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Ошибка при создании товара');
        }
      
        return await response.json();
      } catch (error) {
        console.error('Error creating product:', error);
        throw error;
      }
    },
    // шаблон товара в зармещении
    addTempPlacementProduct() {
      this.tempPlacementItems.push({
        code: '',
        name: '',
        width: 0,
        height: 0,
        length: 0,
        quantity: 1,
        type_id: '',
        weight: 0,
        locations: [] // Массив для хранения выбранных локаций
      });
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
    }
  }
});