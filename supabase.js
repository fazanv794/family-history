// supabase.js - Упрощенный клиент для работы

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
    console.warn('⚠️ Используем локальное хранилище:', error.message);
    
    // Создаем простую заглушку с localStorage
    supabaseClient = {
        auth: {
            getUser: async () => {
                try {
                    const userData = localStorage.getItem('family_tree_user');
                    return { 
                        data: { 
                            user: userData ? JSON.parse(userData) : null 
                        }, 
                        error: null 
                    };
                } catch (e) {
                    console.error('Ошибка получения пользователя:', e);
                    return { data: { user: null }, error: null };
                }
            },
            signUp: async ({ email, password, options }) => {
                console.log('📝 Регистрация:', email);
                try {
                    const user = {
                        id: 'user_' + Date.now(),
                        email: email,
                        user_metadata: options?.data || {},
                        created_at: new Date().toISOString()
                    };
                    localStorage.setItem('family_tree_user', JSON.stringify(user));
                    localStorage.setItem('family_tree_email', email);
                    localStorage.setItem('family_tree_password', password);
                    return { data: { user }, error: null };
                } catch (e) {
                    console.error('Ошибка регистрации:', e);
                    return { data: null, error: { message: 'Ошибка регистрации' } };
                }
            },
            signInWithPassword: async ({ email, password }) => {
                console.log('🔐 Вход:', email);
                
                try {
                    // Проверяем существующих пользователей
                    const savedEmail = localStorage.getItem('family_tree_email');
                    const savedPassword = localStorage.getItem('family_tree_password');
                    
                    let user = null;
                    try {
                        user = JSON.parse(localStorage.getItem('family_tree_user') || 'null');
                    } catch (e) {
                        console.log('Нет сохраненного пользователя');
                    }
                    
                    // Если пользователь существует и пароль совпадает
                    if (user && savedEmail === email && savedPassword === password) {
                        console.log('✅ Пользователь найден, вход выполнен');
                    } else {
                        // Создаем нового пользователя
                        console.log('🆕 Создаем нового пользователя');
                        user = {
                            id: 'user_' + Date.now(),
                            email: email,
                            user_metadata: { name: email.split('@')[0] || 'Пользователь' },
                            created_at: new Date().toISOString()
                        };
                        localStorage.setItem('family_tree_user', JSON.stringify(user));
                        localStorage.setItem('family_tree_email', email);
                        localStorage.setItem('family_tree_password', password);
                    }
                    
                    return { 
                        data: { 
                            user: user,
                            session: {
                                access_token: 'local_token_' + Date.now(),
                                refresh_token: 'local_refresh_' + Date.now()
                            }
                        }, 
                        error: null 
                    };
                } catch (e) {
                    console.error('Ошибка входа:', e);
                    return { 
                        data: null, 
                        error: { message: 'Ошибка входа: ' + e.message } 
                    };
                }
            },
            signOut: async () => {
                console.log('🚪 Выход');
                try {
                    localStorage.removeItem('family_tree_user');
                    // Не удаляем данные, чтобы пользователь мог вернуться
                    return { error: null };
                } catch (e) {
                    console.error('Ошибка выхода:', e);
                    return { error: { message: 'Ошибка выхода' } };
                }
            },
            updateUser: async (data) => {
                console.log('✏️ Обновление пользователя');
                try {
                    const user = JSON.parse(localStorage.getItem('family_tree_user') || '{}');
                    const updatedUser = { ...user, ...data };
                    localStorage.setItem('family_tree_user', JSON.stringify(updatedUser));
                    return { data: { user: updatedUser }, error: null };
                } catch (e) {
                    console.error('Ошибка обновления:', e);
                    return { data: null, error: { message: 'Ошибка обновления' } };
                }
            }
        },
        from: (table) => ({
            select: (columns = '*') => ({
                eq: (column, value) => ({
                    order: (column, { ascending = true } = {}) => {
                        console.log(`📊 Выбор из ${table}: ${column} = ${value}`);
                        try {
                            const allData = JSON.parse(localStorage.getItem('family_tree_data') || '{}');
                            const tableData = allData[table] || [];
                            const filteredData = tableData.filter(item => item[column] === value);
                            return Promise.resolve({ data: filteredData, error: null });
                        } catch (e) {
                            console.error('Ошибка выборки данных:', e);
                            return Promise.resolve({ data: [], error: null });
                        }
                    }
                })
            }),
            insert: (data) => {
                console.log(`➕ Вставка в ${table}:`, data);
                try {
                    const allData = JSON.parse(localStorage.getItem('family_tree_data') || '{}');
                    if (!allData[table]) allData[table] = [];
                    
                    const newData = data.map(item => ({
                        ...item,
                        id: table + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        created_at: new Date().toISOString()
                    }));
                    
                    allData[table].push(...newData);
                    localStorage.setItem('family_tree_data', JSON.stringify(allData));
                    
                    return Promise.resolve({ data: newData, error: null });
                } catch (e) {
                    console.error('Ошибка вставки данных:', e);
                    return Promise.resolve({ data: null, error: { message: 'Ошибка вставки' } });
                }
            },
            update: (data) => ({
                eq: (column, value) => {
                    console.log(`✏️ Обновление ${table}: ${column} = ${value}`, data);
                    try {
                        const allData = JSON.parse(localStorage.getItem('family_tree_data') || '{}');
                        if (allData[table]) {
                            allData[table] = allData[table].map(item => 
                                item[column] === value ? { ...item, ...data } : item
                            );
                            localStorage.setItem('family_tree_data', JSON.stringify(allData));
                        }
                        return Promise.resolve({ error: null });
                    } catch (e) {
                        console.error('Ошибка обновления данных:', e);
                        return Promise.resolve({ error: { message: 'Ошибка обновления' } });
                    }
                }
            }),
            delete: () => ({
                eq: (column, value) => {
                    console.log(`🗑️ Удаление из ${table}: ${column} = ${value}`);
                    try {
                        const allData = JSON.parse(localStorage.getItem('family_tree_data') || '{}');
                        if (allData[table]) {
                            allData[table] = allData[table].filter(item => item[column] !== value);
                            localStorage.setItem('family_tree_data', JSON.stringify(allData));
                        }
                        return Promise.resolve({ error: null });
                    } catch (e) {
                        console.error('Ошибка удаления данных:', e);
                        return Promise.resolve({ error: { message: 'Ошибка удаления' } });
                    }
                }
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

// Функция для проверки демо-режима
window.isDemoMode = function() {
    return localStorage.getItem('family_tree_user') && !localStorage.getItem('family_tree_email')?.includes('@');
};

console.log('✅ Supabase модуль загружен');