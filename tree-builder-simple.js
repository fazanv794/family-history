console.log('🌳 Tree Builder Simple загружается...');

// Глобальные переменные для построителя
let currentStep = 1;
let stepRelatives = [];
let currentTreeName = 'Мое семейное дерево';
let currentMode = 'auto';

// Основная функция запуска построителя
window.startTreeBuilder = function(mode = 'auto') {
    console.log(`🚀 Запуск Tree Builder в режиме: ${mode}`);
    
    currentMode = mode;
    currentStep = 1;
    stepRelatives = [];
    
    // Используем существующее название дерева или создаем новое
    if (window.treeData && window.treeData.name) {
        currentTreeName = window.treeData.name;
    } else {
        currentTreeName = 'Мое семейное дерево';
    }
    
    // Показываем начальное модальное окно
    showBuilderIntroModal(mode);
};

// Показать начальное модальное окно построителя
function showBuilderIntroModal(mode) {
    const content = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>🌳 Построитель генеалогического дерева</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-tree" style="font-size: 4rem; color: #667eea; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 15px; color: #2d3748;">${mode === 'auto' ? 'Авто-построение' : 'Ручное построение'}</h3>
                    <p style="color: #718096; margin-bottom: 25px;">
                        ${mode === 'auto' 
                            ? 'Система поможет вам поэтапно создать генеалогическое дерево' 
                            : 'Вы полностью контролируете процесс построения'}
                    </p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <div class="form-group">
                        <label class="form-label">Название дерева:</label>
                        <input type="text" id="tree-name-input" class="form-control" placeholder="Например: Семья Ивановых" value="${currentTreeName}">
                    </div>
                </div>
                
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <h4 style="margin-top: 0; color: #4a5568; margin-bottom: 10px; font-size: 1rem;">
                        <i class="fas fa-info-circle" style="color: #4299e1; margin-right: 8px;"></i>
                        ${mode === 'auto' ? 'Авто-режим' : 'Ручной режим'}
                    </h4>
                    <p style="margin: 0; color: #718096; font-size: 0.9rem;">
                        ${mode === 'auto' 
                            ? 'Система будет задавать вопросы о ваших родственниках и автоматически строить дерево' 
                            : 'Вы сможете добавлять каждого родственника индивидуально, настраивая все параметры'}
                    </p>
                </div>
                
                <div style="margin-top: 25px; text-align: center;">
                    <button class="btn btn-secondary cancel-btn" style="margin-right: 10px;">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                    <button class="btn" id="start-building-btn">
                        <i class="fas fa-play"></i> Начать построение
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Создаем модальное окно
    const modalId = 'tree-builder-intro';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = content;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.appendChild(modalDiv);
        overlay.classList.remove('hidden');
        modalDiv.classList.remove('hidden');
        
        setTimeout(() => {
            overlay.classList.add('active');
            modalDiv.classList.add('active');
        }, 10);
        
        // Добавляем обработчики
        const closeBtn = modalDiv.querySelector('.modal-close');
        const cancelBtn = modalDiv.querySelector('.cancel-btn');
        const startBtn = modalDiv.querySelector('#start-building-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            });
        }
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                currentTreeName = document.getElementById('tree-name-input')?.value || 'Мое семейное дерево';
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    showStepModal(currentStep);
                }, 300);
            });
        }
        
        // ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Клик по overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            }
        });
    }
}

