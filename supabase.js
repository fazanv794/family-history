// supabase.js - Исправленный клиент Supabase

console.log('🔧 Supabase.js загружается...');

// Проверяем, что Supabase SDK загружен
if (typeof supabase === 'undefined') {
    console.error('Supabase SDK не загружен!');
    // Создаем заглушку для тестирования
    window.supabase = {
        createClient: () => ({
            auth: {
                getUser: async () => ({ 
                    data: { user: null }, 
                    error: null 
                }),
                signUp: async ({ email, password, options }) => {
                    console.log('📝 Регистрация:', email);
                    return { 
                        data: { 
                            user: { 
                                id: 'user_' + Date.now(),
                                email: email,
                                user_metadata: options?.data || {},
                                created_at: new Date().toISOString()
                            } 
                        }, 
                        error: null 
                    };
                },
                signInWithPassword: async ({ email, password }) => {
                    console.log('🔐 Вход:', email);
                    return { 
                        data: { 
                            user: { 
                                id: 'user_' + Date.now(),
                                email: email,
                                user_metadata: { name: email.split('@')[0] },
                                created_at: new Date().toISOString()
                            },
                            session: {
                                access_token: 'demo_token_' + Date.now(),
                                refresh_token: 'demo_refresh_' + Date.now()
                            }
                        }, 
                        error: null 
                    };
                },
                signOut: async () => {
                    console.log('🚪 Выход');
                    return { error: null };
                },
                updateUser: async (data) => {
                    console.log('✏️ Обновление пользователя');
                    return { data: { user: data }, error: null };
                },
                setSession: async (session) => {
                    console.log('🔑 Установка сессии');
                    return { error: null };
                }
            },
            from: (table) => ({
                select: (columns = '*') => ({
                    eq: (column, value) => ({
                        order: (column, { ascending = true } = {}) => {
                            console.log(`📊 Выбор из ${table}: ${column} = ${value}`);
                            return Promise.resolve({ 
                                data: [], 
                                error: null 
                            });
                        }
                    })
                }),
                insert: (data) => {
                    console.log(`➕ Вставка в ${table}:`, data);
                    return Promise.resolve({ 
                        data: data.map(item => ({
                            ...item,
                            id: 'id_' + Date.now() + Math.random(),
                            created_at: new Date().toISOString()
                        })), 
                        error: null 
                    });
                },
                update: (data) => ({
                    eq: (column, value) => {
                        console.log(`✏️ Обновление ${table}: ${column} = ${value}`, data);
                        return Promise.resolve({ error: null });
                    }
                }),
                delete: () => ({
                    eq: (column, value) => {
                        console.log(`🗑️ Удаление из ${table}: ${column} = ${value}`);
                        return Promise.resolve({ error: null });
                    }
                })
            })
        });
    };
}

// КОНФИГУРАЦИЯ SUPABASE
const SUPABASE_URL = 'https://szwsvtxkhlacrarplgtn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3N2dHhraGxhY3JhcnBsZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzA1NjAsImV4cCI6MjA4MTcwNjU2MH0.dcRnrqlA4Iz1RthtFT7wL_KGorGz4lHnMMsWCP8i-ns';

// Создаем клиент Supabase с обработкой ошибок
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase клиент создан');
} catch (error) {
    console.error('❌ Ошибка создания Supabase клиента:', error);
    // Используем заглушку
    supabaseClient = window.supabase.createClient('demo', 'demo');
}

// Функция уведомлений
function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Создаем уведомление если его нет
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span id="notification-text"></span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Обработчик закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
        });
    }
    
    const text = document.getElementById('notification-text');
    if (text) {
        text.textContent = message;
    }
    
    // Обновляем класс типа
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Функции загрузчика
function showLoader(text = 'Загрузка...') {
    console.log(`⏳ ${text}`);
    
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
    
    loader.classList.add('show');
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('show');
    }
}

// Экспортируем функции в глобальную область видимости
window.supabaseClient = supabaseClient;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;

console.log('✅ Supabase модуль загружен');