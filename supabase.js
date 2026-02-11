console.log('🔧 Supabase.js загружается...');

// Базовый клиент Supabase
const SUPABASE_URL = 'https://szwsvtxkhlacrarplgtn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3N2dHhraGxhY3JhcnBsZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzA1NjAsImV4cCI6MjA4MTcwNjU2MH0.dcRnrqlA4Iz1RthtFT7wL_KGorGz4lHnMMsWCP8i-ns';

// Создаем клиент
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
    console.log('⚠️ Создаем заглушку для Supabase');
    
    supabaseClient = {
        auth: {
            getUser: async () => ({ 
                data: { user: null }, 
                error: null 
            }),
            signUp: async (credentials) => {
                console.log('📝 Регистрация (заглушка):', credentials.email);
                const user = {
                    id: 'demo-' + Date.now(),
                    email: credentials.email,
                    user_metadata: credentials.options?.data || {}
                };
                return { data: { user }, error: null };
            },
            signInWithPassword: async (credentials) => {
                console.log('🔐 Вход (заглушка):', credentials.email);
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
        storage: {
            from: (bucket) => ({
                upload: async (path, file, options) => {
                    console.log(`📁 Загрузка в ${bucket}:`, path);
                    // Для демо-режима возвращаем фейковый URL
                    return { 
                        data: { path }, 
                        error: null 
                    };
                },
                getPublicUrl: (path) => {
                    console.log(`🔗 Получение URL из ${bucket}:`, path);
                    // Для демо-режима возвращаем фейковый URL
                    return { 
                        data: { 
                            publicUrl: `https://example.com/${bucket}/${path}`
                        } 
                    };
                },
                remove: async (paths) => {
                    console.log(`🗑️ Удаление из ${bucket}:`, paths);
                    return { data: null, error: null };
                }
            })
        },
        from: (tableName) => ({
            select: (columns) => ({
                eq: (column, value) => ({
                    order: (column, options) => {
                        console.log(`📥 Запрос из ${tableName} где ${column}=${value}`);
                        // Возвращаем демо-данные для тестирования
                        if (tableName === 'events') {
                            return Promise.resolve({ 
                                data: [
                                    {
                                        id: 1,
                                        title: 'Тестовое событие 1',
                                        date: '2024-01-15',
                                        event_type: 'birthday',
                                        description: 'Это тестовое событие',
                                        media_url: 'https://picsum.photos/300/200',
                                        created_at: new Date().toISOString()
                                    },
                                    {
                                        id: 2,
                                        title: 'Тестовое событие 2',
                                        date: '2024-01-10',
                                        event_type: 'wedding',
                                        description: 'Еще одно тестовое событие',
                                        media_url: 'https://picsum.photos/300/201',
                                        created_at: new Date().toISOString()
                                    }
                                ], 
                                error: null 
                            });
                        }
                        return Promise.resolve({ data: [], error: null });
                    }
                }),
                order: (column, options) => {
                    console.log(`📥 Запрос из ${tableName} с сортировкой`);
                    return Promise.resolve({ data: [], error: null });
                }
            }),
            insert: (data) => {
                console.log(`💾 Вставка в ${tableName}:`, data);
                // Добавляем ID к данным
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
                    console.log(`✏️ Обновление ${tableName}:`, data);
                    return Promise.resolve({ 
                        data: data, 
                        error: null 
                    });
                }
            }),
            delete: () => ({
                eq: (column, value) => {
                    console.log(`🗑️ Удаление из ${tableName} где ${column}=${value}`);
                    return Promise.resolve({ 
                        data: null, 
                        error: null 
                    });
                }
            })
        })
    };
}

// Функция для загрузки фото профиля
async function uploadProfilePhoto(file, userId) {
    console.log(`📸 Загрузка фото профиля для пользователя ${userId}`);
    
    try {
        if (!supabaseClient || !supabaseClient.storage) {
            console.log('⚠️ Storage не доступен, используем Data URL');
            return await readFileAsDataURL(file);
        }
        
        // Генерируем уникальное имя файла
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
        
        // Загружаем файл
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (uploadError) throw uploadError;
        
        // Получаем публичный URL
        const { data: urlData } = supabaseClient.storage
            .from('avatars')
            .getPublicUrl(fileName);
        
        console.log('✅ Фото загружено:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки фото в Storage:', error);
        // В случае ошибки используем Data URL
        return await readFileAsDataURL(file);
    }
}

// Функция для чтения файла как Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Функция уведомлений
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

// Функции загрузчика
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

// ================ ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ SUPABASE ================

// Загрузка семейного дерева (заглушка, будет переопределена в tree-engine.js)
window.loadFamilyTreeFromSupabase = async function() {
    console.log('⚠️ Функция loadFamilyTreeFromSupabase будет загружена из tree-engine.js');
    return false;
};

// Сохранение члена семьи (заглушка, будет переопределена в tree-engine.js)
window.saveFamilyMemberToSupabase = async function(personData) {
    console.log('⚠️ Функция saveFamilyMemberToSupabase будет загружена из tree-engine.js');
    return null;
};

// Загрузка фото в Supabase Storage (заглушка, будет переопределена в tree-engine.js)
window.uploadPhotoToSupabase = async function(file, personId) {
    console.log('⚠️ Функция uploadPhotoToSupabase будет загружена из tree-engine.js');
    return await window.readFileAsDataURL(file);
};

// Экспорт дерева в JSON (заглушка, будет переопределена в tree-engine.js)
window.exportTreeAsJson = function() {
    console.log('⚠️ Функция exportTreeAsJson будет загружена из tree-engine.js');
    window.showNotification('Функция экспорта загружается...', 'info');
};

// Сохранение дерева как изображение (заглушка, будет переопределена в tree-engine.js)
window.saveTreeAsImage = function() {
    console.log('⚠️ Функция saveTreeAsImage будет загружена из tree-engine.js');
    window.showNotification('Функция сохранения загружается...', 'info');
};

// Печать дерева (заглушка, будет переопределена в tree-engine.js)
window.printTree = function() {
    console.log('⚠️ Функция printTree будет загружена из tree-engine.js');
    window.showNotification('Функция печати загружается...', 'info');
};

// Построитель дерева (заглушка, будет переопределена в tree-engine.js)
window.startTreeBuilder = function(mode) {
    console.log('⚠️ Функция startTreeBuilder будет загружена из tree-engine.js');
    window.showNotification('Построитель дерева загружается...', 'info');
};

console.log('✅ Дополнительные функции Supabase загружены');

// Экспортируем
window.supabaseClient = supabaseClient;
window.showNotification = showNotification;
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.uploadProfilePhoto = uploadProfilePhoto;
window.readFileAsDataURL = readFileAsDataURL;

console.log('✅ Supabase модуль загружен');