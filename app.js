// Глобальные переменные
let currentUser = null
let currentTree = null
let isRegisterMode = false
let people = []
let events = []
let media = []
let isDragging = false
let dragElement = null
let dragOffset = { x: 0, y: 0 }

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение запускается...')
    
    // Настраиваем обработчики
    setupEventListeners()
    
    // Проверяем авторизацию
    await checkAuth()
    
    // Инициализируем дерево
    initTreeDragAndDrop()
})

// Проверка авторизации
async function checkAuth() {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser()
    
    if (error) {
        console.error('Ошибка проверки авторизации:', error)
        showAuth()
        return
    }
    
    if (user) {
        currentUser = user
        console.log('👤 Пользователь:', user.email)
        setupUser(user)
        await loadUserData()
        showApp()
    } else {
        showAuth()
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('🔧 Настройка обработчиков...')
    
    // Форма авторизации
    const authForm = document.getElementById('auth-form')
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            await handleAuth()
        })
    }
    
    // Переключение режима авторизации
    const authSwitchLink = document.getElementById('auth-switch-link')
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault()
            toggleAuthMode()
        })
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout)
    }
    
    // Формы модальных окон
    const forms = [
        { id: 'add-person-form', handler: handleAddPerson },
        { id: 'add-event-form', handler: handleAddEvent },
        { id: 'upload-form', handler: handleUpload },
        { id: 'invite-form', handler: handleInvite }
    ]
    
    forms.forEach(({ id, handler }) => {
        const form = document.getElementById(id)
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault()
                await handler()
            })
        }
    })
    
    // Закрытие модальных окон
    document.querySelectorAll('.modal-close, .modal-overlay, .btn-secondary').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                e.target.classList.contains('modal-overlay') ||
                e.target.classList.contains('btn-secondary')) {
                closeAllModals()
            }
        })
    })
    
    // Навигация
    document.querySelectorAll('.nav-links a, .feature-card button, .hero-buttons button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault()
            const page = e.target.closest('a, button').getAttribute('onclick')?.match(/'([^']+)'/)?.[1]
            if (page) showPage(page)
        })
    })
}

// ========== АВТОРИЗАЦИЯ ==========

