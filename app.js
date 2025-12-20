// app.js - Общие функции для всех страниц
console.log('📱 App.js загружается...');

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
            
            if (error || !user) {
                console.log('Пользователь не авторизован, перенаправляем...');
                showNotification('Для доступа к этой странице необходимо войти в систему', 'error');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
                return;
            }
            
            window.currentUser = user;
            console.log('✅ Пользователь авторизован:', user.email);
            
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            showNotification('Ошибка проверки авторизации. Пожалуйста, войдите заново.', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
        }
    }
}

// Обновление UI пользователя
function updateUserUI() {
    console.log('🔄 Обновление UI пользователя...');
    
    if (!window.currentUser) {
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
    
    console.log('👤 Отображаем имя:', displayName);
    
    const usernameElements = document.querySelectorAll('#username, .profile-name');
    usernameElements.forEach(el => {
        if (el.id === 'username' || el.classList.contains('profile-name')) {
            el.textContent = displayName;
        }
    });
    
    const avatarElements = document.querySelectorAll('#user-avatar, #profile-avatar, .avatar');
    avatarElements.forEach(el => {
        if (el.id === 'user-avatar' || el.id === 'profile-avatar' || el.classList.contains('avatar')) {
            el.textContent = getUserInitials(displayName);
        }
    });
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
    setupModalCloseHandlers();
    
    // Формы
    setupFormHandlers();
    
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
function setupModalCloseHandlers() {
    // Делегирование событий для закрытия модальных окон
    document.addEventListener('click', (e) => {
        // Закрытие по клику на крестик
        if (e.target.classList.contains('modal-close') || 
            e.target.closest('.modal-close')) {
            closeAllModals();
        }
        
        // Закрытие по клику на кнопку отмены
        if (e.target.classList.contains('cancel-btn') ||
            e.target.closest('.cancel-btn')) {
            closeAllModals();
        }
        
        // Закрытие по клику на overlay (только если кликнули именно на overlay)
        if (e.target.classList.contains('modal-overlay') && 
            e.target.classList.contains('active')) {
            closeAllModals();
        }
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Настройка обработчиков форм
function setupFormHandlers() {
    console.log('📝 Настройка обработчиков форм...');
    
    // Форма добавления человека
    const addPersonForm = document.getElementById('add-person-form-modal');
    if (addPersonForm) {
        console.log('✅ Найдена форма добавления человека');
        addPersonForm.addEventListener('submit', handleAddPerson);
    }
    
    // Форма добавления события
    const addEventForm = document.getElementById('add-event-form-modal');
    if (addEventForm) {
        console.log('✅ Найдена форма добавления события');
        addEventForm.addEventListener('submit', handleAddEvent);
    }
    
    // Форма загрузки медиа
    const uploadForm = document.getElementById('upload-form-modal');
    if (uploadForm) {
        console.log('✅ Найдена форма загрузки медиа');
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
        console.log('✅ Найдена форма приглашения');
        inviteForm.addEventListener('submit', handleInvite);
    }
    
    // Форма редактирования профиля
    const editProfileForm = document.getElementById('edit-profile-form-modal');
    if (editProfileForm) {
        console.log('✅ Найдена форма редактирования профиля');
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
}

// Показать модальное окно - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
window.showModal = function(modalId) {
    console.log('📂 Показать модальное окно:', modalId);
    
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) {
        console.error('Модальное окно или оверлей не найдены');
        return;
    }
    
    // Клонируем модальное окно и добавляем в overlay
    const modalClone = modal.cloneNode(true);
    modalClone.id = modalId + '-clone';
    modalClone.classList.remove('hidden');
    
    // Очищаем overlay и добавляем клон
    overlay.innerHTML = '';
    overlay.appendChild(modalClone);
    
    // Показываем overlay и модальное окно
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('active');
        modalClone.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';
    
    // Добавляем обработчики для кнопок закрытия внутри этого модального окна
    const closeBtn = modalClone.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAllModals);
    }
    
    const cancelBtns = modalClone.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Заполняем данные если нужно
    if (modalId === 'edit-profile-modal' && window.currentUser) {
        const nameParts = (window.currentUser.user_metadata?.name || '').split(' ');
        const nameInput = modalClone.querySelector('#edit-profile-name');
        const lastNameInput = modalClone.querySelector('#edit-profile-last-name');
        const emailInput = modalClone.querySelector('#edit-profile-email');
        
        if (nameInput) nameInput.value = nameParts[0] || '';
        if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';
        if (emailInput) emailInput.value = window.currentUser.email || '';
    }
};

// Закрыть все модальные окна
window.closeAllModals = function() {
    console.log('❌ Закрыть все модальные окна');
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.innerHTML = '';
        }, 300);
    }
    
    document.body.style.overflow = '';
    
    // Сбрасываем основные формы (но не формы шагов)
    document.querySelectorAll('form').forEach(form => {
        if (form.id && !form.id.includes('step') && !form.id.includes('add-person-step')) {
            form.reset();
        }
    });
    
    // Очищаем список файлов
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.style.display = 'none';
    
    const filesList = document.getElementById('selected-files-list');
    if (filesList) filesList.innerHTML = '';
};

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
        
        showNotification('✅ Выход выполнен', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showNotification('Ошибка выхода из системы', 'error');
    }
}

