// app.js - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
let currentUser = null;
let currentTree = null;
let isRegisterMode = false;
let people = [];
let events = [];
let media = [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение загружается...');
    
    // Настраиваем обработчики форм СРАЗУ
    setupEventListeners();
    
    // Слушаем изменения авторизации
    auth.onAuthStateChanged(function(user) {
        console.log('Статус авторизации изменен:', user ? 'Вход' : 'Выход');
        
        if (user) {
            // Пользователь вошел
            currentUser = user;
            console.log('Пользователь:', user.email);
            setupUser(user);
            loadUserData();
            showApp();
        } else {
            // Пользователь вышел
            currentUser = null;
            console.log('Пользователь вышел');
            showAuth();
        }
    });
});

// Настройка всех обработчиков событий
function setupEventListeners() {
    console.log('Настройка обработчиков событий...');
    
    // Форма авторизации
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        console.log('Форма авторизации найдена');
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Форма авторизации отправлена');
            handleAuth();
        });
    } else {
        console.error('Форма авторизации не найдена!');
    }
    
    // Кнопка переключения режима
    const authSwitchLink = document.getElementById('auth-switch-link');
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAuthMode();
        });
    }
    
    // Форма добавления человека
    const addPersonForm = document.getElementById('add-person-form');
    if (addPersonForm) {
        addPersonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddPerson();
        });
    }
    
    // Форма добавления события
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
        addEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddEvent();
        });
    }
    
    // Форма загрузки медиа
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleUpload();
        });
    }
    
    // Форма приглашения
    const inviteForm = document.getElementById('invite-form');
    if (inviteForm) {
        inviteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleInvite();
        });
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Обработка авторизации - УПРОЩЕННАЯ И РАБОЧАЯ ВЕРСИЯ
async function handleAuth() {
    console.log('Обработка авторизации, режим:', isRegisterMode ? 'регистрация' : 'вход');
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    console.log('Email:', email);
    console.log('Пароль:', password ? '***' : 'не указан');
    
    if (!email || !password) {
        showAuthError('Заполните все поля');
        return;
    }
    
    showLoader('Авторизация...');
    
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
            
            console.log('Регистрируем пользователя...');
            
            // 1. Создаем пользователя
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            console.log('Пользователь создан:', userCredential.user.uid);
            
            // 2. Обновляем профиль
            await userCredential.user.updateProfile({
                displayName: name
            });
            console.log('Профиль обновлен');
            
            // 3. Создаем запись в Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Запись в Firestore создана');
            
            // 4. Создаем семейное дерево
            await createFamilyTree(userCredential.user);
            console.log('Семейное дерево создано');
            
            showNotification('Регистрация успешна! Добро пожаловать!', 'success');
            
        } else {
            // ВХОД
            console.log('Входим в систему...');
            await auth.signInWithEmailAndPassword(email, password);
            console.log('Вход выполнен');
            showNotification('Вход выполнен!', 'success');
        }
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        hideLoader();
    }
}