// Обработка авторизации
async function handleAuth() {
    const email = document.getElementById('auth-email').value
    const password = document.getElementById('auth-password').value
    
    if (!email || !password) {
        showAuthError('Заполните все поля')
        return
    }
    
    showLoader(isRegisterMode ? 'Регистрация...' : 'Вход...')
    
    try {
        if (isRegisterMode) {
            // РЕГИСТРАЦИЯ
            const name = document.getElementById('auth-name').value
            const confirmPassword = document.getElementById('auth-confirm-password').value
            
            if (!name) {
                throw new Error('Введите имя и фамилию')
            }
            
            if (password !== confirmPassword) {
                throw new Error('Пароли не совпадают')
            }
            
            // Регистрация в Supabase
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`
                    }
                }
            })
            
            if (error) throw error
            
            showNotification('✅ Регистрация успешна! Проверьте email для подтверждения.', 'success')
            
        } else {
            // ВХОД
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            })
            
            if (error) throw error
            
            showNotification('✅ Вход выполнен!', 'success')
        }
        
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error)
        showAuthError(getAuthErrorMessage(error.message))
    } finally {
        hideLoader()
    }
}

// Настройка пользователя
function setupUser(user) {
    const usernameElement = document.getElementById('username')
    const userAvatar = document.getElementById('user-avatar')
    const profileName = document.getElementById('profile-name')
    const profileEmail = document.getElementById('profile-email')
    const infoEmail = document.getElementById('info-email')
    const infoUserId = document.getElementById('info-user-id')
    const infoRegDate = document.getElementById('info-reg-date')
    
    // Имя пользователя
    const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь'
    
    if (usernameElement) usernameElement.textContent = displayName
    if (userAvatar) userAvatar.textContent = getUserInitials(displayName)
    if (profileName) profileName.textContent = displayName
    if (profileEmail) profileEmail.textContent = user.email
    if (infoEmail) infoEmail.textContent = user.email
    if (infoUserId) infoUserId.textContent = user.id.substring(0, 8) + '...'
    
    // Дата регистрации
    if (infoRegDate && user.created_at) {
        const date = new Date(user.created_at)
        infoRegDate.textContent = date.toLocaleDateString('ru-RU')
    }
}

// Получение инициалов
function getUserInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

// ========== РАБОТА С ДАННЫМИ ==========

// Загрузка данных пользователя
async function loadUserData() {
    if (!currentUser) return
    
    showLoader('Загрузка данных...')
    
    try {
        // Загружаем дерево пользователя
        const { data: trees, error: treeError } = await window.supabaseClient
            .from('family_trees')
            .select('*')
            .eq('owner_id', currentUser.id)
        
        if (treeError) throw treeError
        
        if (trees && trees.length > 0) {
            currentTree = trees[0]
            console.log('🌳 Дерево загружено:', currentTree.id)
            
            // Загружаем все данные параллельно
            await Promise.all([
                loadPeople(),
                loadEvents(),
                loadMedia()
            ])
            
            updateStats()
            updatePeopleList()
            
        } else {
            // Создаем новое дерево
            await createFamilyTree()
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error)
        showNotification('Ошибка загрузки данных', 'error')
    } finally {
        hideLoader()
    }
}

// Создание семейного дерева
async function createFamilyTree() {
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
        .single()
    
    if (error) throw error
    
    currentTree = tree
    
    // Добавляем самого пользователя в дерево
    await addPerson({
        first_name: currentUser.user_metadata?.name?.split(' ')[0] || 'Я',
        last_name: currentUser.user_metadata?.name?.split(' ')[1] || '',
        relation: 'self',
        is_user: true,
        x: 400,
        y: 300,
        color: '#8b4513'
    })
    
    showNotification('✅ Семейное дерево создано!', 'success')
}

// Загрузка людей
async function loadPeople() {
    if (!currentTree) return
    
    const { data, error } = await window.supabaseClient
        .from('people')
        .select('*')
        .eq('tree_id', currentTree.id)
    
    if (error) throw error
    
    people = data || []
    console.log('👥 Загружено людей:', people.length)
    
    renderTree()
    return people
}

// Загрузка событий
async function loadEvents() {
    if (!currentTree) return
    
    const { data, error } = await window.supabaseClient
        .from('events')
        .select('*')
        .eq('tree_id', currentTree.id)
        .order('event_date', { ascending: false })
    
    if (error) throw error
    
    events = data || []
    console.log('📅 Загружено событий:', events.length)
    
    renderTimeline()
    return events
}

// Загрузка медиа
async function loadMedia() {
    if (!currentTree) return
    
    const { data, error } = await window.supabaseClient
        .from('media')
        .select('*')
        .eq('tree_id', currentTree.id)
        .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    
    media = data || []
    console.log('🖼️ Загружено медиа:', media.length)
    
    renderMedia()
    return media
}

// ========== ОТОБРАЖЕНИЕ ДАННЫХ ==========

// Рендеринг дерева с перетаскиванием
function renderTree() {
    const treeContainer = document.getElementById('family-tree')
    const treeEmpty = document.getElementById('tree-empty')
    
    if (!treeContainer) return
    
    if (people.length === 0) {
        if (treeEmpty) treeEmpty.style.display = 'flex'
        treeContainer.innerHTML = ''
        return
    }
    
    if (treeEmpty) treeEmpty.style.display = 'none'
    
    let html = '<div class="tree-visualization" id="tree-visualization">'
    
    people.forEach((person, index) => {
        const left = person.x || 50 + (index % 5) * 180
        const top = person.y || 50 + Math.floor(index / 5) * 150
        
        html += `
            <div class="tree-person draggable" 
                 data-id="${person.id}"
                 style="left: ${left}px; top: ${top}px; border-color: ${person.color || '#8b4513'}"
                 onclick="selectPerson('${person.id}')">
                <div class="tree-person-avatar" style="background-color: ${person.color || '#8b4513'}">
                    ${person.first_name?.[0] || '?'}
                </div>
                <div class="tree-person-name">
                    ${person.first_name || ''} ${person.last_name || ''}
                </div>
                <div class="tree-person-relation">
                    ${getRelationLabel(person.relation)}
                </div>
            </div>
        `
    })
    
    html += '</div>'
    treeContainer.innerHTML = html
    
    // Инициализируем перетаскивание для новых элементов
    initTreeDragAndDrop()
}

// Инициализация перетаскивания
function initTreeDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable')
    const visualization = document.getElementById('tree-visualization')
    
    if (!visualization) return
    
    draggables.forEach(draggable => {
        draggable.addEventListener('mousedown', startDrag)
        draggable.addEventListener('touchstart', startDragTouch)
    })
    
    // Обработчики для мыши
    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', stopDrag)
    
    // Обработчики для тач-устройств
    document.addEventListener('touchmove', dragTouch)
    document.addEventListener('touchend', stopDrag)
}

// Начало перетаскивания
function startDrag(e) {
    e.preventDefault()
    isDragging = true
    dragElement = e.target.closest('.tree-person')
    
    if (!dragElement) return
    
    const rect = dragElement.getBoundingClientRect()
    dragOffset.x = e.clientX - rect.left
    dragOffset.y = e.clientY - rect.top
    
    dragElement.style.zIndex = '1000'
    dragElement.classList.add('dragging')
}

// Начало перетаскивания (тач)
function startDragTouch(e) {
    e.preventDefault()
    isDragging = true
    dragElement = e.target.closest('.tree-person')
    
    if (!dragElement) return
    
    const touch = e.touches[0]
    const rect = dragElement.getBoundingClientRect()
    dragOffset.x = touch.clientX - rect.left
    dragOffset.y = touch.clientY - rect.top
    
    dragElement.style.zIndex = '1000'
    dragElement.classList.add('dragging')
}

// Перетаскивание
function drag(e) {
    if (!isDragging || !dragElement) return
    
    const visualization = document.getElementById('tree-visualization')
    if (!visualization) return
    
    const rect = visualization.getBoundingClientRect()
    let x = e.clientX - rect.left - dragOffset.x
    let y = e.clientY - rect.top - dragOffset.y
    
    // Ограничиваем перемещение в пределах контейнера
    x = Math.max(0, Math.min(x, visualization.clientWidth - dragElement.clientWidth))
    y = Math.max(0, Math.min(y, visualization.clientHeight - dragElement.clientHeight))
    
    dragElement.style.left = x + 'px'
    dragElement.style.top = y + 'px'
}

// Перетаскивание (тач)
function dragTouch(e) {
    if (!isDragging || !dragElement) return
    
    const visualization = document.getElementById('tree-visualization')
    if (!visualization) return
    
    const touch = e.touches[0]
    const rect = visualization.getBoundingClientRect()
    let x = touch.clientX - rect.left - dragOffset.x
    let y = touch.clientY - rect.top - dragOffset.y
    
    // Ограничиваем перемещение в пределах контейнера
    x = Math.max(0, Math.min(x, visualization.clientWidth - dragElement.clientWidth))
    y = Math.max(0, Math.min(y, visualization.clientHeight - dragElement.clientHeight))
    
    dragElement.style.left = x + 'px'
    dragElement.style.top = y + 'px'
}

// Остановка перетаскивания
async function stopDrag() {
    if (!isDragging || !dragElement) return
    
    isDragging = false
    
    // Сохраняем позицию в базе данных
    const personId = dragElement.dataset.id
    const x = parseInt(dragElement.style.left)
    const y = parseInt(dragElement.style.top)
    
    if (personId && !isNaN(x) && !isNaN(y)) {
        await savePersonPosition(personId, x, y)
    }
    
    dragElement.style.zIndex = ''
    dragElement.classList.remove('dragging')
    dragElement = null
}

// Сохранение позиции человека
async function savePersonPosition(personId, x, y) {
    try {
        const { error } = await window.supabaseClient
            .from('people')
            .update({ x, y })
            .eq('id', personId)
        
        if (error) throw error
    } catch (error) {
        console.error('❌ Ошибка сохранения позиции:', error)
    }
}

// Рендеринг ленты событий
function renderTimeline() {
    const container = document.getElementById('timeline-container')
    const empty = document.getElementById('timeline-empty')
    
    if (!container) return
    
    if (events.length === 0) {
        if (empty) empty.style.display = 'flex'
        container.innerHTML = ''
        return
    }
    
    if (empty) empty.style.display = 'none'
    
    let html = '<div class="timeline">'
    
    events.forEach(event => {
        const date = new Date(event.event_date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        
        html += `
            <div class="timeline-event">
                <div class="timeline-event-date">${date}</div>
                <div class="timeline-event-content">
                    <h4>${event.title}</h4>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                </div>
            </div>
        `
    })
    
    html += '</div>'
    container.innerHTML = html
}

// Рендеринг медиа
function renderMedia() {
    const container = document.getElementById('media-container')
    const empty = document.getElementById('media-empty')
    
    if (!container) return
    
    if (media.length === 0) {
        if (empty) empty.style.display = 'flex'
        container.innerHTML = ''
        return
    }
    
    if (empty) empty.style.display = 'none'
    
    let html = ''
    
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
        `
    })
    
    container.innerHTML = html
}

