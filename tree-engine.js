// tree-engine.js - Улучшенный движок для генеалогического древа

class TreeEngine {
    constructor() {
        this.treeData = null;
        this.nodes = new Map();
        this.connections = [];
        this.layout = 'horizontal';
        this.zoom = 1;
        this.generations = 3;
        this.centerPersonId = null;
        this.container = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentDragNode = null;
    }
    
    // Автопостроение дерева
    async autoBuildTree(options) {
        const {
            generations = 3,
            style = 'horizontal',
            centerPerson = 'self',
            showPhotos = true,
            showDates = true,
            showLines = true
        } = options;
        
        this.generations = generations;
        this.layout = style;
        
        window.showLoader('Построение дерева...');
        
        try {
            // Определяем центрального человека
            if (centerPerson === 'self') {
                this.centerPersonId = await this.findSelfPersonId();
            } else if (centerPerson === 'oldest') {
                this.centerPersonId = await this.findOldestPersonId();
            } else if (centerPerson === 'founder') {
                this.centerPersonId = await this.findFounderPersonId();
            }
            
            if (!this.centerPersonId) {
                throw new Error('Не найден центральный человек для дерева');
            }
            
            // Получаем данные дерева
            const treeData = await this.buildTreeData(this.centerPersonId, generations);
            this.treeData = treeData;
            
            // Очищаем контейнер
            this.container = document.getElementById('tree-visualization-container');
            this.container.innerHTML = '';
            
            // Визуализируем дерево
            await this.visualizeTree(treeData, {
                layout: style,
                showPhotos,
                showDates,
                showLines
            });
            
            // Добавляем линии связи
            if (showLines) {
                this.drawConnections();
            }
            
            // Обновляем статистику
            this.updateTreeStats();
            
            window.showNotification('✅ Дерево успешно построено!', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка построения дерева:', error);
            window.showNotification('Ошибка построения дерева: ' + error.message, 'error');
        } finally {
            window.hideLoader();
        }
    }
    
    async findSelfPersonId() {
        const selfPerson = window.people?.find(p => p.relation === 'self');
        return selfPerson ? selfPerson.id : (window.people?.[0] ? window.people[0].id : null);
    }
    
    async findOldestPersonId() {
        if (!window.people || window.people.length === 0) return null;
        
        const sorted = [...window.people].filter(p => p.birth_date).sort((a, b) => {
            return new Date(a.birth_date) - new Date(b.birth_date);
        });
        
        return sorted[0] ? sorted[0].id : window.people[0].id;
    }
    
    async findFounderPersonId() {
        // Находим человека без родителей (основатель рода)
        const founders = window.people?.filter(p => !p.parent_id);
        return founders && founders.length > 0 ? founders[0].id : await this.findOldestPersonId();
    }
    
    async buildTreeData(centerId, generations) {
        if (!centerId) return null;
        
        const centerPerson = window.people?.find(p => p.id === centerId);
        if (!centerPerson) return null;
        
        // Рекурсивно строим дерево
        const tree = {
            person: centerPerson,
            parents: [],
            children: [],
            siblings: [],
            spouse: null,
            level: 0
        };
        
        // Строим вверх (предки)
        await this.buildAncestors(centerPerson, tree, generations - 1);
        
        // Строим вниз (потомки)
        await this.buildDescendants(centerPerson, tree, generations - 1);
        
        // Находим супруга/супругу
        tree.spouse = await this.findSpouse(centerPerson);
        
        return tree;
    }
    
    async buildAncestors(person, node, depth) {
        if (depth <= 0) return;
        
        // Ищем родителей
        const parents = window.people.filter(p => person.parent_id && (p.id === person.parent_id || p.spouse_id === person.parent_id));
        
        if (parents.length > 0) {
            for (const parent of parents) {
                const parentNode = {
                    person: parent,
                    parents: [],
                    children: [],
                    siblings: [],
                    spouse: null,
                    level: node.level - 1
                };
                
                node.parents.push(parentNode);
                
                // Рекурсия для бабушек/дедушек
                await this.buildAncestors(parent, parentNode, depth - 1);
                
                // Находим супруга/супругу родителя
                parentNode.spouse = await this.findSpouse(parent);
            }
        } else if (depth > 0) {
            // Генерируем фиктивных родителей для демо
            node.parents = await this.generateParents(person, depth);
        }
    }
    
    async buildDescendants(person, node, depth) {
        if (depth <= 0) return;
        
        // Ищем детей
        const children = window.people.filter(p => p.parent_id === person.id);
        
        if (children.length > 0) {
            for (const child of children) {
                const childNode = {
                    person: child,
                    parents: [],
                    children: [],
                    siblings: [],
                    spouse: null,
                    level: node.level + 1
                };
                
                node.children.push(childNode);
                
                // Рекурсия для внуков
                await this.buildDescendants(child, childNode, depth - 1);
                
                // Находим супруга/супругу ребенка
                childNode.spouse = await this.findSpouse(child);
            }
        } else if (depth > 0) {
            // Генерируем фиктивных детей для демо
            node.children = await this.generateChildren(person, depth);
        }
    }
    
    async findSpouse(person) {
        if (person.spouse_id) {
            return window.people.find(p => p.id === person.spouse_id) || null;
        }
        
        // Ищем супруга через обратную связь
        const spouse = window.people.find(p => p.spouse_id === person.id);
        return spouse || null;
    }
    
    // Генерация фиктивных данных для демо
    async generateParents(person, depth) {
        if (depth <= 0) return [];
        
        const parents = [];
        const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : 1950;
        
        // Отец
        const father = {
            id: `demo_father_${person.id}`,
            first_name: 'Иван',
            last_name: person.last_name || 'Иванов',
            birth_date: `${birthYear - 30}-01-01`,
            death_date: null,
            gender: 'male',
            relation: 'parent',
            photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
            biography: 'Любящий отец и заботливый семьянин'
        };
        
        // Мать
        const mother = {
            id: `demo_mother_${person.id}`,
            first_name: 'Мария',
            last_name: person.last_name ? person.last_name + 'а' : 'Иванова',
            birth_date: `${birthYear - 28}-01-01`,
            death_date: null,
            gender: 'female',
            relation: 'parent',
            photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b786d4d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
            biography: 'Заботливая мать и хранительница семейного очага'
        };
        
        father.spouse_id = mother.id;
        mother.spouse_id = father.id;
        
        const fatherNode = {
            person: father,
            parents: await this.generateParents(father, depth - 1),
            children: [],
            siblings: [],
            spouse: mother,
            level: -1
        };
        
        const motherNode = {
            person: mother,
            parents: await this.generateParents(mother, depth - 1),
            children: [],
            siblings: [],
            spouse: father,
            level: -1
        };
        
        parents.push(fatherNode, motherNode);
        return parents;
    }
    
    async generateChildren(person, depth) {
        if (depth <= 0) return [];
        
        const children = [];
        const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : 1980;
        const childCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < childCount; i++) {
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const firstName = gender === 'male' ? ['Алексей', 'Дмитрий', 'Сергей', 'Андрей'][i % 4] : 
                                          ['Анна', 'Мария', 'Екатерина', 'Ольга'][i % 4];
            
            const child = {
                id: `demo_child_${person.id}_${i}`,
                first_name: firstName,
                last_name: person.last_name || 'Иванов',
                birth_date: `${birthYear + 25 + i}-01-01`,
                death_date: null,
                gender: gender,
                relation: 'child',
                parent_id: person.id,
                photo_url: gender === 'male' ? 
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' :
                    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
                biography: gender === 'male' ? 'Любознательный и активный ребенок' : 'Добрая и отзывчивая девочка'
            };
            
            const childNode = {
                person: child,
                parents: [],
                children: await this.generateChildren(child, depth - 1),
                siblings: [],
                spouse: null,
                level: 1
            };
            
            children.push(childNode);
        }
        
        return children;
    }
    
