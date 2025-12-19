// supabase.js - ИСПРАВЛЕННЫЙ

console.log('🔧 Supabase.js загружается...');

// Проверяем, что Supabase SDK загружен
if (typeof supabase === 'undefined') {
    console.error('Supabase SDK не загружен!');
    // Создаем заглушку для тестирования
    window.supabase = {
        createClient: () => ({
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                signUp: async () => ({ data: null, error: null }),
                signInWithPassword: async () => ({ 
                    data: { 
                        user: { 
                            id: 'demo_user', 
                            email: 'demo@example.com',
                            user_metadata: { name: 'Демо Пользователь' },
                            created_at: new Date().toISOString()
                        } 
                    }, 
                    error: null 
                }),
                signOut: async () => ({ error: null }),
                updateUser: async () => ({ error: null })
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        order: () => Promise.resolve({ data: [], error: null })
                    })
                }),
                insert: () => Promise.resolve({ data: [], error: null }),
                update: () => Promise.resolve({ error: null }),
                delete: () => Promise.resolve({ error: null })
            })
        })
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
    // Создаем заглушку для демо-режима
    supabaseClient = {
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            signUp: async () => ({ data: null, error: null }),
            signInWithPassword: async () => ({ 
                data: { 
                    user: { 
                        id: 'demo_user', 
                        email: 'demo@example.com',
                        user_metadata: { name: 'Демо Пользователь' },
                        created_at: new Date().toISOString()
                    } 
                }, 
                error: null 
            }),
            signOut: async () => ({ error: null }),
            updateUser: async () => ({ error: null })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null })
                })
            }),
            insert: () => Promise.resolve({ data: [], error: null }),
            update: () => Promise.resolve({ error: null }),
            delete: () => Promise.resolve({ error: null })
        })
    };
}

// Функция уведомлений
function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Создаем уведомление если его нет
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = `notification ${type}`;
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
            setTimeout(() => notification.classList.add('hidden'), 300);
        });
    }
    
    const text = document.getElementById('notification-text');
    if (!text) return;
    
    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.classList.add('hidden'), 300);
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
        loader.className = 'loader-overlay hidden';
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
    
    loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Экспортируем функции в глобальную область видимости
window.supabaseClient = supabaseClient;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;

console.log('✅ Supabase модуль загружен');