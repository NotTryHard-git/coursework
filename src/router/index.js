import { createRouter, createWebHistory } from 'vue-router'

import Goods from '@/components/Goods.vue'
import Shelving from '@/components/Shelving.vue'


const routes = [
  {
    path: '/goods', component: Goods
  },
  {
    path: '/shelving', component: Shelving
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
