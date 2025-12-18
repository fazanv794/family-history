// supabase.js - Инициализация Supabase

console.log('📦 Загружаем Supabase...');

// Твои рабочие ключи
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk';

// Проверяем, не инициализирован ли уже
if (window.supabaseClient) {
    console.warn('⚠️ Supabase уже был инициализирован ранее');
} else {
    try {
        // Проверяем доступность библиотеки
        if (typeof supabase === 'undefined') {
            throw new Error('Библиотека Supabase не загружена. Проверьте подключение в HTML.');
        }
        
        // Создаем клиент с настройками
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: localStorage
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        });
        
        // Сохраняем глобально
        window.supabase = supabaseClient;
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase успешно инициализирован');
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации Supabase:', error);
        
        // Создаем заглушку для предотвращения ошибок
        window.supabase = {
            auth: {
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                signInWithPassword: () => Promise.resolve({ error: new Error('Supabase не инициализирован') }),
                signUp: () => Promise.resolve({ error: new Error('Supabase не инициализирован') }),
                signOut: () => Promise.resolve({ error: new Error('Supabase не инициализирован') }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
            },
            from: () => ({
                select: () => ({
                    eq: () => Promise.resolve({ data: [], error: new Error('Supabase не инициализирован') }),
                    order: () => Promise.resolve({ data: [], error: new Error('Supabase не инициализирован') })
                }),
                insert: () => Promise.resolve({ error: new Error('Supabase не инициализирован') }),
                delete: () => Promise.resolve({ error: new Error('Supabase не инициализирован') })
            })
        };
    }
}

// Вспомогательные функции
(function() {
    // Функция лоадера
    window.showLoader = function(text = 'Загрузка...') {
        const loader = document.getElementById('loader');
        const loaderText = document.getElementById('loader-text');
        
        if (loader) {
            if (loaderText) loaderText.textContent = text;
            loader.classList.remove('hidden');
        }
    };
    
    window.hideLoader = function() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    };
    
    // Функция уведомлений
    window.showNotification = function(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const notificationIcon = document.getElementById('notification-icon');
        
        if (!notification || !notificationText || !notificationIcon) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        
        // Устанавливаем иконку в зависимости от типа
        notificationIcon.className = 'notification-icon fas ' + (
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' :
            'fa-info-circle'
        );
        
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        // Автоматическое скрытие через 4 секунды
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 4000);
    };
    
    window.hideNotification = function() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    };
    
    // Функции модальных окон
    window.showModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };
    
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    };
    
    window.closeAllModals = function() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = 'auto';
    };
    
    // Функции для регистрации/входа
    window.showRegisterModal = function() {
        closeModal('loginModal');
        showModal('registerModal');
    };
    
    window.showLoginModal = function() {
        closeModal('registerModal');
        showModal('loginModal');
    };
    
    console.log('✅ Вспомогательные функции загружены');
})();