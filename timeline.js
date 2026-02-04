// timeline.js - Функции для работы с событиями
console.log('📅 Timeline.js загружается...');

// Инициализация страницы ленты событий
async function initTimelinePage() {
    console.log('🔄 Инициализация страницы ленты событий...');
    
    // Загружаем данные пользователя
    await window.loadUserData();
    
    // Проверяем авторизацию
    if (!window.currentUser) {
        window.showNotification('Пожалуйста, войдите в систему', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // Настраиваем обработчики событий
    setupTimelineEventListeners();
    
    // Загружаем события
    await loadEvents();
    
    // Настраиваем realtime подписку
    setupEventsRealtime();
}

// Настройка обработчиков событий
function setupTimelineEventListeners() {
    console.log('🎮 Настройка обработчиков для ленты событий...');
    
    // Кнопка добавления события
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            openAddEventModal();
        });
    }
    
    // Фильтры
    const filterYear = document.getElementById('filter-year');
    const filterType = document.getElementById('filter-type');
    
    if (filterYear) filterYear.addEventListener('change', renderEvents);
    if (filterType) filterType.addEventListener('change', renderEvents);
    
    // Обработчик формы добавления события
    const addEventForm = document.getElementById('add-event-form-modal');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEventSubmit);
    }
}

// Открытие модального окна добавления события
function openAddEventModal(eventId = null) {
    console.log('📝 Открытие формы события:', eventId ? 'Редактирование' : 'Добавление');
    
    const modal = document.getElementById('add-event-modal');
    const form = document.getElementById('add-event-form-modal');
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const typeInput = document.getElementById('event-type');
    const descriptionInput = document.getElementById('event-description');
    const mediaUrlInput = document.getElementById('event-media-url');
    const modalTitle = document.querySelector('#add-event-modal .modal-header h3');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Устанавливаем сегодняшнюю дату по умолчанию
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    if (eventId) {
        // Редактирование существующего события
        modalTitle.textContent = 'Редактировать событие';
        submitBtn.textContent = 'Сохранить изменения';
        submitBtn.dataset.editingId = eventId;
        
        // Находим событие
        const event = window.events.find(e => e.id === eventId);
        if (event) {
            titleInput.value = event.title || '';
            dateInput.value = event.date ? event.date.split('T')[0] : today;
            typeInput.value = event.event_type || 'other';
            descriptionInput.value = event.description || '';
            mediaUrlInput.value = event.media_url || '';
        }
    } else {
        // Добавление нового события
        modalTitle.textContent = 'Добавить семейное событие';
        submitBtn.textContent = 'Добавить событие';
        delete submitBtn.dataset.editingId;
        
        // Очищаем форму
        form.reset();
        dateInput.value = today;
        typeInput.value = 'birthday';
    }
    
    // Показываем модальное окно
    window.showModal('add-event-modal');
}

// Обработка отправки формы события
async function handleAddEventSubmit(e) {
    e.preventDefault();
    console.log('📨 Обработка формы события...');
    
    const form = e.target;
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const eventType = document.getElementById('event-type').value;
    const description = document.getElementById('event-description').value.trim();
    const mediaUrl = document.getElementById('event-media-url').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    const isEditing = submitBtn.dataset.editingId;
    
    // Валидация
    if (!title) {
        window.showNotification('Введите название события', 'error');
        return;
    }
    
    if (!date) {
        window.showNotification('Выберите дату события', 'error');
        return;
    }
    
    window.showLoader(isEditing ? 'Сохранение изменений...' : 'Добавление события...');
    
    try {
        const eventData = {
            title,
            date,
            event_type: eventType || 'other',
            description: description || null,
            media_url: mediaUrl || null,
            user_id: window.currentUser.id
        };
        
        let result;
        
        if (isEditing) {
            // Обновление существующего события
            const { data, error } = await window.supabaseClient
                .from('events')
                .update(eventData)
                .eq('id', isEditing)
                .eq('user_id', window.currentUser.id)
                .select();
            
            if (error) throw error;
            result = data && data[0];
            
            // Обновляем локальную копию
            const index = window.events.findIndex(e => e.id == isEditing);
            if (index !== -1) {
                window.events[index] = { ...window.events[index], ...eventData };
            }
            
            window.showNotification('✅ Событие обновлено!', 'success');
        } else {
            // Добавление нового события
            const { data, error } = await window.supabaseClient
                .from('events')
                .insert([eventData])
                .select();
            
            if (error) throw error;
            result = data && data[0];
            
            // Добавляем в начало локального массива
            if (result) {
                window.events.unshift(result);
            }
            
            window.showNotification('✅ Событие добавлено!', 'success');
        }
        
        // Обновляем интерфейс
        renderEvents();
        
        // Закрываем модальное окно
        window.closeAllModals();
        
        // Очищаем форму
        form.reset();
        
    } catch (error) {
        console.error('❌ Ошибка сохранения события:', error);
        window.showNotification(`Ошибка: ${error.message}`, 'error');
    } finally {
        window.hideLoader();
    }
}

