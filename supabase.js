// ТВОИ КЛЮЧИ
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk'

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Проверка подключения
supabase.from('persons').select('count', { count: 'exact', head: true })
  .then(response => {
    console.log('✅ Подключение к Supabase успешно')
  })
  .catch(error => {
    console.error('❌ Ошибка подключения:', error)
    showNotification('Ошибка подключения к базе данных', 'error')
  })

// Экспортируем для использования
window.supabaseClient = supabase

// Вспомогательные функции
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification')
    notification.textContent = message
    notification.className = `notification ${type} show`
    
    setTimeout(() => {
        notification.classList.remove('show')
    }, 5000)
}

window.showNotification = showNotification

function showLoader(show = true) {
    const loader = document.getElementById('loader')
    loader.classList.toggle('active', show)
}

window.showLoader = showLoader

// Обработка авторизации
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event)
    
    if (event === 'SIGNED_IN') {
        showNotification('Вход выполнен успешно!', 'success')
        window.location.reload()
    } else if (event === 'SIGNED_OUT') {
        showNotification('Вы вышли из системы', 'info')
        window.location.reload()
    }
})

// Проверка сессии при загрузке
async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

window.initAuth = initAuth