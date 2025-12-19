// supabase.js - ИСПРАВЛЕННЫЙ

// Проверяем, что Supabase SDK загружен
if (typeof supabase === 'undefined') {
    console.error('Supabase SDK не загружен!');
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
            signUp: async () => ({ data: null, error: new Error('Supabase не настроен') }),
            signInWithPassword: async () => ({ data: null, error: new Error('Supabase не настроен') }),
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
    
    const notification = document.getElementById('notification');
    if (!notification) {
        console.warn('Элемент уведомления не найден');
        return;
    }
    
    const text = document.getElementById('notification-text');
    if (!text) return;
    
    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    // Закрытие по клику
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            notification.classList.remove('show');
            setTimeout(() => notification.classList.add('hidden'), 300);
        };
    }
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.classList.add('hidden'), 300);
    }, 4000);
}

// Функции загрузчика
function showLoader(text = 'Загрузка...') {
    console.log(`⏳ ${text}`);
    
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    
    if (loader && loaderText) {
        loaderText.textContent = text;
        loader.classList.remove('hidden');
    } else {
        console.warn('Элемент загрузчика не найден');
    }
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