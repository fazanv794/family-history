// notification-settings.js - Отдельный модуль для настроек уведомлений
console.log('🔔 Notification settings загружается...');

// Настройки уведомлений
let notificationSettings = {
    success: true,
    error: true,
    info: true,
    birthday: true,
    anniversary: true,
    event: true,
    invite: true,
    family_join: true,
    media: true,
    tree: true
};

// Загрузка настроек из Supabase
async function loadNotificationSettings() {
    try {
        if (!window.currentUser) {
            loadFromLocalStorage();
            return;
        }

        if (window.supabaseClient && !window.currentUser.id.startsWith('demo-')) {
            const { data, error } = await window.supabaseClient
                .from('notification_settings')
                .select('*')
                .eq('user_id', window.currentUser.id)
                .maybeSingle();

            if (!error && data) {
                notificationSettings = { ...notificationSettings, ...data };
                console.log('✅ Настройки загружены из Supabase');
            }
        }

        // Всегда сохраняем в localStorage
        saveToLocalStorage();
        applyToUI();

    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        loadFromLocalStorage();
    }
}

// Загрузка из localStorage
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('notification_settings');
        if (saved) {
            notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
            console.log('✅ Настройки загружены из localStorage');
        }
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
    }
    applyToUI();
}

// Сохранение в localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
    }
}

// Применение настроек к интерфейсу
function applyToUI() {
    document.querySelectorAll('.notification-toggle').forEach(toggle => {
        const type = toggle.dataset.type;
        if (type && notificationSettings[type] !== undefined) {
            toggle.checked = notificationSettings[type];
        }
    });
}

// Сохранение настроек
async function saveNotificationSettings() {
    // Собираем данные с переключателей
    document.querySelectorAll('.notification-toggle').forEach(toggle => {
        const type = toggle.dataset.type;
        if (type) {
            notificationSettings[type] = toggle.checked;
        }
    });

    // Сохраняем в localStorage
    saveToLocalStorage();

    // Сохраняем в Supabase если есть пользователь
    if (window.currentUser && window.supabaseClient && !window.currentUser.id.startsWith('demo-')) {
        try {
            const settingsForDb = {
                user_id: window.currentUser.id,
                ...notificationSettings,
                updated_at: new Date().toISOString()
            };

            const { error } = await window.supabaseClient
                .from('notification_settings')
                .upsert(settingsForDb, { onConflict: 'user_id' });

            if (error) throw error;
            console.log('✅ Настройки сохранены в Supabase');
        } catch (error) {
            console.error('Ошибка сохранения в Supabase:', error);
        }
    }

    // Обновляем глобальные настройки
    window.notificationSettings = notificationSettings;
    
    window.showNotification('✅ Настройки уведомлений сохранены', 'success');
    return true;
}

// Сброс настроек
function resetNotificationSettings() {
    notificationSettings = {
        success: true,
        error: true,
        info: true,
        birthday: true,
        anniversary: true,
        event: true,
        invite: true,
        family_join: true,
        media: true,
        tree: true
    };

    applyToUI();
    saveToLocalStorage();
    window.notificationSettings = notificationSettings;
    
    window.showNotification('✅ Настройки сброшены', 'success');
}

// Открытие модального окна
function openNotificationModal() {
    applyToUI();
    window.showModal('notifications-modal');
}

// Сохраняем оригинальную функцию уведомлений
const originalShowNotification = window.showNotification;

// Переопределяем функцию уведомлений
window.showNotification = function(message, type = 'info') {
    if (window.notificationSettings) {
        if (type === 'success' && !window.notificationSettings.success) return;
        if (type === 'error' && !window.notificationSettings.error) return;
        if (type === 'info' && !window.notificationSettings.info) return;
    }
    if (originalShowNotification) {
        originalShowNotification(message, type);
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем настройки
    loadNotificationSettings();
    window.notificationSettings = notificationSettings;

    // Настраиваем кнопку в профиле
    const notifBtn = document.getElementById('notifications-settings-btn');
    if (notifBtn) {
        notifBtn.onclick = function(e) {
            e.preventDefault();
            openNotificationModal();
            return false;
        };
    }

    // Кнопка сохранения
    const saveBtn = document.getElementById('save-notification-settings');
    if (saveBtn) {
        saveBtn.onclick = async function(e) {
            e.preventDefault();
            await saveNotificationSettings();
            window.closeAllModals();
            return false;
        };
    }

    // Кнопка сброса
    const resetBtn = document.getElementById('reset-notifications');
    if (resetBtn) {
        resetBtn.onclick = function(e) {
            e.preventDefault();
            resetNotificationSettings();
            return false;
        };
    }
});

// Экспортируем функции
window.loadNotificationSettings = loadNotificationSettings;
window.saveNotificationSettings = saveNotificationSettings;
window.resetNotificationSettings = resetNotificationSettings;
window.openNotificationModal = openNotificationModal;