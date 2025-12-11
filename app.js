// DOM элементы
const authModal = document.getElementById('auth-modal')
const loginBtn = document.getElementById('login-btn')
const signupBtn = document.getElementById('signup-btn')
const logoutBtn = document.getElementById('logout-btn')
const userMenu = document.getElementById('user-menu')
const userName = document.getElementById('user-name')
const userAvatar = document.getElementById('user-avatar')

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем авторизацию
    const user = await window.initAuth()
    updateUI(user)
    
    // Загружаем данные если пользователь авторизован
    if (user) {
        loadAllData()
    }
    
    // Инициализируем события
    initEvents()
})

// Обновление интерфейса в зависимости от авторизации
function updateUI(user) {
    if (user) {
        // Пользователь вошёл
        loginBtn.style.display = 'none'
        signupBtn.style.display = 'none'
        userMenu.style.display = 'flex'
        userName.textContent = user.email.split('@')[0]
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=667eea&color=fff`
        
        // Показываем основной контент
        document.querySelectorAll('.section').forEach(el => el.style.display = 'block')
    } else {
        // Пользователь не вошёл
        loginBtn.style.display = 'block'
        signupBtn.style.display = 'block'
        userMenu.style.display = 'none'
        
        // Скрываем основной контент
        document.querySelectorAll('.section').forEach(el => el.style.display = 'none')
        
        // Показываем только приветствие
        document.getElementById('welcome').style.display = 'block'
        document.querySelector('.quick-actions').style.display = 'none'
    }
}

// Инициализация всех событий
function initEvents() {
    // Авторизация
    loginBtn.addEventListener('click', () => showAuthModal('login'))
    signupBtn.addEventListener('click', () => showAuthModal('signup'))
    logoutBtn.addEventListener('click', handleLogout)
    
    // Модальные окна
    document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'))
        })
    })
    
    // Быстрые действия
    document.getElementById('add-person-quick').addEventListener('click', () => {
        if (await checkAuth()) showAddPersonModal()
    })
    
    document.getElementById('add-first-person').addEventListener('click', () => {
        if (await checkAuth()) showAddPersonModal()
    })
    
    // Формы
    document.getElementById('login-submit').addEventListener('click', handleLogin)
    document.getElementById('signup-submit').addEventListener('click', handleSignup)
    document.getElementById('save-person').addEventListener('click', savePerson)
    
    // Поиск и фильтры
    document.getElementById('search-persons').addEventListener('input', searchPersons)
    document.getElementById('filter-gender').addEventListener('change', filterPersons)
}

// Показать модальное окно авторизации
function showAuthModal(tab = 'login') {
    authModal.classList.add('active')
    
    // Переключение табов
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab)
    })
    
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none'
    document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none'
}

// Вход
async function handleLogin() {
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value
    
    if (!email || !password) {
        showNotification('Заполните все поля', 'error')
        return
    }
    
    showLoader(true)
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        })
        
        if (error) throw error
        
        authModal.classList.remove('active')
        showNotification('Вход выполнен успешно!', 'success')
        
    } catch (error) {
        showNotification(error.message, 'error')
    } finally {
        showLoader(false)
    }
}

// Регистрация
async function handleSignup() {
    const email = document.getElementById('signup-email').value
    const password = document.getElementById('signup-password').value
    const confirm = document.getElementById('signup-confirm').value
    
    if (!email || !password || !confirm) {
        showNotification('Заполните все поля', 'error')
        return
    }
    
    if (password !== confirm) {
        showNotification('Пароли не совпадают', 'error')
        return
    }
    
    showLoader(true)
    
    try {
        // Получаем текущий URL для редиректа
        const siteUrl = window.location.origin
        
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${siteUrl}/auth-callback.html`
            }
        })
        
        if (error) throw error
        
        authModal.classList.remove('active')
        showNotification('Регистрация успешна! Проверьте email для подтверждения.', 'success')
        
    } catch (error) {
        showNotification(error.message, 'error')
    } finally {
        showLoader(false)
    }
}

// Выход
async function handleLogout() {
    showLoader(true)
    
    try {
        const { error } = await window.supabaseClient.auth.signOut()
        if (error) throw error
        
        showNotification('Вы успешно вышли', 'info')
        
    } catch (error) {
        showNotification(error.message, 'error')
    } finally {
        showLoader(false)
    }
}

