import { ref, onMounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import { PlusIcon, MessageSquareIcon, RefreshCwIcon, Trash2Icon } from '@lucide/vue';
const toast = useToast();
const confirm = useConfirm();
const viewSessionId = ref('default');
const rules = ref([]);
const savedSessions = ref([]);
const fetchSessions = async () => {
    try {
        const data = await fetchApi('/sessions');
        savedSessions.value = data.map((s) => s.id);
    }
    catch (error) {
        console.error('Failed to fetch sessions', error);
    }
};
const form = ref({
    sessionId: 'default',
    keyword: '',
    isExact: true,
    replyText: ''
});
const fetchRules = async () => {
    if (!viewSessionId.value)
        return;
    try {
        const data = await fetchApi(`/autoreply/${viewSessionId.value}`);
        rules.value = data;
    }
    catch (error) {
        toast.error(error.message);
    }
};
const addRule = async () => {
    try {
        await fetchApi('/autoreply', {
            method: 'POST',
            body: JSON.stringify(form.value)
        });
        toast.success('Auto reply rule saved successfully.');
        form.value.keyword = '';
        form.value.replyText = '';
        if (viewSessionId.value === form.value.sessionId) {
            fetchRules();
        }
    }
    catch (error) {
        toast.error(error.message);
    }
};
const deleteRule = async (id) => {
    confirm.show({
        title: 'Delete Rule',
        message: 'Are you sure you want to delete this auto reply rule?',
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            try {
                await fetchApi(`/autoreply/${viewSessionId.value}/${id}`, {
                    method: 'DELETE'
                });
                toast.success('Auto reply rule deleted.');
                fetchRules();
            }
            catch (error) {
                toast.error(error.message);
            }
        }
    });
};
onMounted(() => {
    fetchSessions();
    fetchRules();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "auto-reply" },
});
/** @type {__VLS_StyleScopedClasses['auto-reply']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header mb-6" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "page-title" },
});
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "split-layout" },
});
/** @type {__VLS_StyleScopedClasses['split-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card compose-panel" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['compose-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-label" },
});
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.PlusIcon} */
PlusIcon;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    size: (14),
}));
const __VLS_2 = __VLS_1({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.addRule) },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group mb-4" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    ...{ class: "field-input" },
    value: (__VLS_ctx.form.sessionId),
    list: "session-list",
    required: true,
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.datalist, __VLS_intrinsics.datalist)({
    id: "session-list",
});
for (const [s] of __VLS_vFor((__VLS_ctx.savedSessions))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (s),
        value: (s),
    });
    // @ts-ignore
    [addRule, form, savedSessions,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group mb-4" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    ...{ class: "field-input" },
    value: (__VLS_ctx.form.keyword),
    required: true,
    placeholder: "e.g. price",
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group mb-4" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    ...{ class: "field-input" },
    value: (__VLS_ctx.form.isExact),
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (true),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: (false),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group mb-5" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ class: "field-input field-textarea" },
    value: (__VLS_ctx.form.replyText),
    rows: "4",
    required: true,
    placeholder: "Your automated response...",
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
/** @type {__VLS_StyleScopedClasses['field-textarea']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn-primary-solid" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['btn-primary-solid']} */ ;
let __VLS_5;
/** @ts-ignore @type { | typeof __VLS_components.PlusIcon} */
PlusIcon;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    size: (14),
}));
const __VLS_7 = __VLS_6({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card monitor-panel" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['monitor-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex align-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
let __VLS_10;
/** @ts-ignore @type { | typeof __VLS_components.MessageSquareIcon} */
MessageSquareIcon;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    size: (16),
}));
const __VLS_12 = __VLS_11({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex gap-2" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    ...{ class: "field-input" },
    value: (__VLS_ctx.viewSessionId),
    list: "session-list",
    placeholder: "Filter by Session ID",
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.fetchRules) },
    ...{ class: "btn-icon" },
    title: "Refresh list",
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
let __VLS_15;
/** @ts-ignore @type { | typeof __VLS_components.RefreshCwIcon} */
RefreshCwIcon;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    size: (14),
}));
const __VLS_17 = __VLS_16({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "table-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
    ...{ class: "data-table" },
});
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [rule] of __VLS_vFor((__VLS_ctx.rules))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (rule.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "mono" },
    });
    /** @type {__VLS_StyleScopedClasses['mono']} */ ;
    (rule.keyword);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-badge" },
        ...{ class: (rule.isExact ? 'status-sent' : 'status-pending') },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (rule.isExact ? 'Exact' : 'Contains');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "msg-preview" },
        title: (rule.replyText),
    });
    /** @type {__VLS_StyleScopedClasses['msg-preview']} */ ;
    (rule.replyText);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return __VLS_ctx.deleteRule(rule.id);
                // @ts-ignore
                [form, form, form, viewSessionId, fetchRules, rules, deleteRule,];
            } },
        ...{ class: "action-btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
    let __VLS_20;
    /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
    Trash2Icon;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        size: (13),
    }));
    const __VLS_22 = __VLS_21({
        size: (13),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    // @ts-ignore
    [];
}
if (__VLS_ctx.rules.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "4",
        ...{ class: "empty-row" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-row']} */ ;
    let __VLS_25;
    /** @ts-ignore @type { | typeof __VLS_components.MessageSquareIcon} */
    MessageSquareIcon;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        size: (20),
        ...{ style: {} },
    }));
    const __VLS_27 = __VLS_26({
        size: (20),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
}
// @ts-ignore
[rules,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
