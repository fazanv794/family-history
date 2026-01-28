// supabase.js - Клиент для работы с Supabase
console.log('🔧 Supabase.js загружается...');

const SUPABASE_URL = 'https://szwsvtxkhlacrarplgtn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3N2dHhraGxhY3JhcnBsZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzA1NjAsImV4cCI6MjA4MTcwNjU2MH0.dcRnrqlA4Iz1RthtFT7wL_KGorGz4lHnMMsWCP8i-ns';

let supabaseClient;

try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        console.log('✅ Supabase клиент создан');
    } else {
        throw new Error('Библиотека Supabase не загружена');
    }
} catch (error) {
    console.error('❌ Ошибка создания Supabase клиента:', error.message);
    createFallbackClient();
}

function createFallbackClient() {
    supabaseClient = {
        auth: {
            getUser: async () => ({ 
                data: { user: null }, 
                error: null 
            }),
            signUp: async (credentials) => {
                const user = {
                    id: 'demo-' + Date.now(),
                    email: credentials.email,
                    user_metadata: credentials.options?.data || {}
                };
                return { data: { user }, error: null };
            },
            signInWithPassword: async (credentials) => {
                const user = {
                    id: 'demo-' + Date.now(),
                    email: credentials.email,
                    user_metadata: { name: 'Демо пользователь' }
                };
                return { 
                    data: { 
                        user,
                        session: { 
                            access_token: 'demo-token',
                            refresh_token: 'demo-refresh'
                        }
                    }, 
                    error: null 
                };
            },
            signOut: async () => ({ error: null }),
            updateUser: async (updates) => ({ 
                data: { user: updates }, 
                error: null 
            })
        },
        from: (tableName) => ({
            select: (columns) => ({
                eq: (column, value) => ({
                    order: (column, options) => {
                        return Promise.resolve({ data: [], error: null });
                    }
                }),
                order: (column, options) => {
                    return Promise.resolve({ data: [], error: null });
                }
            }),
            insert: (data) => {
                const result = data.map(item => ({ 
                    ...item, 
                    id: Date.now() + Math.floor(Math.random() * 1000)
                }));
                return Promise.resolve({ 
                    data: result, 
                    error: null 
                });
            },
            update: (data) => ({
                eq: (column, value) => {
                    return Promise.resolve({ 
                        data: data, 
                        error: null 
                    });
                }
            }),
            delete: () => ({
                eq: (column, value) => {
                    return Promise.resolve({ 
                        data: null, 
                        error: null 
                    });
                }
            })
        })
    };
}

function showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    try {
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
        
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
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

function showLoader(text = 'Загрузка...') {
    console.log(`⏳ ${text}`);
    
    try {
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

window.supabaseClient = supabaseClient;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;

console.log('✅ Supabase модуль загружен');