// Проверка авторизации
async function checkAuth() {
    const { data: { user } } = await window.supabaseClient.auth.getUser()
    
    if (!user) {
        showNotification('Сначала войдите в систему', 'error')
        showAuthModal('login')
        return false
    }
    
    return true
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ ==========

// Загрузка всех данных
async function loadAllData() {
    if (!await checkAuth()) return
    
    showLoader(true)
    
    try {
        await Promise.all([
            loadPersons(),
            loadPhotos(),
            loadStories(),
            updateStats()
        ])
    } catch (error) {
        console.error('Ошибка загрузки данных:', error)
    } finally {
        showLoader(false)
    }
}

// Загрузка людей
async function loadPersons() {
    const { data: persons, error } = await window.supabaseClient
        .from('persons')
        .select('*')
        .order('birth_date', { ascending: true })
    
    if (error) {
        console.error('Ошибка загрузки людей:', error)
        showNotification('Ошибка загрузки людей', 'error')
        return
    }
    
    renderPersons(persons || [])
}

// Отображение людей
function renderPersons(persons) {
    const container = document.getElementById('persons-grid')
    
    if (persons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users fa-3x"></i>
                <h3>Пока нет ни одного человека</h3>
                <p>Добавьте первого члена семьи</p>
                <button id="add-first-from-list" class="btn btn-primary">Добавить человека</button>
            </div>
        `
        
        document.getElementById('add-first-from-list').addEventListener('click', () => {
            if (checkAuth()) showAddPersonModal()
        })
        
        return
    }
    
    container.innerHTML = persons.map(person => `
        <div class="person-card" data-id="${person.id}">
            <div class="person-header">
                <div class="person-avatar">
                    ${person.first_name.charAt(0)}${person.last_name?.charAt(0) || ''}
                </div>
                <div class="person-info">
                    <h3>${person.first_name} ${person.last_name || ''}</h3>
                    <p class="person-meta">
                        ${person.birth_date ? `🎂 ${new Date(person.birth_date).toLocaleDateString('ru-RU')}` : 'Дата рождения неизвестна'}
                        ${person.gender === 'male' ? ' • 👨 Мужчина' : person.gender === 'female' ? ' • 👩 Женщина' : ''}
                    </p>
                </div>
            </div>
            ${person.biography ? `<p class="person-bio">${person.biography.substring(0, 100)}...</p>` : ''}
            <div class="person-actions">
                <button class="btn-icon" onclick="editPerson('${person.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="viewPerson('${person.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('')
}

// Показать модальное окно добавления человека
function showAddPersonModal() {
    const modal = document.getElementById('add-person-modal')
    modal.classList.add('active')
    
    // Сброс формы
    document.getElementById('person-first-name').value = ''
    document.getElementById('person-last-name').value = ''
    document.getElementById('person-middle-name').value = ''
    document.getElementById('person-gender').value = ''
    document.getElementById('person-birth-date').value = ''
    document.getElementById('person-death-date').value = ''
    document.getElementById('person-birth-place').value = ''
    document.getElementById('person-biography').value = ''
}

// Сохранение человека
async function savePerson() {
    if (!await checkAuth()) return
    
    const firstName = document.getElementById('person-first-name').value
    if (!firstName) {
        showNotification('Введите имя', 'error')
        return
    }
    
    showLoader(true)
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser()
        
        const personData = {
            first_name: firstName,
            last_name: document.getElementById('person-last-name').value || null,
            middle_name: document.getElementById('person-middle-name').value || null,
            gender: document.getElementById('person-gender').value || null,
            birth_date: document.getElementById('person-birth-date').value || null,
            death_date: document.getElementById('person-death-date').value || null,
            birth_place: document.getElementById('person-birth-place').value || null,
            biography: document.getElementById('person-biography').value || null,
            user_id: user.id
        }
        
        const { data, error } = await window.supabaseClient
            .from('persons')
            .insert([personData])
            .select()
        
        if (error) throw error
        
        // Закрываем модалку
        document.getElementById('add-person-modal').classList.remove('active')
        
        // Обновляем данные
        loadPersons()
        updateStats()
        
        showNotification('Человек успешно добавлен!', 'success')
        
    } catch (error) {
        console.error('Ошибка сохранения:', error)
        showNotification(error.message, 'error')
    } finally {
        showLoader(false)
    }
}

// Обновление статистики
async function updateStats() {
    try {
        const [{ count: persons }, { count: photos }, { count: stories }] = await Promise.all([
            window.supabaseClient.from('persons').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('photos').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('stories').select('*', { count: 'exact', head: true })
        ])
        
        document.getElementById('total-persons').textContent = persons || 0
        document.getElementById('total-photos').textContent = photos || 0
        document.getElementById('total-stories').textContent = stories || 0
        
    } catch (error) {
        console.error('Ошибка обновления статистики:', error)
    }
}

// Поиск людей
function searchPersons() {
    const searchTerm = this.value.toLowerCase()
    const cards = document.querySelectorAll('.person-card')
    
    cards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase()
        card.style.display = name.includes(searchTerm) ? 'block' : 'none'
    })
}

// Фильтрация по полу
function filterPersons() {
    const gender = this.value
    const cards = document.querySelectorAll('.person-card')
    
    cards.forEach(card => {
        const meta = card.querySelector('.person-meta').textContent
        const show = !gender || 
            (gender === 'male' && meta.includes('👨')) ||
            (gender === 'female' && meta.includes('👩'))
        
        card.style.display = show ? 'block' : 'none'
    })
}

// Функции для редактирования и просмотра (заглушки)
function editPerson(id) {
    showNotification('Редактирование скоро будет доступно', 'info')
}

function viewPerson(id) {
    showNotification('Просмотр профиля скоро будет доступен', 'info')
}

// Экспортируем функции для использования в HTML
window.showAddPersonModal = showAddPersonModal
window.editPerson = editPerson
window.viewPerson = viewPerson