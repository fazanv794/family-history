<script>
    // tree-builder-simple.js - Упрощенный построитель дерева для tree.html
    console.log('🌳 Tree Builder Simple загружается...');
    
    // Основные функции построителя
    window.startTreeBuilder = function(mode = 'auto') {
        console.log(`🚀 Запуск Tree Builder в режиме: ${mode}`);
        
        // Показываем модальное окно построителя
        showTreeBuilderModal(mode);
    };
    
    function showTreeBuilderModal(mode) {
        const content = `
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
                    <input type="text" id="tree-name-input" class="form-control" placeholder="Например: Семья Ивановых" value="Мое семейное дерево">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Стартовая персона:</label>
                    <select id="root-person-select" class="form-control">
                        <option value="self">Я (Вы)</option>
                        <option value="father">Отец</option>
                        <option value="mother">Мать</option>
                        <option value="spouse">Супруг/а</option>
                        <option value="custom">Другая персона</option>
                    </select>
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
                <button class="btn btn-small" onclick="showNextStep()" style="margin-right: 10px;">
                    <i class="fas fa-arrow-left"></i> Назад
                </button>
                <button class="btn" onclick="startBuildingProcess('${mode}')">
                    <i class="fas fa-play"></i> Начать построение
                </button>
            </div>
        `;
        
        // Создаем модальное окно
        const modalHtml = `
            <div class="modal show" id="tree-builder-modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>🌳 Построитель генеалогического дерева</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.innerHTML = modalHtml;
            overlay.classList.remove('hidden');
            
            // Добавляем обработчик закрытия
            const modal = document.getElementById('tree-builder-modal');
            if (modal) {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        overlay.classList.add('hidden');
                    });
                }
            }
            
            // Закрытие по клику на оверлей
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.classList.add('hidden');
                }
            };
        }
    }
    
    function showNextStep() {
        window.showNotification('Следующий шаг в разработке', 'info');
    }
    
    function startBuildingProcess(mode) {
        const treeName = document.getElementById('tree-name-input')?.value || 'Мое семейное дерево';
        const rootPerson = document.getElementById('root-person-select')?.value || 'self';
        
        console.log(`Начинаем построение: ${treeName}, корень: ${rootPerson}, режим: ${mode}`);
        
        // Закрываем текущее модальное окно
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        // Показываем уведомление
        window.showNotification(`Начинаем построение дерева "${treeName}"`, 'success');
        
        // Через секунду запускаем пошаговый построитель
        setTimeout(() => {
            startStepByStepBuilder(mode, treeName, rootPerson);
        }, 1000);
    }
    
    function startStepByStepBuilder(mode, treeName, rootPerson) {
        // Шаг 1: Добавление корневой персоны
        showAddPersonStep(1, mode, treeName, rootPerson);
    }
    
    function showAddPersonStep(step, mode, treeName, rootPerson, relatives = []) {
        const stepTitles = [
            'Добавьте себя',
            'Добавьте родителей',
            'Добавьте супруга/супругу',
            'Добавьте детей',
            'Добавьте братьев и сестер'
        ];
        
        const stepDescriptions = [
            'Начните с добавления себя в качестве центральной персоны дерева',
            'Добавьте информацию о ваших родителях',
            'Если вы состоите в браке, добавьте информацию о супруге/супруге',
            'Добавьте информацию о ваших детях',
            'Добавьте информацию о ваших братьях и сестрах'
        ];
        
        const currentStep = step - 1;
        const totalSteps = 5;
        
        const content = `
            <div style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #2d3748;">Шаг ${step} из ${totalSteps}</h4>
                    <div style="font-size: 0.9rem; color: #718096;">
                        ${relatives.length} родственников добавлено
                    </div>
                </div>
                
                <div class="progress" style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-bottom: 20px; overflow: hidden;">
                    <div style="width: ${(step / totalSteps) * 100}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: width 0.3s;"></div>
                </div>
                
                <h3 style="margin-bottom: 10px; color: #2d3748;">${stepTitles[currentStep] || 'Добавление родственников'}</h3>
                <p style="color: #718096; margin-bottom: 25px;">${stepDescriptions[currentStep] || 'Добавьте информацию о родственниках'}</p>
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
            
            ${relatives.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 15px; color: #4a5568;">
                        <i class="fas fa-users" style="color: #48bb78; margin-right: 8px;"></i>
                        Добавленные родственники
                    </h4>
                    <div style="max-height: 200px; overflow-y: auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px;">
                        ${relatives.map((person, index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: ${index < relatives.length - 1 ? '1px solid #e2e8f0' : 'none'};">
                                <div>
                                    <div style="font-weight: 500; color: #2d3748;">${person.firstName} ${person.lastName}</div>
                                    <div style="font-size: 0.85rem; color: #718096;">
                                        ${getRelationText(person.relation)} • ${person.gender === 'male' ? 'Мужской' : 'Женский'}
                                    </div>
                                </div>
                                <button class="btn-icon" onclick="removeRelative(${index})" style="background: none; border: none; color: #f56565; cursor: pointer;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; margin-top: 25px;">
                ${step > 1 ? `
                    <button class="btn btn-secondary" onclick="goToStep(${step - 1}, '${mode}', '${treeName}', '${rootPerson}')">
                        <i class="fas fa-arrow-left"></i> Назад
                    </button>
                ` : '<div></div>'}
                
                <div>
                    ${step < totalSteps ? `
                        <button class="btn btn-secondary" onclick="skipStep(${step}, '${mode}', '${treeName}', '${rootPerson}')" style="margin-right: 10px;">
                            Пропустить
                        </button>
                        <button class="btn" onclick="completeStep(${step}, '${mode}', '${treeName}', '${rootPerson}')">
                            Далее <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : `
                        <button class="btn" onclick="finishBuilding('${mode}', '${treeName}', '${rootPerson}')">
                            <i class="fas fa-check-circle"></i> Завершить построение
                        </button>
                    `}
                </div>
            </div>
        `;
        
        // Создаем модальное окно для шага
        const modalHtml = `
            <div class="modal show" id="tree-step-modal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>🌳 Построение дерева: ${treeName}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.innerHTML = modalHtml;
            overlay.classList.remove('hidden');
            
            // Настраиваем форму
            setTimeout(() => {
                const form = document.getElementById('add-person-step-form');
                if (form) {
                    form.onsubmit = (e) => {
                        e.preventDefault();
                        addPersonInStep(step, mode, treeName, rootPerson, relatives);
                    };
                }
                
                // Если это первый шаг, предзаполняем данными пользователя
                if (step === 1 && window.currentUser) {
                    const name = window.currentUser.user_metadata?.name || '';
                    const nameParts = name.split(' ');
                    if (document.getElementById('step-first-name')) {
                        document.getElementById('step-first-name').value = nameParts[0] || '';
                    }
                    if (document.getElementById('step-last-name')) {
                        document.getElementById('step-last-name').value = nameParts.slice(1).join(' ') || '';
                    }
                }
                
                // Добавляем обработчик закрытия
                const modal = document.getElementById('tree-step-modal');
                if (modal) {
                    const closeBtn = modal.querySelector('.modal-close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            overlay.classList.add('hidden');
                        });
                    }
                }
                
                // Закрытие по клику на оверлей
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        overlay.classList.add('hidden');
                    }
                };
            }, 10);
        }
    }
    
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
    
    // Глобальные переменные для построителя
    let stepRelatives = [];
    
    function addPersonInStep(step, mode, treeName, rootPerson, relatives) {
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
            id: Date.now(),
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
        
        // Очищаем форму
        const form = document.getElementById('add-person-step-form');
        if (form) form.reset();
        
        // Обновляем текущий шаг
        showAddPersonStep(step, mode, treeName, rootPerson, stepRelatives);
    }
    
    function removeRelative(index) {
        stepRelatives.splice(index, 1);
        
        // Получаем текущие параметры из URL или сохраняем их
        const currentStep = 1; // В реальном приложении нужно сохранять текущий шаг
        const mode = 'auto'; // В реальном приложении нужно сохранять режим
        const treeName = 'Мое семейное дерево'; // В реальном приложении нужно сохранять название
        const rootPerson = 'self'; // В реальном приложении нужно сохранять корневую персону
        
        showAddPersonStep(currentStep, mode, treeName, rootPerson, stepRelatives);
    }
    
    function goToStep(step, mode, treeName, rootPerson) {
        showAddPersonStep(step, mode, treeName, rootPerson, stepRelatives);
    }
    
    function skipStep(step, mode, treeName, rootPerson) {
        // Переходим к следующему шагу
        completeStep(step, mode, treeName, rootPerson);
    }
    
    function completeStep(step, mode, treeName, rootPerson) {
        const nextStep = step + 1;
        showAddPersonStep(nextStep, mode, treeName, rootPerson, stepRelatives);
    }
    
    function finishBuilding(mode, treeName, rootPerson) {
        // Закрываем модальное окно
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        // Сохраняем дерево
        saveTreeToDatabase(treeName, stepRelatives);
        
        // Показываем уведомление
        window.showNotification(`✅ Дерево "${treeName}" успешно создано!`, 'success');
        
        // Обновляем интерфейс
        updateTreeInterface(stepRelatives);
        
        // Очищаем временные данные
        stepRelatives = [];
    }
    
    function saveTreeToDatabase(treeName, relatives) {
        console.log('Сохранение дерева:', { treeName, relatives });
        
        // В реальном приложении здесь сохранение в Supabase
        // Пока просто сохраняем в localStorage для демонстрации
        localStorage.setItem('family_tree_data', JSON.stringify({
            treeName,
            relatives,
            created: new Date().toISOString()
        }));
        
        // Обновляем статистику
        if (window.updateTreeStats) {
            window.updateTreeStats();
        }
    }
    
    function updateTreeInterface(relatives) {
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
                <h3 style="margin-bottom: 30px; color: #2d3748;">Ваше генеалогическое дерево</h3>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
        `;
        
        relatives.forEach(person => {
            const bgColor = person.gender === 'male' ? '#4299e1' : '#ed64a6';
            const relationText = getRelationText(person.relation);
            
            html += `
                <div style="background: white; border-radius: 10px; padding: 15px; width: 160px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); border: 2px solid ${bgColor};">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; margin: 0 auto 10px;">
                        ${person.firstName.charAt(0)}${person.lastName.charAt(0)}
                    </div>
                    <div style="font-weight: bold; margin-bottom: 5px; color: #2d3748;">${person.firstName}</div>
                    <div style="font-size: 0.9rem; color: #718096; margin-bottom: 5px;">${person.lastName}</div>
                    <div style="font-size: 0.8rem; color: ${bgColor}; font-weight: 500;">${relationText}</div>
                    ${person.birthDate ? `<div style="font-size: 0.8rem; color: #a0aec0; margin-top: 5px;">📅 ${person.birthDate}</div>` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
                <div style="margin-top: 30px; color: #718096;">
                    <p>Всего родственников: ${relatives.length}</p>
                    <button class="btn" onclick="showBuilderModal()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Добавить еще родственников
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    console.log('✅ Tree Builder Simple готов к использованию');
</script>