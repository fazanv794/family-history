// app.js - Основные функции приложения
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
        loadFromLocalStorage();
        await checkAuthForProtectedPages();
        setupCommonEventListeners();
        updateUserUI();
        
        if (window.currentUser) {
            await loadUserData();
        }
        
        saveToLocalStorage();
        
        console.log('✅ Страница инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
});

// Загрузить данные из localStorage
function loadFromLocalStorage() {
    try {
        const savedTreeData = localStorage.getItem('family_tree_data');
        if (savedTreeData) {
            window.treeData = JSON.parse(savedTreeData);
        }
        
        const savedUser = localStorage.getItem('family_tree_user');
        if (savedUser) {
            try {
                window.currentUser = JSON.parse(savedUser);
            } catch (e) {
                console.log('❌ Ошибка парсинга пользователя');
            }
        }
        
        const savedPeople = localStorage.getItem('family_tree_people');
        if (savedPeople) {
            window.people = JSON.parse(savedPeople) || [];
        }
        
        const savedEvents = localStorage.getItem('family_tree_events');
        if (savedEvents) {
            window.events = JSON.parse(savedEvents) || [];
        }
        
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
        localStorage.setItem('family_tree_data', JSON.stringify(window.treeData));
        
        if (window.currentUser) {
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
        }
        
        localStorage.setItem('family_tree_people', JSON.stringify(window.people));
        localStorage.setItem('family_tree_events', JSON.stringify(window.events));
        localStorage.setItem('family_tree_media', JSON.stringify(window.media));
        
        console.log('💾 Данные сохранены в localStorage');
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
    }
}

// Проверка авторизации
async function checkAuthForProtectedPages() {
    const protectedPages = ['app.html', 'tree.html', 'timeline.html', 'media.html', 'profile.html', 'chats.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (protectedPages.includes(currentPage)) {
        try {
            const { data: { user }, error } = await window.supabaseClient?.auth.getUser();
            
            if (error || !user) {
                if (!window.currentUser) {
                    showNotification('Для доступа необходимо войти в систему', 'error');
                    setTimeout(() => {
                        window.location.href = 'auth.html';
                    }, 1500);
                    return;
                }
                console.log('👤 Используем демо-режим');
            } else {
                window.currentUser = user;
            }
            
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            
            if (!window.currentUser) {
                showNotification('Ошибка проверки авторизации', 'error');
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
                return;
            }
        }
    }
}

// Обновление UI пользователя
function updateUserUI() {
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

// Получение инициалов
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

// Настройка обработчиков
function setupCommonEventListeners() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    const logoutBtns = document.querySelectorAll('#logout-btn, #logout-profile-btn, .logout-btn');
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', handleLogout);
        }
    });
    
    setupModalCloseHandlers();
    setupFormHandlers();
    
    window.addEventListener('beforeunload', () => {
        saveToLocalStorage();
    });
}

// Мобильное меню
function toggleMobileMenu() {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Обработчики модальных окон
function setupModalCloseHandlers() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || 
            e.target.closest('.modal-close')) {
            closeAllModals();
        }
        
        if (e.target.classList.contains('cancel-btn') ||
            e.target.closest('.cancel-btn')) {
            closeAllModals();
        }
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay && e.target === overlay && overlay.classList.contains('active')) {
            closeAllModals();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Настройка обработчиков форм
function setupFormHandlers() {
    const addPersonForm = document.getElementById('add-person-form-modal');
    if (addPersonForm) {
        addPersonForm.addEventListener('submit', handleAddPerson);
    }
    
    const addEventForm = document.getElementById('add-event-form-modal');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }
    
    const uploadForm = document.getElementById('upload-form-modal');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadMedia);
        
        const browseBtn = document.getElementById('browse-files-btn');
        const fileInput = document.getElementById('upload-files');
        
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', showSelectedFiles);
        }
    }
    
    const inviteForm = document.getElementById('invite-form-modal');
    if (inviteForm) {
        inviteForm.addEventListener('submit', handleInvite);
    }
    
    const editProfileForm = document.getElementById('edit-profile-form-modal');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
}

