import { ref, onMounted, onUnmounted } from 'vue';
import { fetchApi } from '../services/api';
import { useToast, useConfirm } from '../composables/useNotification';
import { SmartphoneIcon, PlusIcon, RefreshCwIcon, QrCodeIcon, LinkIcon, Trash2Icon, LoaderIcon, XIcon } from '@lucide/vue';
const toast = useToast();
const confirm = useConfirm();
const newSessionId = ref('');
const loading = ref(false);
const savedSessions = ref([]);
let pollInterval = null;
const activeQr = ref('');
const activeQrSession = ref('');
const fetchSessions = async () => {
    try {
        const data = await fetchApi('/sessions');
        savedSessions.value = data;
        if (activeQrSession.value) {
            const activeSession = data.find((s) => s.id === activeQrSession.value);
            if (activeSession && activeSession.status === 'qr') {
                const qrData = await fetchApi(`/sessions/${activeQrSession.value}`);
                if (qrData.qr)
                    activeQr.value = qrData.qr;
            }
            else if (activeSession && activeSession.status === 'connected') {
                const connectedId = activeQrSession.value;
                closeQr();
                toast.success(`WhatsApp session "${connectedId}" is now connected!`);
            }
            else if (activeSession && activeSession.status === 'error') {
                const errorId = activeQrSession.value;
                closeQr();
                toast.error(`Connection failed for "${errorId}": ${activeSession.error || 'Connection Failure'}`);
            }
        }
    }
    catch (error) {
        console.error('Failed to fetch sessions', error);
    }
};
const getStatusClass = (status) => {
    if (status === 'connected')
        return 'status-sent';
    if (status === 'qr' || status === 'connecting')
        return 'status-pending';
    return 'status-failed';
};
const startSession = async () => {
    if (!newSessionId.value)
        return;
    loading.value = true;
    try {
        await fetchApi('/sessions', {
            method: 'POST',
            body: JSON.stringify({ sessionId: newSessionId.value }),
        });
        activeQrSession.value = newSessionId.value;
        newSessionId.value = '';
        await fetchSessions();
        toast.info('Initializing session... Preparing QR code.');
    }
    catch (error) {
        toast.error(error.message);
    }
    finally {
        loading.value = false;
    }
};
const reconnectSession = async (id) => {
    try {
        await fetchApi('/sessions', {
            method: 'POST',
            body: JSON.stringify({ sessionId: id }),
        });
        activeQrSession.value = id;
        await fetchSessions();
        toast.info(`Connecting to session "${id}"...`);
    }
    catch (error) {
        toast.error(error.message);
    }
};
const deleteSession = async (id) => {
    confirm.show({
        title: 'Delete Session',
        message: `Are you sure you want to permanently delete WhatsApp session "${id}"?`,
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            try {
                await fetchApi(`/sessions/${id}`, {
                    method: 'DELETE',
                });
                await fetchSessions();
                toast.success(`Session "${id}" deleted successfully.`);
            }
            catch (error) {
                toast.error(error.message);
            }
        }
    });
};
const showQr = async (id) => {
    activeQrSession.value = id;
    await fetchSessions();
};
const closeQr = () => {
    activeQr.value = '';
    activeQrSession.value = '';
};
onMounted(() => {
    fetchSessions();
    pollInterval = window.setInterval(fetchSessions, 3000);
});
onUnmounted(() => {
    if (pollInterval)
        clearInterval(pollInterval);
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
/** @type {__VLS_StyleScopedClasses['action-btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "session-manager" },
});
/** @type {__VLS_StyleScopedClasses['session-manager']} */ ;
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
    ...{ onSubmit: (__VLS_ctx.startSession) },
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
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    ...{ class: "field-input" },
    value: (__VLS_ctx.newSessionId),
    placeholder: "e.g. marketing-dept",
    required: true,
});
/** @type {__VLS_StyleScopedClasses['field-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn-primary-solid" },
    ...{ style: {} },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['btn-primary-solid']} */ ;
