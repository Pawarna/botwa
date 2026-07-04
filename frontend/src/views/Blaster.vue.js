import { ref, computed, onMounted, onUnmounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import { UsersIcon, UserIcon, SmartphoneIcon, DatabaseIcon, TagIcon, PhoneIcon, MessageSquareIcon, PaperclipIcon, SendIcon, LoaderIcon, ActivityIcon, RefreshCwIcon, LayoutListIcon, Trash2Icon } from '@lucide/vue';
const toast = useToast();
const confirm = useConfirm();
const mode = ref('bulk');
const savedSessions = ref([]);
const isQueueing = ref(false);
const form = ref({ sessionId: 'default', messageTemplate: '', mediaUrl: '', mediaType: '' });
const batches = ref([]);
const selectedBatchId = ref('');
const batchContacts = ref([]);
// Per-contact selection using a Set of IDs
const selectedContactIds = ref(new Set());
const selectedContacts = computed(() => batchContacts.value.filter(c => selectedContactIds.value.has(c.id)));
const isAllSelected = computed(() => batchContacts.value.length > 0 && selectedContactIds.value.size === batchContacts.value.length);
const toggleContact = (c) => {
    const ids = new Set(selectedContactIds.value);
    if (ids.has(c.id))
        ids.delete(c.id);
    else
        ids.add(c.id);
    selectedContactIds.value = ids;
};
const toggleAll = () => {
    if (isAllSelected.value) {
        selectedContactIds.value = new Set();
    }
    else {
        selectedContactIds.value = new Set(batchContacts.value.map((c) => c.id));
    }
};
const singlePhone = ref('');
const stats = ref(null);
const jobs = ref([]);
let pollInterval = null;
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const statusClass = (s) => ({
    'status-sent': s === 'SENT',
    'status-pending': s === 'PENDING' || s === 'PROCESSING',
    'status-failed': s === 'FAILED',
});
const fetchSessions = async () => {
    try {
        const data = await fetchApi('/sessions');
        savedSessions.value = data.map((s) => s.id);
    }
    catch { }
};
const loadBatches = async () => {
    try {
        batches.value = await fetchApi('/scrape/batches');
    }
    catch { }
};
const deleteJob = async (jobId) => {
    confirm.show({
        title: 'Delete Job',
        message: 'Are you sure you want to delete this broadcast job from history?',
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            try {
                await fetchApi(`/broadcast/jobs/${jobId}`, {
                    method: 'DELETE'
                });
                jobs.value = jobs.value.filter(j => j.id !== jobId);
                if (form.value.sessionId) {
                    stats.value = await fetchApi(`/broadcast/${form.value.sessionId}/stats`);
                }
                toast.success('Job deleted from queue history.');
            }
            catch (error) {
                toast.error('Failed to delete job: ' + error.message);
            }
        }
    });
};
const clearQueue = async () => {
    if (!form.value.sessionId)
        return;
    confirm.show({
        title: 'Clear Queue History',
        message: 'Are you sure you want to clear the entire queue history for this session?',
        confirmText: 'Clear All',
        type: 'danger',
        onConfirm: async () => {
            try {
                await fetchApi(`/broadcast/${form.value.sessionId}/clear`, {
                    method: 'DELETE'
                });
                jobs.value = [];
                stats.value = { PENDING: 0, PROCESSING: 0, SENT: 0, FAILED: 0, total: 0 };
                toast.success('Queue history cleared successfully.');
            }
            catch (error) {
                toast.error('Failed to clear queue: ' + error.message);
            }
        }
    });
};
const deleteContact = async (contactId) => {
    confirm.show({
        title: 'Delete Contact',
        message: 'Are you sure you want to delete this contact from the database?',
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            try {
                await fetchApi(`/scrape/contacts/${contactId}`, {
                    method: 'DELETE'
                });
                batchContacts.value = batchContacts.value.filter(c => c.id !== contactId);
                const updatedIds = new Set(selectedContactIds.value);
                updatedIds.delete(contactId);
                selectedContactIds.value = updatedIds;
                loadBatches();
                toast.success('Contact deleted successfully.');
            }
            catch (error) {
                toast.error('Failed to delete contact: ' + error.message);
            }
        }
    });
};
const loadBatchContacts = async () => {
    if (!selectedBatchId.value)
        return;
    batchContacts.value = [];
    selectedContactIds.value = new Set();
    try {
        const data = await fetchApi(`/scrape/batches/${selectedBatchId.value}`);
        batchContacts.value = data;
        // Auto select all
        selectedContactIds.value = new Set(data.map((c) => c.id));
    }
    catch { }
};
const fetchQueueJobs = async () => {
    if (!form.value.sessionId)
        return;
    try {
        stats.value = await fetchApi(`/broadcast/${form.value.sessionId}/stats`);
        jobs.value = await fetchApi(`/broadcast/${form.value.sessionId}/jobs`);
    }
    catch { }
};
onMounted(() => {
    fetchSessions();
    loadBatches();
    pollInterval = window.setInterval(fetchQueueJobs, 3000);
});
onUnmounted(() => { if (pollInterval)
    clearInterval(pollInterval); });
