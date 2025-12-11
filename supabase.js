
const SUPABASE_URL = 'https://ejbdehqypaotjnsiunny.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmRlaHF5cGFvdGpuc2l1bm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg2MzQsImV4cCI6MjA4MDk4NDYzNH0.hDWtZLUtMgg266d4LpFsKaOfKF1zAPt1JFN8OtqbLFk'


const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Проверяем подключение
supabase.from('persons').select('count', { count: 'exact', head: true })
  .then(response => {
    console.log('✅ Подключение к Supabase успешно')
  })
  .catch(error => {
    console.error('❌ Ошибка подключения:', error)
    alert('Проверь подключение к Supabase. Возможно, таблицы не созданы.')
  })

// Экспортируем для использования
window.supabaseClient = supabase