// Показать шаг построения
function showStepModal(step) {
    const steps = [
        { title: 'Добавьте себя', description: 'Начните с добавления себя в качестве центральной персоны дерева' },
        { title: 'Добавьте родителей', description: 'Добавьте информацию о ваших родителях' },
        { title: 'Добавьте супруга/супругу', description: 'Если вы состоите в браке, добавьте информацию о супруге/супруге' },
        { title: 'Добавьте детей', description: 'Добавьте информацию о ваших детях' },
        { title: 'Добавьте братьев и сестер', description: 'Добавьте информацию о ваших братьях и сестрах' }
    ];
    
    const currentStepData = steps[step - 1] || { title: 'Добавление родственников', description: 'Добавьте информацию о родственниках' };
    const totalSteps = steps.length;
    
    const content = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>🌳 Построение: ${currentTreeName}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: #2d3748;">Шаг ${step} из ${totalSteps}</h4>
                        <div style="font-size: 0.9rem; color: #718096;">
                            ${stepRelatives.length} родственников добавлено
                        </div>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(step / totalSteps) * 100}%"></div>
                    </div>
                    
                    <h3 style="margin-bottom: 10px; color: #2d3748;">${currentStepData.title}</h3>
                    <p style="color: #718096; margin-bottom: 25px;">${currentStepData.description}</p>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #4a5568;">
                        <i class="fas fa-user" style="color: #667eea; margin-right: 8px;"></i>
                        ${step === 1 ? 'Информация о вас' : 'Добавление родственника'}
                    </h4>
                    
                    <form id="add-person-step-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Имя *</label>
                                <input type="text" id="step-first-name" class="form-control" placeholder="Имя" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Фамилия *</label>
                                <input type="text" id="step-last-name" class="form-control" placeholder="Фамилия" required>
                            </div>
                        </div>
                        
                        ${step === 1 ? '' : `
                            <div class="form-group">
                                <label class="form-label">Родство *</label>
                                <select id="step-relation" class="form-control" required>
                                    <option value="">Выберите родство</option>
                                    ${step === 2 ? `
                                        <option value="father">Отец</option>
                                        <option value="mother">Мать</option>
                                    ` : ''}
                                    ${step === 3 ? `
                                        <option value="spouse">Супруг/а</option>
                                        <option value="partner">Партнер</option>
                                    ` : ''}
                                    ${step === 4 ? `
                                        <option value="son">Сын</option>
                                        <option value="daughter">Дочь</option>
                                    ` : ''}
                                    ${step === 5 ? `
                                        <option value="brother">Брат</option>
                                        <option value="sister">Сестра</option>
                                    ` : ''}
                                </select>
                            </div>
                        `}
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Дата рождения</label>
                                <input type="date" id="step-birth-date" class="form-control">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Пол *</label>
                                <select id="step-gender" class="form-control" required>
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <button type="submit" class="btn" style="width: 100%;">
                                <i class="fas fa-check"></i> ${step === 1 ? 'Сохранить и продолжить' : 'Добавить родственника'}
                            </button>
                        </div>
                    </form>
                </div>
                
                ${stepRelatives.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px; color: #4a5568;">
                            <i class="fas fa-users" style="color: #48bb78; margin-right: 8px;"></i>
                            Добавленные родственники
                        </h4>
                        <div style="max-height: 200px; overflow-y: auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px;">
                            ${stepRelatives.map((person, index) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: ${index < stepRelatives.length - 1 ? '1px solid #e2e8f0' : 'none'};">
                                    <div>
                                        <div style="font-weight: 500; color: #2d3748;">${person.firstName} ${person.lastName}</div>
                                        <div style="font-size: 0.85rem; color: #718096;">
                                            ${getRelationText(person.relation)} • ${person.gender === 'male' ? 'Мужской' : 'Женский'}
                                        </div>
                                    </div>
                                    <button class="btn-icon" onclick="removeRelative(${index})" style="background: none; border: none; color: #f56565; cursor: pointer; padding: 5px;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; margin-top: 25px;">
                    ${step > 1 ? `
                        <button class="btn btn-secondary" id="prev-step-btn">
                            <i class="fas fa-arrow-left"></i> Назад
                        </button>
                    ` : '<div></div>'}
                    
                    <div>
                        ${step < totalSteps ? `
                            <button class="btn btn-secondary" id="skip-step-btn" style="margin-right: 10px;">
                                Пропустить
                            </button>
                            <button class="btn" id="next-step-btn">
                                Далее <i class="fas fa-arrow-right"></i>
                            </button>
                        ` : `
                            <button class="btn" id="finish-building-btn">
                                <i class="fas fa-check-circle"></i> Завершить построение
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Создаем модальное окно
    const modalId = 'tree-step-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = content;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.appendChild(modalDiv);
        overlay.classList.remove('hidden');
        modalDiv.classList.remove('hidden');
        
        setTimeout(() => {
            overlay.classList.add('active');
            modalDiv.classList.add('active');
        }, 10);
        
        // Добавляем обработчики
        const closeBtn = modalDiv.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            });
        }
        
        // Форма добавления
        const form = modalDiv.querySelector('#add-person-step-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                addPersonInStep(step);
            });
        }
        
        // Если это первый шаг, предзаполняем данными пользователя
        if (step === 1 && window.currentUser) {
            const name = window.currentUser.user_metadata?.name || '';
            const nameParts = name.split(' ');
            const firstNameInput = modalDiv.querySelector('#step-first-name');
            const lastNameInput = modalDiv.querySelector('#step-last-name');
            
            if (firstNameInput) firstNameInput.value = nameParts[0] || '';
            if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';
        }
        
        // Кнопки навигации
        const prevBtn = modalDiv.querySelector('#prev-step-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    showStepModal(step - 1);
                }, 300);
            });
        }
        
        const skipBtn = modalDiv.querySelector('#skip-step-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    showStepModal(step + 1);
                }, 300);
            });
        }
        
        const nextBtn = modalDiv.querySelector('#next-step-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    showStepModal(step + 1);
                }, 300);
            });
        }
        
        const finishBtn = modalDiv.querySelector('#finish-building-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    finishBuilding();
                }, 300);
            });
        }
        
        // ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Клик по overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            }
        });
    }
}

// Добавить человека на текущем шаге
function addPersonInStep(step) {
    const firstName = document.getElementById('step-first-name')?.value;
    const lastName = document.getElementById('step-last-name')?.value;
    const birthDate = document.getElementById('step-birth-date')?.value;
    const gender = document.getElementById('step-gender')?.value;
    const relation = step === 1 ? 'self' : document.getElementById('step-relation')?.value;
    
    if (!firstName || !lastName || !gender || (step > 1 && !relation)) {
        window.showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    const newPerson = {
        id: Date.now() + Math.random(),
        firstName,
        lastName,
        birthDate,
        gender,
        relation: relation || 'self'
    };
    
    // Добавляем в массив родственников
    stepRelatives.push(newPerson);
    
    // Показываем уведомление
    window.showNotification(`${firstName} ${lastName} добавлен(а)`, 'success');
    
    // Обновляем текущий шаг
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            showStepModal(step);
        }, 300);
    }
}

// Удалить родственника
window.removeRelative = function(index) {
    stepRelatives.splice(index, 1);
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            showStepModal(currentStep);
        }, 300);
    }
};

// Получить текст отношения
function getRelationText(relation) {
    const relations = {
        'self': 'Я',
        'father': 'Отец',
        'mother': 'Мать',
        'spouse': 'Супруг/а',
        'son': 'Сын',
        'daughter': 'Дочь',
        'brother': 'Брат',
        'sister': 'Сестра',
        'grandfather': 'Дедушка',
        'grandmother': 'Бабушка'
    };
    return relations[relation] || relation;
}

// Завершить построение
function finishBuilding() {
    // Сохраняем дерево
    saveTreeToDatabase(currentTreeName, stepRelatives);
    
    // Показываем уведомление
    window.showNotification(`✅ Дерево "${currentTreeName}" успешно создано!`, 'success');
    
    // Обновляем интерфейс
    updateTreeInterface(stepRelatives, currentTreeName);
    
    // Сбрасываем данные
    currentStep = 1;
    stepRelatives = [];
    
    // Сохраняем в localStorage
    if (typeof window.saveToLocalStorage === 'function') {
        window.saveToLocalStorage();
    }
}

// Сохранить дерево в базу данных
function saveTreeToDatabase(treeName, relatives) {
    console.log('Сохранение дерева:', { treeName, relatives });
    
    // Сохраняем в глобальные переменные
    window.treeData = {
        name: treeName,
        relatives: relatives,
        created: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('family_tree_data', JSON.stringify(window.treeData));
    
    // Также добавляем людей в общий массив людей
    relatives.forEach(person => {
        // Проверяем, нет ли уже такого человека
        const existingPerson = window.people.find(p => 
            p.firstName === person.firstName && 
            p.lastName === person.lastName && 
            p.relation === person.relation
        );
        
        if (!existingPerson) {
            const newPerson = {
                id: person.id,
                first_name: person.firstName,
                last_name: person.lastName,
                birth_date: person.birthDate,
                gender: person.gender,
                relation: person.relation,
                created_at: new Date().toISOString()
            };
            
            window.people.push(newPerson);
        }
    });
    
    // Обновляем статистику
    if (window.updateTreeStats) {
        window.updateTreeStats();
    }
    
    // Событие об изменении данных дерева
    window.dispatchEvent(new CustomEvent('treeDataChanged'));
}

// Обновить интерфейс дерева
function updateTreeInterface(relatives, treeName) {
    const container = document.getElementById('tree-visualization-container');
    const emptyState = document.getElementById('tree-empty-state');
    const controlsPanel = document.getElementById('tree-controls-panel');
    
    if (!container) return;
    
    if (relatives.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (controlsPanel) controlsPanel.style.display = 'none';
        return;
    }
    
    // Скрываем пустое состояние
    if (emptyState) emptyState.style.display = 'none';
    if (controlsPanel) controlsPanel.style.display = 'flex';
    
    // Создаем простое дерево для отображения
    let html = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="margin-bottom: 30px; color: #2d3748;">${treeName}</h3>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
    `;
    
    // Группируем родственников по типам
    const selfPerson = relatives.find(p => p.relation === 'self');
    const parents = relatives.filter(p => p.relation === 'father' || p.relation === 'mother');
    const spouse = relatives.find(p => p.relation === 'spouse' || p.relation === 'partner');
    const children = relatives.filter(p => p.relation === 'son' || p.relation === 'daughter');
    const siblings = relatives.filter(p => p.relation === 'brother' || p.relation === 'sister');
    
    // Отображаем дерево с иерархией
    html += '<div style="width: 100%;">';
    
    // Поколение родителей
    if (parents.length > 0) {
        html += '<div style="margin-bottom: 40px;">';
        html += '<h4 style="color: #718096; margin-bottom: 20px;">Родители</h4>';
        html += '<div style="display: flex; justify-content: center; gap: 20px;">';
        parents.forEach(parent => {
            html += createPersonCard(parent);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Центральное поколение
    html += '<div style="margin-bottom: 40px;">';
    html += '<h4 style="color: #718096; margin-bottom: 20px;">Центральное поколение</h4>';
    html += '<div style="display: flex; justify-content: center; align-items: center; gap: 30px;">';
    
    if (selfPerson) {
        html += createPersonCard(selfPerson, true);
    }
    
    if (spouse) {
        html += '<div style="font-size: 2rem; color: #ed64a6;">♥</div>';
        html += createPersonCard(spouse);
    }
    
    html += '</div>';
    html += '</div>';
    
    // Поколение детей
    if (children.length > 0) {
        html += '<div style="margin-bottom: 40px;">';
        html += '<h4 style="color: #718096; margin-bottom: 20px;">Дети</h4>';
        html += '<div style="display: flex; justify-content: center; gap: 20px;">';
        children.forEach(child => {
            html += createPersonCard(child);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Братья и сестры
    if (siblings.length > 0) {
        html += '<div>';
        html += '<h4 style="color: #718096; margin-bottom: 20px;">Братья и сестры</h4>';
        html += '<div style="display: flex; justify-content: center; gap: 20px;">';
        siblings.forEach(sibling => {
            html += createPersonCard(sibling);
        });
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div>';
    
    html += `
            </div>
            <div style="margin-top: 30px; color: #718096;">
                <p>Всего родственников: ${relatives.length}</p>
                <button class="btn" onclick="window.startTreeBuilder()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Добавить еще родственников
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обновляем статистику
    if (typeof window.updateTreeStats === 'function') {
        window.updateTreeStats();
    }
}

// Создать карточку человека
function createPersonCard(person, isSelf = false) {
    const bgColor = person.gender === 'male' ? '#4299e1' : '#ed64a6';
    const relationText = getRelationText(person.relation);
    const selfClass = isSelf ? 'self' : '';
    
    return `
        <div class="person-card ${person.gender} ${selfClass}" style="position: relative;">
            <div class="person-avatar ${person.gender} ${selfClass}" style="background: ${bgColor};">
                ${person.firstName.charAt(0)}${person.lastName.charAt(0)}
            </div>
            <div style="font-weight: bold; margin-bottom: 5px; color: #2d3748;">${person.firstName}</div>
            <div style="font-size: 0.9rem; color: #718096; margin-bottom: 5px;">${person.lastName}</div>
            <div style="font-size: 0.8rem; color: ${bgColor}; font-weight: 500;">${relationText}</div>
            ${person.birthDate ? `<div style="font-size: 0.8rem; color: #a0aec0; margin-top: 5px;">📅 ${person.birthDate}</div>` : ''}
        </div>
    `;
}

// Функция для обновления статистики дерева
window.updateTreeStats = function() {
    const treeRelatives = window.treeData?.relatives || [];
    const peopleCount = treeRelatives.length;
    
    // Обновляем статистику на странице дерева
    const statRelatives = document.getElementById('stat-relatives');
    const statTrees = document.getElementById('stat-trees');
    const statDepth = document.getElementById('stat-depth');
    const statYears = document.getElementById('stat-years');
    
    if (statRelatives) statRelatives.textContent = peopleCount;
    if (statTrees) statTrees.textContent = window.treeData?.name ? '1' : '0';
    if (statDepth) statDepth.textContent = calculateTreeGenerations();
    if (statYears) statYears.textContent = calculateTreeYears();
    
    // Показываем/скрываем раздел с недавними деревьями
    const recentTreesSection = document.getElementById('recent-trees-section');
    if (recentTreesSection) {
        recentTreesSection.style.display = window.treeData?.name ? 'block' : 'none';
    }
};

// Рассчитать количество поколений в дереве
function calculateTreeGenerations() {
    const treeRelatives = window.treeData?.relatives || [];
    if (treeRelatives.length === 0) return 0;
    
    const relations = treeRelatives.map(p => p.relation);
    let generations = 1; // Текущее поколение
    
    if (relations.includes('grandparent')) generations++;
    if (relations.includes('grandchild')) generations++;
    if (relations.includes('greatgrandparent')) generations++;
    if (relations.includes('greatgrandchild')) generations++;
    
    return generations;
}

// Рассчитать охват лет в дереве
function calculateTreeYears() {
    const treeRelatives = window.treeData?.relatives || [];
    if (treeRelatives.length === 0) return 0;
    
    const dates = treeRelatives
        .filter(p => p.birthDate)
        .map(p => new Date(p.birthDate).getFullYear());
    
    if (dates.length < 2) return 0;
    
    const minYear = Math.min(...dates);
    const maxYear = Math.max(...dates);
    
    return maxYear - minYear;
}

console.log('✅ Tree Builder Simple готов к использованию');