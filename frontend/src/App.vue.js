import { useToast, useConfirm } from './composables/useNotification';
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon, LoaderIcon } from '@lucide/vue';
const { toasts, remove } = useToast();
const { confirmState, confirmLoading, close, confirm } = useConfirm();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view'] | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
routerView;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toasts-container" },
});
/** @type {__VLS_StyleScopedClasses['toasts-container']} */ ;
let __VLS_5;
/** @ts-ignore @type { | typeof __VLS_components.TransitionGroup | typeof __VLS_components.TransitionGroup} */
TransitionGroup;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    name: "toast-slide",
}));
const __VLS_7 = __VLS_6({
    name: "toast-slide",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const { default: __VLS_10 } = __VLS_8.slots;
for (const [t] of __VLS_vFor((__VLS_ctx.toasts))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (t.id),
        ...{ class: "toast-item" },
        ...{ class: ('toast-' + t.type) },
    });
    /** @type {__VLS_StyleScopedClasses['toast-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-icon']} */ ;
    if (t.type === 'success') {
        let __VLS_11;
        /** @ts-ignore @type { | typeof __VLS_components.CheckCircleIcon} */
        CheckCircleIcon;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            size: (16),
        }));
        const __VLS_13 = __VLS_12({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    }
    else if (t.type === 'error') {
        let __VLS_16;
        /** @ts-ignore @type { | typeof __VLS_components.AlertCircleIcon} */
        AlertCircleIcon;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
            size: (16),
        }));
        const __VLS_18 = __VLS_17({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    }
    else if (t.type === 'warning') {
        let __VLS_21;
        /** @ts-ignore @type { | typeof __VLS_components.AlertTriangleIcon} */
        AlertTriangleIcon;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
            size: (16),
        }));
        const __VLS_23 = __VLS_22({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    }
    else {
        let __VLS_26;
        /** @ts-ignore @type { | typeof __VLS_components.InfoIcon} */
        InfoIcon;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            size: (16),
        }));
        const __VLS_28 = __VLS_27({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toast-message" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-message']} */ ;
    (t.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return __VLS_ctx.remove(t.id);
                // @ts-ignore
                [toasts, remove,];
            } },
        ...{ class: "toast-close" },
    });
    /** @type {__VLS_StyleScopedClasses['toast-close']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_8;
if (__VLS_ctx.confirmState) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "confirm-modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-modal-card" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-modal-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "d-flex align-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    if (__VLS_ctx.confirmState.type === 'danger') {
        let __VLS_31;
        /** @ts-ignore @type { | typeof __VLS_components.AlertTriangleIcon} */
        AlertTriangleIcon;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
            size: (18),
            ...{ class: "text-danger" },
        }));
        const __VLS_33 = __VLS_32({
            size: (18),
            ...{ class: "text-danger" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        /** @type {__VLS_StyleScopedClasses['text-danger']} */ ;
    }
    else if (__VLS_ctx.confirmState.type === 'warning') {
        let __VLS_36;
        /** @ts-ignore @type { | typeof __VLS_components.AlertCircleIcon} */
        AlertCircleIcon;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            size: (18),
            ...{ class: "text-warning" },
        }));
        const __VLS_38 = __VLS_37({
            size: (18),
            ...{ class: "text-warning" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
    }
    else {
        let __VLS_41;
        /** @ts-ignore @type { | typeof __VLS_components.InfoIcon} */
        InfoIcon;
        // @ts-ignore
        const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
            size: (18),
            ...{ class: "text-primary" },
        }));
        const __VLS_43 = __VLS_42({
            size: (18),
            ...{ class: "text-primary" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_42));
        /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "confirm-modal-title" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-modal-title']} */ ;
    (__VLS_ctx.confirmState.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.confirmState.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "confirm-modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['confirm-modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "btn btn-outline" },
        disabled: (__VLS_ctx.confirmLoading),
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
    (__VLS_ctx.confirmState.cancelText || 'Cancel');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirm) },
        ...{ class: "btn" },
        ...{ class: (__VLS_ctx.confirmState.type === 'danger' ? 'btn-danger-solid' : 'btn-primary-solid') },
        disabled: (__VLS_ctx.confirmLoading),
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
    if (__VLS_ctx.confirmLoading) {
        let __VLS_46;
        /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
        LoaderIcon;
        // @ts-ignore
        const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            size: (14),
            ...{ class: "spin" },
        }));
        const __VLS_48 = __VLS_47({
            size: (14),
            ...{ class: "spin" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        /** @type {__VLS_StyleScopedClasses['spin']} */ ;
    }
    (__VLS_ctx.confirmState.confirmText || 'Confirm');
}
// @ts-ignore
[confirmState, confirmState, confirmState, confirmState, confirmState, confirmState, confirmState, confirmState, close, close, confirmLoading, confirmLoading, confirmLoading, confirm,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
