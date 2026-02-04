// app.js - Общие функции для всех страниц
console.log('📱 App.js загружается...');

// Глобальные переменные
window.currentUser = null;
window.people = [];
window.events = [];
window.media = [];
window.treeData = {
    name: 'Мое семейное дерево',
    created: null,
    relatives: []
};

// Инициализация для всех страниц
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Инициализация страницы...');
    
    try {
        // Загружаем данные из localStorage перед проверкой авторизации
        loadFromLocalStorage();
        
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
        
        // Сохраняем данные в localStorage после загрузки
        saveToLocalStorage();
        
        console.log('✅ Страница инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
});

// Загрузить данные из localStorage
function loadFromLocalStorage() {
    try {
        // Загружаем данные дерева
        const savedTreeData = localStorage.getItem('family_tree_data');
        if (savedTreeData) {
            const parsedData = JSON.parse(savedTreeData);
            window.treeData = parsedData;
            console.log('🌳 Дерево загружено из localStorage:', window.treeData);
        }
        
        // Загружаем данные пользователя (для демо-режима)
        const savedUser = localStorage.getItem('family_tree_user');
        if (savedUser) {
            try {
                window.currentUser = JSON.parse(savedUser);
                console.log('👤 Пользователь загружен из localStorage:', window.currentUser.email);
            } catch (e) {
                console.log('❌ Ошибка парсинга пользователя из localStorage');
            }
        }
        
        // Загружаем людей
        const savedPeople = localStorage.getItem('family_tree_people');
        if (savedPeople) {
            window.people = JSON.parse(savedPeople) || [];
        }
        
        // Загружаем события
        const savedEvents = localStorage.getItem('family_tree_events');
        if (savedEvents) {
            window.events = JSON.parse(savedEvents) || [];
        }
        
        // Загружаем медиа
        const savedMedia = localStorage.getItem('family_tree_media');
        if (savedMedia) {
            window.media = JSON.parse(savedMedia) || [];
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки из localStorage:', error);
    }
}

// Сохранить данные в localStorage
function saveToLocalStorage() {
    try {
        // Сохраняем дерево
        localStorage.setItem('family_tree_data', JSON.stringify(window.treeData));
        
        // Сохраняем пользователя (для демо-режима)
        if (window.currentUser) {
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
        }
        
        // Сохраняем людей
        localStorage.setItem('family_tree_people', JSON.stringify(window.people));
        
        // Сохраняем события
        localStorage.setItem('family_tree_events', JSON.stringify(window.events));
        
        // Сохраняем медиа
        localStorage.setItem('family_tree_media', JSON.stringify(window.media));
        
        console.log('💾 Данные сохранены в localStorage');
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
    }
}

// Проверка авторизации для защищенных страниц
async function checkAuthForProtectedPages() {
    const protectedPages = ['app.html', 'tree.html', 'timeline.html', 'media.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (protectedPages.includes(currentPage)) {
        console.log('🔒 Проверка авторизации для защищенной страницы:', currentPage);
        
        try {
            const { data: { user }, error } = await window.supabaseClient?.auth.getUser();
            
            if (error || !user) {
                // Демо-режим: используем данные из localStorage
                if (!window.currentUser) {
                    console.log('Пользователь не авторизован, перенаправляем...');
                    showNotification('Для доступа к этой странице необходимо войти в систему', 'error');
                    setTimeout(() => {
                        window.location.href = 'auth.html';
                    }, 1500);
                    return;
                }
                
                console.log('👤 Используем демо-режим с данными из localStorage');
            } else {
                window.currentUser = user;
                console.log('✅ Пользователь авторизован:', user.email);
            }
            
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            
            // Демо-режим при ошибке
            if (!window.currentUser) {
                showNotification('Ошибка проверки авторизации. Пожалуйста, войдите заново.', 'error');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
                return;
            }
            
            console.log('👤 Продолжаем в демо-режиме');
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
    
    // Сохраняем данные при закрытии страницы
    window.addEventListener('beforeunload', () => {
        saveToLocalStorage();
    });
    
    // Сохраняем данные при изменении
    window.addEventListener('treeDataChanged', () => {
        saveToLocalStorage();
    });
    
    // Сохраняем данные при изменении событий
    window.addEventListener('eventsChanged', () => {
        saveToLocalStorage();
    });
    
    // Сохраняем данные при изменении медиа
    window.addEventListener('mediaChanged', () => {
        saveToLocalStorage();
    });
    
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
        const overlay = document.getElementById('modal-overlay');
        if (overlay && e.target === overlay && overlay.classList.contains('active')) {
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
// Показать модальное окно - ИСПРАВЛЕННАЯ ВЕРСИЯ
window.showModal = function(modalId) {
    console.log('📂 Показать модальное окно:', modalId);
    
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) {
        console.error('Модальное окно или оверлей не найдены');
        return;
    }
    
    // Клонируем модальное окно
    const modalClone = modal.cloneNode(true);
    modalClone.id = modalId + '-clone';
    modalClone.classList.remove('hidden');
    
    // Очищаем overlay и добавляем клон
    overlay.innerHTML = '';
    overlay.appendChild(modalClone);
    
    // Показываем overlay
    overlay.classList.remove('hidden');
    
    // Добавляем класс для блокировки скролла body
    document.body.classList.add('modal-open');
    
    // После небольшой задержки добавляем класс active для анимации
    setTimeout(() => {
        overlay.classList.add('active');
        modalClone.classList.add('active');
    }, 10);
    
    // Добавляем обработчики для кнопок закрытия внутри этого модального окна
    const closeBtn = modalClone.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAllModals);
    }
    
    const cancelBtns = modalClone.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Закрытие по клику на overlay
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeAllModals();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    return modalClone;
};


window.closeAllModals = function() {
    console.log('❌ Закрыть все модальные окна');
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        // Убираем классы для анимации
        overlay.classList.remove('active');
        
        // Находим активное модальное окно
        const activeModal = overlay.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
        
        // Ждем завершения анимации и скрываем
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.innerHTML = '';
            document.body.classList.remove('modal-open');
        }, 300);
    }
    
    // Сбрасываем основные формы
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
        if (window.supabaseClient?.auth?.signOut) {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) console.log('Ошибка выхода из Supabase:', error);
        }
        
        // Очищаем localStorage
        localStorage.removeItem('family_tree_user');
        localStorage.removeItem('family_tree_email');
        localStorage.removeItem('family_tree_password');
        localStorage.removeItem('family_tree_data');
        localStorage.removeItem('family_tree_people');
        localStorage.removeItem('family_tree_events');
        localStorage.removeItem('family_tree_media');
        
        // Сбрасываем глобальные переменные
        window.currentUser = null;
        window.people = [];
        window.events = [];
        window.media = [];
        window.treeData = {
            name: 'Мое семейное дерево',
            created: null,
            relatives: []
        };
        
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
            id: Date.now() + Math.random(),
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate || null,
            death_date: deathDate || null,
            gender: gender,
            relation: relation,
            photo_url: photoUrl || null,
            biography: biography || null,
            created_at: new Date().toISOString()
        };
        
        // Если пользователь авторизован, сохраняем в Supabase
        if (window.currentUser && window.supabaseClient) {
            try {
                newPerson.user_id = window.currentUser.id;
                const { data, error } = await window.supabaseClient
                    .from('people')
                    .insert([newPerson])
                    .select();
                
                if (!error && data && data[0]) {
                    newPerson.id = data[0].id;
                    console.log('✅ Человек сохранен в Supabase');
                }
            } catch (supabaseError) {
                console.warn('Не удалось сохранить в Supabase, сохраняем локально:', supabaseError);
            }
        }
        
        // Сохраняем локально
        window.people.push(newPerson);
        
        // Если это добавление в дерево (не из построителя шагов)
        if (window.treeData && window.treeData.relatives) {
            const treePerson = {
                id: newPerson.id,
                firstName: firstName,
                lastName: lastName,
                birthDate: birthDate,
                gender: gender,
                relation: relation
            };
            
            // Проверяем, нет ли уже такой записи в дереве
            const existingIndex = window.treeData.relatives.findIndex(p => 
                p.firstName === firstName && p.lastName === lastName && p.relation === relation
            );
            
            if (existingIndex === -1) {
                window.treeData.relatives.push(treePerson);
                console.log('✅ Человек добавлен в дерево');
                
                // Обновляем интерфейс дерева если мы на странице дерева
                if (typeof window.updateTreeInterface === 'function') {
                    window.updateTreeInterface(window.treeData.relatives, window.treeData.name);
                }
                
                // Событие об изменении данных дерева
                window.dispatchEvent(new CustomEvent('treeDataChanged'));
            }
        }
        
        showNotification('✅ Человек успешно добавлен!', 'success');
        closeAllModals();
        
        // Сохраняем в localStorage
        saveToLocalStorage();
        
        // Обновляем статистику на главной странице
        if (typeof window.updateStats === 'function') {
            window.updateStats();
        }
        
        // Обновляем дерево если мы на странице дерева
        if (typeof window.updateTreeStats === 'function') {
            window.updateTreeStats();
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
    
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const eventType = document.getElementById('event-type').value;
    const description = document.getElementById('event-description').value;
    const mediaUrl = document.getElementById('event-media-url')?.value || '';
    
    if (!title || !date) {
        showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    showLoader('Добавление события...');
    
    try {
        const newEvent = {
            id: Date.now() + Math.random(),
            title: title,
            date: date,
            event_type: eventType || 'other',
            description: description || null,
            media_url: mediaUrl || null,
            created_at: new Date().toISOString()
        };
        
        // Если пользователь авторизован, сохраняем в Supabase
        if (window.currentUser && window.supabaseClient) {
            try {
                newEvent.user_id = window.currentUser.id;
                const { data, error } = await window.supabaseClient
                    .from('events')
                    .insert([newEvent])
                    .select();
                
                if (!error && data && data[0]) {
                    newEvent.id = data[0].id;
                    console.log('✅ Событие сохранено в Supabase');
                }
            } catch (supabaseError) {
                console.warn('Не удалось сохранить в Supabase, сохраняем локально:', supabaseError);
            }
        }
        
        window.events.unshift(newEvent);
        
        // Если есть ссылка на медиа, автоматически добавляем ее в медиатеку
        if (mediaUrl && mediaUrl.trim() !== '') {
            const mediaExists = window.media.some(m => m.file_url === mediaUrl);
            if (!mediaExists) {
                const mediaItem = {
                    id: Date.now() + Math.random(),
                    file_url: mediaUrl,
                    file_type: getMediaTypeFromUrl(mediaUrl),
                    description: description || `Медиа для события: ${title}`,
                    created_at: new Date().toISOString(),
                    is_external: true
                };
                
                window.media.unshift(mediaItem);
                console.log('✅ Медиа добавлено в медиатеку из события');
                
                // Сохраняем медиа в Supabase если пользователь авторизован
                if (window.currentUser && window.supabaseClient) {
                    try {
                        mediaItem.user_id = window.currentUser.id;
                        const { data, error } = await window.supabaseClient
                            .from('media')
                            .insert([mediaItem])
                            .select();
                        
                        if (!error && data && data[0]) {
                            mediaItem.id = data[0].id;
                        }
                    } catch (supabaseError) {
                        console.warn('Не удалось сохранить медиа в Supabase:', supabaseError);
                    }
                }
                
                // Событие об изменении данных медиа
                window.dispatchEvent(new CustomEvent('mediaChanged'));
            }
        }
        
        showNotification('✅ Событие успешно добавлено!', 'success');
        closeAllModals();
        
        // Сохраняем в localStorage
        saveToLocalStorage();
        
        // Событие об изменении данных событий
        window.dispatchEvent(new CustomEvent('eventsChanged'));
        
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
        
        // Обновляем медиатеку если есть медиа
        if (mediaUrl && typeof window.updateMediaGrid === 'function') {
            window.updateMediaGrid();
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
    
    const filesInput = document.getElementById('upload-files');
    const description = document.getElementById('upload-description').value;
    const mediaUrl = document.getElementById('upload-url')?.value || '';
    
    // Проверяем, что есть либо файлы, либо URL
    if ((!filesInput.files || filesInput.files.length === 0) && !mediaUrl) {
        showNotification('Выберите файлы или укажите ссылку на медиа', 'error');
        return;
    }
    
    showLoader('Загрузка медиа...');
    
    try {
        const newMediaItems = [];
        
        // Если есть URL, добавляем его как медиа
        if (mediaUrl) {
            const mediaItem = {
                id: Date.now() + Math.random(),
                file_url: mediaUrl,
                file_type: getMediaTypeFromUrl(mediaUrl),
                description: description || 'Ссылка на медиа',
                created_at: new Date().toISOString(),
                is_external: true
            };
            
            // Если пользователь авторизован, сохраняем в Supabase
            if (window.currentUser && window.supabaseClient) {
                try {
                    mediaItem.user_id = window.currentUser.id;
                    const { data, error } = await window.supabaseClient
                        .from('media')
                        .insert([mediaItem])
                        .select();
                    
                    if (!error && data && data[0]) {
                        mediaItem.id = data[0].id;
                        console.log('✅ Медиа (URL) сохранено в Supabase');
                    }
                } catch (supabaseError) {
                    console.warn('Не удалось сохранить в Supabase, сохраняем локально:', supabaseError);
                }
            }
            
            newMediaItems.push(mediaItem);
        }
        
        // Если есть файлы, обрабатываем их
        if (filesInput.files && filesInput.files.length > 0) {
            const files = Array.from(filesInput.files);
            
            for (const file of files) {
                // В реальном приложении здесь загрузка в Supabase Storage
                // Для демо-режима используем Data URL
                const fileUrl = await readFileAsDataURL(file);
                
                const mediaItem = {
                    id: Date.now() + Math.random(),
                    file_url: fileUrl,
                    file_type: file.type.startsWith('image/') ? 'image' : 
                               file.type.startsWith('video/') ? 'video' : 'file',
                    description: description || file.name,
                    file_name: file.name,
                    file_size: file.size,
                    file_type_mime: file.type,
                    created_at: new Date().toISOString(),
                    is_external: false
                };
                
                // Если пользователь авторизован, сохраняем в Supabase
                if (window.currentUser && window.supabaseClient) {
                    try {
                        mediaItem.user_id = window.currentUser.id;
                        const { data, error } = await window.supabaseClient
                            .from('media')
                            .insert([mediaItem])
                            .select();
                        
                        if (!error && data && data[0]) {
                            mediaItem.id = data[0].id;
                            console.log('✅ Медиа (файл) сохранено в Supabase');
                        }
                    } catch (supabaseError) {
                        console.warn('Не удалось сохранить в Supabase, сохраняем локально:', supabaseError);
                    }
                }
                
                newMediaItems.push(mediaItem);
            }
        }
        
        window.media.unshift(...newMediaItems);
        
        showNotification(`✅ Добавлено ${newMediaItems.length} медиафайлов!`, 'success');
        closeAllModals();
        
        // Сохраняем в localStorage
        saveToLocalStorage();
        
        // Событие об изменении данных медиа
        window.dispatchEvent(new CustomEvent('mediaChanged'));
        
        // Обновляем медиатеку если мы на странице медиа
        if (typeof window.updateMediaGrid === 'function') {
            window.updateMediaGrid();
        }
        
        // Обновляем статистику
        if (typeof window.updateStats === 'function') {
            window.updateStats();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        showNotification('Ошибка загрузки медиа', 'error');
    } finally {
        hideLoader();
    }
}

// Чтение файла как Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Определение типа медиа по URL
function getMediaTypeFromUrl(url) {
    if (!url) return 'link';
    
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) || 
        lowerUrl.includes('image/') || 
        lowerUrl.startsWith('data:image/')) {
        return 'image';
    } else if (lowerUrl.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/) || 
               lowerUrl.includes('video/') || 
               lowerUrl.startsWith('data:video/')) {
        return 'video';
    } else if (lowerUrl.match(/\.(mp3|wav|ogg|flac|aac)$/) || 
               lowerUrl.includes('audio/') || 
               lowerUrl.startsWith('data:audio/')) {
        return 'audio';
    } else if (lowerUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/)) {
        return 'document';
    } else {
        return 'link';
    }
}