// Создание семейного дерева
async function createFamilyTree(user) {
    const treeData = {
        name: 'Моя семья',
        ownerId: user.uid,
        members: [user.uid],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const treeRef = await db.collection('trees').add(treeData);
    currentTree = { id: treeRef.id, ...treeData };
    
    // Добавляем самого пользователя в дерево
    await addPersonToTree(treeRef.id, {
        firstName: user.displayName?.split(' ')[0] || 'Я',
        lastName: user.displayName?.split(' ')[1] || '',
        userId: user.uid,
        relation: 'self',
        isUser: true
    });
    
    return treeRef;
}

// Добавление человека в дерево
async function addPersonToTree(treeId, personData) {
    const personRef = await db.collection('people').add({
        treeId: treeId,
        firstName: personData.firstName,
        lastName: personData.lastName,
        birthDate: personData.birthDate || null,
        relation: personData.relation || 'other',
        biography: personData.biography || '',
        userId: personData.userId || null,
        isUser: personData.isUser || false,
        x: personData.x || 400 + Math.random() * 200,
        y: personData.y || 300 + Math.random() * 200,
        color: getRandomColor(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return personRef;
}

// Настройка пользователя
function setupUser(user) {
    console.log('Настройка пользователя:', user.email);
    
    // Обновляем шапку
    const usernameElement = document.getElementById('username');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (usernameElement) {
        usernameElement.textContent = user.displayName || user.email;
    }
    
    if (userAvatar) {
        userAvatar.textContent = getUserInitials(user);
    }
    
    if (logoutBtn) {
        logoutBtn.textContent = 'Выйти';
    }
    
    // Обновляем профиль
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const infoEmail = document.getElementById('info-email');
    const infoUserId = document.getElementById('info-user-id');
    
    if (profileName) profileName.textContent = user.displayName || 'Не указано';
    if (profileEmail) profileEmail.textContent = user.email;
    if (infoEmail) infoEmail.textContent = user.email;
    if (infoUserId) infoUserId.textContent = user.uid.substring(0, 8) + '...';
    
    // Форматируем дату регистрации
    const infoRegDate = document.getElementById('info-reg-date');
    if (infoRegDate && user.metadata && user.metadata.creationTime) {
        const date = new Date(user.metadata.creationTime);
        infoRegDate.textContent = date.toLocaleDateString('ru-RU');
    }
}

// Получение инициалов
function getUserInitials(user) {
    if (user.displayName) {
        return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return user.email.substring(0, 2).toUpperCase();
}

// Загрузка данных пользователя
async function loadUserData() {
    console.log('Загрузка данных пользователя...');
    showLoader('Загрузка данных...');
    
    try {
        // Загружаем дерево пользователя
        const treeSnapshot = await db.collection('trees')
            .where('ownerId', '==', currentUser.uid)
            .get();
        
        if (!treeSnapshot.empty) {
            const treeDoc = treeSnapshot.docs[0];
            currentTree = { id: treeDoc.id, ...treeDoc.data() };
            console.log('Дерево загружено:', currentTree.id);
            
            // Загружаем людей
            await loadPeople();
            
            // Загружаем события
            await loadEvents();
            
            // Загружаем медиа
            await loadMedia();
            
            // Обновляем статистику
            updateStats();
            
            // Обновляем список людей
            updatePeopleList();
        } else {
            console.log('Дерево не найдено');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
    } finally {
        hideLoader();
    }
}

// Загрузка людей
async function loadPeople() {
    const snapshot = await db.collection('people')
        .where('treeId', '==', currentTree.id)
        .get();
    
    people = [];
    snapshot.forEach(doc => {
        people.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Загружено людей:', people.length);
    
    // Обновляем дерево
    renderTree();
}

// Загрузка событий
async function loadEvents() {
    const snapshot = await db.collection('events')
        .where('treeId', '==', currentTree.id)
        .orderBy('date', 'desc')
        .get();
    
    events = [];
    snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Загружено событий:', events.length);
    
    renderTimeline();
}

// Загрузка медиа
async function loadMedia() {
    const snapshot = await db.collection('media')
        .where('treeId', '==', currentTree.id)
        .orderBy('uploadedAt', 'desc')
        .get();
    
    media = [];
    snapshot.forEach(doc => {
        media.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Загружено медиа:', media.length);
    
    renderMedia();
}

// Рендеринг дерева
function renderTree() {
    const treeContainer = document.getElementById('family-tree');
    const treeEmpty = document.getElementById('tree-empty');
    
    if (!treeContainer) return;
    
    if (people.length === 0) {
        if (treeEmpty) {
            treeEmpty.style.display = 'flex';
        }
        treeContainer.innerHTML = '';
        return;
    }
    
    if (treeEmpty) {
        treeEmpty.style.display = 'none';
    }
    
    // Простая визуализация дерева
    let html = '<div class="tree-visualization">';
    
    people.forEach((person, index) => {
        const left = 50 + (index % 5) * 180;
        const top = 50 + Math.floor(index / 5) * 150;
        
        html += `
            <div class="tree-person" 
                 style="left: ${left}px; top: ${top}px; border-color: ${person.color || '#8b4513'}"
                 onclick="showPerson('${person.id}')">
                <div class="tree-person-avatar" style="background-color: ${person.color || '#8b4513'}">
                    ${person.firstName?.[0] || '?'}
                </div>
                <div class="tree-person-name">
                    ${person.firstName || ''} ${person.lastName || ''}
                </div>
                <div class="tree-person-relation">
                    ${getRelationLabel(person.relation)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    treeContainer.innerHTML = html;
}

// Рендеринг ленты событий
function renderTimeline() {
    const container = document.getElementById('timeline-container');
    const empty = document.getElementById('timeline-empty');
    
    if (!container) return;
    
    if (events.length === 0) {
        if (empty) {
            empty.style.display = 'flex';
        }
        container.innerHTML = '';
        return;
    }
    
    if (empty) {
        empty.style.display = 'none';
    }
    
    let html = '<div class="timeline">';
    
    events.forEach(event => {
        const date = new Date(event.date).toLocaleDateString('ru-RU', {
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

// Рендеринг медиа
function renderMedia() {
    const container = document.getElementById('media-container');
    const empty = document.getElementById('media-empty');
    
    if (!container) return;
    
    if (media.length === 0) {
        if (empty) {
            empty.style.display = 'flex';
        }
        container.innerHTML = '';
        return;
    }
    
    if (empty) {
        empty.style.display = 'none';
    }
    
    let html = '';
    
    media.forEach(item => {
        html += `
            <div class="media-item">
                <div class="media-item-image">
                    <i class="fas fa-image"></i>
                </div>
                <div class="media-item-info">
                    <div class="media-item-name">${item.name || 'Фотография'}</div>
                    ${item.description ? `<div class="media-item-desc">${item.description}</div>` : ''}
                    <div class="media-item-date">${new Date(item.uploadedAt?.toDate()).toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Обновление статистики
function updateStats() {
    const statPeople = document.getElementById('stat-people');
    const statEvents = document.getElementById('stat-events');
    const statMedia = document.getElementById('stat-media');
    
    const profileStatPeople = document.getElementById('profile-stat-people');
    const profileStatEvents = document.getElementById('profile-stat-events');
    const profileStatMedia = document.getElementById('profile-stat-media');
    
    if (statPeople) statPeople.textContent = people.length;
    if (statEvents) statEvents.textContent = events.length;
    if (statMedia) statMedia.textContent = media.length;
    
    if (profileStatPeople) profileStatPeople.textContent = people.length;
    if (profileStatEvents) profileStatEvents.textContent = events.length;
    if (profileStatMedia) profileStatMedia.textContent = media.length;
}

// Обновление списка людей
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
                    ${person.firstName?.[0] || '?'}
                </div>
                <div class="person-card-info">
                    <h4>${person.firstName || ''} ${person.lastName || ''}</h4>
                    <p>${getRelationLabel(person.relation)}</p>
                    ${person.birthDate ? `<p>${new Date(person.birthDate).toLocaleDateString('ru-RU')}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========

// Переключение режима авторизации
function toggleAuthMode(e) {
    if (e) e.preventDefault();
    
    isRegisterMode = !isRegisterMode;
    console.log('Переключение режима авторизации:', isRegisterMode ? 'регистрация' : 'вход');
    
    const nameGroup = document.getElementById('reg-name-group');
    const confirmGroup = document.getElementById('reg-confirm-group');
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');
    
    if (isRegisterMode) {
        if (nameGroup) nameGroup.classList.remove('hidden');
        if (confirmGroup) confirmGroup.classList.remove('hidden');
        if (authTitle) authTitle.textContent = 'Регистрация';
        if (authSubmit) authSubmit.textContent = 'Зарегистрироваться';
        if (authSwitchText) authSwitchText.innerHTML = 'Уже есть аккаунт? ';
        if (authSwitchLink) authSwitchLink.textContent = 'Войти';
    } else {
        if (nameGroup) nameGroup.classList.add('hidden');
        if (confirmGroup) confirmGroup.classList.add('hidden');
        if (authTitle) authTitle.textContent = 'Вход в аккаунт';
        if (authSubmit) authSubmit.textContent = 'Войти';
        if (authSwitchText) authSwitchText.innerHTML = 'Нет аккаунта? ';
        if (authSwitchLink) authSwitchLink.textContent = 'Зарегистрироваться';
    }
    
    // Очищаем ошибки
    const authError = document.getElementById('auth-error');
    if (authError) {
        authError.textContent = '';
        authError.style.display = 'none';
    }
}

// Показать приложение
function showApp() {
    console.log('Показываем приложение');
    
    const authPage = document.getElementById('auth-page');
    const mainHeader = document.getElementById('main-header');
    const homePage = document.getElementById('home-page');
    
    if (authPage) authPage.classList.add('hidden');
    if (mainHeader) mainHeader.classList.remove('hidden');
    if (homePage) homePage.classList.remove('hidden');
    
    // Скрываем другие страницы
    ['tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page');
        if (element) {
            element.classList.add('hidden');
        }
    });
}

// Показать авторизацию
function showAuth() {
    console.log('Показываем авторизацию');
    
    const authPage = document.getElementById('auth-page');
    const mainHeader = document.getElementById('main-header');
    
    if (authPage) authPage.classList.remove('hidden');
    if (mainHeader) mainHeader.classList.add('hidden');
    
    // Скрываем все страницы приложения
    ['home', 'tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page');
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Сбрасываем режим авторизации
    isRegisterMode = false;
    const nameGroup = document.getElementById('reg-name-group');
    const confirmGroup = document.getElementById('reg-confirm-group');
    const authTitle = document.getElementById('auth-title');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');
    
    if (nameGroup) nameGroup.classList.add('hidden');
    if (confirmGroup) confirmGroup.classList.add('hidden');
    if (authTitle) authTitle.textContent = 'Вход в аккаунт';
    if (authSubmit) authSubmit.textContent = 'Войти';
    if (authSwitchText) authSwitchText.innerHTML = 'Нет аккаунта? ';
    if (authSwitchLink) authSwitchLink.textContent = 'Зарегистрироваться';
    
    // Очищаем форму
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.reset();
    }
}

// Переключение страниц
function showPage(pageId) {
    console.log('Переключение на страницу:', pageId);
    
    // Скрываем все страницы
    ['home', 'tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page');
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Показываем выбранную страницу
    const pageElement = document.getElementById(pageId + '-page');
    if (pageElement) {
        pageElement.classList.remove('hidden');
    }
    
    // Обновляем данные если нужно
    if (pageId === 'tree') {
        updatePeopleList();
    }
}

// Выход из аккаунта
function logout() {
    console.log('Выход из аккаунта');
    auth.signOut()
        .then(() => {
            showNotification('Вы вышли из аккаунта', 'info');
        })
        .catch(error => {
            console.error('Ошибка при выходе:', error);
            showNotification('Ошибка при выходе: ' + error.message, 'error');
        });
}

// ========== ОБРАБОТЧИКИ ФОРМ ==========

// Добавление человека
async function handleAddPerson() {
    const firstName = document.getElementById('person-first-name').value.trim();
    const lastName = document.getElementById('person-last-name').value.trim();
    const birthDate = document.getElementById('person-birth-date').value;
    const relation = document.getElementById('person-relation').value;
    const biography = document.getElementById('person-bio').value.trim();
    
    if (!firstName || !lastName) {
        showNotification('Заполните имя и фамилию', 'error');
        return;
    }
    
    showLoader('Добавление человека...');
    
    try {
        await addPersonToTree(currentTree.id, {
            firstName: firstName,
            lastName: lastName,
            birthDate: birthDate || null,
            relation: relation,
            biography: biography
        });
        
        closeModal('add-person-modal');
        showNotification('Человек добавлен в древо!', 'success');
        
        // Обновляем данные
        await loadPeople();
        updateStats();
        updatePeopleList();
        
    } catch (error) {
        console.error('Ошибка добавления человека:', error);
        showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

// Добавление события
async function handleAddEvent() {
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value.trim();
    
    if (!title || !date) {
        showNotification('Заполните название и дату события', 'error');
        return;
    }
    
    showLoader('Добавление события...');
    
    try {
        await db.collection('events').add({
            treeId: currentTree.id,
            title: title,
            date: date,
            description: description,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('add-event-modal');
        showNotification('Событие добавлено!', 'success');
        
        // Обновляем данные
        await loadEvents();
        updateStats();
        
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

// Загрузка медиа
async function handleUpload() {
    const files = document.getElementById('upload-files').files;
    const description = document.getElementById('upload-description').value.trim();
    
    if (files.length === 0) {
        showNotification('Выберите файлы для загрузки', 'error');
        return;
    }
    
    showLoader('Загрузка файлов...');
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Загружаем в Storage
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`media/${currentUser.uid}/${Date.now()}_${file.name}`);
            await fileRef.put(file);
            const url = await fileRef.getDownloadURL();
            
            // Сохраняем информацию в Firestore
            await db.collection('media').add({
                treeId: currentTree.id,
                name: file.name,
                type: file.type.startsWith('image/') ? 'photo' : 'file',
                url: url,
                description: description,
                uploadedBy: currentUser.uid,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        closeModal('upload-modal');
        showNotification('Файлы успешно загружены!', 'success');
        
        // Обновляем данные
        await loadMedia();
        updateStats();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showNotification('Ошибка загрузки: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

// Приглашение родственника
async function handleInvite() {
    const email = document.getElementById('invite-email').value.trim();
    const message = document.getElementById('invite-message').value.trim();
    
    if (!email) {
        showNotification('Введите email', 'error');
        return;
    }
    
    showLoader('Отправка приглашения...');
    
    try {
        await db.collection('invitations').add({
            treeId: currentTree.id,
            email: email,
            message: message || 'Приглашаю вас присоединиться к нашему семейному древу!',
            invitedBy: currentUser.uid,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('invite-modal');
        showNotification('Приглашение отправлено!', 'success');
        
    } catch (error) {
        console.error('Ошибка отправки приглашения:', error);
        showNotification('Ошибка: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Открытие модальных окон
function openAddPersonModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error');
        return;
    }
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('add-person-modal').classList.remove('hidden');
}

function openAddEventModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error');
        return;
    }
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('add-event-modal').classList.remove('hidden');
}

function openUploadModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error');
        return;
    }
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('upload-modal').classList.remove('hidden');
}

function openInviteModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error');
        return;
    }
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('invite-modal').classList.remove('hidden');
}

// Закрытие модальных окон
function closeModal(modalId) {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById(modalId).classList.add('hidden');
    
    // Очищаем формы
    const form = document.getElementById(modalId.replace('-modal', '-form'));
    if (form) {
        form.reset();
    }
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// Управление деревом
function zoomIn() {
    const tree = document.querySelector('.tree-visualization');
    if (tree) {
        const currentScale = parseFloat(tree.style.transform?.replace('scale(', '') || 1);
        tree.style.transform = `scale(${currentScale + 0.1})`;
    }
}

function zoomOut() {
    const tree = document.querySelector('.tree-visualization');
    if (tree) {
        const currentScale = parseFloat(tree.style.transform?.replace('scale(', '') || 1);
        if (currentScale > 0.5) {
            tree.style.transform = `scale(${currentScale - 0.1})`;
        }
    }
}

function resetTree() {
    const tree = document.querySelector('.tree-visualization');
    if (tree) {
        tree.style.transform = 'scale(1)';
    }
}

function printTree() {
    window.print();
}

// Показать человека (заглушка)
function showPerson(personId) {
    const person = people.find(p => p.id === personId);
    if (person) {
        showNotification(`Выбран: ${person.firstName} ${person.lastName}`, 'info');
    }
}

// Получение метки родства
function getRelationLabel(relation) {
    const labels = {
        'self': 'Я',
        'spouse': 'Супруг/а',
        'parent': 'Родитель',
        'child': 'Ребенок',
        'sibling': 'Брат/сестра',
        'grandparent': 'Дедушка/бабушка',
        'grandchild': 'Внук/внучка',
        'other': 'Родственник'
    };
    
    return labels[relation] || relation;
}

// Случайный цвет
function getRandomColor() {
    const colors = ['#8b4513', '#d2691e', '#a0522d', '#cd853f', '#d2b48c', '#bc8f8f', '#deb887'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Управление меню
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Получение понятного сообщения об ошибке
function getAuthErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'Этот email уже используется',
        'auth/invalid-email': 'Неверный формат email',
        'auth/operation-not-allowed': 'Регистрация отключена',
        'auth/weak-password': 'Пароль слишком слабый (минимум 6 символов)',
        'auth/user-disabled': 'Аккаунт отключен',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
        'auth/network-request-failed': 'Ошибка сети. Проверьте подключение'
    };
    
    return messages[errorCode] || 'Произошла ошибка. Попробуйте еще раз';
}

// ========== УВЕДОМЛЕНИЯ И ЗАГРУЗЧИКИ ==========

function showNotification(message, type = 'info') {
    console.log('Уведомление:', message, type);
    
    const notification = document.getElementById('notification');
    const text = document.getElementById('notification-text');
    
    if (!notification || !text) {
        console.log('Уведомление не найдено, показываем alert');
        alert(message);
        return;
    }
    
    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.add('hidden');
    }
}

function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.error('Ошибка авторизации:', message);
        alert('Ошибка: ' + message);
    }
}

function showLoader(text = 'Загрузка...') {
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    
    if (loader) {
        if (loaderText) {
            loaderText.textContent = text;
        }
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Дополнительные функции
function editProfile() {
    showNotification('Редактирование профиля в разработке', 'info');
}

function showHelp() {
    showNotification('Раздел помощи в разработке', 'info');
}

function filterMedia() {
    const filter = document.getElementById('media-filter').value;
    showNotification(`Фильтр: ${filter}`, 'info');
}