// Глобальные переменные
let currentUser = null;
let currentTree = null;
let isRegisterMode = false;
let people = [];
let events = [];
let media = [];

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// Добавьте в начале app.js или в отдельный файл utils.js
window.showLoader = function() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    } else {
        console.warn('Элемент loader не найден');
        // Создайте loader динамически или проверьте HTML
    }
}

window.hideLoader = function() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение запускается...');
    
    // Показываем лендинг по умолчанию
    showLanding();
    
    // Настраиваем обработчики
    setupAllEventListeners();
    
    // Проверяем авторизацию (но не показываем сразу)
    await checkAuthStatus();
    
    console.log('✅ Инициализация завершена');
});

// ========== АВТОРИЗАЦИЯ ==========

async function checkAuthStatus() {
    try {
        const { data, error } = await supabase.auth.getSession();
        // исправьте на window.supabase если используете глобальную переменную
        // или убедитесь что supabase инициализирован
        if (error) throw error;
        
        if (data.session) {
            console.log('Пользователь авторизован');
            // Действия при авторизации
        } else {
            console.log('Пользователь не авторизован');
            // Действия при отсутствии авторизации
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
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
    if (authError) {
        authError.textContent = '';
        authError.style.display = 'none';
    }
}

function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

async function logout() {
    try {
        await window.supabaseClient.auth.signOut();
        currentUser = null;
        currentTree = null;
        people = [];
        events = [];
        media = [];
        
        window.showNotification('Вы вышли из аккаунта', 'info');
        showLanding();
        
    } catch (error) {
        console.error('❌ Ошибка при выходе:', error);
        window.showNotification('Ошибка при выходе: ' + error.message, 'error');
    }
}

// ========== НОВАЯ ЛОГИКА ==========

function showLanding() {
    // Скрываем все, показываем лендинг
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('main-header').classList.add('hidden');
    document.getElementById('main-footer').classList.add('hidden');
    
    ['home', 'tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page');
        if (element) element.classList.add('hidden');
    });
}

function showAuthPage() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('auth-page').classList.remove('hidden');
}

function showApp() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-footer').classList.remove('hidden');
    showPage('home');
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========

function setupAllEventListeners() {
    console.log('🔧 Настройка обработчиков...');
    
    // 1. Лендинг
    setupLandingListeners();
    
    // 2. Авторизация
    setupAuthListeners();
    
    // 3. Навигация
    setupNavigationListeners();
    
    // 4. Модальные окна
    setupModalListeners();
    
    // 5. Кнопки на страницах
    setupPageButtonListeners();
    
    console.log('✅ Все обработчики настроены');
}

function setupLandingListeners() {
    // Кнопка "Попробовать демо"
    document.getElementById('try-demo-btn')?.addEventListener('click', async () => {
        window.showLoader('Загрузка демо...');
        
        // Создаем демо-данные
        await createDemoData();
        
        // Показываем интерфейс приложения
        showApp();
        showPage('tree');
        
        // Через секунду предлагаем автопостроение
        setTimeout(() => {
            openModal('auto-tree-modal');
        }, 1000);
        
        window.hideLoader();
    });
    
    // Кнопка "Войти / Регистрация"
    document.getElementById('go-to-auth-btn')?.addEventListener('click', () => {
        showAuthPage();
    });
    
    // Кнопка "Начать сейчас"
    document.getElementById('start-now-btn')?.addEventListener('click', () => {
        showAuthPage();
    });
}

