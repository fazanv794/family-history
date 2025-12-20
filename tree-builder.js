// tree-builder.js - Пошаговое построение генеалогического дерева

console.log('🌳 Tree Builder загружается...');

// Инициализируем данные дерева
if (!window.treeData) {
    window.treeData = {
        people: [],
        currentPerson: null,
        treeStructure: null
    };
}

// Основная функция пошагового построения
window.startTreeBuilder = function() {
    console.log('🚀 Запуск пошагового построения дерева');
    console.log('Текущий пользователь:', window.currentUser);
    
    // Проверка авторизации
    if (!window.currentUser) {
        window.showNotification('Для построения дерева необходимо войти в систему', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // Убеждаемся что оверлей существует
    const overlay = ensureOverlayExists();
    
    // Показываем начальное окно
    showTreeBuilderStartModal(overlay);
}

// Начальное модальное окно
function showTreeBuilderStartModal(overlay) {
    console.log('📋 Показываем стартовое окно');
    
    const modalHtml = `
    <div class="modal" id="tree-builder-start-modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Пошаговое построение генеалогического древа</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 30px 20px;">
                    <i class="fas fa-tree" style="font-size: 4rem; color: #48bb78; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 15px; color: #4a5568;">Создайте ваше первое древо</h3>
                    <p style="margin-bottom: 25px; color: #718096; line-height: 1.6;">
                        Начните с себя, затем добавляйте родственников по очереди.<br>
                        Система автоматически построит дерево на основе добавленных связей.
                    </p>
                    
                    <div class="start-options" style="margin-top: 30px; display: flex; flex-direction: column; gap: 15px; align-items: center;">
                        <button class="btn" id="start-with-self" style="min-width: 250px; padding: 15px 30px; font-size: 1.1rem;">
                            <i class="fas fa-user"></i> Начать с себя
                        </button>
                        <button class="btn btn-secondary" id="start-with-other" style="min-width: 250px; padding: 15px 30px; font-size: 1.1rem;">
                            <i class="fas fa-users"></i> Начать с другого родственника
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    // Очищаем и добавляем новое содержимое
    overlay.innerHTML = modalHtml;
    overlay.classList.remove('hidden');
    
    console.log('✅ Модальное окно добавлено в оверлей');
    
    // Добавляем обработчики событий
    setTimeout(() => {
        const startWithSelfBtn = document.getElementById('start-with-self');
        const startWithOtherBtn = document.getElementById('start-with-other');
        const closeBtn = document.querySelector('#tree-builder-start-modal .modal-close');
        
        if (startWithSelfBtn) {
            startWithSelfBtn.addEventListener('click', () => {
                console.log('👤 Начинаем с себя');
                overlay.classList.add('hidden');
                setTimeout(() => addNewPerson('self'), 100);
            });
        }
        
        if (startWithOtherBtn) {
            startWithOtherBtn.addEventListener('click', () => {
                console.log('👥 Начинаем с другого');
                overlay.classList.add('hidden');
                setTimeout(() => addNewPerson('other'), 100);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('❌ Закрытие модального окна');
                overlay.classList.add('hidden');
            });
        }
        
        // Закрытие при клике на оверлей
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
        
        console.log('✅ Обработчики событий добавлены');
    }, 50);
}

// Добавление нового человека
window.addNewPerson = function(defaultRelation = 'self') {
    console.log('➕ Добавляем нового человека, роль по умолчанию:', defaultRelation);
    
    const overlay = ensureOverlayExists();
    
    const modalHtml = `
    <div class="modal" id="add-person-builder-modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>${defaultRelation === 'self' ? 'Добавьте себя' : 'Добавить родственника'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-person-builder-form">
                    <div class="form-section">
                        <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-user"></i> Основная информация
                        </h4>
                        
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label for="builder-first-name">Имя *</label>
                                <input type="text" id="builder-first-name" placeholder="Иван" required style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            </div>
                            <div class="form-group">
                                <label for="builder-last-name">Фамилия *</label>
                                <input type="text" id="builder-last-name" placeholder="Иванов" required style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            </div>
                        </div>
                        
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label for="builder-birth-date">Дата рождения</label>
                                <input type="date" id="builder-birth-date" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            </div>
                            <div class="form-group">
                                <label for="builder-death-date">Дата смерти</label>
                                <input type="date" id="builder-death-date" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            </div>
                            <div class="form-group">
                                <label for="builder-gender">Пол *</label>
                                <select id="builder-gender" required style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section" style="margin-top: 25px;">
                        <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-link"></i> Связи и родство
                        </h4>
                        
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label for="builder-relation">Роль в древе *</label>
                                <select id="builder-relation" required ${defaultRelation === 'self' ? 'disabled' : ''} style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                    <option value="">Выберите роль</option>
                                    <option value="self" ${defaultRelation === 'self' ? 'selected' : ''}>Я (центральная персона)</option>
                                    <option value="spouse">Супруг/супруга</option>
                                    <option value="father">Отец</option>
                                    <option value="mother">Мать</option>
                                    <option value="son">Сын</option>
                                    <option value="daughter">Дочь</option>
                                    <option value="grandfather">Дедушка</option>
                                    <option value="grandmother">Бабушка</option>
                                    <option value="grandson">Внук</option>
                                    <option value="granddaughter">Внучка</option>
                                    <option value="great_grandfather">Прадедушка</option>
                                    <option value="great_grandmother">Прабабушка</option>
                                    <option value="great_grandson">Правнук</option>
                                    <option value="great_granddaughter">Правнучка</option>
                                    <option value="brother">Брат</option>
                                    <option value="sister">Сестра</option>
                                </select>
                                ${defaultRelation === 'self' ? '<input type="hidden" id="builder-relation-hidden" value="self">' : ''}
                            </div>
                            
                            <div class="form-group">
                                <label for="builder-line">Линия родства</label>
                                <select id="builder-line" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                    <option value="both">Обе линии</option>
                                    <option value="father">Отцовская линия</option>
                                    <option value="mother">Материнская линия</option>
                                    <option value="unknown">Неизвестно</option>
                                </select>
                            </div>
                        </div>
                        
                        ${window.treeData.people.length > 0 ? `
                        <div class="form-group">
                            <label for="builder-related-to">Родственник по отношению к:</label>
                            <select id="builder-related-to" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                <option value="">Не указано</option>
                                ${window.treeData.people.map(person => 
                                    `<option value="${person.id}">${person.first_name} ${person.last_name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="form-section" style="margin-top: 25px;">
                        <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                            <i class="fas fa-file-alt"></i> Дополнительная информация
                        </h4>
                        
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label for="builder-bio">Биография</label>
                            <textarea id="builder-bio" rows="3" placeholder="Расскажите историю этого человека..." style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="builder-photo-url">Фотография (URL)</label>
                            <input type="url" id="builder-photo-url" placeholder="https://example.com/photo.jpg" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            <small style="color: #718096; font-size: 0.85rem;">Или оставьте пустым для автоматического аватара</small>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="margin-top: 30px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <button type="button" class="btn btn-secondary cancel-btn" style="padding: 10px 20px;">
                            Отмена
                        </button>
                        <button type="submit" class="btn" style="padding: 10px 30px;">
                            <i class="fas fa-check"></i> ${defaultRelation === 'self' ? 'Начать построение' : 'Добавить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
    
    // Очищаем и добавляем новое содержимое
    overlay.innerHTML = modalHtml;
    overlay.classList.remove('hidden');
    
    console.log('✅ Форма добавления человека показана');
    
    // Добавляем обработчики событий
    setTimeout(() => {
        const form = document.getElementById('add-person-builder-form');
        const closeBtn = document.querySelector('#add-person-builder-modal .modal-close');
        const cancelBtn = document.querySelector('#add-person-builder-modal .cancel-btn');
        
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                savePerson();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                // Если ещё нет людей, показываем стартовое окно
                if (window.treeData.people.length === 0) {
                    setTimeout(() => showTreeBuilderStartModal(overlay), 300);
                }
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                // Если ещё нет людей, показываем стартовое окно
                if (window.treeData.people.length === 0) {
                    setTimeout(() => showTreeBuilderStartModal(overlay), 300);
                }
            });
        }
        
        // Закрытие при клике на оверлей
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
                if (window.treeData.people.length === 0) {
                    setTimeout(() => showTreeBuilderStartModal(overlay), 300);
                }
            }
        });
    }, 50);
}