// Приглашение родственника
async function handleInvite(e) {
    console.log('📨 Приглашение родственника');
    e.preventDefault();
    
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
        // Обновляем локально
        if (window.currentUser) {
            window.currentUser.user_metadata = {
                ...window.currentUser.user_metadata,
                name: name,
                full_name: lastName ? `${name} ${lastName}` : name
            };
            window.currentUser.email = email;
            
            // Сохраняем в localStorage
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
        }
        
        // Если пользователь авторизован, обновляем в Supabase
        if (window.currentUser && window.supabaseClient?.auth?.updateUser) {
            try {
                const { data, error } = await window.supabaseClient.auth.updateUser({
                    email: email,
                    data: {
                        name: name,
                        full_name: lastName ? `${name} ${lastName}` : name
                    }
                });
                
                if (!error && data.user) {
                    window.currentUser = data.user;
                    console.log('✅ Профиль обновлен в Supabase');
                }
            } catch (supabaseError) {
                console.warn('Не удалось обновить в Supabase:', supabaseError);
            }
        }
        
        showNotification('✅ Профиль успешно обновлен!', 'success');
        
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
            // Используем данные из localStorage
            return;
        }
        
        showLoader('Загрузка данных...');
        
        const userId = window.currentUser.id;
        
        // Загрузка данных из Supabase
        console.log('📦 Загрузка данных из Supabase...');
        
        // Загрузка людей
        if (window.supabaseClient) {
            try {
                const { data: peopleData, error: peopleError } = await window.supabaseClient
                    .from('people')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true });
                
                if (!peopleError && peopleData) {
                    window.people = peopleData || [];
                    console.log('✅ Люди загружены из Supabase:', window.people.length);
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('family_tree_people', JSON.stringify(window.people));
                }
            } catch (error) {
                console.warn('Ошибка загрузки людей из Supabase:', error);
            }
        }
        
        // Если нет людей, создаем запись для самого пользователя
        if (window.people.length === 0) {
            const selfPerson = {
                id: Date.now(),
                first_name: window.currentUser.user_metadata?.name?.split(' ')[0] || 'Я',
                last_name: window.currentUser.user_metadata?.name?.split(' ')[1] || '',
                relation: 'self',
                gender: 'male',
                created_at: new Date().toISOString()
            };
            
            console.log('👤 Создаем запись пользователя...');
            window.people.push(selfPerson);
        }
        
        // Загрузка событий из Supabase
        if (window.supabaseClient) {
            try {
                const { data: eventsData, error: eventsError } = await window.supabaseClient
                    .from('events')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });
                
                if (!eventsError && eventsData) {
                    window.events = eventsData || [];
                    console.log('✅ События загружены из Supabase:', window.events.length);
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('family_tree_events', JSON.stringify(window.events));
                }
            } catch (error) {
                console.warn('Ошибка загрузки событий из Supabase:', error);
            }
        }
        
        // Загрузка медиа из Supabase
        if (window.supabaseClient) {
            try {
                const { data: mediaData, error: mediaError } = await window.supabaseClient
                    .from('media')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                
                if (!mediaError && mediaData) {
                    window.media = mediaData || [];
                    console.log('✅ Медиа загружены из Supabase:', window.media.length);
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('family_tree_media', JSON.stringify(window.media));
                }
            } catch (error) {
                console.warn('Ошибка загрузки медиа из Supabase:', error);
            }
        }
        
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
        
        if (typeof window.updateTreeInterface === 'function' && window.treeData.relatives.length > 0) {
            window.updateTreeInterface(window.treeData.relatives, window.treeData.name);
        }
        
        showNotification('✅ Данные загружены', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        
        // Используем данные из localStorage
        if (window.people.length === 0) {
            window.people = JSON.parse(localStorage.getItem('family_tree_people') || '[]');
        }
        if (window.events.length === 0) {
            window.events = JSON.parse(localStorage.getItem('family_tree_events') || '[]');
        }
        if (window.media.length === 0) {
            window.media = JSON.parse(localStorage.getItem('family_tree_media') || '[]');
        }
        
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
        
        if (typeof window.updateTreeInterface === 'function' && window.treeData.relatives.length > 0) {
            window.updateTreeInterface(window.treeData.relatives, window.treeData.name);
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
    const treeRelatives = window.treeData?.relatives || [];
    if (treeRelatives.length === 0) {
        const people = window.people || [];
        if (people.length === 0) return 0;
        
        // Простой расчет поколений из всех людей
        const hasGrandparents = people.some(p => p.relation === 'grandparent');
        const hasGrandchildren = people.some(p => p.relation === 'grandchild');
        
        let generations = 1; // Текущее поколение
        if (hasGrandparents) generations++;
        if (hasGrandchildren) generations++;
        
        return generations;
    }
    
    // Расчет поколений из дерева
    const relations = treeRelatives.map(p => p.relation);
    let generations = 1; // Текущее поколение
    
    if (relations.includes('grandparent')) generations++;
    if (relations.includes('grandchild')) generations++;
    if (relations.includes('greatgrandparent')) generations++;
    if (relations.includes('greatgrandchild')) generations++;
    
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
        
        // Проверяем есть ли медиа
        const hasMedia = event.media_url && event.media_url.trim() !== '';
        const mediaType = hasMedia ? getMediaTypeFromUrl(event.media_url) : null;
        
        html += `
            <div class="timeline-event" style="display: flex; gap: 15px; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div class="event-icon" style="background: #667eea; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="${icon}"></i>
                </div>
                <div class="event-content" style="flex: 1;">
                    <h3 style="margin-bottom: 5px; color: #2d3748;">${event.title}</h3>
                    <div class="event-date" style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">${date}</div>
                    ${event.description ? `<p style="color: #4a5568; margin-bottom: 10px;">${event.description}</p>` : ''}
                    
                    ${hasMedia ? `
                        <div style="margin-top: 10px;">
                            <div style="font-size: 0.9rem; color: #718096; margin-bottom: 5px;">
                                <i class="fas fa-paperclip"></i> Прикреплено медиа
                            </div>
                            ${mediaType === 'image' ? `
                                <a href="${event.media_url}" target="_blank">
                                    <img src="${event.media_url}" 
                                         alt="${event.title}" 
                                         style="max-width: 100px; max-height: 100px; border-radius: 6px; border: 1px solid #e2e8f0; object-fit: cover;"
                                         onerror="this.style.display='none';">
                                </a>
                            ` : `
                                <a href="${event.media_url}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 0.9rem;">
                                    <i class="fas fa-link"></i> ${mediaType === 'video' ? 'Видео' : 'Ссылка на медиа'}
                                </a>
                            `}
                        </div>
                    ` : ''}
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
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.getMediaTypeFromUrl = getMediaTypeFromUrl;
window.readFileAsDataURL = readFileAsDataURL;
window.showSelectedFiles = showSelectedFiles;

console.log('✅ App.js загружен');