function setupAuthListeners() {
    // Форма авторизации
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuthSubmit();
        });
    }
    
    // Переключение режима авторизации
    const authSwitchLink = document.getElementById('auth-switch-link');
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }
    
    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function setupNavigationListeners() {
    // Навигация в хедере
    document.querySelectorAll('#home-link, #tree-link, #timeline-link, #media-link, #profile-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.id.replace('-link', '');
            showPage(page);
        });
    });
    
    // Мобильное меню
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const navLinks = document.getElementById('nav-links');
            if (navLinks) navLinks.classList.toggle('active');
        });
    }
    
    // Кнопки на главной
    document.getElementById('tree-btn')?.addEventListener('click', () => showPage('tree'));
    document.getElementById('add-person-btn')?.addEventListener('click', () => openModal('add-person-modal'));
    
    // Кнопки в карточках на главной
    document.querySelectorAll('.tree-btn-2').forEach(btn => {
        btn.addEventListener('click', () => showPage('tree'));
    });
    
    document.querySelectorAll('.media-btn-2').forEach(btn => {
        btn.addEventListener('click', () => showPage('media'));
    });
    
    document.querySelectorAll('.timeline-btn-2').forEach(btn => {
        btn.addEventListener('click', () => showPage('timeline'));
    });
    
    document.querySelectorAll('.invite-btn-2').forEach(btn => {
        btn.addEventListener('click', () => openModal('invite-modal'));
    });
}

function setupModalListeners() {
    console.log('🪟 Настройка модальных окон...');
    
    // Кнопки открытия модальных окон
    const openButtons = [
        { id: 'add-person-tree-btn', modal: 'add-person-modal' },
        { id: 'add-person-empty-btn', modal: 'add-person-modal' },
        { id: 'add-person-btn', modal: 'add-person-modal' },
        { id: 'add-event-btn', modal: 'add-event-modal' },
        { id: 'add-event-empty-btn', modal: 'add-event-modal' },
        { id: 'upload-media-btn', modal: 'upload-modal' },
        { id: 'upload-media-empty-btn', modal: 'upload-modal' },
        { id: 'auto-tree-btn', modal: 'auto-tree-modal' },
        { id: 'auto-start-btn', modal: 'auto-tree-modal' }
    ];
    
    openButtons.forEach(({ id, modal }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(modal);
            });
        }
    });
    
    // Кнопка сохранения дерева как картинки
    document.getElementById('save-image-btn')?.addEventListener('click', saveTreeAsImage);
    
    // Кнопка печати
    document.getElementById('print-tree-btn')?.addEventListener('click', printTree);
    
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllModals();
        });
    });
    
    // Закрытие по клику на оверлей
    document.getElementById('modal-overlay')?.addEventListener('click', closeAllModals);
    
    // Запрет клика внутри модального окна
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    // Обработчики форм
    document.getElementById('add-person-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAddPerson();
    });
    
    document.getElementById('add-event-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAddEvent();
    });
    
    document.getElementById('upload-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUpload();
    });
    
    document.getElementById('invite-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleInvite();
    });
    
    document.getElementById('auto-tree-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await window.autoBuildTree();
        closeAllModals();
    });
    
    document.getElementById('edit-person-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleEditPerson();
    });
    
    // Удаление человека
    document.getElementById('delete-person-btn')?.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить этого родственника?')) {
            window.showNotification('Родственник удален', 'success');
            closeAllModals();
        }
    });
    
    // Загрузка фото
    document.getElementById('edit-person-photo')?.addEventListener('change', handlePhotoUpload);
}

function setupPageButtonListeners() {
    // Управление деревом
    document.getElementById('zoom-in-btn')?.addEventListener('click', zoomIn);
    document.getElementById('zoom-out-btn')?.addEventListener('click', zoomOut);
    document.getElementById('reset-tree-btn')?.addEventListener('click', resetTree);
    document.getElementById('fit-tree-btn')?.addEventListener('click', fitTree);
    
    // Виды отображения
    document.getElementById('vertical-view-btn')?.addEventListener('click', () => setTreeView('vertical'));
    document.getElementById('horizontal-view-btn')?.addEventListener('click', () => setTreeView('horizontal'));
    document.getElementById('radial-view-btn')?.addEventListener('click', () => setTreeView('radial'));
    
    // Профиль
    document.getElementById('edit-profile-btn')?.addEventListener('click', editProfile);
    document.getElementById('help-btn')?.addEventListener('click', showHelp);
    
    // Фильтр медиа
    document.getElementById('media-filter')?.addEventListener('change', filterMedia);
}