    // Визуализация дерева
    async visualizeTree(treeData, options) {
        if (!this.container) return;
        
        this.nodes.clear();
        this.connections = [];
        
        // Собираем всех людей из дерева
        const allPeople = this.collectAllPeople(treeData);
        
        // Рассчитываем позиции
        const positions = this.calculatePositions(treeData, options.layout);
        
        // Отрисовываем узлы
        for (const [personId, pos] of Object.entries(positions)) {
            const person = allPeople.find(p => p.id === personId);
            if (person) {
                this.createNodeElement(person, pos, options);
            }
        }
        
        // Инициализируем перетаскивание
        this.initDragAndDrop();
    }
    
    calculatePositions(treeData, layout) {
        const positions = {};
        const nodesByLevel = {};
        
        // Собираем все узлы по уровням
        this.collectNodesByLevel(treeData, nodesByLevel);
        
        // Рассчитываем позиции в зависимости от layout
        if (layout === 'horizontal') {
            this.calculateHorizontalPositions(nodesByLevel, positions);
        } else if (layout === 'vertical') {
            this.calculateVerticalPositions(nodesByLevel, positions);
        } else if (layout === 'radial') {
            this.calculateRadialPositions(nodesByLevel, positions);
        }
        
        return positions;
    }
    
    collectNodesByLevel(node, nodesByLevel, level = 0) {
        if (!nodesByLevel[level]) nodesByLevel[level] = [];
        nodesByLevel[level].push(node.person.id);
        
        for (const parent of node.parents) {
            this.collectNodesByLevel(parent, nodesByLevel, level - 1);
        }
        
        for (const child of node.children) {
            this.collectNodesByLevel(child, nodesByLevel, level + 1);
        }
        
        if (node.spouse) {
            if (!nodesByLevel[level]) nodesByLevel[level] = [];
            nodesByLevel[level].push(node.spouse.id);
        }
    }
    
