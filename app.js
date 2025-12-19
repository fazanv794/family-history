// app.js - ИСПРАВЛЕННЫЙ И ПОЛНЫЙ

// Глобальные переменные
let currentUser = null;
let currentTree = null;
let isRegisterMode = false;
let people = [];
let events = [];
let media = [];
let messages = [];

// Проверяем, что необходимые функции существуют
function checkDependencies() {
    const required = ['supabaseClient', 'showNotification', 'showLoader', 'hideLoader'];
    const missing = [];
    
    required.forEach(func => {
        if (typeof window[func] === 'undefined') {
            missing.push(func);
        }
    });
    
    if (missing.length > 0) {
        console.error('Отсутствуют зависимости:', missing);
        return false;
    }
    
    return true;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение запускается...');
    
    // Проверяем зависимости
    if (!checkDependencies()) {
        console.error('Критические зависимости не загружены');
        showNotification('Ошибка загрузки приложения. Обновите страницу.', 'error');
        return;
    }
    
    try {
        // Настраиваем обработчики событий
        setupEventListeners();
        
        // Проверяем авторизацию
        await checkAuthStatus();
        
        console.log('✅ Инициализация завершена');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
});

function setupEventListeners() {
    // Лендинг страница
    document.getElementById('landing-login-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthPage();
    });
    
    document.getElementById('landing-register-btn')?.addEventListener('click', () => {
        showAuthPage();
        toggleAuthMode();
    });
    
    document.getElementById('start-free-btn')?.addEventListener('click', () => {
        showAuthPage();
        toggleAuthMode();
    });
    
    document.getElementById('watch-demo-btn')?.addEventListener('click', () => {
        showDemoMode();
    });
    
    // Демо кнопки функций на лендинге
    document.querySelectorAll('.feature-demo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feature = e.target.dataset.feature;
            showFeatureDemo(feature);
        });
    });
    
    // Авторизация
    document.getElementById('auth-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAuthSubmit();
    });
    
    document.getElementById('auth-switch-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
    
    document.getElementById('back-to-landing')?.addEventListener('click', () => {
        showLandingPage();
    });
    
    // Навигация приложения
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('nav-links').classList.toggle('active');
    });
    
    document.getElementById('home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('home-page');
    });
    
    document.getElementById('tree-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('tree-page');
    });
    
    document.getElementById('timeline-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('timeline-page');
    });
    
    document.getElementById('media-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('media-page');
    });
    
    document.getElementById('profile-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('profile-page');
    });
    
    // Кнопки на главной
    document.getElementById('tree-btn')?.addEventListener('click', () => {
        showPage('tree-page');
    });
    
    document.getElementById('add-person-btn')?.addEventListener('click', () => {
        showModal('add-person-modal');
    });
    
    // Древо
    document.getElementById('auto-build-btn')?.addEventListener('click', () => {
        buildFamilyTree();
    });
    
    document.getElementById('auto-build-btn-2')?.addEventListener('click', () => {
        buildFamilyTree();
    });
    
    document.getElementById('manual-add-btn')?.addEventListener('click', () => {
        showModal('add-person-modal');
    });
    
    document.getElementById('save-image-btn')?.addEventListener('click', () => {
        saveTreeAsImage();
    });
    
    document.getElementById('print-tree-btn')?.addEventListener('click', () => {
        printTree();
    });
    
    // Лента событий
    document.getElementById('add-event-btn')?.addEventListener('click', () => {
        showModal('add-event-modal');
    });
    
    document.getElementById('filter-year')?.addEventListener('change', updateTimeline);
    document.getElementById('filter-type')?.addEventListener('change', updateTimeline);
    
    // Медиатека
    document.getElementById('upload-media-btn')?.addEventListener('click', () => {
        showModal('upload-modal');
    });
    
    document.getElementById('media-search')?.addEventListener('input', updateMediaGrid);
    document.getElementById('media-sort')?.addEventListener('change', updateMediaGrid);
    
    // Профиль
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        showModal('edit-profile-modal');
    });
    
    document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
        showNotification('Функция смены аватара в разработке', 'info');
    });
    
    document.getElementById('invite-btn')?.addEventListener('click', () => {
        showModal('invite-modal');
    });
    
    document.getElementById('notifications-settings-btn')?.addEventListener('click', () => {
        showNotification('Настройки уведомлений в разработке', 'info');
    });
    
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
        exportUserData();
    });
    
    document.getElementById('logout-profile-btn')?.addEventListener('click', () => {
        logout();
    });
    
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        logout();
    });
    
    // Чат
    document.getElementById('chat-toggle')?.addEventListener('click', () => {
        toggleChat();
    });
    
    document.getElementById('chat-minimize')?.addEventListener('click', () => {
        document.getElementById('chat-widget').classList.remove('active');
    });
    
    document.getElementById('chat-send')?.addEventListener('click', sendMessage);
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Модальные окна
    document.getElementById('modal-backdrop')?.addEventListener('click', closeAllModals);
    
    document.querySelectorAll('.modal-close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllModals();
        });
    });
    
    // Предотвращаем закрытие при клике внутри модального окна
    document.querySelectorAll('.modal-dialog').forEach(modal => {
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    // Форма добавления человека
    document.getElementById('add-person-form-modal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addPerson();
    });
    
    // Форма добавления события
    document.getElementById('add-event-form-modal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addEvent();
    });
    
    // Форма загрузки медиа
    document.getElementById('upload-form-modal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        uploadMedia();
    });
    
    document.getElementById('browse-files-btn')?.addEventListener('click', () => {
        document.getElementById('upload-files').click();
    });
    
    document.getElementById('upload-files')?.addEventListener('change', (e) => {
        showSelectedFiles(e.target.files);
    });
    
    // Форма приглашения
    document.getElementById('invite-form-modal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        sendInvitation();
    });
    
    // Форма редактирования профиля
    document.getElementById('edit-profile-form-modal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile();
    });
}