// ========== МОДАЛЬНЫЕ ОКНА ==========

function openModal(modalId) {
    console.log('📂 Открываем модальное окно:', modalId);
    
    // Для демо-режима разрешаем все
    if (!currentUser && modalId !== 'auto-tree-modal') {
        window.showNotification('Сначала войдите в аккаунт', 'error');
        return;
    }
    
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        
        // Останавливаем анимации скрытия
        modal.style.display = 'block';
        overlay.style.display = 'block';
        
        // Фокус на первом поле ввода
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 10);
    }
}

function closeAllModals() {
    console.log('❌ Закрываем все модальные окна');
    
    const overlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.modal');
    
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
    
    modals.forEach(modal => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    });
    
    // Очищаем формы
    document.querySelectorAll('form').forEach(form => {
        if (form.id !== 'auth-form') {
            form.reset();
        }
    });
    
    // Очищаем превью фото
    const preview = document.getElementById('edit-person-photo-preview');
    if (preview) preview.innerHTML = '';
}

// ========== ДЕМО-ДАННЫЕ ==========

async function createDemoData() {
    // Создаем демо-пользователя
    currentUser = {
        id: 'demo_user_12345',
        email: 'demo@family-history.com',
        user_metadata: { 
            name: 'Демо Пользователь',
            avatar: 'ДП'
        },
        created_at: new Date().toISOString()
    };
    
    // Создаем демо-дерево
    currentTree = {
        id: 'demo_tree_12345',
        name: 'Демо-семья Ивановых',
        owner_id: 'demo_user_12345',
        created_at: new Date().toISOString()
    };
    
    // Создаем демо-людей с фото
    people = [
        {
            id: 'person_1',
            tree_id: 'demo_tree_12345',
            first_name: 'Иван',
            last_name: 'Иванов',
            birth_date: '1980-05-15',
            relation: 'self',
            gender: 'male',
            x: 400,
            y: 300,
            color: '#4299e1',
            photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            biography: 'Основатель семейного древа. Родился в Москве.'
        },
        {
            id: 'person_2',
            tree_id: 'demo_tree_12345',
            first_name: 'Мария',
            last_name: 'Иванова',
            birth_date: '1982-08-20',
            relation: 'spouse',
            gender: 'female',
            x: 650,
            y: 300,
            color: '#d69e2e',
            photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            biography: 'Любящая жена и мать. Преподаватель музыки.'
        },
        {
            id: 'person_3',
            tree_id: 'demo_tree_12345',
            first_name: 'Алексей',
            last_name: 'Иванов',
            birth_date: '2005-03-10',
            relation: 'child',
            gender: 'male',
            x: 525,
            y: 500,
            color: '#4299e1',
            photo_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005-128?w=150&h=150&fit=crop&crop=face',
            biography: 'Студент университета. Увлекается программированием.'
        },
        {
            id: 'person_4',
            tree_id: 'demo_tree_12345',
            first_name: 'Анна',
            last_name: 'Иванова',
            birth_date: '2008-07-22',
            relation: 'child',
            gender: 'female',
            x: 525,
            y: 550,
            color: '#d69e2e',
            photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
            biography: 'Школьница. Занимается танцами и рисованием.'
        }
    ];
    
    // Демо-события
    events = [
        {
            id: 'event_1',
            tree_id: 'demo_tree_12345',
            title: 'Свадьба Ивана и Марии',
            event_date: '2004-06-12',
            description: 'Торжественная церемония в московском загсе',
            created_by: 'demo_user_12345',
            created_at: '2023-01-15'
        },
        {
            id: 'event_2',
            tree_id: 'demo_tree_12345',
            title: 'Рождение Алексея',
            event_date: '2005-03-10',
            description: 'Родился первый ребенок в семье',
            created_by: 'demo_user_12345',
            created_at: '2023-01-16'
        },
        {
            id: 'event_3',
            tree_id: 'demo_tree_12345',
            title: 'Рождение Анны',
            event_date: '2008-07-22',
            description: 'Родилась дочь Анна',
            created_by: 'demo_user_12345',
            created_at: '2023-01-17'
        }
    ];
    
    // Демо-медиа
    media = [
        {
            id: 'media_1',
            tree_id: 'demo_tree_12345',
            name: 'Свадебное фото',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=200&fit=crop',
            description: 'Иван и Мария в день свадьбы',
            uploaded_by: 'demo_user_12345',
            uploaded_at: '2023-01-15'
        },
        {
            id: 'media_2',
            tree_id: 'demo_tree_12345',
            name: 'Семейный отдых',
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1529255484355-cb73c33c04bb?w=300&h=200&fit=crop',
            description: 'Отдых на море всей семьей',
            uploaded_by: 'demo_user_12345',
            uploaded_at: '2023-01-16'
        }
    ];
    
    // Настраиваем UI
    setupUserUI(currentUser);
    
    // Показываем уведомление
    window.showNotification('✅ Демо-режим активирован! Вы можете тестировать все функции приложения.', 'success');
}