    calculateHorizontalPositions(nodesByLevel, positions) {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        const nodeWidth = 180;
        const nodeHeight = 150;
        const verticalSpacing = 200;
        const horizontalSpacing = 250;
        
        // Находим минимальный и максимальный уровни
        const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
        const minLevel = Math.min(...levels);
        const maxLevel = Math.max(...levels);
        
        // Центральная позиция
        const centerY = containerHeight / 2;
        
        for (const level of levels) {
            const nodesInLevel = nodesByLevel[level];
            const yStart = centerY - ((nodesInLevel.length - 1) * verticalSpacing) / 2;
            
            // Позиция по X зависит от уровня
            const x = containerWidth / 2 + (level * horizontalSpacing);
            
            nodesInLevel.forEach((personId, index) => {
                const y = yStart + (index * verticalSpacing);
                positions[personId] = { x, y };
            });
        }
    }
    
    calculateVerticalPositions(nodesByLevel, positions) {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        const nodeWidth = 180;
        const nodeHeight = 150;
        const verticalSpacing = 200;
        const horizontalSpacing = 250;
        
        // Находим минимальный и максимальный уровни
        const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
        
        // Центральная позиция
        const centerX = containerWidth / 2;
        
        for (const level of levels) {
            const nodesInLevel = nodesByLevel[level];
            const xStart = centerX - ((nodesInLevel.length - 1) * horizontalSpacing) / 2;
            
            // Позиция по Y зависит от уровня
            const y = 100 + (level - Math.min(...levels)) * verticalSpacing;
            
            nodesInLevel.forEach((personId, index) => {
                const x = xStart + (index * horizontalSpacing);
                positions[personId] = { x, y };
            });
        }
    }
    
    calculateRadialPositions(nodesByLevel, positions) {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        
        const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
        
        for (const level of levels) {
            const nodesInLevel = nodesByLevel[level];
            const radius = 150 + Math.abs(level) * 120;
            const angleStep = (2 * Math.PI) / Math.max(nodesInLevel.length, 1);
            
            nodesInLevel.forEach((personId, index) => {
                const angle = index * angleStep + (level % 2 === 0 ? 0 : angleStep / 2);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                positions[personId] = { x, y };
            });
        }
    }
    
    createNodeElement(person, position, options) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'tree-node draggable';
        
        if (person.relation === 'self') {
            nodeEl.classList.add('self');
        } else if (person.gender === 'male') {
            nodeEl.classList.add('male');
        } else if (person.gender === 'female') {
            nodeEl.classList.add('female');
        }
        
        nodeEl.dataset.id = person.id;
        nodeEl.style.left = `${position.x}px`;
        nodeEl.style.top = `${position.y}px`;
        
        // Фото
        let photoHtml = '';
        if (options.showPhotos && person.photo_url) {
            photoHtml = `
                <img src="${person.photo_url}" alt="${person.first_name}" 
                     class="person-photo" 
                     onerror="this.src='https://via.placeholder.com/150/667eea/ffffff?text=${person.first_name[0]}${person.last_name ? person.last_name[0] : ''}'">
            `;
        } else if (options.showPhotos) {
            const initials = `${person.first_name[0]}${person.last_name ? person.last_name[0] : ''}`;
            photoHtml = `
                <div class="person-photo" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                    ${initials}
                </div>
            `;
        }
        
        // Даты
        let datesHtml = '';
        if (options.showDates && person.birth_date) {
            const birthDate = new Date(person.birth_date).toLocaleDateString('ru-RU');
            const deathDate = person.death_date ? new Date(person.death_date).toLocaleDateString('ru-RU') : '';
            datesHtml = `
                <div class="person-dates">
                    <div>${birthDate}</div>
                    ${deathDate ? `<div>${deathDate}</div>` : ''}
                </div>
            `;
        }
        
