export type Lang = "th" | "en";

export const translations = {
  th: {
    // Nav
    nav_home: "หน้าหลัก",
    nav_dashboard: "แดชบอร์ด",
    nav_scheduled_tasks: "งานอัตโนมัติ",
    nav_create_task: "สร้างงาน",
    nav_templates: "เทมเพลต",
    nav_task_results: "ผลลัพธ์",
    nav_notifications: "การแจ้งเตือน",
    nav_settings: "ตั้งค่า",
    nav_admin: "แอดมิน",
    // Topbar
    topbar_subtitle: "API-connected Dashboard",
    topbar_live: "API Live",
    // Sidebar
    sidebar_phase: "เฟส 27",
    sidebar_desc: "Dashboard, API, Scheduler, Templates, Settings, Admin และ Deploy พร้อมใช้งาน",
    sidebar_build_label: "Production MVP",
    // Common
    common_refresh: "รีเฟรช",
    common_save: "บันทึก",
    common_cancel: "ยกเลิก",
    common_delete: "ลบ",
    common_confirm: "ยืนยัน",
    common_loading: "กำลังโหลด...",
    common_error: "เกิดข้อผิดพลาด",
    common_success: "สำเร็จ",
  },
  en: {
    // Nav
    nav_home: "Home",
    nav_dashboard: "Dashboard",
    nav_scheduled_tasks: "Scheduled Tasks",
    nav_create_task: "Create Task",
    nav_templates: "Templates",
    nav_task_results: "Task Results",
    nav_notifications: "Notifications",
    nav_settings: "Settings",
    nav_admin: "Admin",
    // Topbar
    topbar_subtitle: "API-connected Dashboard",
    topbar_live: "API Live",
    // Sidebar
    sidebar_phase: "Phase 27",
    sidebar_desc: "Dashboard, API, Scheduler, Templates, Settings, Admin & Deploy ready.",
    sidebar_build_label: "Production MVP",
    // Common
    common_refresh: "Refresh",
    common_save: "Save",
    common_cancel: "Cancel",
    common_delete: "Delete",
    common_confirm: "Confirm",
    common_loading: "Loading...",
    common_error: "Error occurred",
    common_success: "Success",
  },
} as const;

export type TranslationKey = keyof typeof translations.th;