if (__VLS_ctx.loading) {
    let __VLS_5;
    /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
    LoaderIcon;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        size: (14),
        ...{ class: "spin" },
    }));
    const __VLS_7 = __VLS_6({
        size: (14),
        ...{ class: "spin" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['spin']} */ ;
}
else {
    let __VLS_10;
    /** @ts-ignore @type { | typeof __VLS_components.PlusIcon} */
    PlusIcon;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        size: (14),
    }));
    const __VLS_12 = __VLS_11({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
}
(__VLS_ctx.loading ? 'Starting...' : 'Create Session');
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
let __VLS_15;
/** @ts-ignore @type { | typeof __VLS_components.SmartphoneIcon} */
SmartphoneIcon;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    size: (16),
}));
const __VLS_17 = __VLS_16({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "card-title" },
});
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.fetchSessions) },
    ...{ class: "btn-icon" },
    title: "Refresh list",
});
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
let __VLS_20;
/** @ts-ignore @type { | typeof __VLS_components.RefreshCwIcon} */
RefreshCwIcon;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    size: (14),
}));
const __VLS_22 = __VLS_21({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
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
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
for (const [session] of __VLS_vFor((__VLS_ctx.savedSessions))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (session.id),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "mono" },
    });
    /** @type {__VLS_StyleScopedClasses['mono']} */ ;
    (session.id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-badge" },
        ...{ class: (__VLS_ctx.getStatusClass(session.status)) },
        title: (session.error),
    });
    /** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
    (session.status === 'qr' ? 'Pending Scan' : (session.status === 'error' ? 'Connection Error ⓘ' : session.status));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "d-flex gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    if (session.status === 'qr') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(session.status === 'qr'))
                        throw 0;
                    return __VLS_ctx.showQr(session.id);
                    // @ts-ignore
                    [startSession, newSessionId, loading, loading, loading, fetchSessions, savedSessions, getStatusClass, showQr,];
                } },
            ...{ class: "action-btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['action-btn-primary']} */ ;
        let __VLS_25;
        /** @ts-ignore @type { | typeof __VLS_components.QrCodeIcon} */
        QrCodeIcon;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
            size: (13),
        }));
        const __VLS_27 = __VLS_26({
            size: (13),
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    }
    if (session.status === 'offline' || session.status === 'error') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(session.status === 'offline' || session.status === 'error'))
                        throw 0;
                    return __VLS_ctx.reconnectSession(session.id);
                    // @ts-ignore
                    [reconnectSession,];
                } },
            ...{ class: "action-btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['action-btn-primary']} */ ;
        let __VLS_30;
        /** @ts-ignore @type { | typeof __VLS_components.LinkIcon} */
        LinkIcon;
        // @ts-ignore
        const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            size: (13),
        }));
        const __VLS_32 = __VLS_31({
            size: (13),
        }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return __VLS_ctx.deleteSession(session.id);
                // @ts-ignore
                [deleteSession,];
            } },
        ...{ class: "action-btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
    let __VLS_35;
    /** @ts-ignore @type { | typeof __VLS_components.Trash2Icon} */
    Trash2Icon;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        size: (13),
    }));
    const __VLS_37 = __VLS_36({
        size: (13),
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    // @ts-ignore
    [];
}
if (__VLS_ctx.savedSessions.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        colspan: "3",
        ...{ class: "empty-row" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-row']} */ ;
    let __VLS_40;
    /** @ts-ignore @type { | typeof __VLS_components.SmartphoneIcon} */
    SmartphoneIcon;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        size: (20),
        ...{ style: {} },
    }));
    const __VLS_42 = __VLS_41({
        size: (20),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
}
if (__VLS_ctx.activeQrSession) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeQr) },
        ...{ class: "qr-modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['qr-modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "qr-modal-content card" },
    });
    /** @type {__VLS_StyleScopedClasses['qr-modal-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "d-flex justify-between align-center mb-4" },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeQr) },
        ...{ class: "btn-icon" },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
    let __VLS_45;
    /** @ts-ignore @type { | typeof __VLS_components.XIcon} */
    XIcon;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        size: (16),
    }));
    const __VLS_47 = __VLS_46({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    if (__VLS_ctx.activeQr) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-muted mb-4" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "qr-container" },
        });
        /** @type {__VLS_StyleScopedClasses['qr-container']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.activeQr),
            alt: "QR Code",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "d-flex align-center justify-center gap-2 mt-4" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        let __VLS_50;
        /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
        LoaderIcon;
        // @ts-ignore
        const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            size: (14),
            ...{ class: "spin" },
        }));
        const __VLS_52 = __VLS_51({
            size: (14),
            ...{ class: "spin" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_51));
        /** @type {__VLS_StyleScopedClasses['spin']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "d-flex flex-column align-center justify-center py-6" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
        /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        let __VLS_55;
        /** @ts-ignore @type { | typeof __VLS_components.LoaderIcon} */
        LoaderIcon;
        // @ts-ignore
        const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
            size: (32),
            ...{ class: "spin" },
            ...{ style: {} },
        }));
        const __VLS_57 = __VLS_56({
            size: (32),
            ...{ class: "spin" },
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_56));
        /** @type {__VLS_StyleScopedClasses['spin']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-muted" },
            ...{ style: {} },
        });
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    }
}
// @ts-ignore
[savedSessions, activeQrSession, closeQr, closeQr, activeQr, activeQr,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
