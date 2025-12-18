// app.js - Основная логика приложения

// Глобальные переменные
let currentUser = null;
let userData = [];
let authSubscription = null;

// Основные функции
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
            await loadUserData();
            setupAuthListener();
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

// Загрузка данных пользователя
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        showLoader('Загрузка данных...');
        
        // Пример: Загрузка данных из таблицы 'user_data'
        const { data, error } = await window.supabase
            .from('user_data')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        userData = data || [];
        console.log('✅ Данные загружены:', userData.length, 'записей');
        renderDataTable();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
    } finally {
        hideLoader();
    }
}

// Отрисовка таблицы данных
function renderDataTable() {
    const tableBody = document.getElementById('dataTableBody');
    if (!tableBody) return;
    
    if (userData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    <i class="fas fa-database"></i>
                    <p>Данные отсутствуют</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = userData.map(item => `
        <tr>
            <td>${item.id || '-'}</td>
            <td>${item.title || 'Без названия'}</td>
            <td>${item.description || 'Нет описания'}</td>
            <td>${new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
            <td>
                <button onclick="editData('${item.id}')" class="btn btn-secondary btn-sm">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteData('${item.id}')" class="btn btn-danger btn-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Обновление UI для авторизованного пользователя
function updateUIForLoggedInUser() {
    // Переключаем видимость элементов
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('userProfile').classList.remove('hidden');
    document.getElementById('userContent').classList.remove('hidden');
    document.getElementById('welcomeSection').classList.add('hidden');
    
    // Обновляем информацию о пользователе
    document.getElementById('userName').textContent = currentUser.email.split('@')[0];
    document.getElementById('displayEmail').textContent = currentUser.email;
    document.getElementById('displayId').textContent = currentUser.id.substring(0, 8) + '...';
    document.getElementById('displayCreated').textContent = new Date(currentUser.created_at).toLocaleDateString('ru-RU');
    
    // Обновляем аватар
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.email)}&background=random`;
    }
}

// Обновление UI для неавторизованного пользователя
function updateUIForLoggedOutUser() {
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('userProfile').classList.add('hidden');
    document.getElementById('userContent').classList.add('hidden');
    document.getElementById('welcomeSection').classList.remove('hidden');
    
    // Очищаем данные
    userData = [];
    renderDataTable();
}

// Обработчик входа
async function handleLogin(email, password) {
    try {
        showLoader('Вход в систему...');
        
        if (!window.supabase) {
            throw new Error('Supabase не инициализирован');
        }
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim()
        });
        
        if (error) {
            throw error;
        }
        
        currentUser = data.user;
        showNotification('Вход выполнен успешно!', 'success');
        closeAllModals();
        updateUIForLoggedInUser();
        await loadUserData();
        
        return data;
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        
        let errorMessage = 'Ошибка входа';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Неверный email или пароль';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Подтвердите email перед входом';
        }
        
        showNotification(errorMessage, 'error');
        return null;
        
    } finally {
        hideLoader();
    }
}