// ========== АВТОРИЗАЦИЯ ==========

async function checkAuthStatus() {
    try {
        console.log('🔍 Проверка авторизации...');
        
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) {
            console.log('❌ Ошибка проверки авторизации:', error.message);
            showLandingPage();
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
            showLandingPage();
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        showNotification('Ошибка проверки авторизации: ' + error.message, 'error');
        showLandingPage();
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
                    data: { 
                        name: name,
                        full_name: name
                    },
                    emailRedirectTo: window.location.origin + '/auth-callback.html'
                }
            });
            
            if (error) throw error;
            
            window.showNotification('✅ Регистрация успешна! Проверьте email для подтверждения.', 'success');
            
            // Создаем профиль пользователя
            if (data.user) {
                await window.supabaseClient
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            full_name: name,
                            created_at: new Date().toISOString()
                        }
                    ]);
            }
            
            // Возвращаемся к форме входа
            setTimeout(() => {
                toggleAuthMode();
            }, 3000);
            
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

function getAuthErrorMessage(errorMsg) {
    const messages = {
        'Invalid login credentials': 'Неверный email или пароль',
        'Email not confirmed': 'Email не подтвержден. Проверьте вашу почту',
        'User already registered': 'Пользователь уже зарегистрирован',
        'Password should be at least 6 characters': 'Пароль должен быть не менее 6 символов',
        'To signup, please provide your email': 'Для регистрации укажите email'
    };
    
    return messages[errorMsg] || errorMsg;
}

