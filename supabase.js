// supabase.js - очищенная версия

// Проверяем, не загружен ли уже Supabase
if (typeof createClient === 'undefined') {
    console.error('❌ Библиотека Supabase не загружена! Проверьте подключение в HTML');
} else if (typeof window.supabase !== 'undefined') {
    console.log('ℹ️ Supabase уже инициализирован, используем существующий');
} else {
    // Ключи из твоего проекта
    const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk';
    
    try {
        // Инициализация
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
        // Делаем доступным глобально
        window.supabase = supabase;
        console.log('✅ Supabase инициализирован успешно');
    } catch (error) {
        console.error('❌ Ошибка инициализации Supabase:', error);
    }
}

// Функции уведомлений (опционально)
if (!window.showNotification) {
    window.showNotification = function(message, type = 'info') {
        console.log(`${type}: ${message}`);
        alert(message); // временное решение
    };
}

if (!window.showLoader) {
    window.showLoader = function() {
        console.log('showLoader called');
    };
    window.hideLoader = function() {
        console.log('hideLoader called');
    };
}