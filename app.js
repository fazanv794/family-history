// app.js - Общие функции для всех страниц

console.log('📱 App.js загружается...');

// Проверяем зависимости
if (typeof supabase === 'undefined') {
    console.error('Supabase SDK не загружен!');
}

// Глобальные переменные
window.currentUser = null;
window.people = [];
window.events = [];
window.media = [];

// Инициализация для всех страниц
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Инициализация страницы...');
    
    try {
        // Проверяем авторизацию для защищенных страниц
        await checkAuthForProtectedPages();
        
        // Настраиваем общие обработчики событий
        setupCommonEventListeners();
        
        // Обновляем UI пользователя
        updateUserUI();
        
        // Загружаем данные если пользователь авторизован
        if (window.currentUser) {
            await loadUserData();
        }
        
        console.log('✅ Страница инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
});

// Проверка авторизации для защищенных страниц
async function checkAuthForProtectedPages() {
    const protectedPages = ['app.html', 'tree.html', 'timeline.html', 'media.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (protectedPages.includes(currentPage)) {
        console.log('🔒 Проверка авторизации для защищенной страницы:', currentPage);
        
        try {
            const { data: { user }, error } = await window.supabaseClient?.auth.getUser();
            
            if (error) {
                console.error('Ошибка проверки авторизации:', error);
                redirectToAuth();
                return;
            }
            
            if (!user) {
                console.log('Пользователь не авторизован, перенаправляем...');
                redirectToAuth();
                return;
            }
            
            window.currentUser = user;
            console.log('✅ Пользователь авторизован:', user.email);
            
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            redirectToAuth();
        }
    }
}

// Перенаправление на страницу авторизации
function redirectToAuth() {
    // Сохраняем текущую страницу для возврата после авторизации
    const currentPage = window.location.pathname;
    if (currentPage !== '/index.html' && currentPage !== '/auth.html') {
        sessionStorage.setItem('returnUrl', currentPage);
    }
    
    window.location.href = 'auth.html';
}

// Обновление UI пользователя
function updateUserUI() {
    if (!window.currentUser) {
        // Для неавторизованных пользователей
        const usernameElements = document.querySelectorAll('#username, .profile-name');
        usernameElements.forEach(el => {
            if (el.id === 'username' || el.classList.contains('profile-name')) {
                el.textContent = 'Гость';
            }
        });
        
        const avatarElements = document.querySelectorAll('#user-avatar, #profile-avatar, .avatar');
        avatarElements.forEach(el => {
            if (el.id === 'user-avatar' || el.id === 'profile-avatar' || el.classList.contains('avatar')) {
                el.textContent = 'Г';
            }
        });
        return;
    }
    
    const displayName = window.currentUser.user_metadata?.name || 
                       window.currentUser.user_metadata?.full_name || 
                       window.currentUser.email?.split('@')[0] || 
                       'Пользователь';
    
    // Обновляем имя пользователя везде, где есть элемент
    const usernameElements = document.querySelectorAll('#username, .profile-name');
    usernameElements.forEach(el => {
        if (el.id === 'username' || el.classList.contains('profile-name')) {
            el.textContent = displayName;
        }
    });
    
    // Обновляем аватар везде, где есть элемент
    const avatarElements = document.querySelectorAll('#user-avatar, #profile-avatar, .avatar');
    avatarElements.forEach(el => {
        if (el.id === 'user-avatar' || el.id === 'profile-avatar' || el.classList.contains('avatar')) {
            el.textContent = getUserInitials(displayName);
        }
    });
    
    // Обновляем email в профиле
    const emailElements = document.querySelectorAll('#profile-email, #info-email');
    emailElements.forEach(el => {
        if (el.id === 'profile-email' || el.id === 'info-email') {
            el.textContent = window.currentUser.email;
        }
    });
    
    // Обновляем ID пользователя
    const userIdElement = document.getElementById('info-user-id');
    if (userIdElement && window.currentUser.id) {
        userIdElement.textContent = window.currentUser.id.substring(0, 8) + '...';
    }
    
    // Обновляем дату регистрации
    const regDateElement = document.getElementById('info-reg-date');
    if (regDateElement && window.currentUser.created_at) {
        const date = new Date(window.currentUser.created_at);
        regDateElement.textContent = date.toLocaleDateString('ru-RU');
    }
}