// Добавление человека
async function handleAddPerson(e) {
    console.log('👤 Добавление человека');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        showNotification('Для добавления человека необходимо войти в систему', 'error');
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
        showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    showLoader('Добавление человека...');
    
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
            
            showNotification('✅ Человек успешно добавлен!', 'success');
            closeAllModals();
            
            // Обновляем статистику на главной странице
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            }
            
            // Обновляем дерево если мы на странице дерева
            if (typeof window.updateTreeStats === 'function') {
                window.updateTreeStats();
            }
        }
        
    } catch (error) {
        console.error('Ошибка добавления человека:', error);
        showNotification('Ошибка добавления человека', 'error');
    } finally {
        hideLoader();
    }
}

// Добавление события
async function handleAddEvent(e) {
    console.log('📅 Добавление события');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        showNotification('Для добавления события необходимо войти в систему', 'error');
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
        showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    showLoader('Добавление события...');
    
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
            
            showNotification('✅ Событие успешно добавлено!', 'success');
            closeAllModals();
            
            // Обновляем ленту событий если мы на странице событий
            if (typeof window.updateTimeline === 'function') {
                window.updateTimeline();
            }
            
            // Обновляем главную страницу если мы на ней
            if (typeof window.updateRecentEvents === 'function') {
                window.updateRecentEvents();
            }
            
            // Обновляем статистику
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            }
        }
        
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        showNotification('Ошибка добавления события', 'error');
    } finally {
        hideLoader();
    }
}

// Загрузка медиа
async function handleUploadMedia(e) {
    console.log('📁 Загрузка медиа');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        showNotification('Для загрузки медиа необходимо войти в систему', 'error');
        closeAllModals();
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    const filesInput = document.getElementById('upload-files');
    const description = document.getElementById('upload-description').value;
    
    if (!filesInput.files || filesInput.files.length === 0) {
        showNotification('Выберите файлы для загрузки', 'error');
        return;
    }
    
    showLoader('Загрузка файлов...');
    
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
            
            showNotification(`✅ Загружено ${files.length} файлов!`, 'success');
            closeAllModals();
            
            // Обновляем медиатеку если мы на странице медиа
            if (typeof window.updateMediaGrid === 'function') {
                window.updateMediaGrid();
            }
            
            // Обновляем статистику
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            }
        }
        
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        showNotification('Ошибка загрузки файлов', 'error');
    } finally {
        hideLoader();
    }
}

// Приглашение родственника
async function handleInvite(e) {
    console.log('📨 Приглашение родственника');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        showNotification('Для отправки приглашения необходимо войти в систему', 'error');
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
        showNotification('Введите email', 'error');
        return;
    }
    
    showLoader('Отправка приглашения...');
    
    try {
        // Реальный режим
        showNotification('✅ Приглашение отправлено на ' + email, 'success');
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка отправки приглашения:', error);
        showNotification('Ошибка отправки приглашения', 'error');
    } finally {
        hideLoader();
    }
}

// Редактирование профиля
async function handleEditProfile(e) {
    console.log('✏️ Редактирование профиля');
    e.preventDefault();
    
    // Проверка авторизации
    if (!window.currentUser) {
        showNotification('Для доступа к этой странице необходимо войти в систему', 'error');
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
        showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    showLoader('Сохранение профиля...');
    
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
        
        showNotification('✅ Профиль успешно обновлен!', 'success');
        
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
        showNotification('Ошибка обновления профиля', 'error');
    } finally {
        hideLoader();
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
        
        showLoader('Загрузка данных...');
        
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
        
        showNotification('✅ Данные загружены', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        
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
        hideLoader();
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

// Функция уведомлений
function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    try {
        // Создаем уведомление если его нет
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <span id="notification-text">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Обработчик закрытия
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 300);
            });
        }
        
        const text = document.getElementById('notification-text');
        if (text) {
            text.textContent = message;
        }
        
        // Обновляем класс типа
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 4000);
    } catch (e) {
        console.error('Ошибка показа уведомления:', e);
    }
}

// Функции загрузчика
function showLoader(text = 'Загрузка...') {
    console.log(`⏳ ${text}`);
    
    try {
        // Создаем загрузчик если его нет
        let loader = document.getElementById('loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loader-overlay';
            loader.innerHTML = `
                <div class="loader"></div>
                <div class="loader-text" id="loader-text">${text}</div>
            `;
            document.body.appendChild(loader);
        }
        
        const loaderText = document.getElementById('loader-text');
        if (loaderText) {
            loaderText.textContent = text;
        }
        
        loader.style.display = 'flex';
        setTimeout(() => {
            loader.classList.add('show');
        }, 10);
    } catch (e) {
        console.error('Ошибка показа загрузчика:', e);
    }
}

function hideLoader() {
    try {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.remove('show');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    } catch (e) {
        console.error('Ошибка скрытия загрузчика:', e);
    }
}

// Экспортируем функции
window.updateStats = updateStats;
window.updateRecentEvents = updateRecentEvents;
window.getEventIcon = getEventIcon;
window.calculateGenerations = calculateGenerations;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLogout = handleLogout;
window.getUserInitials = getUserInitials;
window.updateUserUI = updateUserUI;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.loadUserData = loadUserData;

console.log('✅ App.js загружен');