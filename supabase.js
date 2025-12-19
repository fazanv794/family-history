// ТВОИ КЛЮЧИ - ЗАМЕНИ НА НОВЫЕ ИЗ SUPABASE DASHBOARD
const SUPABASE_URL = 'https://szwsvtxkhlacrarplgtn.supabase.co'; // FIX: Замени на новый URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3N2dHhraGxhY3JhcnBsZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzA1NjAsImV4cCI6MjA4MTcwNjU2MH0.dcRnrqlA4Iz1RthtFT7wL_KGorGz4lHnMMsWCP8i-ns'; // FIX: Замени на новый anon key

// Инициализация Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); // FIX: Добавил инициализацию

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

// Экспортируем
window.supabaseClient = supabase;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;

console.log('✅ Supabase подключен');