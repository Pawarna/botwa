import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Dashboard from './views/Dashboard.vue';
import Login from './views/Login.vue';
import Session from './views/Session.vue';
import AutoReply from './views/AutoReply.vue';
import Blaster from './views/Blaster.vue';
import Scraper from './views/Scraper.vue';
import Projects from './views/Projects.vue';
import ProjectDetail from './views/ProjectDetail.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/login', component: Login, name: 'Login' },
  { 
    path: '/', 
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/session' },
      { path: 'session',    component: Session,    name: 'Session',    meta: { requiresAuth: true } },
      { path: 'auto-reply', component: AutoReply,  name: 'AutoReply',  meta: { requiresAuth: true } },
      { path: 'scraper',    component: Scraper,    name: 'Scraper',    meta: { requiresAuth: true } },
      { path: 'blaster',    component: Blaster,    name: 'Blaster',    meta: { requiresAuth: true } },
      { path: 'projects',   component: Projects,   name: 'Projects',   meta: { requiresAuth: true } },
      { path: 'projects/:id', component: ProjectDetail, name: 'ProjectDetail', meta: { requiresAuth: true } },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = !!localStorage.getItem('adminToken');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/session');
  } else {
    next();
  }
});

export default router;
