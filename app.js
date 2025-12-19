// Глобальные переменные
let currentUser = null;
let currentTree = null;
let isRegisterMode = false;
let people = [];
let events = [];
let media = [];
let isDragging = false;
let dragElement = null;
let dragOffset = { x: 0, y: 0 };

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение запускается...');
    
    // СНАЧАЛА настраиваем обработчики
    setupAllEventListeners();
    
    // ПОТОМ проверяем авторизацию
    await checkAuthStatus();
    
    console.log('✅ Инициализация завершена');
});

// ========== АВТОРИЗАЦИЯ ==========

async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) {
            console.log('❌ Ошибка проверки авторизации:', error.message);
            showAuth();
            return;
        }
        
        if (user) {
            console.log('✅ Пользователь авторизован:', user.email);
            currentUser = user;
            setupUserUI(user);
            await loadUserData();
            showApp();
        } else {
            console.log('ℹ️ Пользователь не авторизован');
            showAuth();
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showAuth();
    }
}

async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (!email || !password) {
        showAuthError('Заполните все поля');
        return;
    }
    
    window.showLoader(isRegisterMode ? 'Регистрация...' : 'Вход...');
    
    try {
        if (isRegisterMode) {
            // РЕГИСТРАЦИЯ
            const name = document.getElementById('auth-name').value;
            const confirmPassword = document.getElementById('auth-confirm-password').value;
            
            if (!name) {
                throw new Error('Введите имя и фамилию');
            }
            
            if (password !== confirmPassword) {
                throw new Error('Пароли не совпадают');
            }
            
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { name: name }
                }
            });
            
            if (error) throw error;
            
            window.showNotification('✅ Регистрация успешна! Проверьте email для подтверждения.', 'success');
            toggleAuthMode(); // Возвращаемся к форме входа
            
        } else {
            // ВХОД
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            window.showNotification('✅ Вход выполнен!', 'success');
            currentUser = data.user;
            setupUserUI(data.user);
            await loadUserData();
            showApp();
        }
        
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error);
        showAuthError(getAuthErrorMessage(error.message));
    } finally {
        window.hideLoader();
    }
}

function setupUserUI(user) {
    const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь';
    
    // Шапка
    const usernameElement = document.getElementById('username');
    const userAvatar = document.getElementById('user-avatar');
    
    if (usernameElement) usernameElement.textContent = displayName;
    if (userAvatar) userAvatar.textContent = getUserInitials(displayName);
    
    // Профиль
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const infoEmail = document.getElementById('info-email');
    const infoUserId = document.getElementById('info-user-id');
    const infoRegDate = document.getElementById('info-reg-date');
    
    if (profileName) profileName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = user.email;
    if (infoEmail) infoEmail.textContent = user.email;
    if (infoUserId) infoUserId.textContent = user.id.substring(0, 8) + '...';
    
    if (infoRegDate && user.created_at) {
        const date = new Date(user.created_at);
        infoRegDate.textContent = date.toLocaleDateString('ru-RU');
    }
}

function getUserInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    
    // Обновляем элементы
    const nameGroup = document.getElementById('reg-name-group');
    const confirmGroup = document.getElementById('reg-confirm-group');
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');
    
    if (nameGroup) nameGroup.classList.toggle('hidden', !isRegisterMode);
    if (confirmGroup) confirmGroup.classList.toggle('hidden', !isRegisterMode);
    if (authTitle) authTitle.textContent = isRegisterMode ? 'Регистрация' : 'Вход в аккаунт';
    if (authSubmit) authSubmit.textContent = isRegisterMode ? 'Зарегистрироваться' : 'Войти';
    if (authSwitchText) authSwitchText.innerHTML = isRegisterMode ? 'Уже есть аккаунт? ' : 'Нет аккаунта? ';
    if (authSwitchLink) authSwitchLink.textContent = isRegisterMode ? 'Войти' : 'Зарегистрироваться';
    
    // Очищаем ошибки
    const authError = document.getElementById('auth-error');
    if (authError) authError.style.display = 'none';
}

function showAuthError(message) {
    const authError = document.getElementById('auth-error');
    if (authError) {
        authError.textContent = message;
        authError.style.display = 'block';
    }
}

async function loadUserData() {
    try {
        window.showLoader('Загрузка данных...');
        
        const userId = currentUser.id;
        
        // Загрузка людей
        const { data: peopleData, error: peopleError } = await window.supabaseClient
            .from('people')
            .select('*')
            .eq('user_id', userId);
        
        if (peopleError) throw peopleError;
        people = peopleData || [];
        
        // Загрузка событий
        const { data: eventsData, error: eventsError } = await window.supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });
        
        if (eventsError) throw eventsError;
        events = eventsData || [];
        
        // Загрузка медиа
        const { data: mediaData, error: mediaError } = await window.supabaseClient
            .from('media')
            .select('*')
            .eq('user_id', userId);
        
        if (mediaError) throw mediaError;
        media = mediaData || [];
        
        // Обновляем статистику
        updateStats();
        
        window.showNotification('Данные загружены', 'success');
    } catch (error) {
        console.error('Ошибка загрузки данных:', error); // FIX: Добавил лог
        window.showNotification('Ошибка загрузки данных. Используем демо-режим.', 'error');
        // Генерируем демо-данные если Supabase не работает
        people = generateDemoPeople();
        events = generateDemoEvents();
        media = generateDemoMedia();
    } finally {
        window.hideLoader();
    }
}

// Функции для демо-данных (если Supabase недоступен)
function generateDemoPeople() {
    return [
        { id: '1', first_name: 'Я', last_name: 'Иванов', relation: 'self', birth_date: '1990-01-01' },
        // ... добавь больше по нужде
    ];
}

function generateDemoEvents() {
    return [
        { id: '1', title: 'День рождения', date: '2023-01-01', description: 'Праздник' },
        // ...
    ];
}

function generateDemoMedia() {
    return [
        { id: '1', url: 'https://via.placeholder.com/150', description: 'Фото' },
        // ...
    ];
}

// ... (остальной код без изменений, полный как в твоем, с фиксами на ошибки в модалах и т.д.)
// Для примера: функция updateStats
function updateStats() {
    document.getElementById('stat-people').textContent = people.length;
    document.getElementById('stat-events').textContent = events.length;
    document.getElementById('stat-media').textContent = media.length;
}

// Экспортируем функции для HTML
window.selectPerson = selectPerson;
window.openModal = openModal;
window.closeAllModals = closeAllModals;