// Сохранение человека
function savePerson() {
    const relation = document.getElementById('builder-relation-hidden') ? 
                   'self' : document.getElementById('builder-relation').value;
    
    const person = {
        id: 'person_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        first_name: document.getElementById('builder-first-name').value.trim(),
        last_name: document.getElementById('builder-last-name').value.trim(),
        birth_date: document.getElementById('builder-birth-date').value || null,
        death_date: document.getElementById('builder-death-date').value || null,
        gender: document.getElementById('builder-gender').value,
        relation: relation,
        line: document.getElementById('builder-line').value,
        related_to: document.getElementById('builder-related-to') ? 
                   document.getElementById('builder-related-to').value || null : null,
        biography: document.getElementById('builder-bio')?.value.trim() || '',
        photo_url: document.getElementById('builder-photo-url')?.value.trim() || null,
        created_at: new Date().toISOString()
    };
    
    // Валидация
    if (!person.first_name || !person.last_name || !person.gender || !person.relation) {
        if (window.showNotification) {
            window.showNotification('Заполните все обязательные поля', 'error');
        } else {
            alert('Заполните все обязательные поля');
        }
        return;
    }
    
    // Добавляем в данные
    window.treeData.people.push(person);
    
    // Если это первый человек, делаем его текущим
    if (window.treeData.people.length === 1) {
        window.treeData.currentPerson = person;
    }
    
    // Показываем уведомление
    if (window.showNotification) {
        window.showNotification(`✅ ${person.first_name} ${person.last_name} добавлен в древо`, 'success');
    }
    
    // Закрываем модальное окно
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    // Обновляем предпросмотр
    setTimeout(() => {
        if (window.updateTreePreview) {
            window.updateTreePreview();
        }
    }, 100);
}

