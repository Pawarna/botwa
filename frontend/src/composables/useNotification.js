import { ref } from 'vue';
const GLOBAL_TOASTS_KEY = '__VUE_GLOBAL_TOASTS__';
const GLOBAL_CONFIRM_KEY = '__VUE_GLOBAL_CONFIRM__';
const GLOBAL_CONFIRM_LOADING_KEY = '__VUE_GLOBAL_CONFIRM_LOADING__';
const getGlobalRef = (key, defaultValue) => {
    if (typeof window !== 'undefined') {
        if (!window[key]) {
            window[key] = ref(defaultValue);
        }
        return window[key];
    }
    return ref(defaultValue);
};
const toasts = getGlobalRef(GLOBAL_TOASTS_KEY, []);
export const useToast = () => {
    const show = (message, type = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast = { id, type, message, duration };
        toasts.value.push(toast);
        setTimeout(() => {
            remove(id);
        }, duration);
    };
    const success = (msg, duration) => show(msg, 'success', duration);
    const error = (msg, duration) => show(msg, 'error', duration);
    const warning = (msg, duration) => show(msg, 'warning', duration);
    const info = (msg, duration) => show(msg, 'info', duration);
    const remove = (id) => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    };
    return {
        toasts,
        success,
        error,
        warning,
        info,
        remove
    };
};
const confirmState = getGlobalRef(GLOBAL_CONFIRM_KEY, null);
const confirmLoading = getGlobalRef(GLOBAL_CONFIRM_LOADING_KEY, false);
export const useConfirm = () => {
    const show = (options) => {
        confirmState.value = options;
        confirmLoading.value = false;
    };
    const close = () => {
        confirmState.value = null;
        confirmLoading.value = false;
    };
    const confirm = async () => {
        if (!confirmState.value)
            return;
        confirmLoading.value = true;
        try {
            await confirmState.value.onConfirm();
        }
        catch (err) {
            console.error('Confirm callback error:', err);
        }
        finally {
            close();
        }
    };
    return {
        confirmState,
        confirmLoading,
        show,
        close,
        confirm
    };
};