// Показать модальное окно
window.showModal = function(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) {
        return;
    }
    
    const modalClone = modal.cloneNode(true);
    modalClone.id = modalId + '-clone';
    modalClone.classList.remove('hidden');
    
    overlay.innerHTML = '';
    overlay.appendChild(modalClone);
    
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('active');
        modalClone.classList.add('active');
    }, 10);
    
    document.body.style.overflow = 'hidden';
    
    const closeBtn = modalClone.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAllModals);
    }
    
    const cancelBtns = modalClone.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    if (modalId === 'edit-profile-modal' && window.currentUser) {
        const nameParts = (window.currentUser.user_metadata?.name || '').split(' ');
        const nameInput = modalClone.querySelector('#edit-profile-name');
        const lastNameInput = modalClone.querySelector('#edit-profile-last-name');
        const emailInput = modalClone.querySelector('#edit-profile-email');
        
        if (nameInput) nameInput.value = nameParts[0] || '';
        if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';
        if (emailInput) emailInput.value = window.currentUser.email || '';
    }
    
    return modalClone;
};

// Закрыть все модальные окна
window.closeAllModals = function() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.innerHTML = '';
        }, 300);
    }
    
    document.body.style.overflow = '';
    
    document.querySelectorAll('form').forEach(form => {
        if (form.id && !form.id.includes('step') && !form.id.includes('add-person-step')) {
            form.reset();
        }
    });
    
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.style.display = 'none';
    
    const filesList = document.getElementById('selected-files-list');
    if (filesList) filesList.innerHTML = '';
};

// Выход из системы
async function handleLogout() {
    try {
        if (window.supabaseClient?.auth?.signOut) {
            await window.supabaseClient.auth.signOut();
        }
        
        localStorage.removeItem('family_tree_user');
        localStorage.removeItem('family_tree_email');
        localStorage.removeItem('family_tree_password');
        localStorage.removeItem('family_tree_data');
        localStorage.removeItem('family_tree_people');
        localStorage.removeItem('family_tree_events');
        localStorage.removeItem('family_tree_media');
        
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
    e.preventDefault();
    
    const firstName = document.getElementById('person-first-name').value;
    const lastName = document.getElementById('person-last-name').value;
    const birthDate = document.getElementById('person-birth-date').value;
    const gender = document.getElementById('person-gender').value;
    const relation = document.getElementById('person-relation').value;
    const biography = document.getElementById('person-bio').value;
    
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
            gender: gender,
            relation: relation,
            biography: biography || null,
            created_at: new Date().toISOString()
        };
        
        if (window.currentUser && window.supabaseClient) {
            try {
                newPerson.user_id = window.currentUser.id;
                const { data, error } = await window.supabaseClient
                    .from('people')
                    .insert([newPerson])
                    .select();
                
                if (!error && data && data[0]) {
                    newPerson.id = data[0].id;
                }
            } catch (supabaseError) {
                console.warn('Не удалось сохранить в Supabase');
            }
        }
        
        window.people.push(newPerson);
        
        if (window.treeData && window.treeData.relatives) {
            const treePerson = {
                id: newPerson.id,
                firstName: firstName,
                lastName: lastName,
                birthDate: birthDate,
                gender: gender,
                relation: relation
            };
            
            const existingIndex = window.treeData.relatives.findIndex(p => 
                p.firstName === firstName && p.lastName === lastName && p.relation === relation
            );
            
            if (existingIndex === -1) {
                window.treeData.relatives.push(treePerson);
                window.dispatchEvent(new CustomEvent('treeDataChanged'));
            }
        }
        
        showNotification('✅ Человек успешно добавлен!', 'success');
        closeAllModals();
        
        saveToLocalStorage();
        
    } catch (error) {
        console.error('Ошибка добавления человека:', error);
        showNotification('Ошибка добавления человека', 'error');
    } finally {
        hideLoader();
    }
}

// Добавление события
async function handleAddEvent(e) {
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
        
        if (window.currentUser && window.supabaseClient) {
            try {
                newEvent.user_id = window.currentUser.id;
                const { data, error } = await window.supabaseClient
                    .from('events')
                    .insert([newEvent])
                    .select();
                
                if (!error && data && data[0]) {
                    newEvent.id = data[0].id;
                }
            } catch (supabaseError) {
                console.warn('Не удалось сохранить в Supabase');
            }
        }
        
        window.events.unshift(newEvent);
        
        showNotification('✅ Событие успешно добавлено!', 'success');
        closeAllModals();
        
        saveToLocalStorage();
        
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        showNotification('Ошибка добавления события', 'error');
    } finally {
        hideLoader();
    }
}