// Обработчик регистрации
async function handleRegister(name, email, password) {
    try {
        showLoader('Регистрация...');
        
        if (!window.supabase) {
            throw new Error('Supabase не инициализирован');
        }
        
        const { data, error } = await window.supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
                data: {
                    name: name.trim(),
                    created_at: new Date().toISOString()
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        showNotification('Регистрация успешна! Проверьте вашу почту для подтверждения.', 'success');
        closeAllModals();
        
        // Очищаем форму
        document.getElementById('registerForm').reset();
        
        return data;
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        
        let errorMessage = 'Ошибка регистрации';
        if (error.message.includes('already registered')) {
            errorMessage = 'Пользователь с таким email уже зарегистрирован';
        } else if (error.message.includes('weak_password')) {
            errorMessage = 'Пароль слишком слабый. Используйте не менее 6 символов';
        }
        
        showNotification(errorMessage, 'error');
        return null;
        
    } finally {
        hideLoader();
    }
}

// Обработчик выхода
async function handleLogout() {
    try {
        showLoader('Выход из системы...');
        
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
        
        // Отписываемся от слушателя
        if (authSubscription) {
            authSubscription.unsubscribe();
            authSubscription = null;
        }
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showNotification('Ошибка при выходе', 'error');
    } finally {
        hideLoader();
    }
}

// Добавление данных
async function addData(title, description) {
    if (!currentUser) {
        showNotification('Сначала войдите в систему', 'warning');
        return;
    }
    
    try {
        showLoader('Добавление данных...');
        
        const { data, error } = await window.supabase
            .from('user_data')
            .insert([
                {
                    user_id: currentUser.id,
                    title: title,
                    description: description,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) {
            throw error;
        }
        
        showNotification('Данные успешно добавлены', 'success');
        await loadUserData(); // Перезагружаем данные
        
        return data;
        
    } catch (error) {
        console.error('Ошибка добавления данных:', error);
        showNotification('Ошибка добавления данных', 'error');
        return null;
    } finally {
        hideLoader();
    }
}

// Удаление данных
async function deleteData(id) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }
    
    try {
        showLoader('Удаление данных...');
        
        const { error } = await window.supabase
            .from('user_data')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);
        
        if (error) {
            throw error;
        }
        
        showNotification('Данные успешно удалены', 'success');
        await loadUserData(); // Перезагружаем данные
        
    } catch (error) {
        console.error('Ошибка удаления данных:', error);
        showNotification('Ошибка удаления данных', 'error');
    } finally {
        hideLoader();
    }
}

// Слушатель изменения статуса авторизации
function setupAuthListener() {
    if (authSubscription || !window.supabase) return;
    
    authSubscription = window.supabase.auth.onAuthStateChange(
        (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN') {
                currentUser = session.user;
                updateUIForLoggedInUser();
                loadUserData();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                updateUIForLoggedOutUser();
            } else if (event === 'USER_UPDATED') {
                currentUser = session.user;
                updateUIForLoggedInUser();
            }
        }
    );
}

// Настройка обработчиков событий
function setupEventHandlers() {
    console.log('⚙️ Настройка обработчиков...');
    
    // Кнопка входа
    document.getElementById('loginBtn').addEventListener('click', () => {
        showModal('loginModal');
    });
    
    // Кнопка выхода
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Форма входа
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await handleLogin(email, password);
    });
    
    // Форма регистрации
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        await handleRegister(name, email, password);
    });
    
    // Кнопка обновления
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await checkAuthStatus();
        showNotification('Данные обновлены', 'success');
    });
    
    // Кнопка добавления данных (пример)
    document.getElementById('addDataBtn').addEventListener('click', () => {
        const title = prompt('Введите название:');
        const description = prompt('Введите описание:');
        
        if (title && description) {
            addData(title, description);
        }
    });
    
    // Навигация
    document.getElementById('navHome').addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Главная страница', 'info');
    });
    
    document.getElementById('navProfile').addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Страница профиля', 'info');
    });
    
    document.getElementById('navData').addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Страница данных', 'info');
    });
    
    document.getElementById('navSettings').addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Настройки', 'info');
    });
    
    // Закрытие модальных окон при клике вне их
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    console.log('✅ Все обработчики настроены');
}

// Функции для кнопок в таблице (должны быть глобальными)
window.editData = function(id) {
    const item = userData.find(d => d.id === id);
    if (item) {
        const newTitle = prompt('Новое название:', item.title);
        const newDesc = prompt('Новое описание:', item.description);
        
        if (newTitle !== null && newDesc !== null) {
            // Здесь можно добавить функцию обновления данных
            showNotification('Функция редактирования в разработке', 'info');
        }
    }
};

window.deleteData = deleteData;

// Инициализация приложения
async function initApp() {
    console.log('🚀 Приложение запускается...');
    
    // Проверяем инициализацию Supabase
    if (!window.supabase) {
        console.error('❌ Supabase не инициализирован');
        showNotification('Ошибка инициализации базы данных. Пожалуйста, обновите страницу.', 'error');
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

// Экспортируем функции для глобального доступа
window.currentUser = currentUser;
window.checkAuthStatus = checkAuthStatus;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.addData = addData;
window.deleteData = deleteData;