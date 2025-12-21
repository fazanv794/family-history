// manual-tree-builder.js - Ручной построитель дерева с Drag & Drop
console.log('🎮 Manual Tree Builder загружается...');

class ManualTreeBuilder {
    constructor() {
        this.canvas = null;
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.dragging = false;
        this.mode = 'select'; // select, add-person, add-connection
    }
    
    // Инициализация ручного построителя
    init(containerId) {
        console.log('🎮 Инициализация ручного построителя');
        
        this.canvas = document.getElementById(containerId);
        if (!this.canvas) {
            console.error('Холст не найден');
            return;
        }
        
        // Очищаем холст
        this.canvas.innerHTML = '';
        
        // Добавляем сетку на фон
        this.addGrid();
        
        // Добавляем центральный узел (пользователь)
        this.addCentralNode();
        
        // Инициализируем события
        this.initEvents();
        
        // Создаем панель инструментов
        this.createToolbar();
        
        console.log('✅ Ручной построитель готов');
    }
    
    // Добавляем сетку на фон
    addGrid() {
        const gridSize = 50;
        const svgNS = "http://www.w3.org/2000/svg";
        
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.zIndex = "0";
        svg.style.pointerEvents = "none";
        
        // Вертикальные линии
        for (let x = 0; x < this.canvas.clientWidth; x += gridSize) {
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", x);
            line.setAttribute("y1", 0);
            line.setAttribute("x2", x);
            line.setAttribute("y2", this.canvas.clientHeight);
            line.setAttribute("stroke", "#e2e8f0");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }
        
        // Горизонтальные линии
        for (let y = 0; y < this.canvas.clientHeight; y += gridSize) {
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", 0);
            line.setAttribute("y1", y);
            line.setAttribute("x2", this.canvas.clientWidth);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "#e2e8f0");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }
        