// Загрузка медиа
async function handleUploadMedia(e) {
    e.preventDefault();
    
    const filesInput = document.getElementById('upload-files');
    const description = document.getElementById('upload-description').value;
    const mediaUrl = document.getElementById('upload-url')?.value || '';
    
    if ((!filesInput.files || filesInput.files.length === 0) && !mediaUrl) {
        showNotification('Выберите файлы или укажите ссылку на медиа', 'error');
        return;
    }
    
    showLoader('Загрузка медиа...');
    
    try {
        const newMediaItems = [];
        
        if (mediaUrl) {
            const mediaItem = {
                id: Date.now() + Math.random(),
                file_url: mediaUrl,
                file_type: getMediaTypeFromUrl(mediaUrl),
                description: description || 'Ссылка на медиа',
                created_at: new Date().toISOString(),
                is_external: true
            };
            
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
                    console.warn('Не удалось сохранить в Supabase');
                }
            }
            
            newMediaItems.push(mediaItem);
        }
        
        if (filesInput.files && filesInput.files.length > 0) {
            const files = Array.from(filesInput.files);
            
            for (const file of files) {
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
                        console.warn('Не удалось сохранить в Supabase');
                    }
                }
                
                newMediaItems.push(mediaItem);
            }
        }
        
        window.media.unshift(...newMediaItems);
        
        showNotification(`✅ Добавлено ${newMediaItems.length} медиафайлов!`, 'success');
        closeAllModals();
        
        saveToLocalStorage();
        
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
        showNotification('Ошибка загрузки медиа', 'error');
    } finally {
        hideLoader();
    }
}

// Приглашение родственника
async function handleInvite(e) {
    e.preventDefault();
    
    const email = document.getElementById('invite-email').value;
    
    if (!email) {
        showNotification('Введите email', 'error');
        return;
    }
    
    showLoader('Отправка приглашения...');
    
    try {
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
        if (window.currentUser) {
            window.currentUser.user_metadata = {
                ...window.currentUser.user_metadata,
                name: name,
                full_name: lastName ? `${name} ${lastName}` : name
            };
            window.currentUser.email = email;
            
            localStorage.setItem('family_tree_user', JSON.stringify(window.currentUser));
        }
        
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
                }
            } catch (supabaseError) {
                console.warn('Не удалось обновить в Supabase');
            }
        }
        
        showNotification('✅ Профиль успешно обновлен!', 'success');
        
        updateUserUI();
        
        closeAllModals();
        
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        showNotification('Ошибка обновления профиля', 'error');
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
    } else {
        return 'link';
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
    try {
        if (!window.currentUser) {
            const savedUser = localStorage.getItem('family_tree_user');
            if (savedUser) {
                try {
                    window.currentUser = JSON.parse(savedUser);
                } catch (e) {
                    console.error('❌ Ошибка парсинга пользователя:', e);
                }
            }
            
            if (!window.currentUser) {
                return;
            }
        }
        
        showLoader('Загрузка данных...');
        
        if (window.people.length === 0) {
            const selfPerson = {
                id: Date.now(),
                first_name: window.currentUser.user_metadata?.name?.split(' ')[0] || 'Я',
                last_name: window.currentUser.user_metadata?.name?.split(' ')[1] || '',
                relation: 'self',
                gender: 'male',
                created_at: new Date().toISOString()
            };
            
            window.people.push(selfPerson);
        }
        
        console.log('✅ Данные загружены');
        
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
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
        
        if (window.people.length === 0) {
            window.people = JSON.parse(localStorage.getItem('family_tree_people') || '[]');
        }
        if (window.events.length === 0) {
            window.events = JSON.parse(localStorage.getItem('family_tree_events') || '[]');
        }
        if (window.media.length === 0) {
            window.media = JSON.parse(localStorage.getItem('family_tree_media') || '[]');
        }
        
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

// Функции для обновления статистики
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
    const treeRelatives = window.treeData?.relatives || [];
    if (treeRelatives.length === 0) {
        const people = window.people || [];
        if (people.length === 0) return 0;
        
        const hasGrandparents = people.some(p => p.relation === 'grandparent');
        const hasGrandchildren = people.some(p => p.relation === 'grandchild');
        
        let generations = 1;
        if (hasGrandparents) generations++;
        if (hasGrandchildren) generations++;
        
        return generations;
    }
    
    const relations = treeRelatives.map(p => p.relation);
    let generations = 1;
    
    if (relations.includes('grandparent')) generations++;
    if (relations.includes('grandchild')) generations++;
    
    return generations;
}

function updateRecentEvents() {
    const container = document.getElementById('recent-events-list');
    if (!container) {
        return;
    }
    
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
                    ${event.description ? `<p style="color: #4a5568; margin-bottom: 10px;">${event.description}</p>` : ''}
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

// Функция уведомлений
function showNotification(message, type = 'info') {
    try {
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
        
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
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
    try {
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