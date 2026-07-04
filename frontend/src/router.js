import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from './views/Dashboard.vue';
import Login from './views/Login.vue';
import Session from './views/Session.vue';
import AutoReply from './views/AutoReply.vue';
import Blaster from './views/Blaster.vue';
import Scraper from './views/Scraper.vue';
const routes = [
    { path: '/login', component: Login, name: 'Login' },
    {
        path: '/',
        component: Dashboard,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/session' },
            { path: 'session', component: Session, name: 'Session' },
            { path: 'auto-reply', component: AutoReply, name: 'AutoReply' },
            { path: 'blaster', component: Blaster, name: 'Blaster' },
            { path: 'scraper', component: Scraper, name: 'Scraper' },
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
    }
    else if (to.path === '/login' && isAuthenticated) {
        next('/');
    }
    else {
        next();
    }
});
export default router;
