// app.js
let currentUser = null;

// Проверка авторизации
async function checkAuthStatus() {
    try {
        showLoader('Проверка авторизации...');
        
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
            updateUIForLoggedInUser();
        } else {
            currentUser = null;
            console.log('ℹ️ Пользователь не авторизован');
            updateUIForLoggedOutUser();
        }
        
        return currentUser;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        showNotification('Ошибка проверки авторизации', 'error');
        return null;
    } finally {
        hideLoader();
    }
}

// Функции для обновления UI
function updateUIForLoggedInUser() {
    // Скрываем кнопку входа, показываем кнопку выхода и т.д.
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmail = document.getElementById('userEmail');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userEmail && currentUser) {
        userEmail.textContent = currentUser.email;
    }
}

function updateUIForLoggedOutUser() {
    // Показываем кнопку входа, скрываем кнопку выхода
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmail = document.getElementById('userEmail');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userEmail) userEmail.textContent = '';
}

// Обработчик выхода
async function handleLogout() {
    try {
        showLoader('Выход...');
        
        if (!window.supabase) {
            throw new Error('Supabase не инициализирован');
        }
        
        const { error } = await window.supabase.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        currentUser = null;
        showNotification('Выход выполнен успешно', 'success');
        updateUIForLoggedOutUser();
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showNotification('Ошибка при выходе', 'error');
    } finally {
        hideLoader();
    }
}

// Обработчик входа
async function handleLogin(email, password) {
    try {
        showLoader('Вход...');
        
        if (!window.supabase) {
            throw new Error('Supabase не инициализирован');
        }
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        currentUser = data.user;
        showNotification('Вход выполнен успешно', 'success');
        updateUIForLoggedInUser();
        
        return data;
    } catch (error) {
        console.error('Ошибка входа:', error);
        showNotification('Ошибка входа: ' + error.message, 'error');
        return null;
    } finally {
        hideLoader();
    }
}

// Настройка обработчиков событий
function setupEventHandlers() {
    console.log('⚙️ Настройка обработчиков...');
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Кнопка входа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // Откройте модальное окно входа или используйте форму
            const email = prompt('Введите email:');
            const password = prompt('Введите пароль:');
            if (email && password) {
                handleLogin(email, password);
            }
        });
    }
    
    // Форма входа (если есть)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = this.querySelector('[name="email"]').value;
            const password = this.querySelector('[name="password"]').value;
            await handleLogin(email, password);
        });
    }
    
    console.log('✅ Все обработчики настроены');
}

// Инициализация приложения
async function initApp() {
    console.log('🚀 Приложение запускается...');
    
    // Проверяем инициализацию Supabase
    if (!window.supabase) {
        console.error('❌ Supabase не инициализирован');
        showNotification('Ошибка инициализации базы данных', 'error');
        return;
    }
    
    console.log('✅ Supabase доступен');
    
    // Проверяем авторизацию
    await checkAuthStatus();
    
    // Настраиваем обработчики
    setupEventHandlers();
    
    console.log('✅ Инициализация завершена');
}

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    
    // Даем время на загрузку supabase.js
    setTimeout(() => {
        initApp();
    }, 100);
});

// Экспортируем для отладки
window.currentUser = currentUser;
window.checkAuthStatus = checkAuthStatus;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;