        nodeEl.innerHTML = `
            ${photoHtml}
            <div class="person-name">
                ${person.first_name} ${person.last_name || ''}
            </div>
            ${datesHtml}
            <div class="node-actions">
                <button class="node-btn" onclick="window.showPersonInfo('${person.id}')" title="Информация">
                    <i class="fas fa-info"></i>
                </button>
                <button class="node-btn" onclick="window.editPerson('${person.id}')" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        
        this.container.appendChild(nodeEl);
        this.nodes.set(person.id, { element: nodeEl, person: person });
    }
    
    drawConnections() {
        // Очищаем старые линии
        document.querySelectorAll('.tree-connection').forEach(el => el.remove());
        
        // Создаем линии между родителями и детьми
        for (const [personId, node] of this.nodes) {
            const person = node.person;
            
            // Связь с родителями
            if (person.parent_id && this.nodes.has(person.parent_id)) {
                this.drawConnection(personId, person.parent_id, '#48bb78');
            }
            
            // Связь с супругом
            if (person.spouse_id && this.nodes.has(person.spouse_id)) {
                this.drawConnection(personId, person.spouse_id, '#ed64a6');
            }
            
            // Связь с детьми (обрабатывается через parent_id детей)
        }
    }
    
    drawConnection(fromId, toId, color) {
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);
        
        if (!fromNode || !toNode) return;
        
        const fromRect = fromNode.element.getBoundingClientRect();
        const toRect = toNode.element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top + toRect.height / 2 - containerRect.top;
        
        // Создаем SVG линию
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.classList.add('tree-connection');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';
        
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute('x1', fromX);
        line.setAttribute('y1', fromY);
        line.setAttribute('x2', toX);
        line.setAttribute('y2', toY);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        
        svg.appendChild(line);
        this.container.appendChild(svg);
        this.connections.push(svg);
    }
    
    initDragAndDrop() {
        const nodes = document.querySelectorAll('.tree-node.draggable');
        
        nodes.forEach(node => {
            node.addEventListener('mousedown', this.startDrag.bind(this));
            node.addEventListener('touchstart', this.startDrag.bind(this));
        });
        
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
        document.addEventListener('touchend', this.stopDrag.bind(this));
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.currentDragNode = e.target.closest('.tree-node');
        
        const rect = this.currentDragNode.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        if (e.type === 'mousedown') {
            this.dragOffset.x = e.clientX - rect.left + containerRect.left;
            this.dragOffset.y = e.clientY - rect.top + containerRect.top;
        } else if (e.touches && e.touches[0]) {
            this.dragOffset.x = e.touches[0].clientX - rect.left + containerRect.left;
            this.dragOffset.y = e.touches[0].clientY - rect.top + containerRect.top;
        }
        
        this.currentDragNode.style.zIndex = '1000';
        this.currentDragNode.style.opacity = '0.8';
    }
    
    drag(e) {
        if (!this.isDragging || !this.currentDragNode) return;
        
        e.preventDefault();
        let clientX, clientY;
        
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        const containerRect = this.container.getBoundingClientRect();
        const x = clientX - containerRect.left - this.dragOffset.x;
        const y = clientY - containerRect.top - this.dragOffset.y;
        
        this.currentDragNode.style.left = `${x}px`;
        this.currentDragNode.style.top = `${y}px`;
        
        // Перерисовываем линии связи
        this.redrawConnections();
    }
    
    stopDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        if (this.currentDragNode) {
            this.currentDragNode.style.zIndex = '10';
            this.currentDragNode.style.opacity = '1';
            this.currentDragNode = null;
        }
    }
    
    redrawConnections() {
        // Удаляем старые линии
        this.connections.forEach(conn => conn.remove());
        this.connections = [];
        
        // Рисуем новые линии
        this.drawConnections();
    }
    
    collectAllPeople(node, people = []) {
        if (!node) return people;
        
        if (node.person && !people.find(p => p.id === node.person.id)) {
            people.push(node.person);
        }
        
        if (node.spouse && !people.find(p => p.id === node.spouse.id)) {
            people.push(node.spouse);
        }
        
        for (const parent of node.parents) {
            this.collectAllPeople(parent, people);
        }
        
        for (const child of node.children) {
            this.collectAllPeople(child, people);
        }
        
        return people;
    }
    
    updateTreeStats() {
        if (!this.treeData) return;
        
        const allPeople = this.collectAllPeople(this.treeData);
        const levels = new Set();
        
        // Находим все уровни
        const collectLevels = (node, level = 0) => {
            levels.add(level);
            node.parents.forEach(p => collectLevels(p, level - 1));
            node.children.forEach(c => collectLevels(c, level + 1));
        };
        
        collectLevels(this.treeData);
        
        document.getElementById('tree-people-count').textContent = allPeople.length;
        document.getElementById('tree-photos-count').textContent = allPeople.filter(p => p.photo_url).length;
        document.getElementById('tree-generations').textContent = Math.max(...levels) - Math.min(...levels) + 1;
        document.getElementById('tree-connections').textContent = this.connections.length;
    }
    
    // Сохранение дерева как картинки
    saveAsImage() {
        const container = document.getElementById('tree-visualization-container');
        
        html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'family-tree-' + new Date().toISOString().split('T')[0] + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            window.showNotification('✅ Дерево сохранено как изображение!', 'success');
        }).catch(error => {
            console.error('Ошибка сохранения:', error);
            window.showNotification('Ошибка сохранения дерева', 'error');
        });
    }
    
    // Печать дерева
    printTree() {
        const container = document.getElementById('tree-visualization-container');
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Генеалогическое древо</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .tree-node { border: 1px solid #ccc; padding: 10px; margin: 5px; display: inline-block; }
                        .person-name { font-weight: bold; }
                        .person-dates { font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>Генеалогическое древо</h1>
                    <div>${container.innerHTML}</div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        
        printWindow.document.close();
    }
}

// Вспомогательные функции
function getRelationLabel(relation) {
    const labels = {
        'self': 'Я',
        'spouse': 'Супруг/а',
        'parent': 'Родитель',
        'child': 'Ребенок',
        'sibling': 'Брат/сестра',
        'grandparent': 'Дедушка/бабушка',
        'grandchild': 'Внук/внучка',
        'aunt_uncle': 'Тетя/дядя',
        'cousin': 'Двоюродный брат/сестра',
        'other': 'Родственник'
    };
    
    return labels[relation] || relation;
}

// Инициализируем движок
window.treeEngine = new TreeEngine();

// Экспортируем функции для HTML
window.autoBuildTree = async () => {
    const generations = parseInt(document.getElementById('auto-generations').value);
    const style = document.getElementById('auto-style').value;
    const centerPerson = document.getElementById('auto-center-person').value;
    const showPhotos = document.getElementById('auto-show-photos').checked;
    const showDates = document.getElementById('auto-show-dates').checked;
    const showLines = document.getElementById('auto-show-lines').checked;
    
    await window.treeEngine.autoBuildTree({
        generations,
        style,
        centerPerson,
        showPhotos,
        showDates,
        showLines
    });
};

window.editPerson = async (personId) => {
    const person = window.people?.find(p => p.id === personId);
    if (person) {
        window.showNotification(`Редактирование: ${person.first_name} ${person.last_name}`, 'info');
        // Здесь можно открыть модальное окно редактирования
    }
};

window.showPersonInfo = (personId) => {
    const person = window.people?.find(p => p.id === personId);
    
    if (person) {
        const modal = document.getElementById('view-person-modal');
        const nameEl = document.getElementById('view-person-name');
        const detailsEl = document.getElementById('person-details');
        
        nameEl.textContent = `${person.first_name} ${person.last_name || ''}`;
        
        let html = `
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex-shrink: 0;">
                    ${person.photo_url ? 
                        `<img src="${person.photo_url}" alt="${person.first_name}" style="width: 150px; height: 150px; border-radius: 8px; object-fit: cover;">` : 
                        `<div style="width: 150px; height: 150px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; display: flex; align-items: center; justify-content: center; font-size: 3rem; border-radius: 8px;">
                            ${person.first_name[0]}${person.last_name ? person.last_name[0] : ''}
                         </div>`
                    }
                </div>
                <div>
                    <h4>Основная информация</h4>
                    <p><strong>Родство:</strong> ${getRelationLabel(person.relation)}</p>
                    ${person.birth_date ? `<p><strong>Дата рождения:</strong> ${new Date(person.birth_date).toLocaleDateString('ru-RU')}</p>` : ''}
                    ${person.death_date ? `<p><strong>Дата смерти:</strong> ${new Date(person.death_date).toLocaleDateString('ru-RU')}</p>` : ''}
                    ${person.gender ? `<p><strong>Пол:</strong> ${person.gender === 'male' ? 'Мужской' : 'Женский'}</p>` : ''}
                </div>
            </div>
        `;
        
        if (person.biography) {
            html += `
                <div style="margin-bottom: 20px;">
                    <h4>Биография</h4>
                    <p>${person.biography}</p>
                </div>
            `;
        }
        
        detailsEl.innerHTML = html;
        
        modal.classList.remove('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
    }
};

// Сохранение как картинки
window.saveTreeAsImage = () => {
    window.treeEngine.saveAsImage();
};

// Печать дерева
window.printTree = () => {
    window.treeEngine.printTree();
};

console.log('✅ Tree Engine загружен');