import { createRouter, createWebHistory } from 'vue-router'
import FrameeView from '../views/FrameeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'framee',
      component: FrameeView,
    },
  ],
})

export default router
