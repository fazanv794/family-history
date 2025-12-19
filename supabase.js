// supabase.js - ИСПРАВЛЕННАЯ версия

// Ключи из вашего проекта
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk';

// Ожидаем загрузки библиотеки Supabase
document.addEventListener('DOMContentLoaded', function() {
    // Ждем немного, чтобы библиотека точно загрузилась
    setTimeout(() => {
        if (typeof supabase === 'undefined') {
            console.error('❌ Библиотека Supabase не загружена!');
            alert('Библиотека Supabase не загрузилась. Проверьте интернет соединение.');
            return;
        }
        
        try {
            console.log('✅ Библиотека Supabase загружена, создаем клиент...');
            
            // Создаем клиент с правильными параметрами
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
            
            // Делаем глобально доступным
            window.supabaseClient = supabaseClient;
            window.supabase = supabaseClient;
            
            console.log('✅ Supabase клиент создан и доступен как window.supabaseClient');
            
            // Проверяем доступность
            if (window.supabaseClient && window.supabaseClient.auth) {
                console.log('✅ Supabase.auth доступен');
            } else {
                console.error('❌ Supabase.auth не доступен!');
            }
            
        } catch (error) {
            console.error('❌ Ошибка создания Supabase клиента:', error);
        }
    }, 500);
});

// Вспомогательные функции
(function() {
    // Лоадер
    window.showLoader = function(text = 'Загрузка...') {
        const loader = document.getElementById('loader');
        const loaderText = document.getElementById('loader-text');
        
        if (loader && loaderText) {
            loaderText.textContent = text;
            loader.classList.remove('hidden');
        }
    };
    
    window.hideLoader = function() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    };
    
    // Уведомления
    window.showNotification = function(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.remove('hidden');
            
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 4000);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };
    
    console.log('✅ Supabase.js загружен');
})();