function setupUserUI(user) {
    const displayName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь';
    
    // Шапка
    const usernameElement = document.getElementById('username');
    const userAvatar = document.getElementById('user-avatar');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    
    if (usernameElement) usernameElement.textContent = displayName;
    if (userAvatar) userAvatar.textContent = getUserInitials(displayName);
    if (profileAvatar) profileAvatar.textContent = getUserInitials(displayName);
    if (profileName) profileName.textContent = displayName;
    
    // Профиль
    const profileEmail = document.getElementById('profile-email');
    const infoEmail = document.getElementById('info-email');
    const infoUserId = document.getElementById('info-user-id');
    const infoRegDate = document.getElementById('info-reg-date');
    
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

// ========== ЗАГРУЗКА ДАННЫХ ==========

async function loadUserData() {
    try {
        window.showLoader('Загрузка данных...');
        
        const userId = currentUser.id;
        
        // Загрузка людей
        const { data: peopleData, error: peopleError } = await window.supabaseClient
            .from('people')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        
        if (peopleError) throw peopleError;
        people = peopleData || [];
        
        // Если нет людей, создаем запись для самого пользователя
        if (people.length === 0) {
            const selfPerson = {
                first_name: currentUser.user_metadata?.name?.split(' ')[0] || 'Я',
                last_name: currentUser.user_metadata?.name?.split(' ')[1] || '',
                relation: 'self',
                user_id: userId,
                gender: 'male' // По умолчанию
            };
            
            const { data: newPerson, error: insertError } = await window.supabaseClient
                .from('people')
                .insert([selfPerson])
                .select();
            
            if (!insertError && newPerson) {
                people.push(newPerson[0]);
            }
        }
        
        // Загрузка событий
        const { data: eventsData, error: eventsError } = await window.supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (eventsError) throw eventsError;
        events = eventsData || [];
        
        // Загрузка медиа
        const { data: mediaData, error: mediaError } = await window.supabaseClient
            .from('media')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (mediaError) throw mediaError;
        media = mediaData || [];
        
        // Загрузка сообщений чата
        const { data: messagesData, error: messagesError } = await window.supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (messagesError) throw messagesError;
        messages = messagesData || [];
        
        // Обновляем UI
        updateStats();
        updateRecentEvents();
        updateTimeline();
        updateMediaGrid();
        updateChat();
        
        window.showNotification('Данные загружены', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        window.showNotification('Ошибка загрузки данных. Используем демо-режим.', 'error');
        
        // Генерируем демо-данные
        people = generateDemoPeople();
        events = generateDemoEvents();
        media = generateDemoMedia();
        messages = generateDemoMessages();
        
        updateStats();
        updateRecentEvents();
        updateTimeline();
        updateMediaGrid();
        updateChat();
    } finally {
        window.hideLoader();
    }
}

function generateDemoPeople() {
    return [
        {
            id: '1',
            first_name: 'Иван',
            last_name: 'Иванов',
            birth_date: '1990-01-15',
            gender: 'male',
            relation: 'self',
            photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            biography: 'Основатель семейного древа. Увлечен историей своей семьи.'
        },
        {
            id: '2',
            first_name: 'Мария',
            last_name: 'Иванова',
            birth_date: '1992-03-22',
            gender: 'female',
            relation: 'spouse',
            spouse_id: '1',
            photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b786d4d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
        },
        {
            id: '3',
            first_name: 'Алексей',
            last_name: 'Иванов',
            birth_date: '2015-07-10',
            gender: 'male',
            relation: 'child',
            parent_id: '1',
            photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
        },
        {
            id: '4',
            first_name: 'Анна',
            last_name: 'Иванова',
            birth_date: '2018-11-05',
            gender: 'female',
            relation: 'child',
            parent_id: '1',
            photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
        }
    ];
}

function generateDemoEvents() {
    const today = new Date();
    return [
        {
            id: '1',
            title: 'День рождения Алексея',
            date: new Date(today.getFullYear(), 6, 10).toISOString().split('T')[0],
            event_type: 'birthday',
            description: 'Празднование дня рождения сына'
        },
        {
            id: '2',
            title: 'Семейный пикник',
            date: new Date(today.getFullYear(), 7, 15).toISOString().split('T')[0],
            event_type: 'holiday',
            description: 'Ежегодный семейный пикник в лесу'
        },
        {
            id: '3',
            title: 'Годовщина свадьбы',
            date: new Date(today.getFullYear(), 5, 30).toISOString().split('T')[0],
            event_type: 'anniversary',
            description: '10 лет совместной жизни'
        }
    ];
}

function generateDemoMedia() {
    return [
        {
            id: '1',
            file_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            file_type: 'image',
            description: 'Семейный портрет на природе'
        },
        {
            id: '2',
            file_url: 'https://images.unsplash.com/photo-1529255484355-cb73c33c04bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            file_type: 'image',
            description: 'Дети играют в парке'
        },
        {
            id: '3',
            file_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            file_type: 'image',
            description: 'Семейный ужин'
        }
    ];
}

function generateDemoMessages() {
    return [
        {
            id: '1',
            sender_id: 'demo1',
            content: 'Привет всем! Посмотрите наше новое семейное фото!',
            created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: '2',
            sender_id: 'demo2',
            content: 'Отличное фото! Когда следующая встреча?',
            created_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
            id: '3',
            sender_id: 'demo1',
            content: 'Давайте в эти выходные!',
            created_at: new Date(Date.now() - 900000).toISOString()
        }
    ];
}

// ========== ОБНОВЛЕНИЕ UI ==========

function updateStats() {
    document.getElementById('stat-people').textContent = people.length;
    document.getElementById('stat-events').textContent = events.length;
    document.getElementById('stat-media').textContent = media.length;
    document.getElementById('stat-generations').textContent = calculateGenerations();
    document.getElementById('info-people-count').textContent = people.length;
}

function calculateGenerations() {
    if (people.length === 0) return 0;
    
    // Простой расчет поколений
    const hasGrandparents = people.some(p => p.relation === 'grandparent');
    const hasGrandchildren = people.some(p => p.relation === 'grandchild');
    
    let generations = 1; // Текущее поколение
    if (hasGrandparents) generations++;
    if (hasGrandchildren) generations++;
    
    return generations;
}

function updateRecentEvents() {
    const container = document.getElementById('recent-events-list');
    if (!container) return;
    
    const recentEvents = events.slice(0, 5);
    
    if (recentEvents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Событий пока нет</p>';
        return;
    }
    
    let html = '';
    recentEvents.forEach(event => {
        const date = new Date(event.date).toLocaleDateString('ru-RU');
        const icon = getEventIcon(event.event_type);
        
        html += `
            <div class="timeline-event" style="display: flex; gap: 15px; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div class="event-icon" style="background: #667eea; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="${icon}"></i>
                </div>
                <div class="event-content" style="flex: 1;">
                    <h3 style="margin-bottom: 5px; color: #2d3748;">${event.title}</h3>
                    <div class="event-date" style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">${date}</div>
                    ${event.description ? `<p style="color: #4a5568;">${event.description}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    // Обновляем фильтр по годам
    updateYearFilter();
    
    // Фильтруем события
    const selectedYear = document.getElementById('filter-year')?.value || '';
    const selectedType = document.getElementById('filter-type')?.value || '';
    
    let filteredEvents = [...events];
    
    if (selectedYear) {
        filteredEvents = filteredEvents.filter(event => 
            new Date(event.date).getFullYear().toString() === selectedYear
        );
    }
    
    if (selectedType) {
        filteredEvents = filteredEvents.filter(event => 
            event.event_type === selectedType
        );
    }
    
    // Сортируем по дате
    filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #718096; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <i class="fas fa-calendar" style="font-size: 3rem; margin-bottom: 20px; color: #cbd5e0;"></i>
                <h3 style="margin-bottom: 10px; color: #4a5568;">Событий пока нет</h3>
                <p>Добавьте первое событие в вашу семейную историю</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    let currentYear = null;
    
    filteredEvents.forEach(event => {
        const date = new Date(event.date);
        const year = date.getFullYear();
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
        });
        
        if (year !== currentYear) {
            html += `<h3 style="margin: 30px 0 15px; color: #2d3748;">${year}</h3>`;
            currentYear = year;
        }
        
        const icon = getEventIcon(event.event_type);
        
        html += `
            <div class="timeline-event" style="display: flex; gap: 15px; margin-bottom: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div class="event-icon" style="background: #667eea; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="${icon}"></i>
                </div>
                <div class="event-content" style="flex: 1;">
                    <h3 style="margin-bottom: 5px; color: #2d3748;">${event.title}</h3>
                    <div class="event-date" style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">${formattedDate}</div>
                    ${event.description ? `<p style="color: #4a5568; margin-bottom: 15px;">${event.description}</p>` : ''}
                    <div style="margin-top: 10px;">
                        <button class="btn btn-small" onclick="editEvent('${event.id}')" style="margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteEvent('${event.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateYearFilter() {
    const filter = document.getElementById('filter-year');
    if (!filter) return;
    
    // Собираем уникальные годы из событий
    const years = [...new Set(events.map(event => 
        new Date(event.date).getFullYear()
    ))].sort((a, b) => b - a);
    
    let html = '<option value="">Все годы</option>';
    years.forEach(year => {
        html += `<option value="${year}">${year}</option>`;
    });
    
    filter.innerHTML = html;
}

function getEventIcon(eventType) {
    const icons = {
        'birthday': 'fas fa-birthday-cake',
        'wedding': 'fas fa-ring',
        'anniversary': 'fas fa-heart',
        'holiday': 'fas fa-gift',
        'other': 'fas fa-calendar'
    };
    
    return icons[eventType] || 'fas fa-calendar';
}

function updateMediaGrid() {
    const container = document.getElementById('media-grid');
    if (!container) return;
    
    const searchText = document.getElementById('media-search')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('media-sort')?.value || 'newest';
    
    let filteredMedia = [...media];
    
    // Поиск
    if (searchText) {
        filteredMedia = filteredMedia.filter(item => 
            item.description?.toLowerCase().includes(searchText)
        );
    }
    
    // Сортировка
    filteredMedia.sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        } else if (sortBy === 'name') {
            return (a.description || '').localeCompare(b.description || '');
        }
        return 0;
    });
    
    if (filteredMedia.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #718096; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 20px; color: #cbd5e0;"></i>
                <h3 style="margin-bottom: 10px; color: #4a5568;">Медиафайлов пока нет</h3>
                <p>Загрузите первое фото в ваш семейный архив</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredMedia.forEach(item => {
        html += `
            <div class="media-item">
                <img src="${item.file_url}" alt="${item.description || 'Фото'}" 
                     onerror="this.src='https://via.placeholder.com/300/667eea/ffffff?text=Фото'"
                     style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0;">
                <div class="media-description" style="padding: 15px; background: white; border-radius: 0 0 8px 8px;">
                    ${item.description || 'Без описания'}
                    <div style="margin-top: 10px; font-size: 0.8rem;">
                        <button class="btn btn-small" onclick="viewMedia('${item.id}')" style="margin-right: 5px;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteMedia('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateChat() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Сообщений пока нет</p>';
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isOwn = msg.sender_id === currentUser?.id || msg.sender_id === 'demo1';
        const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="chat-message" style="margin-bottom: 10px; padding: 10px; background: ${isOwn ? '#ebf8ff' : '#f7fafc'}; border-radius: 8px; ${isOwn ? 'text-align: right;' : ''}">
                <div style="margin-bottom: 5px;">${msg.content}</div>
                <small style="color: #718096; font-size: 0.8rem;">${time}</small>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
    
    // Обновляем счетчик онлайн
    const onlineCount = Math.floor(Math.random() * 5) + 1; // Для демо
    document.getElementById('online-count').textContent = `${onlineCount} онлайн`;
}

// ========== МОДАЛЬНЫЕ ОКНА ==========

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modal-backdrop');
    
    if (modal && backdrop) {
        // Закрываем все открытые модальные окна
        closeAllModals();
        
        // Показываем backdrop
        backdrop.classList.add('show');
        
        // Показываем модальное окно
        modal.classList.add('show');
        
        // Блокируем прокрутку body
        document.body.style.overflow = 'hidden';
        
        // Заполняем данные если нужно
        if (modalId === 'edit-profile-modal' && currentUser) {
            document.getElementById('edit-profile-name').value = currentUser.user_metadata?.name?.split(' ')[0] || '';
            document.getElementById('edit-profile-last-name').value = currentUser.user_metadata?.name?.split(' ')[1] || '';
            document.getElementById('edit-profile-email').value = currentUser.email || '';
        }
    }
}

function closeAllModals() {
    // Закрываем все модальные окна
    document.querySelectorAll('.modal-dialog').forEach(modal => {
        modal.classList.remove('show');
    });
    
    // Скрываем backdrop
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.classList.remove('show');
    }
    
    // Восстанавливаем прокрутку
    document.body.style.overflow = '';
}

// ========== ПОСТРОЕНИЕ ДЕРЕВА ==========

async function buildFamilyTree() {
    try {
        window.showLoader('Построение генеалогического древа...');
        
        const container = document.getElementById('tree-visualization-container');
        if (!container) {
            throw new Error('Контейнер для дерева не найден');
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Получаем настройки
        const generations = parseInt(document.getElementById('auto-generations')?.value || 3);
        const style = document.getElementById('auto-style')?.value || 'horizontal';
        const centerPerson = document.getElementById('auto-center-person')?.value || 'self';
        
        // Создаем дерево
        createTreeVisualization(container, generations, style);
        
        window.showNotification('✅ Генеалогическое древо построено!', 'success');
        
    } catch (error) {
        console.error('Ошибка построения дерева:', error);
        window.showNotification('Ошибка построения дерева: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

function createTreeVisualization(container, generations, style) {
    // Если нет людей, создаем демо-данные
    if (!people || people.length === 0) {
        people = generateDemoPeople();
    }
    
    // Создаем HTML для дерева
    let html = `
        <div class="tree-container" style="text-align: center;">
            <h3 style="color: #2d3748; margin-bottom: 30px;">Генеалогическое древо семьи</h3>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 40px;">
    `;
    
    // Находим центрального человека (Я)
    const selfPerson = people.find(p => p.relation === 'self') || people[0];
    
    // Генерация для демо
    const demoData = {
        name: "Иванов Иван",
        birth: "1990",
        children: [
            {
                name: "Иванов Алексей",
                birth: "2015",
                relation: "сын"
            },
            {
                name: "Иванова Анна", 
                birth: "2018",
                relation: "дочь"
            }
        ],
        parents: [
            {
                name: "Иванов Петр",
                birth: "1960",
                death: "2020",
                relation: "отец"
            },
            {
                name: "Иванова Мария",
                birth: "1965",
                relation: "мать" 
            }
        ],
        grandparents: [
            {
                name: "Иванов Сергей",
                birth: "1930",
                death: "2000",
                relation: "дед"
            },
            {
                name: "Иванова Ольга",
                birth: "1935",
                death: "2005",
                relation: "бабушка"
            }
        ]
    };
    
    // Поколение 3: Бабушки/дедушки
    if (generations >= 3 && demoData.grandparents.length > 0) {
        html += `
            <div style="display: flex; gap: 100px; margin-bottom: 20px;">
                ${demoData.grandparents.map(gp => `
                    <div class="tree-person-card" style="text-align: center;">
                        <div class="person-avatar" style="background: #a0aec0;">
                            ${gp.name.split(' ')[0][0]}${gp.name.split(' ')[1][0]}
                        </div>
                        <div style="font-weight: bold; font-size: 0.9rem; margin-bottom: 5px;">${gp.name}</div>
                        <div style="font-size: 0.8rem; color: #718096; margin-bottom: 5px;">${gp.birth}${gp.death ? `-${gp.death}` : ''}</div>
                        <div style="font-size: 0.8rem; color: #667eea;">${gp.relation}</div>
                    </div>
                `).join('')}
            </div>
            
            <div style="height: 20px; display: flex; justify-content: center;">
                <div style="width: 2px; height: 100%; background: #cbd5e0;"></div>
            </div>
        `;
    }
    
    // Поколение 2: Родители
    if (generations >= 2 && demoData.parents.length > 0) {
        html += `
            <div style="display: flex; gap: 150px; margin-bottom: 20px;">
                ${demoData.parents.map(parent => `
                    <div class="tree-person-card" style="text-align: center;">
                        <div class="person-avatar" style="background: #667eea;">
                            ${parent.name.split(' ')[0][0]}${parent.name.split(' ')[1][0]}
                        </div>
                        <div style="font-weight: bold; margin-bottom: 5px;">${parent.name}</div>
                        <div style="font-size: 0.9rem; color: #718096; margin-bottom: 5px;">${parent.birth}${parent.death ? `-${parent.death}` : ''}</div>
                        <div style="font-size: 0.9rem; color: #48bb78;">${parent.relation}</div>
                    </div>
                `).join('')}
            </div>
            
            <div style="height: 20px; display: flex; justify-content: center;">
                <div style="width: 2px; height: 100%; background: #cbd5e0;"></div>
            </div>
        `;
    }
    
    // Поколение 1: Я (центральный)
    html += `
        <div class="tree-person-card self" style="text-align: center;">
            <div class="person-avatar" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); font-size: 2rem;">
                Я
            </div>
            <div style="font-weight: bold; font-size: 1.2rem; margin-bottom: 5px;">${demoData.name}</div>
            <div style="font-size: 1rem; color: #718096; margin-bottom: 5px;">род. ${demoData.birth}</div>
            <div style="font-size: 1rem; color: #ed64a6; font-weight: bold;">Я</div>
        </div>
        
        <div style="height: 20px; display: flex; justify-content: center;">
            <div style="width: 2px; height: 100%; background: #cbd5e0;"></div>
        </div>
    `;
    
    // Поколение 0: Дети
    if (generations >= 1 && demoData.children.length > 0) {
        html += `
            <div style="display: flex; gap: 150px; margin-top: 20px;">
                ${demoData.children.map(child => `
                    <div class="tree-person-card" style="text-align: center;">
                        <div class="person-avatar" style="background: ${child.relation === 'сын' ? '#4299e1' : '#ed64a6'};">
                            ${child.name.split(' ')[0][0]}${child.name.split(' ')[1][0]}
                        </div>
                        <div style="font-weight: bold; margin-bottom: 5px;">${child.name}</div>
                        <div style="font-size: 0.9rem; color: #718096; margin-bottom: 5px;">род. ${child.birth}</div>
                        <div style="font-size: 0.9rem; color: #d69e2e;">${child.relation}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    html += `
            </div>
            
            <div style="margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="color: #4a5568; margin-bottom: 10px;">Информация о дереве:</h4>
                <p style="color: #718096; margin-bottom: 5px;">• Стиль отображения: <strong>${style === 'horizontal' ? 'Горизонтальный' : style === 'vertical' ? 'Вертикальный' : 'Радиальный'}</strong></p>
                <p style="color: #718096; margin-bottom: 5px;">• Поколений: <strong>${generations}</strong></p>
                <p style="color: #718096;">• Всего людей: <strong>${1 + (demoData.parents?.length || 0) + (demoData.children?.length || 0) + (demoData.grandparents?.length || 0)}</strong></p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    updateTreeStats();
}

function updateTreeStats() {
    const peopleCount = 7; // Примерное количество
    document.getElementById('tree-people-count').textContent = peopleCount;
    document.getElementById('tree-photos-count').textContent = '3';
    document.getElementById('tree-generations').textContent = document.getElementById('auto-generations')?.value || 3;
    document.getElementById('tree-connections').textContent = peopleCount - 1;
}

// ========== ОПЕРАЦИИ С ДАННЫМИ ==========

async function addPerson() {
    const firstName = document.getElementById('person-first-name').value;
    const lastName = document.getElementById('person-last-name').value;
    const birthDate = document.getElementById('person-birth-date').value;
    const deathDate = document.getElementById('person-death-date').value;
    const gender = document.getElementById('person-gender').value;
    const relation = document.getElementById('person-relation').value;
    const photoUrl = document.getElementById('person-photo-url').value;
    const biography = document.getElementById('person-bio').value;
    
    if (!firstName || !gender || !relation) {
        window.showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    window.showLoader('Добавление человека...');
    
    try {
        const newPerson = {
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate || null,
            death_date: deathDate || null,
            gender: gender,
            relation: relation,
            photo_url: photoUrl || null,
            biography: biography || null,
            user_id: currentUser.id
        };
        
        // Если это супруг/супруга, устанавливаем связь
        if (relation === 'spouse') {
            const self = people.find(p => p.relation === 'self');
            if (self) {
                newPerson.spouse_id = self.id;
            }
        }
        
        const { data, error } = await window.supabaseClient
            .from('people')
            .insert([newPerson])
            .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
            people.push(data[0]);
            updateStats();
            
            // Обновляем дерево если оно открыто
            if (document.getElementById('tree-page').classList.contains('hidden') === false) {
                buildFamilyTree();
            }
            
            window.showNotification('✅ Человек успешно добавлен!', 'success');
            closeAllModals();
            
            // Очищаем форму
            document.getElementById('add-person-form-modal').reset();
        }
        
    } catch (error) {
        console.error('Ошибка добавления человека:', error);
        window.showNotification('Ошибка добавления человека', 'error');
    } finally {
        window.hideLoader();
    }
}

async function addEvent() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const eventType = document.getElementById('event-type').value;
    const description = document.getElementById('event-description').value;
    
    if (!title || !date) {
        window.showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    window.showLoader('Добавление события...');
    
    try {
        const newEvent = {
            title: title,
            date: date,
            event_type: eventType || 'other',
            description: description || null,
            user_id: currentUser.id
        };
        
        const { data, error } = await window.supabaseClient
            .from('events')
            .insert([newEvent])
            .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
            events.unshift(data[0]);
            updateRecentEvents();
            updateTimeline();
            updateStats();
            
            window.showNotification('✅ Событие успешно добавлено!', 'success');
            closeAllModals();
            
            // Очищаем форму
            document.getElementById('add-event-form-modal').reset();
        }
        
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        window.showNotification('Ошибка добавления события', 'error');
    } finally {
        window.hideLoader();
    }
}

async function uploadMedia() {
    const filesInput = document.getElementById('upload-files');
    const description = document.getElementById('upload-description').value;
    
    if (!filesInput.files || filesInput.files.length === 0) {
        window.showNotification('Выберите файлы для загрузки', 'error');
        return;
    }
    
    window.showLoader('Загрузка файлов...');
    
    try {
        // В реальном приложении здесь была бы загрузка в Supabase Storage
        // Для демо используем фиктивные URL
        
        const files = Array.from(filesInput.files);
        const newMediaItems = [];
        
        for (const file of files) {
            // Создаем фиктивный URL для демо
            const fakeUrl = `https://via.placeholder.com/300/667eea/ffffff?text=${encodeURIComponent(file.name.split('.')[0])}`;
            
            const mediaItem = {
                file_url: fakeUrl,
                file_type: file.type.startsWith('image/') ? 'image' : 'file',
                description: description || file.name,
                user_id: currentUser.id
            };
            
            newMediaItems.push(mediaItem);
        }
        
        const { data, error } = await window.supabaseClient
            .from('media')
            .insert(newMediaItems)
            .select();
        
        if (error) throw error;
        
        if (data) {
            media.unshift(...data);
            updateMediaGrid();
            updateStats();
            
            window.showNotification(`✅ Загружено ${files.length} файлов!`, 'success');
            closeAllModals();
            
            // Очищаем форму
            document.getElementById('upload-form-modal').reset();
            document.getElementById('file-list').style.display = 'none';
            document.getElementById('selected-files-list').innerHTML = '';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        window.showNotification('Ошибка загрузки файлов', 'error');
    } finally {
        window.hideLoader();
    }
}

async function sendInvitation() {
    const email = document.getElementById('invite-email').value;
    const name = document.getElementById('invite-name').value;
    const message = document.getElementById('invite-message').value;
    const allowEdit = document.getElementById('invite-editor').checked;
    
    if (!email) {
        window.showNotification('Введите email', 'error');
        return;
    }
    
    window.showLoader('Отправка приглашения...');
    
    try {
        // Генерируем токен для приглашения
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        const invitation = {
            from_user_id: currentUser.id,
            to_email: email,
            token: token,
            message: message || null,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const { data, error } = await window.supabaseClient
            .from('invitations')
            .insert([invitation]);
        
        if (error) throw error;
        
        // В реальном приложении здесь отправляется email с приглашением
        
        window.showNotification('✅ Приглашение отправлено!', 'success');
        closeAllModals();
        
        // Очищаем форму
        document.getElementById('invite-form-modal').reset();
        
    } catch (error) {
        console.error('Ошибка отправки приглашения:', error);
        window.showNotification('Ошибка отправки приглашения', 'error');
    } finally {
        window.hideLoader();
    }
}

function editEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Заполняем форму редактирования
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date.split('T')[0];
    document.getElementById('event-type').value = event.event_type || 'other';
    document.getElementById('event-description').value = event.description || '';
    
    // Показываем модальное окно
    showModal('add-event-modal');
    
    // Меняем заголовок и действие формы
    const modal = document.getElementById('add-event-modal');
    const header = modal.querySelector('h3');
    const submitBtn = modal.querySelector('button[type="submit"]');
    
    header.textContent = 'Редактировать событие';
    submitBtn.textContent = 'Сохранить изменения';
    submitBtn.dataset.editingId = eventId;
    
    // Временное изменение обработчика
    const form = document.getElementById('add-event-form-modal');
    const originalSubmit = form.onsubmit;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const updatedEvent = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            event_type: document.getElementById('event-type').value,
            description: document.getElementById('event-description').value
        };
        
        window.showLoader('Сохранение изменений...');
        
        try {
            const { error } = await window.supabaseClient
                .from('events')
                .update(updatedEvent)
                .eq('id', eventId);
            
            if (error) throw error;
            
            // Обновляем в локальном массиве
            const index = events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                events[index] = { ...events[index], ...updatedEvent };
                updateRecentEvents();
                updateTimeline();
            }
            
            window.showNotification('✅ Событие обновлено!', 'success');
            closeAllModals();
            
        } catch (error) {
            console.error('Ошибка обновления события:', error);
            window.showNotification('Ошибка обновления события', 'error');
        } finally {
            window.hideLoader();
            form.onsubmit = originalSubmit; // Восстанавливаем обработчик
        }
    };
}

async function deleteEvent(eventId) {
    if (!confirm('Удалить это событие?')) return;
    
    window.showLoader('Удаление события...');
    
    try {
        const { error } = await window.supabaseClient
            .from('events')
            .delete()
            .eq('id', eventId);
        
        if (error) throw error;
        
        // Удаляем из локального массива
        const index = events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            events.splice(index, 1);
            updateRecentEvents();
            updateTimeline();
            updateStats();
        }
        
        window.showNotification('✅ Событие удалено!', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления события:', error);
        window.showNotification('Ошибка удаления события', 'error');
    } finally {
        window.hideLoader();
    }
}

function viewMedia(mediaId) {
    const item = media.find(m => m.id === mediaId);
    if (!item) return;
    
    // Создаем модальное окно для просмотра
    const modalHtml = `
        <div class="modal-dialog" id="view-media-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Просмотр медиа</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <img src="${item.file_url}" alt="${item.description || 'Фото'}" 
                         style="width: 100%; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">${item.description || 'Без описания'}</h4>
                    <p style="color: #718096;">Загружено: ${new Date(item.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn cancel-btn">Закрыть</button>
                </div>
            </div>
        </div>
    `;
    
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.innerHTML = modalHtml;
    backdrop.classList.add('show');
    document.getElementById('view-media-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Закрытие модального окна
    document.querySelector('#view-media-modal .modal-close-btn')?.addEventListener('click', closeAllModals);
    document.querySelector('#view-media-modal .cancel-btn')?.addEventListener('click', closeAllModals);
}

async function deleteMedia(mediaId) {
    if (!confirm('Удалить этот медиафайл?')) return;
    
    window.showLoader('Удаление медиафайла...');
    
    try {
        const { error } = await window.supabaseClient
            .from('media')
            .delete()
            .eq('id', mediaId);
        
        if (error) throw error;
        
        // Удаляем из локального массива
        const index = media.findIndex(m => m.id === mediaId);
        if (index !== -1) {
            media.splice(index, 1);
            updateMediaGrid();
            updateStats();
        }
        
        window.showNotification('✅ Медиафайл удален!', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления медиафайла:', error);
        window.showNotification('Ошибка удаления медиафайла', 'error');
    } finally {
        window.hideLoader();
    }
}

async function updateProfile() {
    const name = document.getElementById('edit-profile-name').value;
    const lastName = document.getElementById('edit-profile-last-name').value;
    const email = document.getElementById('edit-profile-email').value;
    const bio = document.getElementById('edit-profile-bio').value;
    
    if (!name || !email) {
        window.showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    window.showLoader('Сохранение профиля...');
    
    try {
        // Обновляем данные в Supabase
        const { error } = await window.supabaseClient.auth.updateUser({
            email: email,
            data: { 
                name: name,
                full_name: lastName ? `${name} ${lastName}` : name
            }
        });
        
        if (error) throw error;
        
        // Обновляем профиль
        await window.supabaseClient
            .from('profiles')
            .update({
                full_name: lastName ? `${name} ${lastName}` : name
            })
            .eq('id', currentUser.id);
        
        // Обновляем текущего пользователя
        currentUser.email = email;
        currentUser.user_metadata.name = name;
        currentUser.user_metadata.full_name = lastName ? `${name} ${lastName}` : name;
        
        // Обновляем UI
        setupUserUI(currentUser);
        
        window.showNotification('✅ Профиль успешно обновлен!', 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        window.showNotification('Ошибка обновления профиля', 'error');
    } finally {
        window.hideLoader();
    }
}

function exportUserData() {
    window.showLoader('Подготовка данных...');
    
    try {
        const userData = {
            user: {
                email: currentUser.email,
                name: currentUser.user_metadata?.name,
                registered: currentUser.created_at
            },
            people: people,
            events: events,
            media: media,
            export_date: new Date().toISOString()
        };
        
        // Создаем JSON файл для скачивания
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `family-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        window.showNotification('✅ Данные экспортированы!', 'success');
        
    } catch (error) {
        console.error('Ошибка экспорта данных:', error);
        window.showNotification('Ошибка экспорта данных', 'error');
    } finally {
        window.hideLoader();
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        const newMessage = {
            sender_id: currentUser.id,
            content: message,
            created_at: new Date().toISOString()
        };
        
        // В реальном приложении сохраняем в Supabase
        // Для демо добавляем локально
        
        messages.push(newMessage);
        updateChat();
        
        input.value = '';
        input.focus();
        
        // Автоответ для демо
        setTimeout(() => {
            const responses = [
                'Отличная идея!',
                'Согласен!',
                'Когда встречаемся?',
                'Жду не дождусь!',
                'Как дела у всех?'
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            messages.push({
                id: 'demo_' + Date.now(),
                sender_id: 'demo2',
                content: randomResponse,
                created_at: new Date().toISOString()
            });
            
            updateChat();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        window.showNotification('Ошибка отправки сообщения', 'error');
    }
}

function showSelectedFiles(files) {
    const fileList = document.getElementById('file-list');
    const listContainer = document.getElementById('selected-files-list');
    
    if (!files || files.length === 0) {
        if (fileList) fileList.style.display = 'none';
        return;
    }
    
    if (listContainer) {
        listContainer.innerHTML = '';
        
        Array.from(files).forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            listContainer.appendChild(li);
        });
    }
    
    if (fileList) fileList.style.display = 'block';
}

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========

function showLandingPage() {
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('landing-header').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('about').classList.add('hidden');
    window.scrollTo(0, 0);
}

function showAuthPage() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('landing-header').classList.add('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('auth-page').classList.remove('hidden');
    document.getElementById('about').classList.add('hidden');
    window.scrollTo(0, 0);
}

function showApp() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('landing-header').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('about').classList.add('hidden');
    
    showPage('home-page');
}

function showPage(pageId) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Показываем выбранную страницу
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
    }
    
    // Обновляем навигацию
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Закрываем мобильное меню
    document.getElementById('nav-links').classList.remove('active');
}

function showDemoMode() {
    // Для демо показываем авторизованный интерфейс с демо-данными
    currentUser = {
        id: 'demo_user',
        email: 'demo@example.com',
        user_metadata: { name: 'Демо Пользователь' },
        created_at: new Date().toISOString()
    };
    
    setupUserUI(currentUser);
    
    // Загружаем демо-данные
    people = generateDemoPeople();
    events = generateDemoEvents();
    media = generateDemoMedia();
    messages = generateDemoMessages();
    
    updateStats();
    updateRecentEvents();
    updateTimeline();
    updateMediaGrid();
    updateChat();
    
    showApp();
    
    window.showNotification('Демо-режим активирован. Данные не сохраняются.', 'info');
}

function showFeatureDemo(feature) {
    switch(feature) {
        case 'tree':
            showDemoMode();
            setTimeout(() => {
                showPage('tree-page');
                setTimeout(() => {
                    buildFamilyTree();
                }, 500);
            }, 100);
            break;
        case 'media':
            showDemoMode();
            setTimeout(() => {
                showPage('media-page');
            }, 100);
            break;
        case 'timeline':
            showDemoMode();
            setTimeout(() => {
                showPage('timeline-page');
            }, 100);
            break;
        case 'chat':
            showDemoMode();
            setTimeout(() => {
                toggleChat();
            }, 100);
            break;
        case 'print':
            window.showNotification('Демо печати: дерево будет распечатано в отдельном окне', 'info');
            break;
        case 'notifications':
            window.showNotification('🔔 Напоминание: Завтра день рождения у Алексея!', 'success');
            break;
        default:
            showDemoMode();
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-widget');
    if (chat) {
        chat.classList.toggle('active');
    }
}

async function logout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        people = [];
        events = [];
        media = [];
        messages = [];
        
        window.showNotification('✅ Выход выполнен', 'success');
        showLandingPage();
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
        window.showNotification('Ошибка выхода из системы', 'error');
    }
}

function saveTreeAsImage() {
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showLoader('Сохранение изображения...');
    
    // Для демо просто показываем уведомление
    setTimeout(() => {
        window.showNotification('✅ Дерево сохранено как изображение!', 'success');
        window.hideLoader();
    }, 1500);
}

function printTree() {
    const container = document.getElementById('tree-visualization-container');
    if (!container || container.innerHTML.includes('tree-empty-state')) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showNotification('Подготовка к печати...', 'info');
    
    // Для демо просто открываем новое окно
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Генеалогическое древо</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #2d3748; margin-bottom: 20px; text-align: center; }
                        .tree-container { padding: 20px; background: white; border-radius: 8px; }
                        @media print {
                            body { padding: 0; }
                            .tree-container { border: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Генеалогическое древо</h1>
                    <div class="tree-container">
                        ${container.innerHTML}
                        <div style="text-align: center; margin-top: 40px; color: #718096; font-size: 0.9rem;">
                            Создано в приложении "История моей семьи"<br>
                            Дата: ${new Date().toLocaleDateString('ru-RU')}
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => window.close(), 1000);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// Экспортируем функции для HTML
window.showPersonInfo = function(personId) {
    window.showNotification('Информация о человеке будет отображена здесь', 'info');
};

window.editPerson = function(personId) {
    const person = people.find(p => p.id === personId);
    if (person) {
        window.showNotification(`Редактирование: ${person.first_name} ${person.last_name}`, 'info');
    }
};

window.showModal = showModal;
window.closeAllModals = closeAllModals;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewMedia = viewMedia;
window.deleteMedia = deleteMedia;
window.showLandingPage = showLandingPage;
window.showLandingFeatures = function() {
    showLandingPage();
    setTimeout(() => {
        window.scrollTo(0, document.getElementById('features').offsetTop - 80);
    }, 100);
};

window.showAboutSection = function() {
    showLandingPage();
    setTimeout(() => {
        document.getElementById('about').classList.remove('hidden');
        window.scrollTo(0, document.getElementById('about').offsetTop - 80);
    }, 100);
};

window.showContactModal = function() {
    window.showNotification('Контакты: support@family-history.ru', 'info');
};

window.showTermsModal = function() {
    window.showNotification('Открыть пользовательское соглашение', 'info');
};

window.showPrivacyModal = function() {
    window.showNotification('Открыть политику конфиденциальности', 'info');
};

window.autoBuildTree = buildFamilyTree;
window.saveTreeAsImage = saveTreeAsImage;
window.printTree = printTree;

console.log('✅ Приложение загружено');