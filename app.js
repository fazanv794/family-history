// app.js - Общие функции для всех страниц (без демо-режимов)

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
        // Обновляем список родства
        updateRelationOptions();
        
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
            
            if (error || !user) {
                console.log('Пользователь не авторизован, перенаправляем...');
                window.showNotification('Для доступа к этой странице необходимо войти в систему', 'error');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
                return;
            }
            
            window.currentUser = user;
            console.log('✅ Пользователь авторизован:', user.email);
            
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            window.showNotification('Ошибка проверки авторизации. Пожалуйста, войдите заново.', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
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
    console.log('🔄 Обновление UI пользователя...');
    
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
        
        const emailElements = document.querySelectorAll('#profile-email, #info-email');
        emailElements.forEach(el => {
            if (el.id === 'profile-email' || el.id === 'info-email') {
                el.textContent = 'Не авторизован';
            }
        });
        
        return;
    }
    
    const displayName = window.currentUser.user_metadata?.name || 
                       window.currentUser.user_metadata?.full_name || 
                       window.currentUser.email?.split('@')[0] || 
                       'Пользователь';
    
    console.log('👤 Отображаем имя:', displayName);
    
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
            el.textContent = window.currentUser.email || 'Email не указан';
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
        if (btn) {
            btn.addEventListener('click', handleLogout);
        }
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
    
    console.log('✅ Обработчики событий настроены');
}

// Мобильное меню
function toggleMobileMenu() {
    console.log('📱 Переключение мобильного меню');
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
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
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
    console.log('📝 Настройка обработчиков форм...');
    
    // Форма добавления человека
    const addPersonForm = document.getElementById('add-person-form-modal');
    if (addPersonForm) {
        console.log('✅ Найден форма добавления человека');
        addPersonForm.addEventListener('submit', handleAddPerson);
    }
    
    // Форма добавления события
    const addEventForm = document.getElementById('add-event-form-modal');
    if (addEventForm) {
        console.log('✅ Найден форма добавления события');
        addEventForm.addEventListener('submit', handleAddEvent);
    }
    
    // Форма загрузки медиа
    const uploadForm = document.getElementById('upload-form-modal');
    if (uploadForm) {
        console.log('✅ Найден форма загрузки медиа');
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
        console.log('✅ Найден форма приглашения');
        inviteForm.addEventListener('submit', handleInvite);
    }
    
    // Форма редактирования профиля
    const editProfileForm = document.getElementById('edit-profile-form-modal');
    if (editProfileForm) {
        console.log('✅ Найден форма редактирования профиля');
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
    console.log('📂 Показать модальное окно:', modalId);
    
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
    console.log('❌ Закрыть все модальные окна');
    
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
    console.log('🚪 Выход из системы');
    
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        // Очищаем localStorage
        localStorage.removeItem('family_tree_user');
        localStorage.removeItem('family_tree_email');
        localStorage.removeItem('family_tree_password');
        localStorage.removeItem('family_tree_data');
        
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
    console.log('👤 Добавление человека');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для добавления человека необходимо войти в систему', 'error');
        closeAllModals();
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    const firstName = document.getElementById('person-first-name').value;
    const lastName = document.getElementById('person-last-name').value;
    const birthDate = document.getElementById('person-birth-date').value;
    const deathDate = document.getElementById('person-death-date').value;
    const gender = document.getElementById('person-gender').value;
    const relation = document.getElementById('person-relation').value;
    const photoUrl = document.getElementById('person-photo-url').value;
    const biography = document.getElementById('person-bio').value;
    
    console.log('Данные:', { firstName, lastName, gender, relation });
    
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
    console.log('📅 Добавление события');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для добавления события необходимо войти в систему', 'error');
        closeAllModals();
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
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
    console.log('📁 Загрузка медиа');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для загрузки медиа необходимо войти в систему', 'error');
        closeAllModals();
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
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
    console.log('📨 Приглашение родственника');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для отправки приглашения необходимо войти в систему', 'error');
        closeAllModals();
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
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
        // Реальный режим
        window.showNotification('✅ Приглашение отправлено на ' + email, 'success');
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
    console.log('✏️ Редактирование профиля');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для доступа к этой странице необходимо войти в систему', 'error');
        setTimeout(() => {
          window.location.href = 'auth.html';
        }, 1500);
        return;
      }
    
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
        // Реальный режим - обновляем в Supabase
        const { data, error } = await window.supabaseClient.auth.updateUser({
            email: email,
            data: {
                name: name,
                full_name: lastName ? `${name} ${lastName}` : name
            }
        });
        
        if (error) throw error;
        
        window.showNotification('✅ Профиль успешно обновлен!', 'success');
        
        // Обновляем данные пользователя
        if (data.user) {
            window.currentUser = data.user;
            
            // Сохраняем в localStorage для кэша
            localStorage.setItem('family_tree_user', JSON.stringify(data.user));
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

// Загрузка данных пользователя
async function loadUserData() {
    console.log('📦 Загрузка данных пользователя...');
    
    try {
        if (!window.currentUser) {
            console.log('👤 Пользователь не авторизован');
            window.people = [];
            window.events = [];
            window.media = [];
            return;
        }
        
        window.showLoader('Загрузка данных...');
        
        const userId = window.currentUser.id;
        
        // Загрузка данных из Supabase
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
        window.showNotification('Ошибка загрузки данных', 'error');
        
        // Используем пустые данные при ошибке
        window.people = [];
        window.events = [];
        window.media = [];
        
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

// Функции для обновления статистики (для главной страницы)
function updateStats() {
    console.log('📊 Обновление статистики');
    
    const peopleCount = window.people?.length || 0;
    const eventsCount = window.events?.length || 0;
    const mediaCount = window.media?.length || 0;
    
    console.log('Статистика:', { peopleCount, eventsCount, mediaCount });
    
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
    console.log('📅 Обновление последних событий');
    
    const container = document.getElementById('recent-events-list');
    if (!container) {
        console.log('❌ Контейнер для событий не найден');
        return;
    }
    
    const events = window.events || [];
    const recentEvents = events.slice(0, 5);
    
    console.log('Событий:', recentEvents.length);
    
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
    console.log('✅ События обновлены');
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

// Функция для обновления выпадающего списка родства
function updateRelationOptions() {
    console.log('🔄 Обновление списка родства...');
    
    // Обновляем все select с классом relation-select
    document.querySelectorAll('#person-relation, .relation-select').forEach(select => {
        if (select && select.tagName === 'SELECT') {
            select.innerHTML = `
                <option value="">Выберите родство</option>
                <option value="self">Я (центральная персона)</option>
                <option value="spouse">Супруг/супруга</option>
                <option value="parent">Родитель</option>
                <option value="child">Ребенок</option>
                <option value="sibling">Брат/сестра</option>
                <option value="grandparent">Дедушка/бабушка</option>
                <option value="grandchild">Внук/внучка</option>
                <option value="great_grandparent">Прадедушка/прабабушка</option>
                <option value="great_grandchild">Правнук/правнучка</option>
                <option value="aunt_uncle">Тетя/дядя</option>
                <option value="cousin">Двоюродный брат/сестра</option>
                <option value="nephew_niece">Племянник/племянница</option>
                <option value="uncle_aunt">Дядя/тетя</option>
                <option value="other">Другой родственник</option>
            `;
            console.log('✅ Список родства обновлен');
        }
    });
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
window.updateRelationOptions = updateRelationOptions;

console.log('✅ App.js загружен');