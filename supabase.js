// ТВОИ КЛЮЧИ
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk'

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Экспортируем для использования
window.supabaseClient = supabase

// Вспомогательные функции
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification')
    if (!notification) return
    
    notification.textContent = message
    notification.className = `notification ${type} show`
    
    setTimeout(() => {
        notification.classList.remove('show')
    }, 3000)
}

window.showNotification = showNotification

function showLoader(show = true) {
    const loader = document.getElementById('loader')
    if (loader) {
        loader.classList.toggle('active', show)
    }
}

window.showLoader = showLoader