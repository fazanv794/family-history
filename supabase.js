// supabase.js - Клиент для работы с Supabase (без демо-режима)

console.log('🔧 Supabase.js загружается...');

// Базовый клиент Supabase
const SUPABASE_URL = 'https://szwsvtxkhlacrarplgtn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3N2dHhraGxhY3JhcnBsZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzA1NjAsImV4cCI6MjA4MTcwNjU2MH0.dcRnrqlA4Iz1RthtFT7wL_KGorGz4lHnMMsWCP8i-ns';

// Создаем клиент с обработкой ошибок
let supabaseClient;

try {
    // Проверяем, что библиотека загружена
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase клиент создан');
    } else {
        throw new Error('Библиотека Supabase не загружена');
    }
} catch (error) {
    console.error('❌ Ошибка создания Supabase клиента:', error.message);
    
    // Показываем ошибку
    setTimeout(() => {
        if (window.showNotification) {
            window.showNotification(
                'Ошибка подключения к базе данных. Пожалуйста, обновите страницу.', 
                'error'
            );
        }
    }, 1000);
    
    // Создаем заглушку, которая требует авторизацию
    supabaseClient = {
        auth: {
            getUser: async () => ({ 
                data: { user: null }, 
                error: { message: 'Требуется авторизация' } 
            }),
            signUp: async () => ({ 
                data: null, 
                error: { message: 'Функция недоступна' } 
            }),
            signInWithPassword: async () => ({ 
                data: null, 
                error: { message: 'Функция недоступна' } 
            }),
            signOut: async () => ({ 
                error: { message: 'Нет активной сессии' } 
            }),
            updateUser: async () => ({ 
                data: null, 
                error: { message: 'Требуется авторизация' } 
            })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ 
                        data: [], 
                        error: { message: 'Требуется авторизация' } 
                    })
                })
            }),
            insert: () => Promise.resolve({ 
                data: null, 
                error: { message: 'Требуется авторизация' } 
            }),
            update: () => ({
                eq: () => Promise.resolve({ 
                    error: { message: 'Требуется авторизация' } 
                })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ 
                    error: { message: 'Требуется авторизация' } 
                })
            })
        })
    };
}

// Функция уведомлений
function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    try {
        // Создаем уведомление если его нет
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <span id="notification-text">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Обработчик закрытия
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 300);
            });
        }
        
        const text = document.getElementById('notification-text');
        if (text) {
            text.textContent = message;
        }
        
        // Обновляем класс типа
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 4000);
    } catch (e) {
        console.error('Ошибка показа уведомления:', e);
    }
}

// Функции загрузчика
function showLoader(text = 'Загрузка...') {
    console.log(`⏳ ${text}`);
    
    try {
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
        
        loader.style.display = 'flex';
        setTimeout(() => {
            loader.classList.add('show');
        }, 10);
    } catch (e) {
        console.error('Ошибка показа загрузчика:', e);
    }
}

function hideLoader() {
    try {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.remove('show');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    } catch (e) {
        console.error('Ошибка скрытия загрузчика:', e);
    }
}

// Экспортируем функции
window.supabaseClient = supabaseClient;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;

console.log('✅ Supabase модуль загружен');