// Обновление предпросмотра дерева
window.updateTreePreview = function() {
    console.log('🔄 Обновляем предпросмотр, людей:', window.treeData.people.length);
    
    const container = document.getElementById('tree-visualization-container');
    if (!container) {
        console.error('❌ Контейнер дерева не найден!');
        return;
    }
    
    if (window.treeData.people.length === 0) {
        container.innerHTML = `<div class="tree-empty-state">
            <i class="fas fa-tree" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 20px;"></i>
            <h3>Дерево еще не построено</h3>
            <p>Нажмите "Автопостроение" чтобы создать ваше первое генеалогическое древо</p>
        </div>`;
        return;
    }
    
    let html = `<div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h3 style="margin: 0; font-size: 1.4rem;">Предпросмотр дерева (${window.treeData.people.length} человек)</h3>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-small" onclick="addNewPerson()" style="padding: 8px 15px; background: white; color: #667eea; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-user-plus"></i> Добавить родственника
                </button>
                ${window.treeData.people.length >= 2 ? `
                <button class="btn btn-small btn-success" onclick="buildFinalTree()" style="padding: 8px 15px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-tree"></i> Автопостроение дерева
                </button>
                ` : ''}
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; padding: 25px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; max-height: 500px; overflow-y: auto; padding-right: 10px;">`;
    
    // Показываем всех добавленных людей
    window.treeData.people.forEach(person => {
        const relationText = getRelationText(person.relation);
        const lineText = getLineText(person.line);
        const genderColor = person.gender === 'female' ? '#ed64a6' : '#4299e1';
        
        html += `<div style="display: flex; align-items: center; padding: 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; border-left: 4px solid ${genderColor}; transition: all 0.3s ease; cursor: pointer;" onclick="showPersonDetails('${person.id}')">
            <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; margin-right: 15px; flex-shrink: 0;">
                ${person.photo_url ? 
                    `<img src="${person.photo_url}" alt="${person.first_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${person.first_name}+${person.last_name}&background=${genderColor.substr(1)}&color=fff'">` :
                    `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; color: white; background: ${genderColor};">
                        ${person.first_name[0]}${person.last_name[0] || ''}
                    </div>`
                }
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #2d3748; margin-bottom: 5px;">
                    <strong>${person.first_name} ${person.last_name}</strong>
                </div>
                <div style="font-size: 0.85rem; color: #718096;">
                    <span style="display: inline-block; background: #e6fffa; color: #234e52; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-right: 5px;">
                        ${relationText}
                    </span>
                    ${lineText ? `<span style="display: inline-block; background: #fefcbf; color: #744210; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">
                        ${lineText}
                    </span>` : ''}
                    ${person.birth_date ? `<br><small>📅 ${formatDate(person.birth_date)}</small>` : ''}
                </div>
            </div>
        </div>`;
    });
    
    html += `</div>
            
            <div style="background: #f7fafc; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0;">
                <h4 style="color: #4a5568; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                    <i class="fas fa-chart-bar"></i> Статистика:
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span style="display: block; font-size: 0.85rem; color: #718096; margin-bottom: 5px;">Всего людей:</span>
                        <span style="display: block; font-size: 1.8rem; font-weight: bold; color: #2d3748;">${window.treeData.people.length}</span>
                    </div>
                    <div style="text-align: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span style="display: block; font-size: 0.85rem; color: #718096; margin-bottom: 5px;">Мужчин:</span>
                        <span style="display: block; font-size: 1.8rem; font-weight: bold; color: #2d3748;">${window.treeData.people.filter(p => p.gender === 'male').length}</span>
                    </div>
                    <div style="text-align: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span style="display: block; font-size: 0.85rem; color: #718096; margin-bottom: 5px;">Женщин:</span>
                        <span style="display: block; font-size: 1.8rem; font-weight: bold; color: #2d3748;">${window.treeData.people.filter(p => p.gender === 'female').length}</span>
                    </div>
                    <div style="text-align: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <span style="display: block; font-size: 0.85rem; color: #718096; margin-bottom: 5px;">Поколений:</span>
                        <span style="display: block; font-size: 1.8rem; font-weight: bold; color: #2d3748;">${countGenerations()}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0fff4; border-radius: 8px; border: 1px solid #c6f6d5;">
                    <h5 style="color: #276749; margin-bottom: 10px;">${window.treeData.people.length < 2 ? 'Следующие шаги:' : 'Готово к построению!'}</h5>
                    <ul style="color: #718096; padding-left: 20px;">
                        ${window.treeData.people.length < 2 ? 
                            `<li>Добавьте минимум ${2 - window.treeData.people.length} родственника</li>
                             <li>Нажмите "Добавить родственника"</li>` : 
                            `<li>Дерево готово к построению</li>
                             <li>Нажмите "Автопостроение дерева"</li>`
                        }
                    </ul>
                </div>
            </div>
        </div>
    </div>`;
    
    container.innerHTML = html;
    
    // Обновляем статистику
    updateTreeStats();
}

