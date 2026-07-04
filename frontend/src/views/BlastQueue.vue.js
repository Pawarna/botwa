import { ref, onMounted, onUnmounted, watch } from 'vue';
import { fetchApi } from '../services/api';
const viewSessionId = ref('default');
const rawNumbers = ref('');
const loading = ref(false);
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
    messageText: ''
});
const stats = ref({
    PENDING: 0,
    PROCESSING: 0,
    SENT: 0,
    FAILED: 0,
    total: 0
});
let pollInterval = null;
const fetchStats = async () => {
    if (!viewSessionId.value)
        return;
    try {
        const data = await fetchApi(`/broadcast/${viewSessionId.value}/stats`);
        stats.value = data;
    }
    catch (error) {
        console.error('Failed to fetch stats:', error);
    }
};
const selectedFile = ref(null);
const handleFileSelect = (event) => {
    const target = event.target;
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0];
    }
    else {
        selectedFile.value = null;
    }
};
const queueBroadcast = async () => {
    if (!rawNumbers.value)
        return;
    const numbers = rawNumbers.value.split(',').map(n => n.trim()).filter(n => n);
    if (numbers.length === 0)
        return;
    loading.value = true;
    try {
        let mediaUrl = undefined;
        let mediaType = undefined;
        if (selectedFile.value) {
            const formData = new FormData();
            formData.append('file', selectedFile.value);
            const token = localStorage.getItem('adminToken');
            // Using native fetch because fetchApi sends application/json by default
            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: formData
            });
            if (!uploadRes.ok) {
                const errorData = await uploadRes.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            const uploadData = await uploadRes.json();
            mediaUrl = uploadData.mediaUrl;
            mediaType = uploadData.mediaType;
        }
        const jobs = numbers.map(num => ({
            targetJid: num,
            messageText: form.value.messageText,
            ...(mediaUrl ? { mediaUrl, mediaType } : {})
        }));
        await fetchApi('/broadcast', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: form.value.sessionId,
                jobs
            })
        });
        // Clear form except session
        rawNumbers.value = '';
        form.value.messageText = '';
        selectedFile.value = null;
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput)
            fileInput.value = '';
        // Immediate fetch
        if (viewSessionId.value === form.value.sessionId) {
            fetchStats();
        }
        alert(`Successfully queued ${jobs.length} messages.`);
    }
    catch (error) {
        alert(error.message);
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => {
    fetchSessions();
    fetchStats();
    pollInterval = window.setInterval(fetchStats, 5000);
});
onUnmounted(() => {
    if (pollInterval)
        clearInterval(pollInterval);
});
watch(viewSessionId, () => {
    fetchStats();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['value']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "blast-queue" },
});
/** @type {__VLS_StyleScopedClasses['blast-queue']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex justify-between align-center mb-4" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex gap-4" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "glass-panel flex-1" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['glass-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.queueBroadcast) },
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
    type: "text",
    ...{ class: "form-control" },
    value: (__VLS_ctx.form.sessionId),
    list: "session-list",
    required: true,
});
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.datalist, __VLS_intrinsics.datalist)({
    id: "session-list",
});
for (const [s] of __VLS_vFor((__VLS_ctx.savedSessions))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (s),
        value: (s),
    });
    // @ts-ignore
    [queueBroadcast, form, savedSessions,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ class: "form-control" },
    value: (__VLS_ctx.rawNumbers),
    rows: "3",
    required: true,
    placeholder: "6281234, 6285678",
});
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
    ...{ class: "form-control" },
    value: (__VLS_ctx.form.messageText),
    rows: "5",
    required: true,
    placeholder: "Promo message here...",
});
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-group" },
});
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "form-label" },
});
/** @type {__VLS_StyleScopedClasses['form-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onChange: (__VLS_ctx.handleFileSelect) },
    type: "file",
    ...{ class: "form-control" },
    accept: "image/*,.pdf",
});
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    type: "submit",
    ...{ class: "btn btn-primary mt-2" },
    ...{ style: {} },
    disabled: (__VLS_ctx.loading),
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
(__VLS_ctx.loading ? 'Queueing...' : 'Add to Queue');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "glass-panel" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['glass-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex justify-between mb-4 align-center" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "d-flex gap-2" },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "text",
    ...{ class: "form-control" },
    value: (__VLS_ctx.viewSessionId),
    list: "session-list",
    placeholder: "Filter by Session ID",
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stats-grid mt-4" },
});
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "value" },
});
/** @type {__VLS_StyleScopedClasses['value']} */ ;
(__VLS_ctx.stats.total);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card pending" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pending']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "value" },
});
/** @type {__VLS_StyleScopedClasses['value']} */ ;
(__VLS_ctx.stats.PENDING);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card processing" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['processing']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "value" },
});
/** @type {__VLS_StyleScopedClasses['value']} */ ;
(__VLS_ctx.stats.PROCESSING);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card sent" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['sent']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "value" },
});
/** @type {__VLS_StyleScopedClasses['value']} */ ;
(__VLS_ctx.stats.SENT);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stat-card failed" },
});
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['failed']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "value" },
});
/** @type {__VLS_StyleScopedClasses['value']} */ ;
(__VLS_ctx.stats.FAILED);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-4" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
// @ts-ignore
[form, rawNumbers, handleFileSelect, loading, loading, viewSessionId, stats, stats, stats, stats, stats,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