// Обновление статистики
function updateStats() {
    const elements = {
        'stat-people': people.length,
        'stat-events': events.length,
        'stat-media': media.length,
        'profile-stat-people': people.length,
        'profile-stat-events': events.length,
        'profile-stat-media': media.length
    }
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id)
        if (element) element.textContent = value
    })
}

// Обновление списка людей
function updatePeopleList() {
    const container = document.getElementById('people-list-container')
    
    if (!container) return
    
    if (people.length === 0) {
        container.innerHTML = '<p class="empty-text">В древе пока никого нет</p>'
        return
    }
    
    let html = '<div class="people-grid">'
    
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
        `
    })
    
    html += '</div>'
    container.innerHTML = html
}

// ========== ОБРАБОТЧИКИ ФОРМ ==========

// Добавление человека
async function handleAddPerson() {
    const firstName = document.getElementById('person-first-name').value.trim()
    const lastName = document.getElementById('person-last-name').value.trim()
    const birthDate = document.getElementById('person-birth-date').value
    const relation = document.getElementById('person-relation').value
    const biography = document.getElementById('person-bio').value.trim()
    
    if (!firstName || !lastName) {
        showNotification('Заполните имя и фамилию', 'error')
        return
    }
    
    showLoader('Добавление человека...')
    
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
        })
        
        closeAllModals()
        showNotification('✅ Человек добавлен в древо!', 'success')
        
        await loadPeople()
        updateStats()
        updatePeopleList()
        
    } catch (error) {
        console.error('❌ Ошибка добавления человека:', error)
        showNotification('Ошибка: ' + error.message, 'error')
    } finally {
        hideLoader()
    }
}

// Добавление события
async function handleAddEvent() {
    const title = document.getElementById('event-title').value.trim()
    const date = document.getElementById('event-date').value
    const description = document.getElementById('event-description').value.trim()
    
    if (!title || !date) {
        showNotification('Заполните название и дату события', 'error')
        return
    }
    
    showLoader('Добавление события...')
    
    try {
        const { error } = await window.supabaseClient
            .from('events')
            .insert([{
                tree_id: currentTree.id,
                title: title,
                event_date: date,
                description: description,
                created_by: currentUser.id
            }])
        
        if (error) throw error
        
        closeAllModals()
        showNotification('✅ Событие добавлено!', 'success')
        
        await loadEvents()
        updateStats()
        
    } catch (error) {
        console.error('❌ Ошибка добавления события:', error)
        showNotification('Ошибка: ' + error.message, 'error')
    } finally {
        hideLoader()
    }
}

// Загрузка медиа
async function handleUpload() {
    const files = document.getElementById('upload-files').files
    const description = document.getElementById('upload-description').value.trim()
    
    if (files.length === 0) {
        showNotification('Выберите файлы для загрузки', 'error')
        return
    }
    
    showLoader('Загрузка файлов...')
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            
            // Создаем уникальное имя файла
            const fileName = `${Date.now()}_${file.name}`
            const filePath = `media/${currentUser.id}/${fileName}`
            
            // Загружаем в Supabase Storage
            const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                .from('media')
                .upload(filePath, file)
            
            if (uploadError) throw uploadError
            
            // Получаем публичный URL
            const { data: urlData } = window.supabaseClient.storage
                .from('media')
                .getPublicUrl(filePath)
            
            // Сохраняем информацию в базу
            const { error: dbError } = await window.supabaseClient
                .from('media')
                .insert([{
                    tree_id: currentTree.id,
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'photo' : 'document',
                    url: urlData.publicUrl,
                    description: description,
                    uploaded_by: currentUser.id
                }])
            
            if (dbError) throw dbError
        }
        
        closeAllModals()
        showNotification('✅ Файлы успешно загружены!', 'success')
        
        await loadMedia()
        updateStats()
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error)
        showNotification('Ошибка загрузки: ' + error.message, 'error')
    } finally {
        hideLoader()
    }
}

// Приглашение родственника
async function handleInvite() {
    const email = document.getElementById('invite-email').value.trim()
    const message = document.getElementById('invite-message').value.trim()
    
    if (!email) {
        showNotification('Введите email', 'error')
        return
    }
    
    showLoader('Отправка приглашения...')
    
    try {
        const { error } = await window.supabaseClient
            .from('invitations')
            .insert([{
                tree_id: currentTree.id,
                email: email,
                message: message || 'Приглашаю вас присоединиться к нашему семейному древу!',
                invited_by: currentUser.id
            }])
        
        if (error) throw error
        
        closeAllModals()
        showNotification('✅ Приглашение отправлено!', 'success')
        
    } catch (error) {
        console.error('❌ Ошибка отправки приглашения:', error)
        showNotification('Ошибка: ' + error.message, 'error')
    } finally {
        hideLoader()
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Добавление человека в дерево
async function addPerson(personData) {
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
        .select()
    
    if (error) throw error
    
    return data[0]
}

// Выбор человека в дереве
function selectPerson(personId) {
    if (isDragging) return // Не выделяем при перетаскивании
    
    const person = people.find(p => p.id === personId)
    if (person) {
        showNotification(`Выбран: ${person.first_name} ${person.last_name}`, 'info')
    }
}

// Сохранение дерева как картинки
function saveTreeAsImage() {
    const treeContainer = document.querySelector('.tree-container')
    if (!treeContainer) {
        showNotification('Дерево не найдено', 'error')
        return
    }
    
    showLoader('Сохранение дерева...')
    
    // Используем html2canvas для создания картинки
    if (typeof html2canvas !== 'undefined') {
        html2canvas(treeContainer).then(canvas => {
            const link = document.createElement('a')
            link.download = `family-tree-${new Date().toISOString().split('T')[0]}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            showNotification('✅ Дерево сохранено как картинка!', 'success')
            hideLoader()
        }).catch(error => {
            console.error('Ошибка сохранения картинки:', error)
            showNotification('Ошибка сохранения картинки', 'error')
            hideLoader()
        })
    } else {
        // Если html2canvas не подключен, предлагаем установить
        showNotification('Для сохранения картинки подключите библиотеку html2canvas', 'info')
        hideLoader()
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
    }
    
    return labels[relation] || relation
}

