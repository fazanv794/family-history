// supabase.js

// Ключи (уже рабочие)
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk';

// Проверяем, не инициализирован ли уже
if (window.supabaseClient) {
    console.warn('⚠️ Supabase уже инициализирован');
} else {
    try {
        // Создаем клиент
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        
        // Сохраняем в глобальной области видимости
        window.supabase = supabaseClient;
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации Supabase:', error);
    }
}

// Вспомогательные функции
if (!window.showLoader) {
    window.showLoader = function(text = 'Загрузка...') {
        console.log('Loader show:', text);
        // Добавьте здесь код для показа лоадера
    };
    
    window.hideLoader = function() {
        console.log('Loader hide');
        // Добавьте здесь код для скрытия лоадера
    };
}

if (!window.showNotification) {
    window.showNotification = function(message, type = 'info') {
        console.log(`Notification [${type}]:`, message);
        // Добавьте здесь код для показа уведомлений
    };
}