// Загрузка событий из Supabase
async function loadEvents() {
    console.log('📥 Загрузка событий из Supabase...');
    
    if (!window.currentUser || !window.supabaseClient) {
        console.log('⚠️ Пользователь не авторизован, используем локальные данные');
        renderEvents();
        return;
    }
    
    window.showLoader('Загрузка событий...');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        window.events = data || [];
        console.log(`✅ Загружено ${window.events.length} событий`);
        
        // Обновляем фильтр по годам
        updateYearFilter();
        
        // Рендерим события
        renderEvents();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки событий:', error);
        window.showNotification('Ошибка загрузки событий', 'error');
        
        // Используем локальные данные
        renderEvents();
    } finally {
        window.hideLoader();
    }
}

// Обновление фильтра по годам
function updateYearFilter() {
    const filter = document.getElementById('filter-year');
    if (!filter) return;
    
    // Получаем уникальные годы из событий
    const years = new Set();
    window.events.forEach(event => {
        if (event.date) {
            const year = new Date(event.date).getFullYear();
            years.add(year);
        }
    });
    
    // Сортируем годы по убыванию
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // Очищаем и заполняем фильтр
    filter.innerHTML = '<option value="">Все годы</option>';
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        filter.appendChild(option);
    });
}

// Отображение событий
function renderEvents() {
    console.log('🎨 Рендеринг событий...');
    
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    // Получаем значения фильтров
    const selectedYear = document.getElementById('filter-year')?.value || '';
    const selectedType = document.getElementById('filter-type')?.value || '';
    
    // Фильтруем события
    let filteredEvents = window.events || [];
    
    if (selectedYear) {
        filteredEvents = filteredEvents.filter(event => {
            if (!event.date) return false;
            const year = new Date(event.date).getFullYear();
            return year.toString() === selectedYear;
        });
    }
    
    if (selectedType) {
        filteredEvents = filteredEvents.filter(event => event.event_type === selectedType);
    }
    
    // Сортируем по дате (новые сверху)
    filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #718096; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <i class="fas fa-calendar" style="font-size: 4rem; margin-bottom: 20px; color: #cbd5e0;"></i>
                <h3 style="margin-bottom: 10px; color: #4a5568;">Событий пока нет</h3>
                <p>Добавьте первое событие в вашу семейную историю</p>
            </div>
        `;
        return;
    }
    
    // Группируем события по годам
    const eventsByYear = {};
    filteredEvents.forEach(event => {
        if (!event.date) return;
        
        const year = new Date(event.date).getFullYear();
        if (!eventsByYear[year]) {
            eventsByYear[year] = [];
        }
        eventsByYear[year].push(event);
    });
    
    // Сортируем годы по убыванию
    const sortedYears = Object.keys(eventsByYear).sort((a, b) => b - a);
    
    let html = '';
    
    sortedYears.forEach(year => {
        html += `
            <div class="year-section" style="margin-bottom: 40px;">
                <h3 style="margin-bottom: 20px; color: #2d3748; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
                    ${year} год
                </h3>
                <div class="events-list">
        `;
        
        eventsByYear[year].forEach(event => {
            const date = new Date(event.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long'
            });
            
            const icon = getEventIcon(event.event_type);
            const hasMedia = event.media_url && event.media_url.trim() !== '';
            const mediaType = hasMedia ? window.getMediaTypeFromUrl(event.media_url) : null;
            
            html += `
                <div class="event-card" style="
                    background: white; 
                    border-radius: 12px; 
                    padding: 20px; 
                    margin-bottom: 15px; 
                    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                    border-left: 4px solid ${getEventColor(event.event_type)};
                    transition: all 0.3s ease;
                ">
                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                        <div class="event-icon" style="
                            background: ${getEventColor(event.event_type)}; 
                            color: white; 
                            width: 50px; 
                            height: 50px; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            flex-shrink: 0;
                            font-size: 1.2rem;
                        ">
                            <i class="${icon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0 0 5px 0; color: #2d3748;">${event.title}</h4>
                                    <div style="color: #718096; font-size: 0.9rem;">
                                        <i class="far fa-calendar-alt"></i> ${date}
                                        ${event.event_type ? ` • <span style="color: ${getEventColor(event.event_type)};">${getEventTypeName(event.event_type)}</span>` : ''}
                                    </div>
                                </div>
                                <div class="event-actions" style="display: flex; gap: 5px;">
                                    <button class="btn-icon edit-event-btn" data-id="${event.id}" style="
                                        background: none;
                                        border: none;
                                        color: #a0aec0;
                                        cursor: pointer;
                                        font-size: 0.9rem;
                                        padding: 5px;
                                        border-radius: 4px;
                                    ">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon delete-event-btn" data-id="${event.id}" style="
                                        background: none;
                                        border: none;
                                        color: #a0aec0;
                                        cursor: pointer;
                                        font-size: 0.9rem;
                                        padding: 5px;
                                        border-radius: 4px;
                                    ">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            
                            ${event.description ? `
                                <div style="color: #4a5568; margin-bottom: 15px; line-height: 1.6;">
                                    ${event.description}
                                </div>
                            ` : ''}
                            
                            ${hasMedia ? `
                                <div class="event-media" style="margin-top: 15px;">
                                    <div style="font-size: 0.9rem; color: #718096; margin-bottom: 8px;">
                                        <i class="fas fa-paperclip"></i> Прикрепленное медиа:
                                    </div>
                                    ${mediaType === 'image' ? `
                                        <a href="${event.media_url}" target="_blank" style="display: block;">
                                            <img src="${event.media_url}" 
                                                 alt="${event.title}" 
                                                 style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: cover;"
                                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/400x200/667eea/ffffff?text=Изображение'">
                                        </a>
                                    ` : `
                                        <div style="padding: 10px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                            <a href="${event.media_url}" target="_blank" style="color: #667eea; text-decoration: none; display: flex; align-items: center; gap: 8px;">
                                                <i class="fas fa-external-link-alt"></i>
                                                <span>${mediaType === 'video' ? 'Видео' : 'Файл'}: ${event.media_url.substring(0, 50)}...</span>
                                            </a>
                                        </div>
                                    `}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Добавляем обработчики для кнопок
    addEventCardListeners();
}

// Добавление обработчиков для карточек событий
function addEventCardListeners() {
    // Кнопки редактирования
    document.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const eventId = e.currentTarget.dataset.id;
            openAddEventModal(eventId);
        });
    });
    
    // Кнопки удаления
    document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const eventId = e.currentTarget.dataset.id;
            deleteEvent(eventId);
        });
    });
}

// Удаление события
async function deleteEvent(eventId) {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
        return;
    }
    
    window.showLoader('Удаление события...');
    
    try {
        // Удаляем из Supabase
        const { error } = await window.supabaseClient
            .from('events')
            .delete()
            .eq('id', eventId)
            .eq('user_id', window.currentUser.id);
        
        if (error) throw error;
        
        // Удаляем из локального массива
        const index = window.events.findIndex(e => e.id == eventId);
        if (index !== -1) {
            window.events.splice(index, 1);
        }
        
        // Обновляем интерфейс
        renderEvents();
        updateYearFilter();
        
        window.showNotification('✅ Событие удалено!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка удаления события:', error);
        window.showNotification('Ошибка удаления события', 'error');
    } finally {
        window.hideLoader();
    }
}

// Настройка realtime подписки
function setupEventsRealtime() {
    if (!window.supabaseClient) return;
    
    // Подписка на изменения событий
    window.supabaseClient
        .channel('events-channel')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: `user_id=eq.${window.currentUser.id}`
        }, (payload) => {
            console.log('🔔 Realtime событие:', payload);
            
            if (payload.eventType === 'INSERT') {
                // Добавляем новое событие в начало массива
                const exists = window.events.some(e => e.id === payload.new.id);
                if (!exists) {
                    window.events.unshift(payload.new);
                    renderEvents();
                    updateYearFilter();
                }
            } else if (payload.eventType === 'UPDATE') {
                // Обновляем существующее событие
                const index = window.events.findIndex(e => e.id === payload.new.id);
                if (index !== -1) {
                    window.events[index] = payload.new;
                    renderEvents();
                }
            } else if (payload.eventType === 'DELETE') {
                // Удаляем событие
                const index = window.events.findIndex(e => e.id === payload.old.id);
                if (index !== -1) {
                    window.events.splice(index, 1);
                    renderEvents();
                    updateYearFilter();
                }
            }
        })
        .subscribe();
}

// Вспомогательные функции
function getEventIcon(eventType) {
    const icons = {
        'birthday': 'fas fa-birthday-cake',
        'wedding': 'fas fa-ring',
        'anniversary': 'fas fa-heart',
        'holiday': 'fas fa-gift',
        'other': 'fas fa-calendar-alt'
    };
    
    return icons[eventType] || 'fas fa-calendar-alt';
}

function getEventColor(eventType) {
    const colors = {
        'birthday': '#4299e1',    // blue
        'wedding': '#ed64a6',     // pink
        'anniversary': '#48bb78', // green
        'holiday': '#f6ad55',     // orange
        'other': '#a0aec0'        // gray
    };
    
    return colors[eventType] || '#a0aec0';
}

function getEventTypeName(eventType) {
    const names = {
        'birthday': 'День рождения',
        'wedding': 'Свадьба',
        'anniversary': 'Годовщина',
        'holiday': 'Праздник',
        'other': 'Другое'
    };
    
    return names[eventType] || 'Событие';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Страница ленты событий загружена');
    
    // Ждем загрузки основных скриптов
    setTimeout(() => {
        if (typeof initTimelinePage === 'function') {
            initTimelinePage();
        }
    }, 100);
});

// Экспортируем функции
window.initTimelinePage = initTimelinePage;
window.loadEvents = loadEvents;
window.renderEvents = renderEvents;
window.deleteEvent = deleteEvent;
window.getEventIcon = getEventIcon;
window.getEventColor = getEventColor;
window.getEventTypeName = getEventTypeName;

console.log('✅ Timeline.js загружен');