// Случайный цвет
function getRandomColor() {
    const colors = ['#8b4513', '#d2691e', '#a0522d', '#cd853f', '#d2b48c', '#bc8f8f', '#deb887']
    return colors[Math.floor(Math.random() * colors.length)]
}

// Получение понятного сообщения об ошибке
function getAuthErrorMessage(errorMessage) {
    const messages = {
        'User already registered': 'Этот email уже используется',
        'Invalid email': 'Неверный формат email',
        'Email not confirmed': 'Email не подтвержден',
        'Invalid login credentials': 'Неверный email или пароль',
        'Weak password': 'Пароль слишком слабый (минимум 6 символов)',
        'User not found': 'Пользователь не найден',
        'Too many requests': 'Слишком много попыток. Попробуйте позже'
    }
    
    for (const [key, value] of Object.entries(messages)) {
        if (errorMessage.includes(key)) return value
    }
    
    return 'Произошла ошибка. Попробуйте еще раз'
}

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========

// Переключение режима авторизации
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode
    
    const elements = {
        'reg-name-group': isRegisterMode,
        'reg-confirm-group': isRegisterMode,
        'auth-title': isRegisterMode ? 'Регистрация' : 'Вход в аккаунт',
        'auth-submit': isRegisterMode ? 'Зарегистрироваться' : 'Войти',
        'auth-switch-text': isRegisterMode ? 'Уже есть аккаунт? ' : 'Нет аккаунта? ',
        'auth-switch-link': isRegisterMode ? 'Войти' : 'Зарегистрироваться'
    }
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id)
        if (!element) return
        
        if (id.includes('group')) {
            element.classList.toggle('hidden', !value)
        } else if (id.includes('title') || id.includes('submit') || id.includes('link')) {
            element.textContent = value
        } else if (id.includes('text')) {
            element.innerHTML = value
        }
    })
    
    // Очищаем ошибки
    const authError = document.getElementById('auth-error')
    if (authError) {
        authError.textContent = ''
        authError.style.display = 'none'
    }
}