const insertVariable = (variable) => {
    const textarea = document.getElementById('messageTemplate');
    if (!textarea)
        return;
    const s = textarea.selectionStart;
    const e = textarea.selectionEnd;
    form.value.messageTemplate =
        form.value.messageTemplate.substring(0, s) + variable + form.value.messageTemplate.substring(e);
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(s + variable.length, s + variable.length);
    }, 10);
};
const handleFileSelect = async (event) => {
    const target = event.target;
    if (!target.files?.length)
        return;
    const file = target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok) {
            form.value.mediaUrl = data.url;
            form.value.mediaType = file.type;
            toast.success('Media file uploaded successfully.');
        }
        else
            throw new Error(data.error);
    }
    catch (err) {
        toast.error('Upload failed: ' + err.message);
        target.value = '';
    }
};
const queueBroadcast = async () => {
    if (!form.value.messageTemplate) {
        toast.warning('Please write a message template.');
        return;
    }
    isQueueing.value = true;
    try {
        let payloadJobs = [];
        if (mode.value === 'bulk') {
            if (selectedContacts.value.length === 0)
                throw new Error('No contacts selected');
            payloadJobs = selectedContacts.value.map(c => {
                let text = form.value.messageTemplate
                    .replace(/\{\{name\}\}/g, c.name || '')
                    .replace(/\{\{phone\}\}/g, c.phone || '')
                    .replace(/\{\{address\}\}/g, c.address || '')
                    .replace(/\{\{rating\}\}/g, c.rating || '');
                return { targetJid: c.phone, messageText: text, mediaUrl: form.value.mediaUrl || undefined, mediaType: form.value.mediaType || undefined };
            });
        }
        else {
            if (!singlePhone.value)
                throw new Error('Please enter a phone number');
            payloadJobs = [{ targetJid: singlePhone.value, messageText: form.value.messageTemplate, mediaUrl: form.value.mediaUrl || undefined, mediaType: form.value.mediaType || undefined }];
        }
        await fetchApi('/broadcast', {
            method: 'POST',
            body: JSON.stringify({ sessionId: form.value.sessionId, jobs: payloadJobs }),
        });
        toast.success(`${payloadJobs.length} message(s) successfully queued!`);
        if (mode.value === 'single')
            singlePhone.value = '';
        form.value.messageTemplate = '';
        await fetchQueueJobs();
    }
    catch (err) {
        toast.error(err.message);
    }
    finally {
        isQueueing.value = false;
    }
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['mode-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
/** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
/** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-contact-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-send']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-send']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-block']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-block']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-block']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['page-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "page-title" },
});
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mode-tabs mb-6" },
});
/** @type {__VLS_StyleScopedClasses['mode-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return __VLS_ctx.mode = 'bulk';
            // @ts-ignore
            [mode,];
        } },
    ...{ class: "mode-tab" },
    ...{ class: ({ active: __VLS_ctx.mode === 'bulk' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.UsersIcon} */
UsersIcon;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    size: (15),
}));
const __VLS_2 = __VLS_1({
    size: (15),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return __VLS_ctx.mode = 'single';
            // @ts-ignore
            [mode, mode,];
        } },
    ...{ class: "mode-tab" },
    ...{ class: ({ active: __VLS_ctx.mode === 'single' }) },
});
/** @type {__VLS_StyleScopedClasses['mode-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
let __VLS_5;
/** @ts-ignore @type { | typeof __VLS_components.UserIcon} */
UserIcon;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    size: (15),
}));
const __VLS_7 = __VLS_6({
    size: (15),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "main-layout" },
});
/** @type {__VLS_StyleScopedClasses['main-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "compose-panel card" },
});
/** @type {__VLS_StyleScopedClasses['compose-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-label" },
});
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
let __VLS_10;
/** @ts-ignore @type { | typeof __VLS_components.SmartphoneIcon} */
SmartphoneIcon;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    size: (14),
}));
const __VLS_12 = __VLS_11({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field-group mb-5" },
});
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['input-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.fetchQueueJobs) },
    type: "text",
    ...{ class: "field-input with-icon" },
    value: (__VLS_ctx.form.sessionId),
    list: "session-list",
    placeholder: "Session ID (e.g. default)",
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
/** @type {__VLS_StyleScopedClasses['with-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.datalist, __VLS_intrinsics.datalist)({
    id: "session-list",
});
for (const [s] of __VLS_vFor((__VLS_ctx.savedSessions))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (s),
        value: (s),
    });
    // @ts-ignore
    [mode, fetchQueueJobs, form, savedSessions,];
}
if (__VLS_ctx.mode === 'bulk') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-label" },
    });
    /** @type {__VLS_StyleScopedClasses['section-label']} */ ;
    let __VLS_15;
    /** @ts-ignore @type { | typeof __VLS_components.DatabaseIcon} */
    DatabaseIcon;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        size: (14),
    }));
    const __VLS_17 = __VLS_16({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-group mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.loadBatchContacts) },
        ...{ class: "field-input" },
        value: (__VLS_ctx.selectedBatchId),
    });
    /** @type {__VLS_StyleScopedClasses['field-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
        disabled: true,
    });
    for (const [b] of __VLS_vFor((__VLS_ctx.batches))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (b.id),
            value: (b.id),
        });
        (b.query);
        (b._count.contacts);
        (__VLS_ctx.formatDate(b.createdAt));
        // @ts-ignore
        [mode, loadBatchContacts, selectedBatchId, batches, formatDate,];
    }
    if (__VLS_ctx.batchContacts.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "contact-selector mb-5" },
        });
        /** @type {__VLS_StyleScopedClasses['contact-selector']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "selector-toolbar" },
        });
        /** @type {__VLS_StyleScopedClasses['selector-toolbar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "checkbox-label" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.toggleAll) },
            type: "checkbox",
            checked: (__VLS_ctx.isAllSelected),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.isAllSelected ? 'Deselect All' : 'Select All');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "selection-count" },
        });
        /** @type {__VLS_StyleScopedClasses['selection-count']} */ ;
        (__VLS_ctx.selectedContacts.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "contact-scroll-list" },
        });
        /** @type {__VLS_StyleScopedClasses['contact-scroll-list']} */ ;
        for (const [c] of __VLS_vFor((__VLS_ctx.batchContacts))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (c.id),
                ...{ class: "contact-row" },
                ...{ class: ({ checked: __VLS_ctx.selectedContactIds.has(c.id) }) },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['contact-row']} */ ;
            /** @type {__VLS_StyleScopedClasses['checked']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "checkbox-label" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['checkbox-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.mode === 'bulk'))
                            throw 0;
                        if (!(__VLS_ctx.batchContacts.length > 0))
                            throw 0;
                        return __VLS_ctx.toggleContact(c);
                        // @ts-ignore
                        [batchContacts, batchContacts, toggleAll, isAllSelected, isAllSelected, selectedContacts, selectedContactIds, toggleContact,];
                    } },
                type: "checkbox",
                checked: (__VLS_ctx.selectedContactIds.has(c.id)),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "contact-info" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['contact-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "c-name" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['c-name']} */ ;
            (c.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "c-phone" },
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['c-phone']} */ ;
            (c.phone);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "c-address" },
                title: (c.address),
                ...{ style: {} },
            });
            /** @type {__VLS_StyleScopedClasses['c-address']} */ ;
            (c.address);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mode === 'bulk'))
                            throw 0;
                        if (!(__VLS_ctx.batchContacts.length > 0))
                            throw 0;
                        return __VLS_ctx.deleteContact(c.id);
                        // @ts-ignore
                        [selectedContactIds, deleteContact,];
                    } },
                type: "button",
                ...{ class: "delete-contact-btn" },
                title: "Delete contact",
            });
            /** @type {__VLS_StyleScopedClasses['delete-contact-btn']} */ ;
            let __VLS_20;
            /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
            Trash2Icon;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                size: (12),
            }));
            const __VLS_22 = __VLS_21({
                size: (12),
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            // @ts-ignore
            [];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-label" },
    });
    /** @type {__VLS_StyleScopedClasses['section-label']} */ ;
    let __VLS_25;
    /** @ts-ignore @type { | typeof __VLS_components.TagIcon} */
    TagIcon;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        size: (14),
    }));
    const __VLS_27 = __VLS_26({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "var-chips mb-5" },
    });
    /** @type {__VLS_StyleScopedClasses['var-chips']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mode === 'bulk'))
                    throw 0;
                return __VLS_ctx.insertVariable('{{name}}');
                // @ts-ignore
                [insertVariable,];
            } },
        type: "button",
        ...{ class: "var-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mode === 'bulk'))
                    throw 0;
                return __VLS_ctx.insertVariable('{{phone}}');
                // @ts-ignore
                [insertVariable,];
            } },
        type: "button",
        ...{ class: "var-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mode === 'bulk'))
                    throw 0;
                return __VLS_ctx.insertVariable('{{address}}');
                // @ts-ignore
                [insertVariable,];
            } },
        type: "button",
        ...{ class: "var-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mode === 'bulk'))
                    throw 0;
                return __VLS_ctx.insertVariable('{{rating}}');
                // @ts-ignore
                [insertVariable,];
            } },
        type: "button",
        ...{ class: "var-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['var-chip']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-label" },
    });
    /** @type {__VLS_StyleScopedClasses['section-label']} */ ;
    let __VLS_30;
    /** @ts-ignore @type { | typeof __VLS_components.PhoneIcon} */
    PhoneIcon;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        size: (14),
    }));
    const __VLS_32 = __VLS_31({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-group mb-5" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "text",
        ...{ class: "field-input" },
        value: (__VLS_ctx.singlePhone),
        placeholder: "628123456789",
    });
    /** @type {__VLS_StyleScopedClasses['field-input']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-label" },
});
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
let __VLS_35;
/** @ts-ignore @type { | typeof __VLS_components.MessageSquareIcon} */
MessageSquareIcon;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    size: (14),
}));
const __VLS_37 = __VLS_36({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field-group mb-5" },
});
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    id: "messageTemplate",
    ...{ class: "field-input field-textarea" },
    value: (__VLS_ctx.form.messageTemplate),
    rows: "6",
    placeholder: (__VLS_ctx.mode === 'bulk' ? 'Halo {{name}}, toko Anda di {{address}} menarik!' : 'Tulis pesan...'),
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
/** @type {__VLS_StyleScopedClasses['field-textarea']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-label" },
});
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
let __VLS_40;
/** @ts-ignore @type { | typeof __VLS_components.PaperclipIcon} */
PaperclipIcon;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    size: (14),
}));
const __VLS_42 = __VLS_41({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "optional-tag" },
});
/** @type {__VLS_StyleScopedClasses['optional-tag']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field-group mb-6" },
});
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleFileSelect) },
    type: "file",
    ...{ class: "field-input" },
    accept: "image/*,.pdf",
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.queueBroadcast) },
    ...{ class: "btn-send" },
    disabled: (__VLS_ctx.isQueueing),
});
/** @type {__VLS_StyleScopedClasses['btn-send']} */ ;
if (__VLS_ctx.isQueueing) {
    let __VLS_45;
    /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
    LoaderIcon;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        size: (15),
        ...{ class: "spin" },
    }));
    const __VLS_47 = __VLS_46({
        size: (15),
        ...{ class: "spin" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    /** @type {__VLS_StyleScopedClasses['spin']} */ ;
}
else {
    let __VLS_50;
    /** @ts-ignore @type { | typeof __VLS_components.SendIcon} */
    SendIcon;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        size: (15),
    }));
    const __VLS_52 = __VLS_51({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
}
if (__VLS_ctx.mode === 'bulk') {
    (__VLS_ctx.isQueueing ? 'Queueing...' : `Blast to ${__VLS_ctx.selectedContacts.length} Contacts`);
}
else {
    (__VLS_ctx.isQueueing ? 'Sending...' : 'Send Message');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "monitor-panel card" },
});
/** @type {__VLS_StyleScopedClasses['monitor-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "monitor-header" },
});
/** @type {__VLS_StyleScopedClasses['monitor-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex align-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
let __VLS_55;
/** @ts-ignore @type { | typeof __VLS_components.ActivityIcon} */
ActivityIcon;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
    size: (16),
}));
const __VLS_57 = __VLS_56({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex gap-2" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
if (__VLS_ctx.jobs.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearQueue) },
        ...{ class: "action-btn-danger" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
    let __VLS_60;
    /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
    Trash2Icon;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
        size: (12),
    }));
    const __VLS_62 = __VLS_61({
        size: (12),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.fetchQueueJobs) },
    ...{ class: "btn-icon" },
    title: "Refresh",
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
let __VLS_65;
/** @ts-ignore @type { | typeof __VLS_components.RefreshCwIcon} */
RefreshCwIcon;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
    size: (14),
}));
const __VLS_67 = __VLS_66({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
if (__VLS_ctx.stats) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-row mb-5" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-block sent" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['sent']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-num" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
    (__VLS_ctx.stats.SENT || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-block pending" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['pending']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-num" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
    (__VLS_ctx.stats.PENDING || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-block failed" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-block']} */ ;
    /** @type {__VLS_StyleScopedClasses['failed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-num" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
    (__VLS_ctx.stats.FAILED || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
}
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
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [job] of __VLS_vFor((__VLS_ctx.jobs))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (job.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "mono" },
    });
    /** @type {__VLS_StyleScopedClasses['mono']} */ ;
    (job.targetJid);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "msg-preview" },
        title: (job.messageText),
    });
    /** @type {__VLS_StyleScopedClasses['msg-preview']} */ ;
    (job.messageText);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-badge" },
        ...{ class: (__VLS_ctx.statusClass(job.status)) },
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (job.status);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "text-muted time-cell" },
    });
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['time-cell']} */ ;
    (new Date(job.createdAt).toLocaleTimeString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return __VLS_ctx.deleteJob(job.id);
                // @ts-ignore
                [mode, mode, fetchQueueJobs, form, selectedContacts, singlePhone, handleFileSelect, queueBroadcast, isQueueing, isQueueing, isQueueing, isQueueing, jobs, jobs, clearQueue, stats, stats, stats, stats, statusClass, deleteJob,];
            } },
        ...{ class: "action-btn-danger" },
        title: "Delete job",
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
    let __VLS_70;
    /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
    Trash2Icon;
    // @ts-ignore
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        size: (12),
    }));
    const __VLS_72 = __VLS_71({
        size: (12),
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    // @ts-ignore
    [];
}
if (__VLS_ctx.jobs.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "5",
        ...{ class: "empty-row" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-row']} */ ;
    let __VLS_75;
    /** @ts-ignore @type { | typeof __VLS_components.LayoutListIcon} */
    LayoutListIcon;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        size: (20),
    }));
    const __VLS_77 = __VLS_76({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
}
// @ts-ignore
[jobs,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
