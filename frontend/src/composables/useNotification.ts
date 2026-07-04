import { ref, Ref } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

const GLOBAL_TOASTS_KEY = '__VUE_GLOBAL_TOASTS__';
const GLOBAL_CONFIRM_KEY = '__VUE_GLOBAL_CONFIRM__';
const GLOBAL_CONFIRM_LOADING_KEY = '__VUE_GLOBAL_CONFIRM_LOADING__';

const getGlobalRef = <T>(key: string, defaultValue: T): Ref<T> => {
  if (typeof window !== 'undefined') {
    if (!(window as any)[key]) {
      (window as any)[key] = ref(defaultValue);
    }
    return (window as any)[key] as Ref<T>;
  }
  return ref(defaultValue) as Ref<T>;
};

const toasts = getGlobalRef<Toast[]>(GLOBAL_TOASTS_KEY, []);

export const useToast = () => {
  const show = (message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, type, message, duration };
    toasts.value.push(toast);

    setTimeout(() => {
      remove(id);
    }, duration);
  };

  const success = (msg: string, duration?: number) => show(msg, 'success', duration);
  const error = (msg: string, duration?: number) => show(msg, 'error', duration);
  const warning = (msg: string, duration?: number) => show(msg, 'warning', duration);
  const info = (msg: string, duration?: number) => show(msg, 'info', duration);

  const remove = (id: string) => {
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

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void | Promise<void>;
}

const confirmState = getGlobalRef<ConfirmOptions | null>(GLOBAL_CONFIRM_KEY, null);
const confirmLoading = getGlobalRef<boolean>(GLOBAL_CONFIRM_LOADING_KEY, false);

export const useConfirm = () => {
  const show = (options: ConfirmOptions) => {
    confirmState.value = options;
    confirmLoading.value = false;
  };

  const close = () => {
    confirmState.value = null;
    confirmLoading.value = false;
  };

  const confirm = async () => {
    if (!confirmState.value) return;
    confirmLoading.value = true;
    try {
      await confirmState.value.onConfirm();
    } catch (err: any) {
      console.error('Confirm callback error:', err);
    } finally {
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