// Показать приложение
function showApp() {
    const authPage = document.getElementById('auth-page')
    const mainHeader = document.getElementById('main-header')
    const homePage = document.getElementById('home-page')
    
    if (authPage) authPage.classList.add('hidden')
    if (mainHeader) mainHeader.classList.remove('hidden')
    if (homePage) homePage.classList.remove('hidden')
    
    // Скрываем другие страницы
    ['tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page')
        if (element) element.classList.add('hidden')
    })
}

// Показать авторизацию
function showAuth() {
    const authPage = document.getElementById('auth-page')
    const mainHeader = document.getElementById('main-header')
    
    if (authPage) authPage.classList.remove('hidden')
    if (mainHeader) mainHeader.classList.add('hidden')
    
    // Скрываем все страницы приложения
    ['home', 'tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page')
        if (element) element.classList.add('hidden')
    })
    
    // Сбрасываем режим
    isRegisterMode = false
    const nameGroup = document.getElementById('reg-name-group')
    const confirmGroup = document.getElementById('reg-confirm-group')
    
    if (nameGroup) nameGroup.classList.add('hidden')
    if (confirmGroup) confirmGroup.classList.add('hidden')
    
    // Очищаем форму
    const authForm = document.getElementById('auth-form')
    if (authForm) authForm.reset()
}

