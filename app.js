// Глобальные переменные
let currentUser = null;
let currentTree = null;
let isRegisterMode = false;
let people = [];
let events = [];
let media = [];
let messages = [];

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение запускается...');
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Проверяем, авторизован ли пользователь
    await checkAuthStatus();
    
    console.log('✅ Инициализация завершена');
});

function setupEventListeners() {
    // Лендинг страница
    document.getElementById('landing-login-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthPage();
    });
    
    document.getElementById('landing-register-btn')?.addEventListener('click', () => {
        showAuthPage();
        toggleAuthMode(); // Переключаем на регистрацию
    });
    
    document.getElementById('start-free-btn')?.addEventListener('click', () => {
        showAuthPage();
        toggleAuthMode(); // Переключаем на регистрацию
    });
    
    document.getElementById('watch-demo-btn')?.addEventListener('click', () => {
        showDemo();
    });
    
    // Демо кнопки функций
    document.querySelectorAll('.feature-demo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feature = e.target.dataset.feature;
            showFeatureDemo(feature);
        });
    });
    
    // Навигация лендинга
    document.getElementById('landing-mobile-btn')?.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
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
        openModal('add-person-modal');
    });
    
    // Древо
    document.getElementById('manual-add-btn')?.addEventListener('click', () => {
        openModal('add-person-modal');
    });
    
    document.getElementById('save-image-btn')?.addEventListener('click', () => {
        window.saveTreeAsImage();
    });
    
    document.getElementById('print-tree-btn')?.addEventListener('click', () => {
        window.printTree();
    });
    
    // Лента событий
    document.getElementById('add-event-btn')?.addEventListener('click', () => {
        openModal('add-event-modal');
    });
    
    // Медиатека
    document.getElementById('upload-media-btn')?.addEventListener('click', () => {
        openModal('upload-modal');
    });
    
    // Профиль
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        editProfile();
    });
    
    document.getElementById('invite-btn')?.addEventListener('click', () => {
        openModal('invite-modal');
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
    document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('modal-overlay')?.addEventListener('click', closeAllModals);
    
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
}

// ========== АВТОРИЗАЦИЯ ==========

async function checkAuthStatus() {
    try {
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
        console.error('❌ Ошибка:', error);
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
        container.innerHTML = '<p style="text-align: center; color: #718096;">Событий пока нет</p>';
        return;
    }
    
    let html = '';
    recentEvents.forEach(event => {
        const date = new Date(event.date).toLocaleDateString('ru-RU');
        const icon = getEventIcon(event.event_type);
        
        html += `
            <div class="timeline-event">
                <div class="event-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="event-content">
                    <h3>${event.title}</h3>
                    <div class="event-date">${date}</div>
                    ${event.description ? `<p>${event.description}</p>` : ''}
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
    const selectedYear = document.getElementById('filter-year').value;
    const selectedType = document.getElementById('filter-type').value;
    
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
            <div style="text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-calendar" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Событий пока нет</h3>
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
            <div class="timeline-event">
                <div class="event-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="event-content">
                    <h3>${event.title}</h3>
                    <div class="event-date">${formattedDate}</div>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                    <div style="margin-top: 10px;">
                        <button class="btn btn-small" onclick="editEvent('${event.id}')">
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
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Медиафайлов пока нет</h3>
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
                     onerror="this.src='https://via.placeholder.com/300/667eea/ffffff?text=Фото'">
                <div class="media-description">
                    ${item.description || 'Без описания'}
                    <div style="margin-top: 5px; font-size: 0.8rem;">
                        <button class="btn btn-small" onclick="viewMedia('${item.id}')">
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
            <div class="chat-message ${isOwn ? 'own' : ''}">
                <div>${msg.content}</div>
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
        
        // Если это родитель, устанавливаем связь с "Я"
        if (relation === 'parent') {
            const self = people.find(p => p.relation === 'self');
            if (self) {
                // В реальном приложении нужно определить, кто отец, кто мать
                // Здесь для простоты используем parent_id
                newPerson.id = `temp_${Date.now()}`;
                // Обработка связи будет в updatePersonRelations
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
                window.autoBuildTree();
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
            
            // В реальном приложении:
            // 1. Загружаем файл в Supabase Storage
            // 2. Получаем public URL
            // 3. Сохраняем в таблице media
            
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
        // Для демо показываем уведомление
        
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
    openModal('add-event-modal');
    
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
    
    window.showNotification(`Просмотр: ${item.description || 'Медиафайл'}`, 'info');
    // В реальном приложении можно открыть модальное окно с увеличенным изображением
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

async function sendMessage() {
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

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========

function showLandingPage() {
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('landing-header').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('auth-page').classList.add('hidden');
}

function showAuthPage() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('landing-header').classList.add('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('auth-page').classList.remove('hidden');
}

function showApp() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('landing-header').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('auth-page').classList.add('hidden');
    
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

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        
        // Заполняем селекторы если нужно
        if (modalId === 'add-event-modal') {
            fillPeopleSelect('event-people');
        }
        if (modalId === 'upload-modal') {
            fillPeopleSelect('upload-person');
        }
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    document.getElementById('modal-overlay').classList.add('hidden');
}

function fillPeopleSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    let html = '';
    if (selectId === 'upload-person') {
        html = '<option value="">Не связывать</option>';
    }
    
    people.forEach(person => {
        const name = `${person.first_name} ${person.last_name || ''}`;
        html += `<option value="${person.id}">${name}</option>`;
    });
    
    select.innerHTML = html;
}

function showSelectedFiles(files) {
    const fileList = document.getElementById('file-list');
    const listContainer = document.getElementById('selected-files-list');
    
    if (!files || files.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    listContainer.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        listContainer.appendChild(li);
    });
    
    fileList.style.display = 'block';
}

function showDemo() {
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
            showPage('tree-page');
            setTimeout(() => {
                window.autoBuildTree();
            }, 500);
            break;
        case 'media':
            showPage('media-page');
            break;
        case 'timeline':
            showPage('timeline-page');
            break;
        case 'chat':
            toggleChat();
            break;
        case 'print':
            window.showNotification('Демо печати: дерево будет распечатано', 'info');
            break;
        case 'notifications':
            window.showNotification('🔔 Напоминание: Завтра день рождения у Алексея!', 'success');
            break;
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-widget');
    chat.classList.toggle('active');
}

function editProfile() {
    window.showNotification('Редактирование профиля', 'info');
    // В реальном приложении открыть модальное окно редактирования
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

// Экспортируем функции для HTML
window.showPersonInfo = showPersonInfo;
window.editPerson = editProfile;
window.openModal = openModal;
window.closeAllModals = closeAllModals;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewMedia = viewMedia;
window.deleteMedia = deleteMedia;

console.log('✅ Приложение загружено');