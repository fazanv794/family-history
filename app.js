// app.js - базовая версия

// Объявляем переменные
let currentUser = null;

// Основные функции
async function checkAuthStatus() {
    try {
        console.log('Проверяем авторизацию...');
        
        if (!window.supabase) {
            throw new Error('Supabase не инициализирован');
        }
        
        const { data, error } = await window.supabase.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (data.session) {
            currentUser = data.session.user;
            console.log('✅ Пользователь авторизован:', currentUser.email);
            // Здесь можно обновить UI
        } else {
            console.log('ℹ️ Пользователь не авторизован');
            currentUser = null;
        }
        
        return currentUser;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return null;
    }
}

// Инициализация приложения
async function initApp() {
    console.log('🚀 Приложение запускается...');
    
    // Проверяем Supabase
    if (!window.supabase) {
        console.error('Supabase не доступен');
        return;
    }
    
    // Проверяем авторизацию
    await checkAuthStatus();
    
    // Настройка обработчиков событий
    console.log('⚙️ Настройка обработчиков...');
    setupEventHandlers();
    
    console.log('✅ Инициализация завершена');
}

// Настройка обработчиков событий
function setupEventHandlers() {
    console.log('Настраиваем обработчики...');
    
    // Пример: кнопка входа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Кнопка входа нажата');
            // Здесь будет логика входа
        });
    }
    
    // Пример: кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            console.log('Кнопка выхода нажата');
            if (window.supabase) {
                await window.supabase.auth.signOut();
                currentUser = null;
                console.log('✅ Выход выполнен');
            }
        });
    }
    
    console.log('✅ Все обработчики настроены');
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    initApp();
});

// Экспортируем для отладки
window.currentUser = currentUser;
window.checkAuthStatus = checkAuthStatus;
window.initApp = initApp;