// Переключение страниц
function showPage(pageId) {
    console.log('📄 Переключение на страницу:', pageId)
    
    // Скрываем все страницы
    ['home', 'tree', 'timeline', 'media', 'profile'].forEach(page => {
        const element = document.getElementById(page + '-page')
        if (element) element.classList.add('hidden')
    })
    
    // Показываем выбранную страницу
    const pageElement = document.getElementById(pageId + '-page')
    if (pageElement) {
        pageElement.classList.remove('hidden')
    }
    
    // Обновляем данные если нужно
    if (pageId === 'tree') {
        updatePeopleList()
    }
}

// Выход из аккаунта
async function logout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut()
        if (error) throw error
        
        currentUser = null
        currentTree = null
        people = []
        events = []
        media = []
        
        showNotification('Вы вышли из аккаунта', 'info')
        showAuth()
        
    } catch (error) {
        console.error('❌ Ошибка при выходе:', error)
        showNotification('Ошибка при выходе: ' + error.message, 'error')
    }
}

// Открытие модальных окон
function openAddPersonModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error')
        return
    }
    document.getElementById('modal-overlay').classList.remove('hidden')
    document.getElementById('add-person-modal').classList.remove('hidden')
}

function openAddEventModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error')
        return
    }
    document.getElementById('modal-overlay').classList.remove('hidden')
    document.getElementById('add-event-modal').classList.remove('hidden')
}

function openUploadModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error')
        return
    }
    document.getElementById('modal-overlay').classList.remove('hidden')
    document.getElementById('upload-modal').classList.remove('hidden')
}

function openInviteModal() {
    if (!currentUser) {
        showNotification('Сначала войдите в аккаунт', 'error')
        return
    }
    document.getElementById('modal-overlay').classList.remove('hidden')
    document.getElementById('invite-modal').classList.remove('hidden')
}

// Закрытие модальных окон
function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden')
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden')
    })
    
    // Очищаем формы
    document.querySelectorAll('form').forEach(form => form.reset())
}

// Управление деревом
function zoomIn() {
    const tree = document.querySelector('.tree-visualization')
    if (tree) {
        const currentScale = parseFloat(tree.style.transform?.replace('scale(', '') || 1)
        tree.style.transform = `scale(${currentScale + 0.1})`
    }
}

function zoomOut() {
    const tree = document.querySelector('.tree-visualization')
    if (tree) {
        const currentScale = parseFloat(tree.style.transform?.replace('scale(', '') || 1)
        if (currentScale > 0.5) {
            tree.style.transform = `scale(${currentScale - 0.1})`
        }
    }
}

function resetTree() {
    const tree = document.querySelector('.tree-visualization')
    if (tree) {
        tree.style.transform = 'scale(1)'
    }
}

function printTree() {
    saveTreeAsImage()
}

// Показать ошибку авторизации
function showAuthError(message) {
    const errorDiv = document.getElementById('auth-error')
    if (errorDiv) {
        errorDiv.textContent = message
        errorDiv.style.display = 'block'
    } else {
        alert('Ошибка: ' + message)
    }
}

// Управление меню
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links')
    if (navLinks) {
        navLinks.classList.toggle('active')
    }
}

// Дополнительные функции
function editProfile() {
    showNotification('Редактирование профиля в разработке', 'info')
}

function showHelp() {
    showNotification('Раздел помощи в разработке', 'info')
}

function filterMedia() {
    const filter = document.getElementById('media-filter').value
    showNotification(`Фильтр: ${filter}`, 'info')
}