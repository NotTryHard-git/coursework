import { createRouter, createWebHistory } from 'vue-router'
import { useCounterStore } from '@/store';
import Goods from '@/components/Goods.vue'
import Shelving from '@/components/Shelving.vue'
import Login from '@/components/Login.vue'


const routes = [
   {
    path: '/login',
    component: Login
  },
  {
    path: '/',
    redirect: '/goods'
  },
  {
    path: '/goods', component: Goods,
    meta: { requiresAuth: true }
  },
  {
    path: '/shelving', component: Shelving,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Навигационный guard
router.beforeEach(async (to, from, next) => {
  const store = useCounterStore()
  
  // Если данные аутентификации еще загружаются, ждем
  if (store.authLoading) {
    await new Promise(resolve => {
      const check = () => {
        if (!store.authLoading) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })
  }
  
  if (to.meta.requiresAuth && !store.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && store.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