// Получение инициалов пользователя
function getUserInitials(name) {
    const parts = name.split(' ');
    let initials = '';
    
    if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1) {
        initials = parts[0].substring(0, 2).toUpperCase();
    }
    
    return initials || 'П';
}

// Настройка общих обработчиков событий
function setupCommonEventListeners() {
    console.log('🔄 Настройка обработчиков событий...');
    
    // Мобильное меню
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Кнопка выхода
    const logoutBtns = document.querySelectorAll('#logout-btn, #logout-profile-btn, .logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
    
    // Закрытие модальных окон
    setupModalHandlers();
    
    // Кнопки демо на лендинге
    setupLandingDemoButtons();
    
    // Навигация в шапке приложения
    setupAppNavigation();
    
    // Формы
    setupFormHandlers();
    
    // Обработчики для модальных окон
    setupModalCloseHandlers();
}

// Мобильное меню
function toggleMobileMenu() {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Настройка обработчиков модальных окон
function setupModalHandlers() {
    // Закрытие по кнопке закрытия
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || 
            e.target.classList.contains('cancel-btn') ||
            e.target.closest('.modal-close') ||
            e.target.closest('.cancel-btn')) {
            closeAllModals();
        }
    });
    
    // Закрытие по клику на оверлей
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeAllModals);
    }
}

// Настройка кнопок демо на лендинге
function setupLandingDemoButtons() {
    document.querySelectorAll('.feature-demo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feature = e.target.dataset.feature || e.target.closest('.feature-demo-btn').dataset.feature;
            showFeatureDemo(feature);
        });
    });
    
    const watchDemoBtn = document.getElementById('watch-demo-btn');
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', () => {
            window.showNotification('Для тестирования зарегистрируйтесь или войдите в аккаунт', 'info');
        });
    }
}

// Настройка навигации в приложении
function setupAppNavigation() {
    // Активный пункт меню
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === 'app.html' && linkPage === 'app.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Настройка обработчиков форм
function setupFormHandlers() {
    // Форма добавления человека
    const addPersonForm = document.getElementById('add-person-form-modal');
    if (addPersonForm) {
        addPersonForm.addEventListener('submit', handleAddPerson);
    }
    
    // Форма добавления события
    const addEventForm = document.getElementById('add-event-form-modal');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }
    
    // Форма загрузки медиа
    const uploadForm = document.getElementById('upload-form-modal');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadMedia);
        
        // Кнопка выбора файлов
        const browseBtn = document.getElementById('browse-files-btn');
        const fileInput = document.getElementById('upload-files');
        
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', showSelectedFiles);
        }
    }
    
    // Форма приглашения
    const inviteForm = document.getElementById('invite-form-modal');
    if (inviteForm) {
        inviteForm.addEventListener('submit', handleInvite);
    }
    
    // Форма редактирования профиля
    const editProfileForm = document.getElementById('edit-profile-form-modal');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
}

// Настройка обработчиков закрытия модальных окон
function setupModalCloseHandlers() {
    // Закрытие по клику на оверлей
    document.getElementById('modal-overlay')?.addEventListener('click', closeAllModals);
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Показать модальное окно
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        // Заполняем данные если нужно
        if (modalId === 'edit-profile-modal' && window.currentUser) {
            const nameParts = (window.currentUser.user_metadata?.name || '').split(' ');
            document.getElementById('edit-profile-name').value = nameParts[0] || '';
            document.getElementById('edit-profile-last-name').value = nameParts.slice(1).join(' ') || '';
            document.getElementById('edit-profile-email').value = window.currentUser.email || '';
        }
        
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Закрыть все модальные окна
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    
    document.body.style.overflow = '';
    
    // Сбрасываем формы
    document.querySelectorAll('form').forEach(form => form.reset());
    
    // Очищаем список файлов
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.style.display = 'none';
    
    const filesList = document.getElementById('selected-files-list');
    if (filesList) filesList.innerHTML = '';
}

