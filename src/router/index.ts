import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFengshuiStore } from '@/stores/fengshui'
import HomeView from '@/views/HomeView.vue'
import ResultView from '@/views/ResultView.vue'
import ChatView from '@/views/ChatView.vue'
import LookupView from '@/views/LookupView.vue'
import AdminLogin from '@/views/admin/AdminLogin.vue'
import AdminDashboard from '@/views/admin/AdminDashboard.vue'
import { api } from '@/services/api'

function getClientId(storage: Storage, key: string): string {
  const existing = storage.getItem(key)
  if (existing) return existing
  const fallback = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : fallback
  storage.setItem(key, value)
  return value
}

function trackPublicPageView(path: string) {
  if (path.startsWith('/admin') || path.startsWith('/login')) return

  const visitorId = getClientId(localStorage, 'analyticsVisitorId')
  const sessionId = getClientId(sessionStorage, 'analyticsSessionId')

  api.post('/analytics/page-view', {
    visitorId,
    sessionId,
    path,
    referrer: document.referrer || null,
    userAgent: navigator.userAgent
  }).catch(() => null)
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/result', name: 'result', component: ResultView },
    { path: '/chat/:roomId', name: 'chat', component: ChatView },
    { path: '/lookup', name: 'lookup', component: LookupView },
    { path: '/login', name: 'admin-login', component: AdminLogin },
    { path: '/renew', name: 'renew', component: () => import('@/views/RenewView.vue') },
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

router.afterEach((to) => {
  trackPublicPageView(to.fullPath)
})

export default router
