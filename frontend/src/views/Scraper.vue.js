import { ref, nextTick, onUnmounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import { SearchIcon, MapPinIcon, LoaderIcon, TerminalIcon, DatabaseIcon, UsersIcon, RefreshCwIcon, SendIcon, MousePointerClickIcon, StarIcon, Trash2Icon } from '@lucide/vue';
const toast = useToast();
const confirm = useConfirm();
const scrapeQuery = ref('');
const scrapeLimit = ref(20);
const isScraping = ref(false);
const batches = ref([]);
const selectedBatch = ref(null);
const batchContacts = ref([]);
const logs = ref([]);
const logContainer = ref(null);
let eventSource = null;
const logPrefix = (type) => {
    const map = {
        start: '[ START ]',
        info: '[ INFO  ]',
        progress: '[ SCROLL]',
        phone: '[ PHONE ]',
        done: '[ DONE  ]',
        error: '[ ERROR ]',
    };
    return map[type] || '[ LOG   ]';
};
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const appendLog = async (data) => {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    logs.value.push({ ...data, time: now });
    await nextTick();
    if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
};
const startSSE = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    eventSource = new EventSource(`${apiBase}/scrape/logs`);
    eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        appendLog(data);
        if (data.type === 'done') {
            isScraping.value = false;
            closeSSE();
            loadBatches();
        }
    };
    eventSource.onerror = () => {
        closeSSE();
    };
};
const closeSSE = () => {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
};
onUnmounted(() => closeSSE());
const loadBatches = async () => {
    try {
        const data = await fetchApi('/scrape/batches');
        batches.value = data;
        if (selectedBatch.value) {
            const updated = data.find((b) => b.id === selectedBatch.value.id);
            if (updated)
                selectedBatch.value = updated;
        }
    }
    catch (error) {
        console.error('Failed to load batches', error);
    }
};
const deleteBatch = async (batchId, event) => {
    event.stopPropagation();
    confirm.show({
        title: 'Delete Scrape Batch',
        message: 'Are you sure you want to permanently delete this scrape batch and all associated contacts?',
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            try {
                await fetchApi(`/scrape/batches/${batchId}`, {
                    method: 'DELETE'
                });
                if (selectedBatch.value?.id === batchId) {
                    selectedBatch.value = null;
                    batchContacts.value = [];
                }
                await loadBatches();
                toast.success('Scrape batch deleted successfully.');
            }
            catch (error) {
                toast.error('Failed to delete batch: ' + error.message);
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
                await loadBatches();
                toast.success('Contact deleted successfully.');
            }
            catch (error) {
                toast.error('Failed to delete contact: ' + error.message);
            }
        }
    });
};
const selectBatch = async (batch) => {
    selectedBatch.value = batch;
    batchContacts.value = [];
    try {
        const data = await fetchApi(`/scrape/batches/${batch.id}`);
        batchContacts.value = data;
    }
    catch (error) {
        console.error('Failed to load contacts', error);
    }
};
const runScraper = async () => {
    if (!scrapeQuery.value)
        return;
    isScraping.value = true;
    logs.value = [];
    startSSE();
    try {
        await fetchApi('/scrape', {
            method: 'POST',
            body: JSON.stringify({ query: scrapeQuery.value, limit: scrapeLimit.value })
        });
    }
    catch (error) {
        appendLog({ type: 'error', msg: error.message });
        isScraping.value = false;
        closeSSE();
    }
};
loadBatches();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
/** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
/** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
/** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
/** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
/** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['contact-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-batch-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-batch-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-batch-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
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
    ...{ class: "card mb-6" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.runScraper) },
    ...{ class: "scrape-form" },
});
/** @type {__VLS_StyleScopedClasses['scrape-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field-group flex-1" },
});
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "field-label" },
});
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['input-wrapper']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.SearchIcon} */
SearchIcon;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    size: (16),
    ...{ class: "input-icon" },
}));
const __VLS_2 = __VLS_1({
    size: (16),
    ...{ class: "input-icon" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['input-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    ...{ class: "field-input with-icon" },
    value: (__VLS_ctx.scrapeQuery),
    placeholder: "e.g. Coffee Shop in Yogyakarta",
    disabled: (__VLS_ctx.isScraping),
    required: true,
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
/** @type {__VLS_StyleScopedClasses['with-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "field-group" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "field-label" },
});
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "number",
    ...{ class: "field-input" },
    min: "1",
    max: "60",
    disabled: (__VLS_ctx.isScraping),
});
(__VLS_ctx.scrapeLimit);
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn-primary-solid" },
    disabled: (__VLS_ctx.isScraping),
});
/** @type {__VLS_StyleScopedClasses['btn-primary-solid']} */ ;
if (__VLS_ctx.isScraping) {
    let __VLS_5;
    /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
    LoaderIcon;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        size: (16),
        ...{ class: "spin" },
    }));
    const __VLS_7 = __VLS_6({
        size: (16),
        ...{ class: "spin" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['spin']} */ ;
}
else {
    let __VLS_10;
    /** @ts-ignore @type { | typeof __VLS_components.MapPinIcon} */
    MapPinIcon;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        size: (16),
    }));
    const __VLS_12 = __VLS_11({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
}
(__VLS_ctx.isScraping ? 'Scraping...' : 'Start Scraping');
if (__VLS_ctx.isScraping || __VLS_ctx.logs.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card mb-6 terminal-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['terminal-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "terminal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['terminal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "d-flex align-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    let __VLS_15;
    /** @ts-ignore @type { | typeof __VLS_components.TerminalIcon} */
    TerminalIcon;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        size: (15),
    }));
    const __VLS_17 = __VLS_16({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "terminal-title" },
    });
    /** @type {__VLS_StyleScopedClasses['terminal-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "terminal-dots" },
    });
    /** @type {__VLS_StyleScopedClasses['terminal-dots']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot dot-red" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['dot-red']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot dot-yellow" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['dot-yellow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "dot dot-green" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['dot-green']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "terminal-body" },
        ref: "logContainer",
    });
    /** @type {__VLS_StyleScopedClasses['terminal-body']} */ ;
    for (const [log, i] of __VLS_vFor((__VLS_ctx.logs))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
            ...{ class: "log-line" },
            ...{ class: ('log-' + log.type) },
        });
        /** @type {__VLS_StyleScopedClasses['log-line']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "log-time" },
        });
        /** @type {__VLS_StyleScopedClasses['log-time']} */ ;
        (log.time);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "log-prefix" },
        });
        /** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
        (__VLS_ctx.logPrefix(log.type));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "log-msg" },
        });
        /** @type {__VLS_StyleScopedClasses['log-msg']} */ ;
        (log.msg);
        // @ts-ignore
        [runScraper, scrapeQuery, isScraping, isScraping, isScraping, isScraping, isScraping, isScraping, scrapeLimit, logs, logs, logPrefix,];
    }
    if (__VLS_ctx.isScraping && __VLS_ctx.logs.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "log-line log-info" },
        });
        /** @type {__VLS_StyleScopedClasses['log-line']} */ ;
        /** @type {__VLS_StyleScopedClasses['log-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "log-time" },
        });
        /** @type {__VLS_StyleScopedClasses['log-time']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "log-prefix" },
        });
        /** @type {__VLS_StyleScopedClasses['log-prefix']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "log-msg" },
        });
        /** @type {__VLS_StyleScopedClasses['log-msg']} */ ;
    }
    if (__VLS_ctx.isScraping) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "log-cursor" },
        });
        /** @type {__VLS_StyleScopedClasses['log-cursor']} */ ;
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "split-layout" },
});
/** @type {__VLS_StyleScopedClasses['split-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card history-panel" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['history-panel']} */ ;
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
let __VLS_20;
/** @ts-ignore @type { | typeof __VLS_components.DatabaseIcon} */
DatabaseIcon;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    size: (16),
}));
const __VLS_22 = __VLS_21({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.loadBatches) },
    ...{ class: "btn-icon" },
    title: "Refresh",
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
let __VLS_25;
/** @ts-ignore @type { | typeof __VLS_components.RefreshCwIcon} */
RefreshCwIcon;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    size: (14),
}));
const __VLS_27 = __VLS_26({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "batch-list" },
});
/** @type {__VLS_StyleScopedClasses['batch-list']} */ ;
for (const [batch] of __VLS_vFor((__VLS_ctx.batches))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                return __VLS_ctx.selectBatch(batch);
                // @ts-ignore
                [isScraping, isScraping, logs, loadBatches, batches, selectBatch,];
            } },
        key: (batch.id),
        ...{ class: "batch-item" },
        ...{ class: ({ active: __VLS_ctx.selectedBatch?.id === batch.id }) },
    });
    /** @type {__VLS_StyleScopedClasses['batch-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "d-flex justify-between align-center" },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "batch-query" },
    });
    /** @type {__VLS_StyleScopedClasses['batch-query']} */ ;
    (batch.query);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "d-flex align-center gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "contact-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['contact-chip']} */ ;
    (batch._count.contacts);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return __VLS_ctx.deleteBatch(batch.id, $event);
                // @ts-ignore
                [selectedBatch, deleteBatch,];
            } },
        ...{ class: "delete-batch-btn" },
        title: "Delete batch",
    });
    /** @type {__VLS_StyleScopedClasses['delete-batch-btn']} */ ;
    let __VLS_30;
    /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
    Trash2Icon;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        size: (13),
    }));
    const __VLS_32 = __VLS_31({
        size: (13),
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "batch-date" },
    });
    /** @type {__VLS_StyleScopedClasses['batch-date']} */ ;
    (__VLS_ctx.formatDate(batch.createdAt));
    // @ts-ignore
    [formatDate,];
}
if (__VLS_ctx.batches.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    let __VLS_35;
    /** @ts-ignore @type { | typeof __VLS_components.DatabaseIcon} */
    DatabaseIcon;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        size: (32),
        ...{ class: "empty-icon" },
    }));
    const __VLS_37 = __VLS_36({
        size: (32),
        ...{ class: "empty-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card detail-panel" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-panel']} */ ;
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
let __VLS_40;
/** @ts-ignore @type { | typeof __VLS_components.UsersIcon} */
UsersIcon;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    size: (16),
}));
const __VLS_42 = __VLS_41({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
(__VLS_ctx.selectedBatch ? __VLS_ctx.selectedBatch.query : 'Select a batch');
if (__VLS_ctx.selectedBatch) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "contact-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['contact-chip']} */ ;
    (__VLS_ctx.batchContacts.length);
}
if (__VLS_ctx.selectedBatch) {
    let __VLS_45;
    /** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
    routerLink;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        to: "/blaster",
        ...{ class: "btn-secondary-solid" },
    }));
    const __VLS_47 = __VLS_46({
        to: "/blaster",
        ...{ class: "btn-secondary-solid" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    /** @type {__VLS_StyleScopedClasses['btn-secondary-solid']} */ ;
    const { default: __VLS_50 } = __VLS_48.slots;
    let __VLS_51;
    /** @ts-ignore @type { | typeof __VLS_components.SendIcon} */
    SendIcon;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
        size: (14),
    }));
    const __VLS_53 = __VLS_52({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    // @ts-ignore
    [batches, selectedBatch, selectedBatch, selectedBatch, selectedBatch, batchContacts,];
    var __VLS_48;
}
if (!__VLS_ctx.selectedBatch) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state large" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    let __VLS_56;
    /** @ts-ignore @type { | typeof __VLS_components.MousePointerClickIcon} */
    MousePointerClickIcon;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        size: (40),
        ...{ class: "empty-icon" },
    }));
    const __VLS_58 = __VLS_57({
        size: (40),
        ...{ class: "empty-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.batchContacts.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state large" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    let __VLS_61;
    /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
    LoaderIcon;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
        size: (32),
        ...{ class: "empty-icon spin" },
    }));
    const __VLS_63 = __VLS_62({
        size: (32),
        ...{ class: "empty-icon spin" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['spin']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [contact, idx] of __VLS_vFor((__VLS_ctx.batchContacts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (contact.id || idx),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "text-muted" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (idx + 1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "contact-name" },
        });
        /** @type {__VLS_StyleScopedClasses['contact-name']} */ ;
        (contact.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "contact-phone" },
        });
        /** @type {__VLS_StyleScopedClasses['contact-phone']} */ ;
        (contact.phone);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "contact-address" },
            title: (contact.address),
        });
        /** @type {__VLS_StyleScopedClasses['contact-address']} */ ;
        (contact.address);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        if (contact.rating && contact.rating !== 'N/A') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "rating-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['rating-badge']} */ ;
            let __VLS_66;
            /** @ts-ignore @type { | typeof __VLS_components.StarIcon} */
            StarIcon;
            // @ts-ignore
            const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
                size: (11),
            }));
            const __VLS_68 = __VLS_67({
                size: (11),
            }, ...__VLS_functionalComponentArgsRest(__VLS_67));
            (contact.rating);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "text-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.selectedBatch))
                        throw 0;
                    if (!!(__VLS_ctx.batchContacts.length === 0))
                        throw 0;
                    return __VLS_ctx.deleteContact(contact.id);
                    // @ts-ignore
                    [selectedBatch, batchContacts, batchContacts, deleteContact,];
                } },
            ...{ class: "action-btn-danger" },
            title: "Delete contact",
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
        let __VLS_71;
        /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
        Trash2Icon;
        // @ts-ignore
        const __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
            size: (12),
        }));
        const __VLS_73 = __VLS_72({
            size: (12),
        }, ...__VLS_functionalComponentArgsRest(__VLS_72));
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
