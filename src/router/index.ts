import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFengshuiStore } from '@/stores/fengshui'
import HomeView from '@/views/HomeView.vue'
import ResultView from '@/views/ResultView.vue'
import ChatView from '@/views/ChatView.vue'
import LookupView from '@/views/LookupView.vue'
import AdminLogin from '@/views/admin/AdminLogin.vue'
import AdminDashboard from '@/views/admin/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/result', name: 'result', component: ResultView },
    { path: '/chat/:roomId', name: 'chat', component: ChatView },
    { path: '/lookup', name: 'lookup', component: LookupView },
    { path: '/auth/login', name: 'admin-login', component: AdminLogin },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAdmin: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  // Guard admin routes — dùng localStorage vì token là HttpOnly cookie
  if (to.meta.requiresAdmin) {
    const auth = useAuthStore()
    if (!auth.isAdmin) return { name: 'admin-login' }
  }

  // Guard /result — cần có kết quả chấm điểm trong store
  if (to.name === 'result') {
    const fengshui = useFengshuiStore()
    if (!fengshui.checkResponse) return { name: 'home' }
  }

  return true
})

export default router