// Финальное построение дерева
window.buildFinalTree = function() {
    console.log('🌳 Запуск финального построения');
    
    if (window.treeData.people.length < 2) {
        if (window.showNotification) {
            window.showNotification('Добавьте минимум 2 человека для построения дерева', 'error');
        }
        return;
    }
    
    if (window.showLoader) {
        window.showLoader('Построение полного генеалогического древа...');
    }
    
    setTimeout(() => {
        // Находим центральную персону
        const self = window.treeData.people.find(p => p.relation === 'self') || window.treeData.people[0];
        
        // Строим простое дерево для демонстрации
        const container = document.getElementById('tree-visualization-container');
        if (!container) return;
        
        container.innerHTML = buildTreeVisualization(self);
        
        if (window.showNotification) {
            window.showNotification('✅ Генеалогическое древо успешно построено!', 'success');
        }
        
        if (window.hideLoader) {
            window.hideLoader();
        }
    }, 1500);
}

// Построение визуализации дерева
function buildTreeVisualization(self) {
    const familyName = self.last_name || '';
    
    return `<div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
        <div style="padding: 20px 25px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-size: 1.6rem;">Генеалогическое древо семьи ${familyName}</h2>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-small" onclick="saveTreeAsImage ? saveTreeAsImage() : alert('Функция сохранения')" style="padding: 8px 15px; background: white; color: #48bb78; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-image"></i> Сохранить
                </button>
                <button class="btn btn-small" onclick="printTree ? printTree() : alert('Функция печати')" style="padding: 8px 15px; background: white; color: #48bb78; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-print"></i> Печать
                </button>
                <button class="btn btn-small btn-secondary" onclick="startTreeBuilder()" style="padding: 8px 15px; background: transparent; color: white; border: 1px solid white; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
            </div>
        </div>
        
        <div style="text-align: center; padding: 40px 20px; background: #f8fafc; min-height: 500px;">
            <h3 style="color: #4a5568; margin-bottom: 40px;">Ваше генеалогическое древо</h3>
            
            <div style="display: inline-block; text-align: center;">
                <!-- Здесь будет дерево -->
                <div style="margin-bottom: 40px; color: green; font-size: 1.2rem;">
                    🌳 Дерево успешно построено!
                </div>
                
                <div style="display: inline-block; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <p style="color: #4a5568; margin-bottom: 10px;"><strong>Всего родственников:</strong> ${window.treeData.people.length}</p>
                    <p style="color: #4a5568; margin-bottom: 10px;"><strong>Центральная персона:</strong> ${self.first_name} ${self.last_name}</p>
                    <p style="color: #4a5568;"><strong>Дата построения:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                </div>
            </div>
        </div>
    </div>`;
}

