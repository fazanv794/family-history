// ТВОИ КЛЮЧИ
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk'

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Простая функция уведомления
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification')
    if (!notification) {
        console.log(type + ':', message)
        return
    }
    
    const text = document.getElementById('notification-text')
    if (!text) return
    
    text.textContent = message
    notification.className = `notification ${type}`
    notification.classList.remove('hidden')
    
    setTimeout(() => {
        notification.classList.add('hidden')
    }, 4000)
}

// Простая функция загрузчика
function showLoader(text = 'Загрузка...') {
    const loader = document.getElementById('loader')
    const loaderText = document.getElementById('loader-text')
    if (loader) {
        if (loaderText) loaderText.textContent = text
        loader.classList.remove('hidden')
    }
}

function hideLoader() {
    const loader = document.getElementById('loader')
    if (loader) loader.classList.add('hidden')
}

// Экспортируем
window.supabaseClient = supabase
window.showNotification = showNotification
window.showLoader = showLoader
window.hideLoader = hideLoader

console.log('✅ Supabase подключен')