// Выход из системы
async function handleLogout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        window.showNotification('✅ Выход выполнен', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
        window.showNotification('Ошибка выхода из системы', 'error');
    }
}

// Добавление человека
async function handleAddPerson(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('person-first-name').value;
    const lastName = document.getElementById('person-last-name').value;
    const birthDate = document.getElementById('person-birth-date').value;
    const deathDate = document.getElementById('person-death-date').value;
    const gender = document.getElementById('person-gender').value;
    const relation = document.getElementById('person-relation').value;
    const photoUrl = document.getElementById('person-photo-url').value;
    const biography = document.getElementById('person-bio').value;
    
    if (!firstName || !lastName || !gender || !relation) {
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
            user_id: window.currentUser.id
        };
        
        // Для демо-режима - добавляем в локальный массив
        if (!window.supabaseClient || !window.supabaseClient.from) {
            // Демо-режим
            newPerson.id = 'person_' + Date.now();
            newPerson.created_at = new Date().toISOString();
            window.people.push(newPerson);
            
            window.showNotification('✅ Человек успешно добавлен! (демо-режим)', 'success');
            closeAllModals();
            
            // Обновляем статистику на главной странице
            if (window.updateStats) {
                window.updateStats();
            }
            
            // Обновляем дерево если мы на странице дерева
            if (window.autoBuildTree && window.location.pathname.includes('tree.html')) {
                setTimeout(() => {
                    window.autoBuildTree();
                }, 500);
            }
            
            return;
        }
        
        // Реальный режим - сохраняем в Supabase
        const { data, error } = await window.supabaseClient
            .from('people')
            .insert([newPerson])
            .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
            window.people.push(data[0]);
            
            window.showNotification('✅ Человек успешно добавлен!', 'success');
            closeAllModals();
            
            // Обновляем статистику на главной странице
            if (window.updateStats) {
                window.updateStats();
            }
            
            // Обновляем дерево если мы на странице дерева
            if (window.autoBuildTree && window.location.pathname.includes('tree.html')) {
                setTimeout(() => {
                    window.autoBuildTree();
                }, 500);
            }
        }
        
    } catch (error) {
        console.error('Ошибка добавления человека:', error);
        window.showNotification('Ошибка добавления человека', 'error');
    } finally {
        window.hideLoader();
    }
}

// Добавление события
async function handleAddEvent(e) {
    e.preventDefault();
    
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
            user_id: window.currentUser.id
        };
        
        // Для демо-режима
        if (!window.supabaseClient || !window.supabaseClient.from) {
            newEvent.id = 'event_' + Date.now();
            newEvent.created_at = new Date().toISOString();
            window.events.unshift(newEvent);
            
            window.showNotification('✅ Событие успешно добавлено! (демо-режим)', 'success');
            closeAllModals();
            
            // Обновляем ленту событий
            if (window.updateTimeline && window.location.pathname.includes('timeline.html')) {
                window.updateTimeline();
            }
            
            // Обновляем главную страницу
            if (window.updateRecentEvents && window.location.pathname.includes('app.html')) {
                window.updateRecentEvents();
            }
            
            // Обновляем статистику
            if (window.updateStats) {
                window.updateStats();
            }
            
            return;
        }
        
        // Реальный режим
        const { data, error } = await window.supabaseClient
            .from('events')
            .insert([newEvent])
            .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
            window.events.unshift(data[0]);
            
            window.showNotification('✅ Событие успешно добавлено!', 'success');
            closeAllModals();
            
            // Обновляем ленту событий если мы на странице событий
            if (window.updateTimeline && window.location.pathname.includes('timeline.html')) {
                window.updateTimeline();
            }
            
            // Обновляем главную страницу если мы на ней
            if (window.updateRecentEvents && window.location.pathname.includes('app.html')) {
                window.updateRecentEvents();
            }
            
            // Обновляем статистику
            if (window.updateStats) {
                window.updateStats();
            }
        }
        
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        window.showNotification('Ошибка добавления события', 'error');
    } finally {
        window.hideLoader();
    }
}