// Вспомогательные функции
function getRelationText(relation) {
    const relations = {
        'self': 'Я',
        'spouse': 'Супруг(а)',
        'father': 'Отец',
        'mother': 'Мать',
        'son': 'Сын',
        'daughter': 'Дочь',
        'brother': 'Брат',
        'sister': 'Сестра',
        'grandfather': 'Дедушка',
        'grandmother': 'Бабушка',
        'grandson': 'Внук',
        'granddaughter': 'Внучка',
        'great_grandfather': 'Прадедушка',
        'great_grandmother': 'Прабабушка',
        'great_grandson': 'Правнук',
        'great_granddaughter': 'Правнучка'
    };
    return relations[relation] || relation;
}

function getLineText(line) {
    const lines = {
        'father': 'Отцовская',
        'mother': 'Материнская',
        'both': 'Обе линии',
        'unknown': 'Неизвестно'
    };
    return lines[line] || line;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return dateString;
    }
}

function countGenerations() {
    const gens = new Set();
    window.treeData.people.forEach(person => {
        let gen = 0;
        switch(person.relation) {
            case 'great_grandfather': case 'great_grandmother': gen = 3; break;
            case 'grandfather': case 'grandmother': gen = 2; break;
            case 'father': case 'mother': gen = 1; break;
            case 'self': case 'spouse': case 'brother': case 'sister': gen = 0; break;
            case 'son': case 'daughter': gen = -1; break;
            case 'grandson': case 'granddaughter': gen = -2; break;
            case 'great_grandson': case 'great_granddaughter': gen = -3; break;
        }
        gens.add(gen);
    });
    return gens.size;
}

