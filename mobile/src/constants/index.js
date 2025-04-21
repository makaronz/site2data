// Storage keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@film_assistant_user_token',
  USER_DATA: '@film_assistant_user_data',
  NAVIGATION_STATE: '@film_assistant_navigation_state',
  SELECTED_PRODUCTION: '@film_assistant_selected_production',
  THEME_PREFERENCE: '@film_assistant_theme_preference',
  NOTIFICATION_SETTINGS: '@film_assistant_notification_settings',
  OFFLINE_DATA: '@film_assistant_offline_data',
  CACHED_DOCUMENTS: '@film_assistant_cached_documents',
  RECENT_SEARCHES: '@film_assistant_recent_searches'
};

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:5000/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email'
  },
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    REGISTER_DEVICE: '/users/devices'
  },
  SCHEDULES: {
    LIST: '/schedules',
    DETAIL: (id) => `/schedules/${id}`,
    CREATE: '/schedules',
    UPDATE: (id) => `/schedules/${id}`,
    DELETE: (id) => `/schedules/${id}`,
    PUBLISH: (id) => `/schedules/${id}/publish`,
    CONFLICTS: '/schedules/conflicts',
    DAILY: '/schedules/daily',
    WEEKLY: '/schedules/weekly'
  },
  DOCUMENTS: {
    LIST: '/documents',
    DETAIL: (id) => `/documents/${id}`,
    CREATE: '/documents',
    UPDATE: (id) => `/documents/${id}`,
    DELETE: (id) => `/documents/${id}`,
    SEARCH: '/documents/search',
    CATEGORIES: '/documents/categories'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings'
  },
  EQUIPMENT: {
    LIST: '/equipment',
    DETAIL: (id) => `/equipment/${id}`,
    REQUEST: '/equipment/requests',
    REQUEST_DETAIL: (id) => `/equipment/requests/${id}`,
    APPROVE_REQUEST: (id) => `/equipment/requests/${id}/approve`,
    REJECT_REQUEST: (id) => `/equipment/requests/${id}/reject`
  },
  CONTINUITY: {
    LIST: '/continuity',
    DETAIL: (id) => `/continuity/${id}`,
    CREATE: '/continuity',
    UPDATE: (id) => `/continuity/${id}`,
    DELETE: (id) => `/continuity/${id}`,
    SEARCH: '/continuity/search',
    ISSUES: '/continuity/issues',
    RESOLVE_ISSUE: (id) => `/continuity/issues/${id}/resolve`
  },
  WEATHER: '/weather',
  PRODUCTIONS: {
    LIST: '/productions',
    DETAIL: (id) => `/productions/${id}`,
    JOIN: (id) => `/productions/${id}/join`
  }
};

// Screen names
export const SCREENS = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main tabs
  HOME: 'Home',
  SCHEDULES: 'Schedules',
  DOCUMENTS: 'Documents',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
  
  // Schedule screens
  SCHEDULE_DETAIL: 'ScheduleDetail',
  SCHEDULE_CREATE: 'ScheduleCreate',
  SCHEDULE_EDIT: 'ScheduleEdit',
  CONFLICTS: 'ScheduleConflicts',
  CALL_SHEET: 'CallSheet',
  
  // Document screens
  DOCUMENT_DETAIL: 'DocumentDetail',
  DOCUMENT_UPLOAD: 'DocumentUpload',
  DOCUMENT_VIEWER: 'DocumentViewer',
  
  // Continuity screens
  CONTINUITY_LIST: 'ContinuityList',
  CONTINUITY_DETAIL: 'ContinuityDetail',
  CONTINUITY_EDITOR: 'ContinuityEditor',
  CONTINUITY_CAMERA: 'ContinuityCamera',
  CONTINUITY_ISSUES: 'ContinuityIssues',
  
  // Equipment screens
  EQUIPMENT_LIST: 'EquipmentList',
  EQUIPMENT_DETAIL: 'EquipmentDetail',
  EQUIPMENT_REQUEST: 'EquipmentRequest',
  
  // Production screens
  PRODUCTION_LIST: 'ProductionList',
  PRODUCTION_DETAIL: 'ProductionDetail',
  PRODUCTION_JOIN: 'ProductionJoin',
  
  // Settings
  SETTINGS: 'Settings',
  NOTIFICATION_SETTINGS: 'NotificationSettings',
  THEME_SETTINGS: 'ThemeSettings',
  OFFLINE_SETTINGS: 'OfflineSettings',
  ABOUT: 'About'
};

// Notification types
export const NOTIFICATION_TYPES = {
  SCHEDULE_UPDATED: 'schedule_updated',
  SCHEDULE_PUBLISHED: 'schedule_published',
  DOCUMENT_ADDED: 'document_added',
  DOCUMENT_UPDATED: 'document_updated',
  EQUIPMENT_REQUEST_STATUS: 'equipment_request_status',
  CONTINUITY_ISSUE: 'continuity_issue',
  WEATHER_ALERT: 'weather_alert',
  GENERAL: 'general'
};

// Offline sync statuses
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed'
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check the form for errors.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful! Please check your email to verify your account.',
  PASSWORD_RESET_EMAIL: 'Password reset email sent. Please check your inbox.',
  PASSWORD_RESET_SUCCESS: 'Password reset successful. You can now log in with your new password.',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully.',
  DOCUMENT_UPLOAD_SUCCESS: 'Document uploaded successfully.',
  EQUIPMENT_REQUEST_SUCCESS: 'Equipment request submitted successfully.',
  SCHEDULE_PUBLISH_SUCCESS: 'Schedule published successfully.'
};

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  TOAST_DURATION: 3000, // 3 seconds
  DEBOUNCE: 500, // 500 milliseconds
  SPLASH_SCREEN: 2000, // 2 seconds
  LOCATION_REFRESH: 60000 * 15 // 15 minutes
}; 