        this.canvas.appendChild(svg);
    }
    
    // Добавляем центральный узел (пользователь)
    addCentralNode() {
        const centerX = this.canvas.clientWidth / 2;
        const centerY = this.canvas.clientHeight / 2;
        
        const centralNode = {
            id: 'self',
            firstName: 'Я',
            lastName: '',
            gender: 'male',
            relation: 'self',
            x: centerX,
            y: centerY,
            width: 120,
            height: 80
        };
        
        this.nodes.push(centralNode);
        this.renderNode(centralNode);
    }
    
    // Рендеринг узла
    renderNode(node) {
        // Создаем контейнер для узла
        const nodeElement = document.createElement('div');
        nodeElement.className = `tree-node ${node.gender} ${node.relation}`;
        nodeElement.id = `node-${node.id}`;
        nodeElement.style.position = 'absolute';
        nodeElement.style.left = `${node.x - node.width/2}px`;
        nodeElement.style.top = `${node.y - node.height/2}px`;
        nodeElement.style.width = `${node.width}px`;
        nodeElement.style.height = `${node.height}px`;
        
        // Заполняем содержимое
        nodeElement.innerHTML = `
            <div class="node-header">
                <div class="node-avatar ${node.gender}">
                    ${node.firstName.charAt(0)}${node.lastName.charAt(0) || ''}
                </div>
            </div>
            <div class="node-content">
                <div class="node-name">${node.firstName} ${node.lastName}</div>
                <div class="node-relation">${this.getRelationText(node.relation)}</div>
            </div>
            <div class="node-handle" style="
                position: absolute;
                top: 5px;
                right: 5px;
                width: 20px;
                height: 20px;
                background: #667eea;
                border-radius: 50%;
                cursor: move;
            "></div>
        `;
        
        // Добавляем обработчики
        this.addNodeEvents(nodeElement, node);
        
        this.canvas.appendChild(nodeElement);
        node.element = nodeElement;
    }
    
    // Добавляем события для узла
    addNodeEvents(element, node) {
        const handle = element.querySelector('.node-handle');
        
        // Перетаскивание за ручку
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(node, e);
        });
        
        // Выделение узла
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });
        
        // Удаление узла (правый клик)
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showNodeMenu(node, e.clientX, e.clientY);
        });
    }
    
    // Начало перетаскивания
    startDrag(node, e) {
        this.dragging = true;
        this.selectedNode = node;
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startNodeX = node.x;
        const startNodeY = node.y;
        
        // Функция перемещения
        const onMouseMove = (e) => {
            if (!this.dragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            node.x = startNodeX + deltaX;
            node.y = startNodeY + deltaY;
            
            // Обновляем позицию элемента
            node.element.style.left = `${node.x - node.width/2}px`;
            node.element.style.top = `${node.y - node.height/2}px`;
            
            // Обновляем связи
            this.updateConnections(node);
        };
        
        // Функция окончания перетаскивания
        const onMouseUp = () => {
            this.dragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    // Выделение узла
    selectNode(node) {
        // Снимаем выделение со всех узлов
        document.querySelectorAll('.tree-node.selected').forEach(n => {
            n.classList.remove('selected');
        });
        
        // Выделяем выбранный узел
        if (node.element) {
            node.element.classList.add('selected');
        }
        
        this.selectedNode = node;
        this.updatePropertiesPanel(node);
    }
    
    // Создаем панель инструментов
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'builder-toolbar';
        toolbar.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 100;
        `;
        
        toolbar.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #2d3748;">Инструменты</h3>
            <button class="tool-btn" data-action="add-person">
                <i class="fas fa-user-plus"></i> Добавить человека
            </button>
            <button class="tool-btn" data-action="add-couple">
                <i class="fas fa-users"></i> Добавить пару
            </button>
            <button class="tool-btn" data-action="add-child">
                <i class="fas fa-baby"></i> Добавить ребенка
            </button>
            <button class="tool-btn" data-action="add-parent">
                <i class="fas fa-user-friends"></i> Добавить родителя
            </button>
            <button class="tool-btn" data-action="connect">
                <i class="fas fa-link"></i> Создать связь
            </button>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #e2e8f0;">
            <button class="tool-btn" data-action="save">
                <i class="fas fa-save"></i> Сохранить
            </button>
            <button class="tool-btn" data-action="reset">
                <i class="fas fa-redo"></i> Сбросить
            </button>
        `;
        
        // Добавляем обработчики кнопок
        toolbar.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('button').dataset.action;
                this.handleToolAction(action);
            });
        });
        
        this.canvas.parentElement.appendChild(toolbar);
        this.toolbar = toolbar;
    }
    
    // Обработка действий с инструментами
    handleToolAction(action) {
        console.log('Действие:', action);
        
        switch(action) {
            case 'add-person':
                this.addNewPerson();
                break;
            case 'add-couple':
                this.addCouple();
                break;
            case 'add-child':
                this.addChild();
                break;
            case 'add-parent':
                this.addParent();
                break;
            case 'connect':
                this.startConnectionMode();
                break;
            case 'save':
                this.saveTree();
                break;
            case 'reset':
                this.resetBuilder();
                break;
        }
    }
    
    // Добавить нового человека
    addNewPerson() {
        const modalHtml = `
            <div class="modal" id="add-person-manual-modal" style="max-width: 500px;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Добавить человека</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="add-person-manual-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Имя *</label>
                                    <input type="text" id="manual-first-name" placeholder="Имя" required>
                                </div>
                                <div class="form-group">
                                    <label>Фамилия</label>
                                    <input type="text" id="manual-last-name" placeholder="Фамилия">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Пол</label>
                                <select id="manual-gender">
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Дата рождения</label>
                                <input type="date" id="manual-birth-date">
                            </div>
                            
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary cancel-btn">
                                    Отмена
                                </button>
                                <button type="submit" class="btn">
                                    Добавить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.innerHTML = modalHtml;
            overlay.classList.remove('hidden');
            document.querySelector('#add-person-manual-modal').classList.remove('hidden');
            
            // Обработчик формы
            const form = document.getElementById('add-person-manual-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewPerson();
            });
            
            // Закрытие
            document.querySelector('#add-person-manual-modal .modal-close').addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
            document.querySelector('#add-person-manual-modal .cancel-btn').addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
        }
    }
    
    // Создать нового человека
    createNewPerson() {
        const firstName = document.getElementById('manual-first-name').value;
        const lastName = document.getElementById('manual-last-name').value;
        const gender = document.getElementById('manual-gender').value;
        
        if (!firstName) {
            window.showNotification('Введите имя', 'error');
            return;
        }
        
        const newPerson = {
            id: Date.now() + Math.random(),
            firstName,
            lastName,
            gender,
            relation: 'relative',
            x: this.canvas.clientWidth / 2 + (Math.random() * 100 - 50),
            y: this.canvas.clientHeight / 2 + (Math.random() * 100 - 50),
            width: 120,
            height: 80
        };
        
        this.nodes.push(newPerson);
        this.renderNode(newPerson);
        
        // Закрываем модальное окно
        document.getElementById('modal-overlay').classList.add('hidden');
        
        window.showNotification(`${firstName} добавлен(а)`, 'success');
    }
    
    // Добавить пару (супруга)
    addCouple() {
        if (!this.selectedNode) {
            window.showNotification('Выберите узел для добавления супруга', 'info');
            return;
        }
        
        const spouseGender = this.selectedNode.gender === 'male' ? 'female' : 'male';
        const spouseRelation = 'spouse';
        
        const spouse = {
            id: Date.now() + Math.random(),
            firstName: 'Супруг/а',
            lastName: this.selectedNode.lastName,
            gender: spouseGender,
            relation: spouseRelation,
            x: this.selectedNode.x + 200,
            y: this.selectedNode.y,
            width: 120,
            height: 80
        };
        
        this.nodes.push(spouse);
        this.renderNode(spouse);
        
        // Создаем связь
        this.createConnection(this.selectedNode.id, spouse.id, 'marriage');
        
        window.showNotification('Супруг(а) добавлен(а)', 'success');
    }
    
    // Добавить ребенка
    addChild() {
        if (!this.selectedNode) {
            window.showNotification('Выберите родителя', 'info');
            return;
        }
        
        // Спрашиваем количество детей
        const count = prompt('Сколько детей добавить?', '1');
        if (!count) return;
        
        const childCount = parseInt(count) || 1;
        
        for (let i = 0; i < childCount; i++) {
            const child = {
                id: Date.now() + Math.random(),
                firstName: 'Ребенок',
                lastName: this.selectedNode.lastName,
                gender: Math.random() > 0.5 ? 'male' : 'female',
                relation: 'child',
                x: this.selectedNode.x + (i * 150) - (childCount * 75),
                y: this.selectedNode.y + 150,
                width: 100,
                height: 70
            };
            
            this.nodes.push(child);
            this.renderNode(child);
            
            // Создаем связь родитель-ребенок
            this.createConnection(this.selectedNode.id, child.id, 'parent-child');
        }
        
        window.showNotification(`Добавлено ${childCount} детей`, 'success');
    }
    
    // Добавить родителя
    addParent() {
        if (!this.selectedNode) {
            window.showNotification('Выберите узел для добавления родителей', 'info');
            return;
        }
        
        // Добавляем отца и мать
        const parents = [
            {
                id: Date.now() + Math.random(),
                firstName: 'Отец',
                lastName: this.selectedNode.lastName,
                gender: 'male',
                relation: 'father',
                x: this.selectedNode.x - 100,
                y: this.selectedNode.y - 150,
                width: 120,
                height: 80
            },
            {
                id: Date.now() + Math.random(),
                firstName: 'Мать',
                lastName: this.selectedNode.lastName,
                gender: 'female',
                relation: 'mother',
                x: this.selectedNode.x + 100,
                y: this.selectedNode.y - 150,
                width: 120,
                height: 80
            }
        ];
        
        parents.forEach(parent => {
            this.nodes.push(parent);
            this.renderNode(parent);
            
            // Создаем связь родитель-ребенок
            this.createConnection(parent.id, this.selectedNode.id, 'parent-child');
        });
        
        window.showNotification('Родители добавлены', 'success');
    }
    
    // Начать режим создания связей
    startConnectionMode() {
        this.mode = 'connect';
        window.showNotification('Выберите двух человек для создания связи', 'info');
        
        // Временно меняем курсор
        this.canvas.style.cursor = 'crosshair';
        
        let selectedNodes = [];
        
        const onClick = (e) => {
            const nodeElement = e.target.closest('.tree-node');
            if (!nodeElement) return;
            
            const nodeId = nodeElement.id.replace('node-', '');
            const node = this.nodes.find(n => n.id == nodeId);
            
            if (node) {
                selectedNodes.push(node);
                node.element.classList.add('connecting');
                
                if (selectedNodes.length === 2) {
                    // Спрашиваем тип связи
                    const relationType = prompt(
                        'Тип связи:\n1. Родитель-ребенок\n2. Супруги\n3. Братья/сестры',
                        '1'
                    );
                    
                    let relation;
                    switch(relationType) {
                        case '1': relation = 'parent-child'; break;
                        case '2': relation = 'marriage'; break;
                        case '3': relation = 'siblings'; break;
                        default: relation = 'parent-child';
                    }
                    
                    this.createConnection(selectedNodes[0].id, selectedNodes[1].id, relation);
                    
                    // Сбрасываем режим
                    selectedNodes.forEach(n => n.element.classList.remove('connecting'));
                    selectedNodes = [];
                    this.mode = 'select';
                    this.canvas.style.cursor = '';
                    
                    // Удаляем обработчик
                    this.canvas.removeEventListener('click', onClick);
                }
            }
        };
        
        this.canvas.addEventListener('click', onClick);
    }
    
    // Создать связь между узлами
    createConnection(fromId, toId, type) {
        const connection = {
            id: Date.now() + Math.random(),
            from: fromId,
            to: toId,
            type: type
        };
        
        this.connections.push(connection);
        this.renderConnection(connection);
        
        console.log('Связь создана:', connection);
    }
    
    // Отрисовать связь
    renderConnection(connection) {
        const fromNode = this.nodes.find(n => n.id == connection.from);
        const toNode = this.nodes.find(n => n.id == connection.to);
        
        if (!fromNode || !toNode) return;
        
        const svgNS = "http://www.w3.org/2000/svg";
        const line = document.createElementNS(svgNS, "line");
        
        line.setAttribute("x1", fromNode.x);
        line.setAttribute("y1", fromNode.y);
        line.setAttribute("x2", toNode.x);
        line.setAttribute("y2", toNode.y);
        
        // Стиль в зависимости от типа связи
        switch(connection.type) {
            case 'marriage':
                line.setAttribute("stroke", "#ed64a6");
                line.setAttribute("stroke-width", "3");
                line.setAttribute("stroke-dasharray", "10,5");
                break;
            case 'parent-child':
                line.setAttribute("stroke", "#48bb78");
                line.setAttribute("stroke-width", "2");
                break;
            case 'siblings':
                line.setAttribute("stroke", "#4299e1");
                line.setAttribute("stroke-width", "2");
                line.setAttribute("stroke-dasharray", "5,5");
                break;
        }
        
        line.setAttribute("class", "connection-line");
        line.dataset.connectionId = connection.id;
        
        // Добавляем SVG на холст
        let svg = this.canvas.querySelector('svg.connections');
        if (!svg) {
            svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("class", "connections");
            svg.style.position = "absolute";
            svg.style.top = "0";
            svg.style.left = "0";
            svg.style.width = "100%";
            svg.style.height = "100%";
            svg.style.pointerEvents = "none";
            svg.style.zIndex = "1";
            this.canvas.appendChild(svg);
        }
        
        svg.appendChild(line);
        connection.element = line;
    }
    
    // Обновить связи при перемещении узла
    updateConnections(node) {
        this.connections
            .filter(conn => conn.from == node.id || conn.to == node.id)
            .forEach(conn => {
                const fromNode = this.nodes.find(n => n.id == conn.from);
                const toNode = this.nodes.find(n => n.id == conn.to);
                
                if (fromNode && toNode && conn.element) {
                    conn.element.setAttribute("x1", fromNode.x);
                    conn.element.setAttribute("y1", fromNode.y);
                    conn.element.setAttribute("x2", toNode.x);
                    conn.element.setAttribute("y2", toNode.y);
                }
            });
    }
    
    // Сохранить дерево
    saveTree() {
        const treeData = {
            name: `Дерево создано ${new Date().toLocaleDateString()}`,
            nodes: this.nodes,
            connections: this.connections,
            created: new Date().toISOString()
        };
        
        // Сохраняем в глобальную переменную
        if (window.treeData) {
            window.treeData = treeData;
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('family_tree_data', JSON.stringify(treeData));
        
        window.showNotification('Дерево сохранено!', 'success');
        
        // Закрываем построитель
        this.closeBuilder();
    }
    
    // Сбросить построитель
    resetBuilder() {
        if (confirm('Сбросить построитель? Все несохраненные изменения будут потеряны.')) {
            this.nodes = [];
            this.connections = [];
            this.selectedNode = null;
            this.canvas.innerHTML = '';
            this.addGrid();
            this.addCentralNode();
        }
    }
    
    // Закрыть построитель
    closeBuilder() {
        if (this.toolbar) {
            this.toolbar.remove();
        }
        
        // Возвращаемся к обычному виду дерева
        if (window.updateTreeInterface) {
            window.updateTreeInterface(
                this.nodes.map(node => ({
                    id: node.id,
                    firstName: node.firstName,
                    lastName: node.lastName,
                    gender: node.gender,
                    relation: node.relation,
                    birthDate: node.birthDate
                })),
                'Дерево создано вручную'
            );
        }
    }
    
    // Получить текст отношения
    getRelationText(relation) {
        const relations = {
            'self': 'Я',
            'father': 'Отец',
            'mother': 'Мать',
            'spouse': 'Супруг(а)',
            'child': 'Ребенок',
            'relative': 'Родственник',
            'grandparent': 'Дедушка/Бабушка'
        };
        
        return relations[relation] || relation;
    }
    
    // Обновить панель свойств
    updatePropertiesPanel(node) {
        // Реализуем позже
    }
    
    // Показать меню узла
    showNodeMenu(node, x, y) {
        const menu = document.createElement('div');
        menu.className = 'node-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 200px;
        `;
        
        menu.innerHTML = `
            <div class="menu-item" data-action="edit">✏️ Редактировать</div>
            <div class="menu-item" data-action="delete">🗑️ Удалить</div>
            <div class="menu-item" data-action="details">ℹ️ Подробности</div>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #e2e8f0;">
            <div class="menu-item" data-action="add-spouse">💑 Добавить супруга</div>
            <div class="menu-item" data-action="add-child">👶 Добавить ребенка</div>
            <div class="menu-item" data-action="add-parent">👴 Добавить родителя</div>
        `;
        
        document.body.appendChild(menu);
        
        // Обработчики меню
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleNodeAction(node, action);
                menu.remove();
            });
        });
        
        // Закрытие меню при клике вне
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    // Обработка действий с узлом
    handleNodeAction(node, action) {
        switch(action) {
            case 'edit':
                this.editNode(node);
                break;
            case 'delete':
                this.deleteNode(node);
                break;
            case 'details':
                this.showNodeDetails(node);
                break;
            case 'add-spouse':
                this.addCouple();
                break;
            case 'add-child':
                this.addChild();
                break;
            case 'add-parent':
                this.addParent();
                break;
        }
    }
    
    // Редактировать узел
    editNode(node) {
        alert(`Редактирование ${node.firstName} - функция в разработке`);
    }
    
    // Удалить узел
    deleteNode(node) {
        if (confirm(`Удалить ${node.firstName} ${node.lastName}?`)) {
            // Удаляем узел
            const index = this.nodes.findIndex(n => n.id === node.id);
            if (index !== -1) {
                this.nodes.splice(index, 1);
            }
            
            // Удаляем элемент из DOM
            if (node.element) {
                node.element.remove();
            }
            
            // Удаляем связанные связи
            this.connections = this.connections.filter(conn => 
                conn.from !== node.id && conn.to !== node.id
            );
            
            // Перерисовываем связи
            this.redrawConnections();
            
            window.showNotification('Узел удален', 'success');
        }
    }
    
    // Перерисовать все связи
    redrawConnections() {
        // Удаляем все связи
        const svg = this.canvas.querySelector('svg.connections');
        if (svg) {
            svg.remove();
        }
        
        // Перерисовываем
        this.connections.forEach(conn => {
            this.renderConnection(conn);
        });
    }
}

// Глобальный доступ
window.ManualTreeBuilder = ManualTreeBuilder;
window.startManualTreeBuilder = function() {
    const builder = new ManualTreeBuilder();
    builder.init('tree-visualization-container');
    window.currentBuilder = builder;
};

console.log('✅ Manual Tree Builder загружен');