function showPersonDetails(personId) {
    const person = window.treeData.people.find(p => p.id === personId);
    if (!person) return;
    
    const overlay = ensureOverlayExists();
    
    const modalHtml = `
    <div class="modal" id="person-details-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>${person.first_name} ${person.last_name}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    ${person.photo_url ? 
                        `<img src="${person.photo_url}" alt="${person.first_name}" 
                              style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin: 0 auto 15px;">` :
                        `<div style="width: 150px; height: 150px; background: ${person.gender === 'female' ? '#ed64a6' : '#4299e1'}; 
                              color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                              margin: 0 auto 15px; font-size: 3rem;">
                            ${person.first_name[0]}${person.last_name[0] || ''}
                        </div>`
                    }
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
                        ${person.first_name} ${person.last_name}
                    </div>
                    <div style="color: #667eea; margin-bottom: 10px;">
                        ${getRelationText(person.relation)}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #4a5568;">Основная информация:</h4>
                    ${person.birth_date ? 
                        `<p style="margin-bottom: 5px;"><strong>Дата рождения:</strong> ${formatDate(person.birth_date)}</p>` : ''
                    }
                    ${person.death_date ? 
                        `<p style="margin-bottom: 5px;"><strong>Дата смерти:</strong> ${formatDate(person.death_date)}</p>` : ''
                    }
                    ${person.gender ? 
                        `<p style="margin-bottom: 5px;"><strong>Пол:</strong> ${person.gender === 'female' ? 'Женский' : 'Мужской'}</p>` : ''
                    }
                    ${person.line ? 
                        `<p style="margin-bottom: 5px;"><strong>Линия родства:</strong> ${getLineText(person.line)}</p>` : ''
                    }
                </div>
                
                ${person.biography ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; color: #4a5568;">Биография:</h4>
                        <p style="color: #718096; line-height: 1.6;">${person.biography}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary cancel-btn">
                    Закрыть
                </button>
            </div>
        </div>
    </div>`;
    
    overlay.innerHTML = modalHtml;
    overlay.classList.remove('hidden');
    
    // Добавляем обработчики
    setTimeout(() => {
        const closeBtn = document.querySelector('#person-details-modal .modal-close');
        const cancelBtn = document.querySelector('#person-details-modal .cancel-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
        }
        
        // Закрытие при клике на оверлей
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    }, 50);
}

// Обновление статистики
function updateTreeStats() {
    const peopleCount = window.treeData?.people?.length || 0;
    const photosCount = window.treeData?.people?.filter(p => p.photo_url).length || 0;
    const generations = countGenerations();
    
    if (document.getElementById('tree-people-count')) {
        document.getElementById('tree-people-count').textContent = peopleCount;
    }
    if (document.getElementById('tree-photos-count')) {
        document.getElementById('tree-photos-count').textContent = photosCount;
    }
    if (document.getElementById('tree-generations')) {
        document.getElementById('tree-generations').textContent = generations;
    }
    if (document.getElementById('tree-connections')) {
        document.getElementById('tree-connections').textContent = Math.max(0, peopleCount - 1);
    }
}

// Убеждаемся что оверлей существует
function ensureOverlayExists() {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
        console.log('⚠️ Оверлей не найден, создаем...');
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);
        console.log('✅ Оверлей создан');
    }
    return overlay;
}

// Добавляем базовые стили для модальных окон
function addModalStyles() {
    if (!document.getElementById('tree-builder-styles')) {
        const style = document.createElement('style');
        style.id = 'tree-builder-styles';
        style.textContent = `
            .modal {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                animation: modalFadeIn 0.3s ease;
            }
            
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .modal-header h3 {
                margin: 0;
                color: #2d3748;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #a0aec0;
                padding: 5px;
                line-height: 1;
            }
            
            .modal-close:hover {
                color: #4a5568;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                padding: 20px;
                border-top: 1px solid #e2e8f0;
            }
            
            .btn {
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.2s;
            }
            
            .btn:hover {
                background: #5a67d8;
            }
            
            .btn-secondary {
                background: #a0aec0;
            }
            
            .btn-secondary:hover {
                background: #718096;
            }
            
            .btn-success {
                background: #48bb78;
            }
            
            .btn-success:hover {
                background: #38a169;
            }
            
            .btn-small {
                padding: 8px 15px;
                font-size: 0.9rem;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #4a5568;
                font-weight: 500;
            }
            
            .hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Стили добавлены');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Tree Builder готов к работе');
    addModalStyles();
    ensureOverlayExists();
});

console.log('✅ Tree Builder загружен и готов к работе');