// Загрузка медиа
async function handleUploadMedia(e) {
    e.preventDefault();
    
    const filesInput = document.getElementById('upload-files');
    const description = document.getElementById('upload-description').value;
    
    if (!filesInput.files || filesInput.files.length === 0) {
        window.showNotification('Выберите файлы для загрузки', 'error');
        return;
    }
    
    window.showLoader('Загрузка файлов...');
    
    try {
        const files = Array.from(filesInput.files);
        const newMediaItems = [];
        
        for (const file of files) {
            // В реальном приложении здесь загрузка в Supabase Storage
            const fakeUrl = `https://via.placeholder.com/300/667eea/ffffff?text=${encodeURIComponent(file.name.split('.')[0])}`;
            
            const mediaItem = {
                file_url: fakeUrl,
                file_type: file.type.startsWith('image/') ? 'image' : 'file',
                description: description || file.name,
                user_id: window.currentUser.id
            };
            
            newMediaItems.push(mediaItem);
        }
        
        // Для демо-режима
        if (!window.supabaseClient || !window.supabaseClient.from) {
            newMediaItems.forEach(item => {
                item.id = 'media_' + Date.now() + Math.random();
                item.created_at = new Date().toISOString();
                window.media.unshift(item);
            });
            
            window.showNotification(`✅ Загружено ${files.length} файлов! (демо-режим)`, 'success');
            closeAllModals();
            
            // Обновляем медиатеку если мы на странице медиа
            if (window.updateMediaGrid && window.location.pathname.includes('media.html')) {
                window.updateMediaGrid();
            }
            
            // Обновляем статистику
            if (window.updateStats) {
                window.updateStats();
            }
            
            return;
        }
        
        // Реальный режим
        const { data, error } = await window.supabaseClient
            .from('media')
            .insert(newMediaItems)
            .select();
        
        if (error) throw error;
        
        if (data) {
            window.media.unshift(...data);
            
            window.showNotification(`✅ Загружено ${files.length} файлов!`, 'success');
            closeAllModals();
            
            // Обновляем медиатеку если мы на странице медиа
            if (window.updateMediaGrid && window.location.pathname.includes('media.html')) {
                window.updateMediaGrid();
            }
            
            // Обновляем статистику
            if (window.updateStats) {
                window.updateStats();
            }
        }
        
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        window.showNotification('Ошибка загрузки файлов', 'error');
    } finally {
        window.hideLoader();
    }
}

// Приглашение родственника
async function handleInvite(e) {
    e.preventDefault();
    
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
        // Для демо-режима
        window.showNotification('✅ Приглашение отправлено на ' + email + ' (демо-режим)', 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка отправки приглашения:', error);
        window.showNotification('Ошибка отправки приглашения', 'error');
    } finally {
        window.hideLoader();
    }
}

// Редактирование профиля
async function handleEditProfile(e) {
    e.preventDefault();
    
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
        // Для демо-режима
        window.showNotification('✅ Профиль успешно обновлен! (демо-режим)', 'success');
        
        // Обновляем данные пользователя
        if (window.currentUser) {
            window.currentUser.user_metadata = {
                ...window.currentUser.user_metadata,
                name: name,
                full_name: lastName ? `${name} ${lastName}` : name
            };
            window.currentUser.email = email;
        }
        
        // Обновляем UI
        updateUserUI();
        
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        window.showNotification('Ошибка обновления профиля', 'error');
    } finally {
        window.hideLoader();
    }
}

