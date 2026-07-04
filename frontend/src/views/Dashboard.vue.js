import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { SmartphoneIcon, MessageSquareIcon, SearchIcon, SendIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon, BellIcon } from '@lucide/vue';
const router = useRouter();
// Retrieve initial state from localStorage if exists
const isExpanded = ref(localStorage.getItem('sidebar_expanded') === 'true');
const toggleSidebar = () => {
    isExpanded.value = !isExpanded.value;
    localStorage.setItem('sidebar_expanded', String(isExpanded.value));
};
const logout = () => {
    localStorage.removeItem('adminToken');
    router.push('/login');
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-container" },
});
/** @type {__VLS_StyleScopedClasses['app-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "sidebar" },
    ...{ class: ({ expanded: __VLS_ctx.isExpanded }) },
});
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "/",
    ...{ class: "logo-container" },
}));
const __VLS_2 = __VLS_1({
    to: "/",
    ...{ class: "logo-container" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['logo-container']} */ ;
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "logo-icon" },
});
/** @type {__VLS_StyleScopedClasses['logo-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "logo-text" },
});
/** @type {__VLS_StyleScopedClasses['logo-text']} */ ;
// @ts-ignore
[isExpanded,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "nav-menu" },
});
/** @type {__VLS_StyleScopedClasses['nav-menu']} */ ;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    to: "/session",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Session Manager",
}));
const __VLS_8 = __VLS_7({
    to: "/session",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Session Manager",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
let __VLS_12;
/** @ts-ignore @type { | typeof __VLS_components.SmartphoneIcon} */
SmartphoneIcon;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    size: (20),
}));
const __VLS_14 = __VLS_13({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "nav-text" },
});
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
// @ts-ignore
[];
var __VLS_9;
let __VLS_17;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    to: "/auto-reply",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Auto Reply Rules",
}));
const __VLS_19 = __VLS_18({
    to: "/auto-reply",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Auto Reply Rules",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
const { default: __VLS_22 } = __VLS_20.slots;
let __VLS_23;
/** @ts-ignore @type { | typeof __VLS_components.MessageSquareIcon} */
MessageSquareIcon;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
    size: (20),
}));
const __VLS_25 = __VLS_24({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "nav-text" },
});
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
// @ts-ignore
[];
var __VLS_20;
let __VLS_28;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    to: "/scraper",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Maps Scraper",
}));
const __VLS_30 = __VLS_29({
    to: "/scraper",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Maps Scraper",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
const { default: __VLS_33 } = __VLS_31.slots;
let __VLS_34;
/** @ts-ignore @type { | typeof __VLS_components.SearchIcon} */
SearchIcon;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
    size: (20),
}));
const __VLS_36 = __VLS_35({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "nav-text" },
});
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
// @ts-ignore
[];
var __VLS_31;
let __VLS_39;
/** @ts-ignore @type { | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link'] | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components['router-link']} */
routerLink;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    to: "/blaster",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Advanced Blaster",
}));
const __VLS_41 = __VLS_40({
    to: "/blaster",
    ...{ class: "nav-item" },
    activeClass: "active",
    title: "Advanced Blaster",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
const { default: __VLS_44 } = __VLS_42.slots;
let __VLS_45;
/** @ts-ignore @type { | typeof __VLS_components.SendIcon} */
SendIcon;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    size: (20),
}));
const __VLS_47 = __VLS_46({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "nav-text" },
});
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
// @ts-ignore
[];
var __VLS_42;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-footer" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleSidebar) },
    ...{ class: "nav-item" },
    title: (__VLS_ctx.isExpanded ? 'Collapse' : 'Expand'),
});
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
if (!__VLS_ctx.isExpanded) {
    let __VLS_50;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronRightIcon} */
    ChevronRightIcon;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        size: (20),
    }));
    const __VLS_52 = __VLS_51({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
}
else {
    let __VLS_55;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronLeftIcon} */
    ChevronLeftIcon;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        size: (20),
    }));
    const __VLS_57 = __VLS_56({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "nav-text" },
});
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.logout) },
    ...{ class: "nav-item" },
    ...{ style: {} },
    title: "Logout",
});
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
let __VLS_60;
/** @ts-ignore @type { | typeof __VLS_components.LogOutIcon} */
LogOutIcon;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
    size: (20),
}));
const __VLS_62 = __VLS_61({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "nav-text" },
});
/** @type {__VLS_StyleScopedClasses['nav-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "main-content" },
});
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "top-nav" },
});
/** @type {__VLS_StyleScopedClasses['top-nav']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "top-actions" },
});
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ class: "icon-btn" },
});
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
let __VLS_65;
/** @ts-ignore @type { | typeof __VLS_components.SearchIcon} */
SearchIcon;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
    size: (18),
}));
const __VLS_67 = __VLS_66({
    size: (18),
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ class: "icon-btn" },
});
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
let __VLS_70;
/** @ts-ignore @type { | typeof __VLS_components.BellIcon} */
BellIcon;
// @ts-ignore
const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
    size: (18),
}));
const __VLS_72 = __VLS_71({
    size: (18),
}, ...__VLS_functionalComponentArgsRest(__VLS_71));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ style: {} },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "animate-fade-in" },
    ...{ style: {} },
});
/** @type {__VLS_StyleScopedClasses['animate-fade-in']} */ ;
let __VLS_75;
/** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view'] | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
routerView;
// @ts-ignore
const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({}));
const __VLS_77 = __VLS_76({}, ...__VLS_functionalComponentArgsRest(__VLS_76));
// @ts-ignore
[isExpanded, isExpanded, toggleSidebar, logout,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
