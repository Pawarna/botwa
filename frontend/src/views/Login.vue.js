import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '../services/api';
const secret = ref('');
const error = ref('');
const router = useRouter();
const handleLogin = async () => {
    error.value = '';
    // Simply test the token by making a health check or a session check request
    // But wait, we can just save it and redirect to dashboard, and let the dashboard fail if invalid.
    localStorage.setItem('adminToken', secret.value);
    try {
        // Try hitting a protected route to verify
        // Using a fake session id just to test auth middleware
        await fetchApi('/sessions/verify-auth-test');
        router.push('/');
    }
    catch (err) {
        if (err.message.includes('Unauthorized')) {
            error.value = 'Invalid Admin Secret';
            localStorage.removeItem('adminToken');
        }
        else {
            // It might be a 404 or other error if route doesn't exist, but it passed Auth
            router.push('/');
        }
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "login-container d-flex align-center justify-between animate-fade-in" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['login-container']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-fade-in']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "glass-panel" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['glass-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ style: {} },
});
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.error);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.handleLogin) },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "password",
    ...{ class: "form-control" },
    placeholder: "Enter admin secret",
    required: true,
});
(__VLS_ctx.secret);
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn btn-primary mt-4" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
// @ts-ignore
[error, error, handleLogin, secret,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