// Показать выбранные файлы
function showSelectedFiles() {
    const filesInput = document.getElementById('upload-files');
    const fileList = document.getElementById('file-list');
    const listContainer = document.getElementById('selected-files-list');
    
    if (!filesInput || !fileList || !listContainer) return;
    
    const files = filesInput.files;
    
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

// Демо функций
function showFeatureDemo(feature) {
    const demos = {
        'tree': 'Демо построения генеалогического древа',
        'media': 'Демо загрузки семейных фотографий',
        'timeline': 'Демо ленты семейных событий',
        'chat': 'Демо семейного чата',
        'print': 'Демо печати генеалогического древа',
        'notifications': 'Демо умных уведомлений'
    };
    
    const message = demos[feature] || 'Демо функции';
    window.showNotification(message, 'info');
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        if (!window.currentUser) {
            generateDemoData();
            return;
        }
        
        window.showLoader('Загрузка данных...');
        
        const userId = window.currentUser.id;
        
        // Для демо-режима
        if (!window.supabaseClient || !window.supabaseClient.from) {
            console.log('📦 Используем демо-данные');
            generateDemoData();
            
            // Вызываем функции обновления UI для конкретных страниц
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            }
            
            if (typeof window.updateRecentEvents === 'function') {
                window.updateRecentEvents();
            }
            
            if (typeof window.updateTimeline === 'function') {
                window.updateTimeline();
            }
            
            if (typeof window.updateMediaGrid === 'function') {
                window.updateMediaGrid();
            }
            
            if (typeof window.updateTreeStats === 'function') {
                window.updateTreeStats();
            }
            
            window.showNotification('✅ Демо-данные загружены', 'success');
            window.hideLoader();
            return;
        }
        
        // Реальный режим - загрузка из Supabase
        console.log('📦 Загрузка данных из Supabase...');
        
        // Загрузка людей
        const { data: peopleData, error: peopleError } = await window.supabaseClient
            .from('people')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        
        if (peopleError) {
            console.warn('Ошибка загрузки людей:', peopleError);
            throw peopleError;
        }
        
        window.people = peopleData || [];
        
        // Если нет людей, создаем запись для самого пользователя
        if (window.people.length === 0) {
            const selfPerson = {
                first_name: window.currentUser.user_metadata?.name?.split(' ')[0] || 'Я',
                last_name: window.currentUser.user_metadata?.name?.split(' ')[1] || '',
                relation: 'self',
                user_id: userId,
                gender: 'male'
            };
            
            console.log('👤 Создаем запись пользователя...');
            
            const { data: newPerson, error: insertError } = await window.supabaseClient
                .from('people')
                .insert([selfPerson])
                .select();
            
            if (!insertError && newPerson) {
                window.people.push(newPerson[0]);
            }
        }
        
        // Загрузка событий
        const { data: eventsData, error: eventsError } = await window.supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (eventsError) {
            console.warn('Ошибка загрузки событий:', eventsError);
            throw eventsError;
        }
        
        window.events = eventsData || [];
        
        // Загрузка медиа
        const { data: mediaData, error: mediaError } = await window.supabaseClient
            .from('media')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (mediaError) {
            console.warn('Ошибка загрузки медиа:', mediaError);
            throw mediaError;
        }
        
        window.media = mediaData || [];
        
        console.log('✅ Данные загружены:', {
            people: window.people.length,
            events: window.events.length,
            media: window.media.length
        });
        
        // Вызываем функции обновления UI для конкретных страниц
        if (typeof window.updateStats === 'function') {
            window.updateStats();
        }
        
        if (typeof window.updateRecentEvents === 'function') {
            window.updateRecentEvents();
        }
        
        if (typeof window.updateTimeline === 'function') {
            window.updateTimeline();
        }
        
        if (typeof window.updateMediaGrid === 'function') {
            window.updateMediaGrid();
        }
        
        if (typeof window.updateTreeStats === 'function') {
            window.updateTreeStats();
        }
        
        window.showNotification('✅ Данные загружены', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        window.showNotification('Ошибка загрузки данных. Используем демо-режим.', 'error');
        
        // Используем демо-данные при ошибке
        generateDemoData();
        
        // Вызываем функции обновления UI для конкретных страниц
        if (typeof window.updateStats === 'function') {
            window.updateStats();
        }
        
        if (typeof window.updateRecentEvents === 'function') {
            window.updateRecentEvents();
        }
        
        if (typeof window.updateTimeline === 'function') {
            window.updateTimeline();
        }
        
        if (typeof window.updateMediaGrid === 'function') {
            window.updateMediaGrid();
        }
        
        if (typeof window.updateTreeStats === 'function') {
            window.updateTreeStats();
        }
    } finally {
        window.hideLoader();
    }
}

