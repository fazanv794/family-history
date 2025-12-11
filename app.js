// DOM элементы
const authSection = document.getElementById('auth-section')
const appSection = document.getElementById('app-section')
const userEmailSpan = document.getElementById('user-email')
const personsList = document.getElementById('persons-list')
const addPersonForm = document.getElementById('add-person-form')

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await window.supabaseClient.auth.getUser()
    
    if (user) {
        showApp(user)
    } else {
        showAuth()
    }
})

// Показать форму авторизации
function showAuth() {
    authSection.style.display = 'block'
    appSection.style.display = 'none'
}

// Показать основное приложение
function showApp(user) {
    authSection.style.display = 'none'
    appSection.style.display = 'block'
    userEmailSpan.textContent = user.email
    loadPersons()
}

// Вход
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
    })
    
    if (error) {
        showMessage('❌ ' + error.message, 'error')
    } else {
        showApp(data.user)
    }
})

// Регистрация
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password
    })
    
    if (error) {
        showMessage('❌ ' + error.message, 'error')
    } else {
        showMessage('✅ Регистрация успешна! Проверь email для подтверждения.', 'success')
    }
})

// Выход
document.getElementById('logout-btn').addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut()
    showAuth()
})

// Загрузка людей из базы
async function loadPersons() {
    const { data: persons, error } = await window.supabaseClient
        .from('persons')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (error) {
        console.error('Ошибка загрузки:', error)
        personsList.innerHTML = '<p class="empty">Ошибка загрузки данных</p>'
        return
    }
    
    if (persons.length === 0) {
        personsList.innerHTML = '<p class="empty">Пока нет ни одного человека. Добавь первого!</p>'
    } else {
        personsList.innerHTML = persons.map(person => `
            <div class="person-item">
                <div class="person-avatar">${person.first_name.charAt(0)}${person.last_name?.charAt(0) || ''}</div>
                <div class="person-info">
                    <h4>${person.first_name} ${person.last_name || ''}</h4>
                    <p>${person.birth_date ? '🎂 ' + new Date(person.birth_date).toLocaleDateString('ru-RU') : 'Дата рождения неизвестна'}</p>
                    <p>${person.gender ? (person.gender === 'male' ? '👨 Мужчина' : person.gender === 'female' ? '👩 Женщина' : '👤 Другой') : ''}</p>
                </div>
            </div>
        `).join('')
    }
}

// Показать/скрыть форму добавления
document.getElementById('add-person-btn').addEventListener('click', () => {
    addPersonForm.style.display = 'flex'
})

document.getElementById('cancel-person-btn').addEventListener('click', () => {
    addPersonForm.style.display = 'none'
})

// Сохранение человека
document.getElementById('save-person-btn').addEventListener('click', async () => {
    const firstName = document.getElementById('first-name').value
    const lastName = document.getElementById('last-name').value
    const birthDate = document.getElementById('birth-date').value
    const gender = document.getElementById('gender').value
    
    if (!firstName) {
        alert('Введите имя')
        return
    }
    
    const { data: { user } } = await window.supabaseClient.auth.getUser()
    
    const { data, error } = await window.supabaseClient
        .from('persons')
        .insert([{
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate || null,
            gender: gender || null,
            user_id: user.id,
            created_at: new Date().toISOString()
        }])
    
    if (error) {
        alert('Ошибка сохранения: ' + error.message)
    } else {
        // Очищаем форму
        document.getElementById('first-name').value = ''
        document.getElementById('last-name').value = ''
        document.getElementById('birth-date').value = ''
        document.getElementById('gender').value = ''
        
        // Закрываем форму
        addPersonForm.style.display = 'none'
        
        // Обновляем список
        loadPersons()
        
        showMessage('✅ Человек успешно добавлен!', 'success')
    }
})

// Вспомогательная функция для сообщений
function showMessage(text, type) {
    const messageDiv = document.getElementById('auth-message')
    messageDiv.textContent = text
    messageDiv.className = `message ${type}`
    
    setTimeout(() => {
        messageDiv.textContent = ''
        messageDiv.className = 'message'
    }, 5000)
}