// ========== ЗАГРУЗКА ДАННЫХ ==========

async function loadUserData() {
    if (!currentUser) return;
    
    window.showLoader('Загрузка данных...');
    
    try {
        // Если это демо-пользователь, не загружаем из Supabase
        if (currentUser.id === 'demo_user_12345') {
            updateStats();
            updatePeopleList();
            renderTimeline();
            renderMedia();
        } else {
            // Ищем дерево пользователя
            const { data: trees, error: treeError } = await window.supabaseClient
                .from('family_trees')
                .select('*')
                .eq('owner_id', currentUser.id)
                .limit(1);
            
            if (treeError) throw treeError;
            
            if (trees && trees.length > 0) {
                currentTree = trees[0];
                console.log('🌳 Дерево загружено:', currentTree.id);
                
                // Загружаем все данные
                await Promise.all([
                    loadPeople(),
                    loadEvents(),
                    loadMedia()
                ]);
                
                updateStats();
                updatePeopleList();
                
            } else {
                // Создаем новое дерево
                await createFamilyTree();
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        window.showNotification('Ошибка загрузки данных', 'error');
    } finally {
        window.hideLoader();
    }
}

async function createFamilyTree() {
    try {
        const { data: tree, error } = await window.supabaseClient
            .from('family_trees')
            .insert([
                {
                    name: 'Моя семья',
                    owner_id: currentUser.id,
                    members: [currentUser.id]
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        currentTree = tree;
        
        // Добавляем самого пользователя в дерево
        await addPerson({
            first_name: currentUser.user_metadata?.name?.split(' ')[0] || 'Я',
            last_name: currentUser.user_metadata?.name?.split(' ')[1] || '',
            relation: 'self',
            is_user: true,
            x: 400,
            y: 300,
            color: '#8b4513'
        });
        
        window.showNotification('✅ Семейное дерево создано!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка создания дерева:', error);
        throw error;
    }
}

async function loadPeople() {
    if (!currentTree) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('people')
            .select('*')
            .eq('tree_id', currentTree.id);
        
        if (error) throw error;
        
        people = data || [];
        console.log('👥 Загружено людей:', people.length);
        
        return people;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки людей:', error);
        return [];
    }
}

async function loadEvents() {
    if (!currentTree) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('events')
            .select('*')
            .eq('tree_id', currentTree.id)
            .order('event_date', { ascending: false });
        
        if (error) throw error;
        
        events = data || [];
        console.log('📅 Загружено событий:', events.length);
        
        renderTimeline();
        return events;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки событий:', error);
        return [];
    }
}

async function loadMedia() {
    if (!currentTree) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('media')
            .select('*')
            .eq('tree_id', currentTree.id)
            .order('uploaded_at', { ascending: false });
        
        if (error) throw error;
        
        media = data || [];
        console.log('🖼️ Загружено медиа:', media.length);
        
        renderMedia();
        return media;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки медиа:', error);
        return [];
    }
}

// ========== ДОБАВЛЕНИЕ ДАННЫХ ==========

async function handleAddPerson() {
    const firstName = document.getElementById('person-first-name').value.trim();
    const lastName = document.getElementById('person-last-name').value.trim();
    const birthDate = document.getElementById('person-birth-date').value;
    const relation = document.getElementById('person-relation').value;
    const biography = document.getElementById('person-bio').value.trim();
    
    if (!firstName || !lastName) {
        window.showNotification('Заполните имя и фамилию', 'error');
        return;
    }
    
    window.showLoader('Добавление человека...');
    
    try {
        await addPerson({
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate || null,
            relation: relation,
            biography: biography,
            x: 50 + (people.length % 5) * 180,
            y: 50 + Math.floor(people.length / 5) * 150,
            color: getRandomColor()
        });
        
        closeAllModals();
        window.showNotification('✅ Человек добавлен в древо!', 'success');
        
        await loadPeople();
        updateStats();
        updatePeopleList();
        
    } catch (error) {
        console.error('❌ Ошибка добавления человека:', error);
        window.showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

async function handleAddEvent() {
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value.trim();
    
    if (!title || !date) {
        window.showNotification('Заполните название и дату события', 'error');
        return;
    }
    
    window.showLoader('Добавление события...');
    
    try {
        // Для демо-режима
        if (currentUser.id === 'demo_user_12345') {
            events.push({
                id: 'event_' + Date.now(),
                tree_id: currentTree.id,
                title: title,
                event_date: date,
                description: description,
                created_by: currentUser.id,
                created_at: new Date().toISOString()
            });
            
            renderTimeline();
            updateStats();
            closeAllModals();
            window.showNotification('✅ Событие добавлено!', 'success');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('events')
            .insert([{
                tree_id: currentTree.id,
                title: title,
                event_date: date,
                description: description,
                created_by: currentUser.id
            }]);
        
        if (error) throw error;
        
        closeAllModals();
        window.showNotification('✅ Событие добавлено!', 'success');
        
        await loadEvents();
        updateStats();
        
    } catch (error) {
        console.error('❌ Ошибка добавления события:', error);
        window.showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

async function handleUpload() {
    const files = document.getElementById('upload-files').files;
    const description = document.getElementById('upload-description').value.trim();
    
    if (files.length === 0) {
        window.showNotification('Выберите файлы для загрузки', 'error');
        return;
    }
    
    window.showLoader('Загрузка файлов...');
    
    try {
        // Для демо-режима
        if (currentUser.id === 'demo_user_12345') {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    media.push({
                        id: 'media_' + Date.now() + i,
                        tree_id: currentTree.id,
                        name: file.name,
                        type: 'photo',
                        url: e.target.result,
                        description: description,
                        uploaded_by: currentUser.id,
                        uploaded_at: new Date().toISOString()
                    });
                    
                    if (i === files.length - 1) {
                        renderMedia();
                        updateStats();
                        closeAllModals();
                        window.showNotification('✅ Файлы успешно загружены!', 'success');
                        window.hideLoader();
                    }
                };
                
                reader.readAsDataURL(file);
            }
            return;
        }
        
        // Для реального режима (упрощенная версия)
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // В демо-режиме используем заглушку
            const fakeUrl = `https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(file.name)}`;
            
            const { error } = await window.supabaseClient
                .from('media')
                .insert([{
                    tree_id: currentTree.id,
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'photo' : 'document',
                    url: fakeUrl,
                    description: description,
                    uploaded_by: currentUser.id
                }]);
            
            if (error) throw error;
        }
        
        closeAllModals();
        window.showNotification('✅ Файлы успешно загружены!', 'success');
        
        await loadMedia();
        updateStats();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        window.showNotification('Ошибка загрузки: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

async function handleInvite() {
    const email = document.getElementById('invite-email').value.trim();
    const message = document.getElementById('invite-message').value.trim();
    
    if (!email) {
        window.showNotification('Введите email', 'error');
        return;
    }
    
    window.showLoader('Отправка приглашения...');
    
    try {
        const { error } = await window.supabaseClient
            .from('invitations')
            .insert([{
                tree_id: currentTree.id,
                email: email,
                message: message || 'Приглашаю вас присоединиться к нашему семейному древу!',
                invited_by: currentUser.id
            }]);
        
        if (error) throw error;
        
        closeAllModals();
        window.showNotification('✅ Приглашение отправлено!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка отправки приглашения:', error);
        window.showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

async function handleEditPerson() {
    const firstName = document.getElementById('edit-person-first-name').value.trim();
    const lastName = document.getElementById('edit-person-last-name').value.trim();
    const birthDate = document.getElementById('edit-person-birth-date').value;
    const deathDate = document.getElementById('edit-person-death-date').value;
    const relation = document.getElementById('edit-person-relation').value;
    const gender = document.getElementById('edit-person-gender').value;
    const biography = document.getElementById('edit-person-bio').value.trim();
    
    if (!firstName || !lastName) {
        window.showNotification('Заполните имя и фамилию', 'error');
        return;
    }
    
    window.showLoader('Сохранение изменений...');
    
    try {
        // Для демо-режима обновляем локально
        if (currentUser.id === 'demo_user_12345') {
            // Находим и обновляем человека
            const personIndex = people.findIndex(p => 
                p.first_name === firstName && p.last_name === lastName
            );
            
            if (personIndex !== -1) {
                people[personIndex] = {
                    ...people[personIndex],
                    first_name: firstName,
                    last_name: lastName,
                    birth_date: birthDate,
                    death_date: deathDate,
                    relation: relation,
                    gender: gender,
                    biography: biography
                };
            }
            
            closeAllModals();
            window.showNotification('✅ Изменения сохранены!', 'success');
            
            // Перестраиваем дерево если оно было построено
            if (window.treeEngine && window.treeEngine.treeData) {
                await window.treeEngine.autoBuildTree({
                    generations: window.treeEngine.generations,
                    style: window.treeEngine.layout,
                    centerPerson: 'self',
                    showPhotos: true,
                    showDates: true,
                    showLines: true
                });
            }
        } else {
            // Для реального режима
            window.showNotification('Редактирование в реальном режиме будет доступно позже', 'info');
        }
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        window.showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        window.hideLoader();
    }
}

async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const preview = document.getElementById('edit-person-photo-preview');
        if (preview) {
            preview.innerHTML = `<img src="${event.target.result}" alt="Превью">`;
        }
    };
    reader.readAsDataURL(file);
}

async function addPerson(personData) {
    // Для демо-режима
    if (currentUser.id === 'demo_user_12345') {
        const newPerson = {
            id: 'person_' + Date.now(),
            tree_id: currentTree.id,
            first_name: personData.first_name,
            last_name: personData.last_name,
            birth_date: personData.birth_date,
            relation: personData.relation,
            biography: personData.biography,
            x: personData.x,
            y: personData.y,
            color: personData.color,
            is_user: personData.is_user || false,
            user_id: personData.user_id || null,
            gender: personData.relation === 'spouse' ? (people.find(p => p.relation === 'self')?.gender === 'male' ? 'female' : 'male') : 'male'
        };
        
        people.push(newPerson);
        return newPerson;
    }
    
    // Для реального режима
    const { data, error } = await window.supabaseClient
        .from('people')
        .insert([{
            tree_id: currentTree.id,
            first_name: personData.first_name,
            last_name: personData.last_name,
            birth_date: personData.birth_date,
            relation: personData.relation,
            biography: personData.biography,
            x: personData.x,
            y: personData.y,
            color: personData.color,
            is_user: personData.is_user || false,
            user_id: personData.user_id || null
        }])
        .select();
    
    if (error) throw error;
    
    return data[0];
}

// ========== ОТОБРАЖЕНИЕ ДАННЫХ ==========

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    const empty = document.getElementById('timeline-empty');
    
    if (!container) return;
    
    if (events.length === 0) {
        if (empty) empty.style.display = 'flex';
        container.innerHTML = '';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    let html = '<div class="timeline">';
    
    events.forEach(event => {
        const date = new Date(event.event_date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        html += `
            <div class="timeline-event">
                <div class="timeline-event-date">${date}</div>
                <div class="timeline-event-content">
                    <h4>${event.title}</h4>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderMedia() {
    const container = document.getElementById('media-container');
    const empty = document.getElementById('media-empty');
    
    if (!container) return;
    
    if (media.length === 0) {
        if (empty) empty.style.display = 'flex';
        container.innerHTML = '';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    let html = '';
    
    media.forEach(item => {
        html += `
            <div class="media-item">
                <div class="media-item-image">
                    ${item.type === 'photo' ? 
                        `<img src="${item.url}" alt="${item.name}" loading="lazy">` :
                        `<i class="fas fa-file"></i>`
                    }
                </div>
                <div class="media-item-info">
                    <div class="media-item-name">${item.name}</div>
                    ${item.description ? `<div class="media-item-desc">${item.description}</div>` : ''}
                    <div class="media-item-date">${new Date(item.uploaded_at).toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateStats() {
    const elements = {
        'stat-people': people.length,
        'stat-events': events.length,
        'stat-media': media.length,
        'profile-stat-people': people.length,
        'profile-stat-events': events.length,
        'profile-stat-media': media.length
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function updatePeopleList() {
    const container = document.getElementById('people-list-container');
    
    if (!container) return;
    
    if (people.length === 0) {
        container.innerHTML = '<p class="empty-text">В древе пока никого нет</p>';
        return;
    }
    
    let html = '<div class="people-grid">';
    
    people.forEach(person => {
        html += `
            <div class="person-card">
                <div class="person-card-avatar" style="background-color: ${person.color || '#8b4513'}">
                    ${person.first_name?.[0] || '?'}
                </div>
                <div class="person-card-info">
                    <h4>${person.first_name || ''} ${person.last_name || ''}</h4>
                    <p>${getRelationLabel(person.relation)}</p>
                    ${person.birth_date ? `<p>🎂 ${new Date(person.birth_date).toLocaleDateString('ru-RU')}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function saveTreeAsImage() {
    const treeContainer = document.querySelector('.tree-container');
    if (!treeContainer) {
        window.showNotification('Дерево не найдено', 'error');
        return;
    }
    
    window.showLoader('Сохранение дерева...');
    
    if (typeof html2canvas !== 'undefined') {
        html2canvas(treeContainer, {
            backgroundColor: '#f8fafc',
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `family-tree-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            window.showNotification('✅ Дерево сохранено как картинка!', 'success');
            window.hideLoader();
        }).catch(error => {
            console.error('Ошибка сохранения картинки:', error);
            window.showNotification('Ошибка сохранения картинки', 'error');
            window.hideLoader();
        });
    } else {
        window.showNotification('Для сохранения картинки подключите библиотеку html2canvas', 'info');
        window.hideLoader();
    }
}

function printTree() {
    const treeContainer = document.querySelector('.tree-container');
    if (!treeContainer) {
        window.showNotification('Дерево не найдено', 'error');
        return;
    }
    
    window.showLoader('Подготовка к печати...');
    
    // Создаем временный iframe для печати
    const printContent = treeContainer.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="padding: 20px; max-width: 1000px; margin: 0 auto;">
            <h1 style="text-align: center; margin-bottom: 30px;">Генеалогическое древо</h1>
            <div style="background: white; padding: 20px; border-radius: 10px;">
                ${printContent}
            </div>
            <p style="text-align: center; margin-top: 30px; color: #666;">
                Создано в приложении "История моей семьи"<br>
                ${new Date().toLocaleDateString('ru-RU')}
            </p>
        </div>
    `;
    
    window.print();
    
    // Возвращаем исходное содержимое
    document.body.innerHTML = originalContent;
    
    // Переинициализируем обработчики
    setupAllEventListeners();
    
    window.hideLoader();
    window.showNotification('✅ Готово к печати!', 'success');
}

function getRandomColor() {
    const colors = ['#8b4513', '#d2691e', '#a0522d', '#cd853f', '#d2b48c', '#bc8f8f', '#deb887'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getAuthErrorMessage(errorMessage) {
    const messages = {
        'User already registered': 'Этот email уже используется',
        'Invalid email': 'Неверный формат email',
        'Email not confirmed': 'Email не подтвержден',
        'Invalid login credentials': 'Неверный email или пароль',
        'Weak password': 'Пароль слишком слабый (минимум 6 символов)',
        'User not found': 'Пользователь не найден',
        'Too many requests': 'Слишком много попыток. Попробуйте позже'
    };
    
    for (const [key, value] of Object.entries(messages)) {
        if (errorMessage.includes(key)) return value;
    }
    
    return 'Произошла ошибка. Попробуйте еще раз';
}

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========

function showPage(pageId) {
    console.log('📄 Переключение на страницу:', pageId);
    
    // Скрываем все страницы
    ['home', 'tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page');
        if (element) element.classList.add('hidden');
    });
    
    // Показываем выбранную страницу
    const pageElement = document.getElementById(pageId + '-page');
    if (pageElement) {
        pageElement.classList.remove('hidden');
        
        // Если это страница дерева и есть данные, показываем их
        if (pageId === 'tree' && people.length > 0) {
            updatePeopleList();
        }
    }
    
    // Скрываем мобильное меню
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('active');
}

function zoomIn() {
    const container = document.getElementById('tree-visualization-container');
    if (container) {
        const currentScale = parseFloat(container.style.transform?.replace('scale(', '')?.replace(')', '') || 1);
        container.style.transform = `scale(${currentScale + 0.1})`;
    }
}

function zoomOut() {
    const container = document.getElementById('tree-visualization-container');
    if (container) {
        const currentScale = parseFloat(container.style.transform?.replace('scale(', '')?.replace(')', '') || 1);
        if (currentScale > 0.5) {
            container.style.transform = `scale(${currentScale - 0.1})`;
        }
    }
}

function resetTree() {
    const container = document.getElementById('tree-visualization-container');
    if (container) {
        container.style.transform = 'scale(1)';
        container.style.left = '0px';
        container.style.top = '0px';
    }
}

function fitTree() {
    const container = document.getElementById('tree-visualization-container');
    if (container) {
        container.style.transform = 'scale(0.8)';
        container.style.left = '50px';
        container.style.top = '50px';
    }
}

function setTreeView(view) {
    // Обновляем активные кнопки
    document.querySelectorAll('.view-controls .btn-small').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${view}-view-btn`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Если есть построенное дерево, перестраиваем с новым видом
    if (window.treeEngine && window.treeEngine.treeData) {
        window.treeEngine.autoBuildTree({
            generations: window.treeEngine.generations,
            style: view,
            centerPerson: 'self',
            showPhotos: true,
            showDates: true,
            showLines: true
        });
    }
}

function editProfile() {
    window.showNotification('Редактирование профиля в разработке', 'info');
}

function showHelp() {
    window.showNotification('Раздел помощи в разработке', 'info');
}

function filterMedia() {
    const filter = document.getElementById('media-filter').value;
    window.showNotification(`Фильтр: ${filter}`, 'info');
}

// Экспортируем функции для HTML
window.selectPerson = (personId) => {
    const allPeople = window.treeEngine?.collectAllPeople(window.treeEngine.treeData) || [];
    const person = allPeople.find(p => p.id === personId) || people.find(p => p.id === personId);
    
    if (person) {
        window.showNotification(`Выбран: ${person.first_name} ${person.last_name}`, 'info');
    }
};

window.openModal = openModal;
window.closeAllModals = closeAllModals;