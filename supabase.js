// ТВОИ КЛЮЧИ
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iwiwcm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk'

// Проверка, не инициализирован ли уже Supabase
if (typeof window.supabase !== 'undefined') {
    console.warn('⚠️ Supabase уже был инициализирован ранее');
    window.supabaseClient = window.supabase;
} else {
    try {
        // Инициализация Supabase - ИСПРАВЛЕННАЯ СТРОКА
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        // Сохраняем в глобальном объекте window
        window.supabase = supabase;
        window.supabaseClient = supabase;

        console.log('✅ Supabase подключен');
    } catch (error) {
        console.error('❌ Ошибка подключения к Supabase:', error);
    }
}

// Простая функция уведомления
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(type + ':', message);
        return;
    }
    
    const text = document.getElementById('notification-text');
    if (!text) return;
    
    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

// Простая функция загрузчика
function showLoader(text = 'Загрузка...') {
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    if (loader) {
        if (loaderText) loaderText.textContent = text;
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
}

// Экспортируем функции
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;