// Генерация демо-данных
function generateDemoData() {
    console.log('🔄 Генерация демо-данных...');
    
    window.people = [
        {
            id: '1',
            first_name: 'Иван',
            last_name: 'Иванов',
            birth_date: '1990-01-15',
            gender: 'male',
            relation: 'self',
            photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            biography: 'Основатель семейного древа. Увлечен историей своей семьи.',
            created_at: '2024-01-01T10:00:00Z'
        },
        {
            id: '2',
            first_name: 'Мария',
            last_name: 'Иванова',
            birth_date: '1992-03-22',
            gender: 'female',
            relation: 'spouse',
            spouse_id: '1',
            photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b786d4d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            created_at: '2024-01-02T10:00:00Z'
        },
        {
            id: '3',
            first_name: 'Алексей',
            last_name: 'Иванов',
            birth_date: '2015-07-10',
            gender: 'male',
            relation: 'child',
            parent_id: '1',
            photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            created_at: '2024-01-03T10:00:00Z'
        },
        {
            id: '4',
            first_name: 'Анна',
            last_name: 'Иванова',
            birth_date: '2018-11-05',
            gender: 'female',
            relation: 'child',
            parent_id: '1',
            photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            created_at: '2024-01-04T10:00:00Z'
        }
    ];
    
    const today = new Date();
    window.events = [
        {
            id: '1',
            title: 'День рождения Алексея',
            date: new Date(today.getFullYear(), 6, 10).toISOString().split('T')[0],
            event_type: 'birthday',
            description: 'Празднование дня рождения сына',
            created_at: '2024-01-01T10:00:00Z'
        },
        {
            id: '2',
            title: 'Семейный пикник',
            date: new Date(today.getFullYear(), 7, 15).toISOString().split('T')[0],
            event_type: 'holiday',
            description: 'Ежегодный семейный пикник в лесу',
            created_at: '2024-01-02T10:00:00Z'
        },
        {
            id: '3',
            title: 'Годовщина свадьбы',
            date: new Date(today.getFullYear(), 5, 30).toISOString().split('T')[0],
            event_type: 'anniversary',
            description: '10 лет совместной жизни',
            created_at: '2024-01-03T10:00:00Z'
        }
    ];
    
    window.media = [
        {
            id: '1',
            file_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            file_type: 'image',
            description: 'Семейный портрет на природе',
            created_at: '2024-01-01T10:00:00Z'
        },
        {
            id: '2',
            file_url: 'https://images.unsplash.com/photo-1529255484355-cb73c33c04bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            file_type: 'image',
            description: 'Дети играют в парке',
            created_at: '2024-01-02T10:00:00Z'
        },
        {
            id: '3',
            file_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            file_type: 'image',
            description: 'Семейный ужин',
            created_at: '2024-01-03T10:00:00Z'
        }
    ];
}

// Функции для обновления статистики (для главной страницы)
function updateStats() {
    const peopleCount = window.people?.length || 0;
    const eventsCount = window.events?.length || 0;
    const mediaCount = window.media?.length || 0;
    
    const statPeople = document.getElementById('stat-people');
    const statEvents = document.getElementById('stat-events');
    const statMedia = document.getElementById('stat-media');
    const statGenerations = document.getElementById('stat-generations');
    
    if (statPeople) statPeople.textContent = peopleCount;
    if (statEvents) statEvents.textContent = eventsCount;
    if (statMedia) statMedia.textContent = mediaCount;
    if (statGenerations) statGenerations.textContent = calculateGenerations();
}

function calculateGenerations() {
    const people = window.people || [];
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
    
    const events = window.events || [];
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

// Экспортируем функции
window.showModal = showModal;
window.closeAllModals = closeAllModals;
window.loadUserData = loadUserData;
window.updateStats = updateStats;
window.updateRecentEvents = updateRecentEvents;
window.getEventIcon = getEventIcon;
window.calculateGenerations = calculateGenerations;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLogout = handleLogout;
window.getUserInitials = getUserInitials;
window.updateUserUI = updateUserUI;

console.log('✅ App.js загружен');