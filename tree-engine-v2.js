// tree-engine-v2.js - Расширенный движок для работы с деревьями
console.log('🌳 Tree Engine V2 загружается...');

class FamilyTreeEngine {
  constructor() {
    this.currentTreeId = null;
    this.currentTree = null;
    this.people = [];
    this.relationships = [];
    this.events = [];
    this.media = [];
    this.currentUserId = null;
    this.selectedPersonId = null;
    this.treeContainer = null;
    this.isPanning = false;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }
  
  async initialize(containerId, treeId = null) {
    console.log('🚀 Инициализация Tree Engine');
    
    this.treeContainer = document.getElementById(containerId);
    if (!this.treeContainer) {
      console.error('Контейнер не найден:', containerId);
      return;
    }
    
    this.currentUserId = window.currentUser?.id;
    
    if (treeId) {
      await this.loadTree(treeId);
    } else {
      await this.loadUserTrees();
    }
    
    this.setupEventListeners();
    this.render();
  }
  
  async loadTree(treeId) {
    try {
      console.log('📥 Загрузка дерева:', treeId);
      
      // Загрузка дерева
      const { data: tree, error: treeError } = await window.supabaseClient
        .from('family_trees')
        .select('*')
        .eq('id', treeId)
        .single();
      
      if (treeError) throw treeError;
      
      this.currentTreeId = treeId;
      this.currentTree = tree;
      
      // Загрузка людей
      const { data: people, error: peopleError } = await window.supabaseClient
        .from('people')
        .select('*')
        .eq('tree_id', treeId)
        .order('birth_date', { ascending: true });
      
      if (peopleError) throw peopleError;
      this.people = people || [];
      
      // Загрузка связей
      const { data: relationships, error: relError } = await window.supabaseClient
        .from('relationships')
        .select('*')
        .eq('tree_id', treeId);
      
      if (relError) throw relError;
      this.relationships = relationships || [];
      
      // Загрузка событий
      const { data: events, error: eventsError } = await window.supabaseClient
        .from('events')
        .select('*')
        .eq('tree_id', treeId)
        .order('event_date', { ascending: false });
      
      if (eventsError) throw eventsError;
      this.events = events || [];
      
      // Загрузка медиа
      const { data: media, error: mediaError } = await window.supabaseClient
        .from('media')
        .select('*')
        .eq('tree_id', treeId)
        .order('created_at', { ascending: false });
      
      if (mediaError) throw mediaError;
      this.media = media || [];
      
      console.log('✅ Дерево загружено:', {
        people: this.people.length,
        relationships: this.relationships.length,
        events: this.events.length,
        media: this.media.length
      });
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка загрузки дерева:', error);
      return false;
    }
  }
  
  async loadUserTrees() {
    try {
      const { data, error } = await window.supabaseClient
        .from('family_trees')
        .select('*')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        await this.loadTree(data[0].id);
      } else {
        console.log('👤 У пользователя нет деревьев');
      }
    } catch (error) {
      console.error('Ошибка загрузки деревьев пользователя:', error);
    }
  }
  
  setupEventListeners() {
    // Масштабирование колесиком мыши
    this.treeContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.scale = Math.max(0.1, Math.min(5, this.scale + delta));
      this.render();
    });
    
    // Перемещение
    this.treeContainer.addEventListener('mousedown', (e) => {
      this.isPanning = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.treeContainer.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      
      this.translateX += dx;
      this.translateY += dy;
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      
      this.render();
    });
    
    document.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.treeContainer.style.cursor = 'grab';
    });
    
    // Сброс масштаба по двойному клику
    this.treeContainer.addEventListener('dblclick', () => {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.render();
    });
  }
  
  render() {
    if (!this.treeContainer) return;
    
    this.treeContainer.innerHTML = '';
    
    // Создаем SVG контейнер
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '600');
    svg.style.cursor = 'grab';
    
    // Группа для трансформаций
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`);
    
    // Фон
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '1000');
    rect.setAttribute('height', '600');
    rect.setAttribute('fill', '#f8fafc');
    g.appendChild(rect);
    
    // Если нет людей, показываем сообщение
    if (this.people.length === 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '500');
      text.setAttribute('y', '300');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#718096');
      text.setAttribute('font-size', '20');
      text.textContent = 'Дерево пустое. Добавьте первого человека!';
      g.appendChild(text);
    } else {
      // Рассчитываем позиции
      const positions = this.calculatePositions();
      
      // Рисуем связи
      this.drawRelationships(g, positions);
      
      // Рисуем узлы
      this.drawPeople(g, positions);
    }
    
    svg.appendChild(g);
    this.treeContainer.appendChild(svg);
  }
  
  calculatePositions() {
    const positions = {};
    const centerX = 500;
    const centerY = 300;
    
    // Находим центрального человека (если есть)
    const centralPerson = this.people.find(p => 
      !this.relationships.find(r => r.relationship_type === 'parent_child' && r.person2_id === p.id)
    ) || this.people[0];
    
    if (centralPerson) {
      positions[centralPerson.id] = { x: centerX, y: centerY, generation: 0 };
    }
    
    // Распределяем остальных по поколениям
    this.people.forEach(person => {
      if (person.id === centralPerson?.id) return;
      
      const parents = this.getParents(person.id);
      const siblings = this.getSiblings(person.id);
      const spouse = this.getSpouse(person.id);
      
      if (parents.length > 0) {
        // Это родитель - выше по поколению
        const parentGen = positions[parents[0].id]?.generation || 0;
        positions[person.id] = { 
          x: centerX - 200 + Math.random() * 400,
          y: centerY - 150 - (parentGen + 1) * 100,
          generation: parentGen + 1
        };
      } else if (spouse) {
        // Супруг - на том же уровне
        positions[person.id] = { 
          x: positions[spouse.id]?.x + 200 || centerX + 200,
          y: positions[spouse.id]?.y || centerY,
          generation: positions[spouse.id]?.generation || 0
        };
      } else {
        // Другое - вычисляем позицию
        positions[person.id] = { 
          x: centerX - 300 + Math.random() * 600,
          y: centerY - 200 + Math.random() * 400,
          generation: 0
        };
      }
    });
    
    return positions;
  }
  
  drawRelationships(g, positions) {
    this.relationships.forEach(relationship => {
      const pos1 = positions[relationship.person1_id];
      const pos2 = positions[relationship.person2_id];
      
      if (!pos1 || !pos2) return;
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pos1.x);
      line.setAttribute('y1', pos1.y);
      line.setAttribute('x2', pos2.x);
      line.setAttribute('y2', pos2.y);
      
      if (relationship.relationship_type === 'spouse') {
        line.setAttribute('stroke', '#ed64a6');
        line.setAttribute('stroke-dasharray', '5,5');
      } else if (relationship.relationship_type === 'parent_child') {
        line.setAttribute('stroke', '#48bb78');
      } else {
        line.setAttribute('stroke', '#a0aec0');
      }
      
      line.setAttribute('stroke-width', '2');
      g.appendChild(line);
    });
  }
  
  drawPeople(g, positions) {
    this.people.forEach(person => {
      const pos = positions[person.id];
      if (!pos) return;
      
      // Круг для человека
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', '40');
      circle.setAttribute('fill', person.gender === 'male' ? '#4299e1' : '#ed64a6');
      circle.setAttribute('stroke', '#2d3748');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('data-person-id', person.id);
      circle.style.cursor = 'pointer';
      
      // Событие клика
      circle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPersonDetails(person.id);
      });
      
      g.appendChild(circle);
      
      // Имя
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.textContent = `${person.first_name.charAt(0)}. ${person.last_name}`;
      text.setAttribute('data-person-id', person.id);
      text.style.cursor = 'pointer';
      text.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPersonDetails(person.id);
      });
      
      g.appendChild(text);
      
      // Даты рождения/смерти
      if (person.birth_date || person.death_date) {
        const dates = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dates.setAttribute('x', pos.x);
        dates.setAttribute('y', pos.y + 60);
        dates.setAttribute('text-anchor', 'middle');
        dates.setAttribute('fill', '#4a5568');
        dates.setAttribute('font-size', '12');
        
        let dateText = '';
        if (person.birth_date) {
          dateText += new Date(person.birth_date).getFullYear();
        }
        if (person.death_date) {
          dateText += ' - ' + new Date(person.death_date).getFullYear();
        }
        
        dates.textContent = dateText;
        g.appendChild(dates);
      }
    });
  }
  
  getParents(personId) {
    const parentRelationships = this.relationships.filter(r => 
      r.relationship_type === 'parent_child' && r.person2_id === personId
    );
    
    return parentRelationships.map(r => 
      this.people.find(p => p.id === r.person1_id)
    ).filter(p => p);
  }
  
  getChildren(personId) {
    const childRelationships = this.relationships.filter(r => 
      r.relationship_type === 'parent_child' && r.person1_id === personId
    );
    
    return childRelationships.map(r => 
      this.people.find(p => p.id === r.person2_id)
    ).filter(p => p);
  }
  
  getSpouse(personId) {
    const spouseRelationship = this.relationships.find(r => 
      r.relationship_type === 'spouse' && 
      (r.person1_id === personId || r.person2_id === personId)
    );
    
    if (!spouseRelationship) return null;
    
    const spouseId = spouseRelationship.person1_id === personId 
      ? spouseRelationship.person2_id 
      : spouseRelationship.person1_id;
    
    return this.people.find(p => p.id === spouseId);
  }
  
  getSiblings(personId) {
    const parents = this.getParents(personId);
    if (parents.length === 0) return [];
    
    const siblings = [];
    parents.forEach(parent => {
      const parentChildren = this.getChildren(parent.id);
      siblings.push(...parentChildren.filter(child => child.id !== personId));
    });
    
    return [...new Set(siblings)];
  }
  
  async showPersonDetails(personId) {
    const person = this.people.find(p => p.id === personId);
    if (!person) return;
    
    this.selectedPersonId = personId;
    
    // Получаем связанные данные
    const personMedia = this.media.filter(m => m.person_id === personId);
    const personEvents = this.events.filter(e => e.person_id === personId);
    const parents = this.getParents(personId);
    const children = this.getChildren(personId);
    const spouse = this.getSpouse(personId);
    const siblings = this.getSiblings(personId);
    
    const modalContent = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>👤 ${person.first_name} ${person.last_name}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 300px 1fr; gap: 30px;">
            <div>
              <div style="text-align: center;">
                <div class="person-avatar-large" style="
                  width: 150px; height: 150px; 
                  background: ${person.gender === 'male' ? '#4299e1' : '#ed64a6'};
                  border-radius: 50%; margin: 0 auto 20px;
                  display: flex; align-items: center; justify-content: center;
                  color: white; font-size: 3rem; font-weight: bold;">
                  ${person.first_name.charAt(0)}${person.last_name.charAt(0)}
                </div>
                
                ${person.photo_url ? `
                  <img src="${person.photo_url}" 
                       alt="${person.first_name}" 
                       style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 20px;">
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                  <button class="btn btn-small" onclick="window.treeEngine.editPerson('${person.id}')">
                    <i class="fas fa-edit"></i> Редактировать
                  </button>
                  <button class="btn btn-small btn-secondary" onclick="window.treeEngine.addRelatedPerson('${person.id}')">
                    <i class="fas fa-user-plus"></i> Добавить родственника
                  </button>
                </div>
              </div>
              
              <div style="margin-top: 20px;">
                <h4 style="color: #4a5568; margin-bottom: 10px;">Основная информация</h4>
                <div class="info-grid">
                  ${person.birth_date ? `
                    <div class="info-item">
                      <i class="fas fa-birthday-cake"></i>
                      <span>Рождение: ${new Date(person.birth_date).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ` : ''}
                  
                  ${person.birth_place ? `
                    <div class="info-item">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>Место рождения: ${person.birth_place}</span>
                    </div>
                  ` : ''}
                  
                  ${person.death_date ? `
                    <div class="info-item">
                      <i class="fas fa-cross"></i>
                      <span>Смерть: ${new Date(person.death_date).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ` : ''}
                  
                  ${person.death_place ? `
                    <div class="info-item">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>Место смерти: ${person.death_place}</span>
                    </div>
                  ` : ''}
                  
                  <div class="info-item">
                    <i class="fas fa-venus-mars"></i>
                    <span>Пол: ${person.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              ${person.biography ? `
                <div style="margin-bottom: 30px;">
                  <h4 style="color: #4a5568; margin-bottom: 10px;">Биография</h4>
                  <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                    ${person.biography}
                  </div>
                </div>
              ` : ''}
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div>
                  <h4 style="color: #4a5568; margin-bottom: 10px;">Семья</h4>
                  <div class="family-list">
                    ${parents.length > 0 ? `
                      <div style="margin-bottom: 10px;">
                        <strong>Родители:</strong>
                        <div style="margin-top: 5px;">
                          ${parents.map(p => `
                            <div class="family-member" onclick="window.treeEngine.showPersonDetails('${p.id}')" 
                                 style="cursor: pointer; padding: 5px 10px; border-radius: 4px; background: #f7fafc; margin-bottom: 5px;">
                              ${p.first_name} ${p.last_name}
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}
                    
                    ${spouse ? `
                      <div style="margin-bottom: 10px;">
                        <strong>Супруг(а):</strong>
                        <div style="margin-top: 5px;">
                          <div class="family-member" onclick="window.treeEngine.showPersonDetails('${spouse.id}')" 
                               style="cursor: pointer; padding: 5px 10px; border-radius: 4px; background: #f7fafc;">
                            ${spouse.first_name} ${spouse.last_name}
                          </div>
                        </div>
                      </div>
                    ` : ''}
                    
                    ${children.length > 0 ? `
                      <div style="margin-bottom: 10px;">
                        <strong>Дети:</strong>
                        <div style="margin-top: 5px;">
                          ${children.map(c => `
                            <div class="family-member" onclick="window.treeEngine.showPersonDetails('${c.id}')" 
                                 style="cursor: pointer; padding: 5px 10px; border-radius: 4px; background: #f7fafc; margin-bottom: 5px;">
                              ${c.first_name} ${c.last_name}
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}
                    
                    ${siblings.length > 0 ? `
                      <div style="margin-bottom: 10px;">
                        <strong>Братья/Сестры:</strong>
                        <div style="margin-top: 5px;">
                          ${siblings.map(s => `
                            <div class="family-member" onclick="window.treeEngine.showPersonDetails('${s.id}')" 
                                 style="cursor: pointer; padding: 5px 10px; border-radius: 4px; background: #f7fafc; margin-bottom: 5px;">
                              ${s.first_name} ${s.last_name}
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: #4a5568; margin: 0;">Медиа</h4>
                    <button class="btn btn-small" onclick="window.treeEngine.addMediaToPerson('${person.id}')">
                      <i class="fas fa-plus"></i> Добавить
                    </button>
                  </div>
                  
                  ${personMedia.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px;">
                      ${personMedia.slice(0, 6).map(media => `
                        <div onclick="window.treeEngine.showMedia('${media.id}')" 
                             style="cursor: pointer; width: 80px; height: 80px; border-radius: 8px; overflow: hidden;">
                          ${media.file_type === 'image' ? `
                            <img src="${media.file_url}" alt="${media.description || 'Медиа'}" 
                                 style="width: 100%; height: 100%; object-fit: cover;">
                          ` : `
                            <div style="width: 100%; height: 100%; background: #667eea; color: white; 
                                      display: flex; align-items: center; justify-content: center;">
                              <i class="fas fa-${media.file_type === 'video' ? 'video' : 'file'}"></i>
                            </div>
                          `}
                        </div>
                      `).join('')}
                    </div>
                    
                    ${personMedia.length > 6 ? `
                      <div style="text-align: center; margin-top: 10px;">
                        <small>и еще ${personMedia.length - 6} медиафайлов</small>
                      </div>
                    ` : ''}
                  ` : `
                    <div style="text-align: center; padding: 20px; color: #a0aec0;">
                      <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 10px;"></i>
                      <p>Медиафайлов нет</p>
                    </div>
                  `}
                  
                  <div style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                      <h4 style="color: #4a5568; margin: 0;">События</h4>
                      <button class="btn btn-small" onclick="window.treeEngine.addEventToPerson('${person.id}')">
                        <i class="fas fa-plus"></i> Добавить
                      </button>
                    </div>
                    
                    ${personEvents.length > 0 ? `
                      <div style="max-height: 200px; overflow-y: auto;">
                        ${personEvents.map(event => `
                          <div style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                            <div style="font-weight: 500; color: #2d3748;">${event.title}</div>
                            <div style="font-size: 0.85rem; color: #718096;">
                              ${new Date(event.event_date).toLocaleDateString('ru-RU')}
                              ${event.event_place ? ` • ${event.event_place}` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div style="text-align: center; padding: 20px; color: #a0aec0;">
                        <i class="fas fa-calendar" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Событий нет</p>
                      </div>
                    `}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary cancel-btn">
            Закрыть
          </button>
          <button type="button" class="btn btn-danger" onclick="window.treeEngine.deletePerson('${person.id}')">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `;
    
    const modalId = 'person-details-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = modalContent;
    
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
      
      // Обработчики закрытия
      const closeBtn = modalDiv.querySelector('.modal-close');
      const cancelBtn = modalDiv.querySelector('.cancel-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      // ESC
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    }
  }
  
  async editPerson(personId) {
    const person = this.people.find(p => p.id === personId);
    if (!person) return;
    
    // Закрываем текущее модальное окно
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
    
    // Показываем форму редактирования
    await this.showPersonForm(person);
  }
  
  async showPersonForm(person = null) {
    const isEdit = !!person;
    
    const formHtml = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>${isEdit ? 'Редактировать человека' : 'Добавить человека'}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="person-form" enctype="multipart/form-data">
            <input type="hidden" id="person-id" value="${person?.id || ''}">
            
            <div class="form-row">
              <div class="form-group">
                <label for="person-first-name">Имя *</label>
                <input type="text" id="person-first-name" value="${person?.first_name || ''}" required>
              </div>
              <div class="form-group">
                <label for="person-last-name">Фамилия *</label>
                <input type="text" id="person-last-name" value="${person?.last_name || ''}" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="person-middle-name">Отчество</label>
                <input type="text" id="person-middle-name" value="${person?.middle_name || ''}">
              </div>
              <div class="form-group">
                <label for="person-maiden-name">Девичья фамилия</label>
                <input type="text" id="person-maiden-name" value="${person?.maiden_name || ''}">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="person-gender">Пол *</label>
                <select id="person-gender" required>
                  <option value="">Выберите пол</option>
                  <option value="male" ${person?.gender === 'male' ? 'selected' : ''}>Мужской</option>
                  <option value="female" ${person?.gender === 'female' ? 'selected' : ''}>Женский</option>
                  <option value="other" ${person?.gender === 'other' ? 'selected' : ''}>Другой</option>
                </select>
              </div>
              <div class="form-group">
                <label for="person-is-living">Жив/а?</label>
                <select id="person-is-living">
                  <option value="true" ${person?.is_living !== false ? 'selected' : ''}>Да</option>
                  <option value="false" ${person?.is_living === false ? 'selected' : ''}>Нет</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="person-birth-date">Дата рождения</label>
                <input type="date" id="person-birth-date" value="${person?.birth_date || ''}">
              </div>
              <div class="form-group">
                <label for="person-birth-place">Место рождения</label>
                <input type="text" id="person-birth-place" value="${person?.birth_place || ''}">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="person-death-date">Дата смерти</label>
                <input type="date" id="person-death-date" value="${person?.death_date || ''}">
              </div>
              <div class="form-group">
                <label for="person-death-place">Место смерти</label>
                <input type="text" id="person-death-place" value="${person?.death_place || ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label for="person-photo">Фотография</label>
              <input type="file" id="person-photo" accept="image/*">
              ${person?.photo_url ? `
                <div style="margin-top: 10px;">
                  <img src="${person.photo_url}" alt="Текущее фото" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                </div>
              ` : ''}
            </div>
            
            <div class="form-group">
              <label for="person-biography">Биография</label>
              <textarea id="person-biography" rows="4">${person?.biography || ''}</textarea>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary cancel-btn">
                Отмена
              </button>
              <button type="submit" class="btn">
                ${isEdit ? 'Сохранить изменения' : 'Добавить человека'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    const modalId = 'person-form-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = formHtml;
    
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
      
      // Обработчик формы
      const form = modalDiv.querySelector('#person-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.savePerson(form, isEdit);
        });
      }
      
      // Обработчики закрытия
      const closeBtn = modalDiv.querySelector('.modal-close');
      const cancelBtn = modalDiv.querySelector('.cancel-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      // ESC
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    }
  }
  
  async savePerson(form, isEdit) {
    try {
      window.showLoader(isEdit ? 'Сохранение изменений...' : 'Добавление человека...');
      
      const formData = new FormData(form);
      const personData = {
        tree_id: this.currentTreeId,
        first_name: formData.get('person-first-name'),
        last_name: formData.get('person-last-name'),
        middle_name: formData.get('person-middle-name') || null,
        maiden_name: formData.get('person-maiden-name') || null,
        gender: formData.get('person-gender'),
        is_living: formData.get('person-is-living') === 'true',
        birth_date: formData.get('person-birth-date') || null,
        birth_place: formData.get('person-birth-place') || null,
        death_date: formData.get('person-death-date') || null,
        death_place: formData.get('person-death-place') || null,
        biography: formData.get('person-biography') || null,
        user_id: this.currentUserId
      };
      
      // Загрузка фото если есть
      const photoFile = form.querySelector('#person-photo')?.files[0];
      if (photoFile) {
        const uploadResult = await window.uploadToSupabaseStorage(
          photoFile,
          'family-media',
          `people/${this.currentTreeId}`
        );
        
        if (uploadResult.success) {
          personData.photo_url = uploadResult.url;
        }
      }
      
      let result;
      if (isEdit) {
        const personId = formData.get('person-id');
        const { data, error } = await window.supabaseClient
          .from('people')
          .update(personData)
          .eq('id', personId)
          .select();
        
        if (error) throw error;
        result = data[0];
        
        // Обновляем локальный массив
        const index = this.people.findIndex(p => p.id === personId);
        if (index !== -1) {
          this.people[index] = { ...this.people[index], ...result };
        }
      } else {
        const { data, error } = await window.supabaseClient
          .from('people')
          .insert([personData])
          .select();
        
        if (error) throw error;
        result = data[0];
        this.people.push(result);
      }
      
      window.showNotification(
        `✅ Человек ${isEdit ? 'обновлен' : 'добавлен'}!`, 
        'success'
      );
      
      // Закрываем модальное окно
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }
      
      // Перерисовываем дерево
      this.render();
      
      // Если был выбран человек, обновляем его детали
      if (this.selectedPersonId === result.id || isEdit) {
        setTimeout(() => this.showPersonDetails(result.id), 500);
      }
      
    } catch (error) {
      console.error('Ошибка сохранения человека:', error);
      window.showNotification('Ошибка сохранения: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
  
  async addRelatedPerson(personId) {
    const person = this.people.find(p => p.id === personId);
    if (!person) return;
    
    const modalContent = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Добавить родственника для ${person.first_name} ${person.last_name}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 30px;">
            <div class="person-avatar" style="
              width: 80px; height: 80px; margin: 0 auto 15px;
              background: ${person.gender === 'male' ? '#4299e1' : '#ed64a6'};
              border-radius: 50%; display: flex; align-items: center; 
              justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">
              ${person.first_name.charAt(0)}${person.last_name.charAt(0)}
            </div>
            <h4>${person.first_name} ${person.last_name}</h4>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <button class="btn btn-outline" onclick="window.treeEngine.addSpouse('${personId}')">
              <i class="fas fa-heart"></i> Супруг/а
            </button>
            <button class="btn btn-outline" onclick="window.treeEngine.addChild('${personId}')">
              <i class="fas fa-baby"></i> Ребенок
            </button>
            <button class="btn btn-outline" onclick="window.treeEngine.addParent('${personId}')">
              <i class="fas fa-user-friends"></i> Родитель
            </button>
            <button class="btn btn-outline" onclick="window.treeEngine.addSibling('${personId}')">
              <i class="fas fa-users"></i> Брат/Сестра
            </button>
            <button class="btn btn-outline" onclick="window.treeEngine.addOtherRelative('${personId}')" style="grid-column: 1 / -1;">
              <i class="fas fa-user-plus"></i> Другой родственник
            </button>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <h4 style="color: #4a5568; margin-bottom: 10px;">Или добавить существующего человека</h4>
            <select id="existing-person-select" class="form-control" style="margin-bottom: 15px;">
              <option value="">Выберите человека</option>
              ${this.people.filter(p => p.id !== personId).map(p => `
                <option value="${p.id}">${p.first_name} ${p.last_name}</option>
              `).join('')}
            </select>
            <select id="existing-person-relation" class="form-control" style="margin-bottom: 15px;">
              <option value="">Выберите родство</option>
              <option value="spouse">Супруг/а</option>
              <option value="parent_child">Родитель/Ребенок</option>
              <option value="sibling">Брат/Сестра</option>
            </select>
            <button class="btn" onclick="window.treeEngine.linkExistingPerson('${personId}')" style="width: 100%;">
              <i class="fas fa-link"></i> Связать
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary cancel-btn">
            Отмена
          </button>
        </div>
      </div>
    `;
    
    // Показываем модальное окно
    const modalId = 'add-relative-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = modalContent;
    
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
      
      // Обработчики закрытия
      const closeBtn = modalDiv.querySelector('.modal-close');
      const cancelBtn = modalDiv.querySelector('.cancel-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
    }
  }
  
  async addSpouse(personId) {
    const person = this.people.find(p => p.id === personId);
    if (!person) return;
    
    // Закрываем текущее модальное окно
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
    
    // Спрашиваем, добавлять нового или связать существующего
    const existingSpouse = this.getSpouse(personId);
    if (existingSpouse) {
      const confirm = window.confirm(
        `У ${person.first_name} уже есть супруг(а): ${existingSpouse.first_name} ${existingSpouse.last_name}. Добавить еще одного?`
      );
      if (!confirm) return;
    }
    
    // Показываем форму добавления супруга
    setTimeout(async () => {
      await this.showPersonForm();
      
      // После сохранения создаем связь
      const form = document.getElementById('person-form');
      if (form) {
        const originalSubmit = form.onsubmit;
        form.onsubmit = async (e) => {
          e.preventDefault();
          await this.savePerson(form, false);
          
          // Получаем ID нового человека
          const newPerson = this.people[this.people.length - 1];
          if (newPerson) {
            await this.createRelationship({
              tree_id: this.currentTreeId,
              person1_id: personId,
              person2_id: newPerson.id,
              relationship_type: 'spouse',
              user_id: this.currentUserId
            });
          }
        };
      }
    }, 300);
  }
  
  async addChild(personId) {
    // Аналогично addSpouse, но с relationship_type: 'parent_child'
    // и person1_id = personId, person2_id = ID ребенка
  }
  
  async createRelationship(data) {
    try {
      const { data: result, error } = await window.supabaseClient
        .from('relationships')
        .insert([data])
        .select();
      
      if (error) throw error;
      
      this.relationships.push(result[0]);
      this.render();
      
      return result[0];
    } catch (error) {
      console.error('Ошибка создания связи:', error);
      window.showNotification('Ошибка создания связи: ' + error.message, 'error');
    }
  }
  
  async deletePerson(personId) {
    if (!confirm('Вы уверены, что хотите удалить этого человека и все связанные данные?')) {
      return;
    }
    
    try {
      window.showLoader('Удаление человека...');
      
      // Удаляем из базы данных
      const { error } = await window.supabaseClient
        .from('people')
        .delete()
        .eq('id', personId);
      
      if (error) throw error;
      
      // Удаляем из локального массива
      this.people = this.people.filter(p => p.id !== personId);
      
      // Удаляем связанные связи
      this.relationships = this.relationships.filter(r => 
        r.person1_id !== personId && r.person2_id !== personId
      );
      
      window.showNotification('✅ Человек удален', 'success');
      
      // Закрываем модальное окно
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }
      
      // Перерисовываем дерево
      this.render();
      
    } catch (error) {
      console.error('Ошибка удаления человека:', error);
      window.showNotification('Ошибка удаления: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
  
  async addMediaToPerson(personId) {
    const formHtml = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Добавить медиа</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="media-form">
            <input type="hidden" id="media-person-id" value="${personId}">
            
            <div class="form-group">
              <label for="media-type">Тип медиа *</label>
              <select id="media-type" required>
                <option value="">Выберите тип</option>
                <option value="image">Изображение</option>
                <option value="video">Видео</option>
                <option value="document">Документ</option>
                <option value="audio">Аудио</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="media-file">Файл *</label>
              <input type="file" id="media-file" required>
            </div>
            
            <div class="form-group">
              <label for="media-description">Описание</label>
              <textarea id="media-description" rows="3" placeholder="Описание медиафайла..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="media-tags">Теги (через запятую)</label>
              <input type="text" id="media-tags" placeholder="семья, праздник, фото">
            </div>
            
            <div class="form-check" style="margin-bottom: 20px;">
              <input type="checkbox" id="media-is-public" checked>
              <label for="media-is-public">Сделать общедоступным</label>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary cancel-btn">
                Отмена
              </button>
              <button type="submit" class="btn">
                <i class="fas fa-upload"></i> Загрузить
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Показываем форму
    const modalId = 'add-media-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = formHtml;
    
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
      
      // Обработчик формы
      const form = modalDiv.querySelector('#media-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.saveMedia(form, personId);
        });
      }
      
      // Обработчики закрытия
      const closeBtn = modalDiv.querySelector('.modal-close');
      const cancelBtn = modalDiv.querySelector('.cancel-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
    }
  }
  
  async saveMedia(form, personId) {
    try {
      window.showLoader('Загрузка медиа...');
      
      const formData = new FormData(form);
      const file = form.querySelector('#media-file').files[0];
      
      if (!file) {
        throw new Error('Выберите файл');
      }
      
      // Загружаем файл в Supabase Storage
      const uploadResult = await window.uploadToSupabaseStorage(
        file,
        'family-media',
        `trees/${this.currentTreeId}/people/${personId}`
      );
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }
      
      // Сохраняем запись в базе данных
      const mediaData = {
        tree_id: this.currentTreeId,
        person_id: personId,
        file_url: uploadResult.url,
        file_type: formData.get('media-type'),
        file_name: file.name,
        file_size: file.size,
        description: formData.get('media-description') || null,
        tags: formData.get('media-tags') 
          ? formData.get('media-tags').split(',').map(tag => tag.trim()).filter(tag => tag)
          : [],
        is_public: form.querySelector('#media-is-public').checked,
        user_id: this.currentUserId
      };
      
      const { data, error } = await window.supabaseClient
        .from('media')
        .insert([mediaData])
        .select();
      
      if (error) throw error;
      
      // Добавляем в локальный массив
      this.media.unshift(data[0]);
      
      window.showNotification('✅ Медиа загружено!', 'success');
      
      // Закрываем модальное окно
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }
      
      // Обновляем детали человека если открыты
      if (this.selectedPersonId === personId) {
        setTimeout(() => this.showPersonDetails(personId), 500);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки медиа:', error);
      window.showNotification('Ошибка: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
  
  async addEventToPerson(personId) {
    const person = this.people.find(p => p.id === personId);
    if (!person) return;
    
    // Показываем форму добавления события
    // Аналогично addMediaToPerson, но для событий
  }
  
  async showMedia(mediaId) {
    const media = this.media.find(m => m.id === mediaId);
    if (!media) return;
    
    // Показываем модальное окно с медиа
    const modalContent = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>${media.description || 'Медиа'}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${media.file_type === 'image' ? `
            <img src="${media.file_url}" 
                 alt="${media.description || 'Изображение'}" 
                 style="width: 100%; max-height: 500px; object-fit: contain; border-radius: 8px; margin-bottom: 20px;">
          ` : media.file_type === 'video' ? `
            <video controls style="width: 100%; max-height: 500px; border-radius: 8px; margin-bottom: 20px;">
              <source src="${media.file_url}" type="video/mp4">
              Ваш браузер не поддерживает видео.
            </video>
          ` : `
            <div style="text-align: center; padding: 40px;">
              <i class="fas fa-file" style="font-size: 4rem; color: #667eea; margin-bottom: 20px;"></i>
              <h4>${media.file_name || 'Файл'}</h4>
              <p>${media.description || ''}</p>
              <a href="${media.file_url}" target="_blank" class="btn" style="margin-top: 20px;">
                <i class="fas fa-download"></i> Скачать файл
              </a>
            </div>
          `}
          
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #4a5568; margin-bottom: 10px;">Информация о файле</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <strong>Тип:</strong> 
                ${media.file_type === 'image' ? 'Изображение' : 
                  media.file_type === 'video' ? 'Видео' : 
                  media.file_type === 'audio' ? 'Аудио' : 'Документ'}
              </div>
              <div>
                <strong>Имя файла:</strong> ${media.file_name || 'Не указано'}
              </div>
              ${media.file_size ? `
                <div>
                  <strong>Размер:</strong> ${(media.file_size / 1024 / 1024).toFixed(2)} MB
                </div>
              ` : ''}
              <div>
                <strong>Загружено:</strong> ${new Date(media.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
            
            ${media.tags && media.tags.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Теги:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                  ${media.tags.map(tag => `
                    <span style="background: #e2e8f0; padding: 3px 8px; border-radius: 12px; font-size: 0.85rem;">
                      ${tag}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${media.description ? `
              <div style="margin-top: 10px;">
                <strong>Описание:</strong>
                <p style="margin: 5px 0 0 0;">${media.description}</p>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary cancel-btn">
            Закрыть
          </button>
          <button type="button" class="btn btn-danger" onclick="window.treeEngine.deleteMedia('${media.id}')">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `;
    
    // Показываем модальное окно
    const modalId = 'media-view-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = modalContent;
    
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
      
      // Обработчики закрытия
      const closeBtn = modalDiv.querySelector('.modal-close');
      const cancelBtn = modalDiv.querySelector('.cancel-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
    }
  }
  
  async deleteMedia(mediaId) {
    if (!confirm('Вы уверены, что хотите удалить этот медиафайл?')) {
      return;
    }
    
    try {
      window.showLoader('Удаление медиа...');
      
      const media = this.media.find(m => m.id === mediaId);
      
      // Удаляем из хранилища если это не внешняя ссылка
      if (media && !media.file_url.startsWith('http')) {
        // Извлекаем путь из URL
        const urlParts = media.file_url.split('/');
        const path = urlParts.slice(urlParts.indexOf('family-media') + 1).join('/');
        
        if (path) {
          await window.deleteFromSupabaseStorage(path, 'family-media');
        }
      }
      
      // Удаляем запись из базы данных
      const { error } = await window.supabaseClient
        .from('media')
        .delete()
        .eq('id', mediaId);
      
      if (error) throw error;
      
      // Удаляем из локального массива
      this.media = this.media.filter(m => m.id !== mediaId);
      
      window.showNotification('✅ Медиа удалено', 'success');
      
      // Закрываем модальное окно
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }
      
      // Обновляем детали человека если открыты
      if (this.selectedPersonId && media?.person_id) {
        setTimeout(() => this.showPersonDetails(media.person_id), 500);
      }
      
    } catch (error) {
      console.error('Ошибка удаления медиа:', error);
      window.showNotification('Ошибка удаления: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
  
  async inviteToTree() {
    if (!this.currentTreeId) {
      window.showNotification('Сначала создайте дерево', 'error');
      return;
    }
    
    const formHtml = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Пригласить в дерево</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="invite-form">
            <div class="form-group">
              <label for="invite-email">Email приглашаемого *</label>
              <input type="email" id="invite-email" placeholder="email@example.com" required>
            </div>
            
            <div class="form-group">
              <label for="invite-message">Сообщение</label>
              <textarea id="invite-message" rows="3" placeholder="Привет! Приглашаю тебя присоединиться к нашему семейному дереву..."></textarea>
            </div>
            
            <div class="form-group">
              <label for="invite-permissions">Права доступа *</label>
              <select id="invite-permissions" required>
                <option value="viewer">Просмотр</option>
                <option value="editor">Редактирование</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            
            <div class="form-check" style="margin-bottom: 20px;">
              <input type="checkbox" id="invite-expires" checked>
              <label for="invite-expires">Срок действия 30 дней</label>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary cancel-btn">
                Отмена
              </button>
              <button type="submit" class="btn">
                <i class="fas fa-paper-plane"></i> Отправить приглашение
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Показываем форму
    const modalId = 'invite-modal';
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.id = modalId;
    modalDiv.innerHTML = formHtml;
    
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
      
      // Обработчик формы
      const form = modalDiv.querySelector('#invite-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.sendInvitation(form);
        });
      }
      
      // Обработчики закрытия
      const closeBtn = modalDiv.querySelector('.modal-close');
      const cancelBtn = modalDiv.querySelector('.cancel-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.classList.add('hidden'), 300);
        });
      }
    }
  }
  
  async sendInvitation(form) {
    try {
      window.showLoader('Отправка приглашения...');
      
      const formData = new FormData(form);
      const email = formData.get('invite-email');
      const permissions = formData.get('invite-permissions');
      const message = formData.get('invite-message') || '';
      
      // Создаем токен приглашения
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Рассчитываем дату истечения
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Сохраняем приглашение в базу данных
      const invitationData = {
        tree_id: this.currentTreeId,
        inviter_id: this.currentUserId,
        invitee_email: email,
        token: token,
        permissions: permissions,
        message: message,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      };
      
      const { data, error } = await window.supabaseClient
        .from('tree_invitations')
        .insert([invitationData])
        .select();
      
      if (error) throw error;
      
      // В реальном приложении здесь отправка email
      // Для демо просто показываем ссылку
      const inviteLink = `${window.location.origin}/tree.html?invite=${token}`;
      
      window.showNotification(
        `✅ Приглашение отправлено на ${email}. Ссылка: ${inviteLink}`,
        'success'
      );
      
      // Закрываем модальное окно
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.classList.add('hidden'), 300);
      }
      
    } catch (error) {
      console.error('Ошибка отправки приглашения:', error);
      window.showNotification('Ошибка: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
  
  async acceptInvitation(token) {
    try {
      // Получаем приглашение
      const { data: invitations, error: inviteError } = await window.supabaseClient
        .from('tree_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();
      
      if (inviteError) throw new Error('Приглашение не найдено или уже использовано');
      
      // Проверяем срок действия
      if (new Date(invitations.expires_at) < new Date()) {
        throw new Error('Срок действия приглашения истек');
      }
      
      // Добавляем доступ к дереву
      const accessData = {
        tree_id: invitations.tree_id,
        user_id: this.currentUserId,
        permissions: invitations.permissions,
        granted_by: invitations.inviter_id
      };
      
      const { error: accessError } = await window.supabaseClient
        .from('tree_access')
        .insert([accessData]);
      
      if (accessError) throw accessError;
      
      // Обновляем статус приглашения
      await window.supabaseClient
        .from('tree_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitations.id);
      
      window.showNotification('✅ Вы успешно присоединились к дереву!', 'success');
      
      // Загружаем дерево
      await this.loadTree(invitations.tree_id);
      
      return true;
    } catch (error) {
      console.error('Ошибка принятия приглашения:', error);
      window.showNotification('Ошибка: ' + error.message, 'error');
      return false;
    }
  }
  
  // Экспорт дерева в различные форматы
  async exportTree(format = 'json') {
    if (!this.currentTreeId) return;
    
    try {
      window.showLoader('Подготовка экспорта...');
      
      const exportData = {
        tree: this.currentTree,
        people: this.people,
        relationships: this.relationships,
        events: this.events,
        media: this.media,
        export_date: new Date().toISOString(),
        export_format: format,
        version: '2.0'
      };
      
      let dataStr, mimeType, fileName;
      
      switch (format) {
        case 'json':
          dataStr = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          fileName = `family-tree-${this.currentTree.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json`;
          break;
          
        case 'gedcom':
          // Конвертация в GEDCOM формат
          dataStr = this.convertToGEDCOM(exportData);
          mimeType = 'text/plain';
          fileName = `family-tree-${this.currentTree.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.ged`;
          break;
          
        case 'csv':
          dataStr = this.convertToCSV(exportData);
          mimeType = 'text/csv';
          fileName = `family-tree-${this.currentTree.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        default:
          throw new Error('Неизвестный формат');
      }
      
      // Создаем ссылку для скачивания
      const blob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      window.showNotification(`✅ Дерево экспортировано в ${format.toUpperCase()}`, 'success');
      
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      window.showNotification('Ошибка экспорта: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
  
  convertToGEDCOM(data) {
    // Простая конвертация в GEDCOM формат
    let gedcom = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8\n1 SOUR FAMILY_HISTORY\n2 VERS 2.0\n2 NAME История моей семьи\n';
    
    // Добавляем людей
    data.people.forEach((person, index) => {
      const id = `I${index + 1}`;
      gedcom += `0 ${id} INDI\n`;
      gedcom += `1 NAME ${person.first_name} /${person.last_name}/\n`;
      gedcom += `2 GIVN ${person.first_name}\n`;
      gedcom += `2 SURN ${person.last_name}\n`;
      
      if (person.gender) {
        gedcom += `1 SEX ${person.gender === 'male' ? 'M' : 'F'}\n`;
      }
      
      if (person.birth_date) {
        gedcom += `1 BIRT\n`;
        gedcom += `2 DATE ${this.formatGEDCOMDate(person.birth_date)}\n`;
        if (person.birth_place) {
          gedcom += `2 PLAC ${person.birth_place}\n`;
        }
      }
      
      if (person.death_date) {
        gedcom += `1 DEAT\n`;
        gedcom += `2 DATE ${this.formatGEDCOMDate(person.death_date)}\n`;
        if (person.death_place) {
          gedcom += `2 PLAC ${person.death_place}\n`;
        }
      }
    });
    
    // Добавляем семьи
    const families = this.extractFamilies(data);
    families.forEach((fam, index) => {
      const id = `F${index + 1}`;
      gedcom += `0 ${id} FAM\n`;
      
      if (fam.husband) {
        gedcom += `1 HUSB I${data.people.findIndex(p => p.id === fam.husband) + 1}\n`;
      }
      
      if (fam.wife) {
        gedcom += `1 WIFE I${data.people.findIndex(p => p.id === fam.wife) + 1}\n`;
      }
      
      fam.children.forEach(child => {
        gedcom += `1 CHIL I${data.people.findIndex(p => p.id === child) + 1}\n`;
      });
    });
    
    gedcom += '0 TRLR\n';
    return gedcom;
  }
  
  formatGEDCOMDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  }
  
  extractFamilies(data) {
    // Извлекаем семейные связи
    const families = [];
    
    // Находим супружеские пары
    const spouseRels = data.relationships.filter(r => r.relationship_type === 'spouse');
    
    spouseRels.forEach(rel => {
      const family = {
        husband: null,
        wife: null,
        children: []
      };
      
      // Определяем мужчину и женщину
      const person1 = data.people.find(p => p.id === rel.person1_id);
      const person2 = data.people.find(p => p.id === rel.person2_id);
      
      if (person1 && person2) {
        if (person1.gender === 'male') {
          family.husband = person1.id;
          family.wife = person2.id;
        } else {
          family.husband = person2.id;
          family.wife = person1.id;
        }
        
        // Находим детей
        const childRels = data.relationships.filter(r => 
          r.relationship_type === 'parent_child' && 
          (r.person1_id === person1.id || r.person1_id === person2.id)
        );
        
        family.children = childRels.map(r => r.person2_id);
        
        families.push(family);
      }
    });
    
    return families;
  }
  
  convertToCSV(data) {
    // Простая конвертация в CSV
    let csv = 'Имя,Фамилия,Дата рождения,Дата смерти,Пол\n';
    
    data.people.forEach(person => {
      const row = [
        `"${person.first_name}"`,
        `"${person.last_name}"`,
        `"${person.birth_date || ''}"`,
        `"${person.death_date || ''}"`,
        `"${person.gender === 'male' ? 'Мужской' : 'Женский'}"`
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
  
  // Печать дерева
  async printTree() {
    if (!this.currentTreeId) return;
    
    try {
      window.showLoader('Подготовка к печати...');
      
      // Создаем отдельное окно для печати
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Не удалось открыть окно для печати');
      }
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${this.currentTree.name} - Генеалогическое дерево</title>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #333;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2d3748;
            }
            
            .print-header h1 {
              color: #2d3748;
              margin-bottom: 10px;
              font-size: 24px;
            }
            
            .print-meta {
              color: #718096;
              font-size: 14px;
              margin-bottom: 20px;
            }
            
            .tree-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            
            .stat-item {
              text-align: center;
              padding: 15px;
              background: #f7fafc;
              border-radius: 8px;
            }
            
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #2d3748;
              margin-bottom: 5px;
            }
            
            .stat-label {
              font-size: 12px;
              color: #718096;
            }
            
            .people-list {
              margin-top: 30px;
            }
            
            .person-item {
              margin-bottom: 15px;
              padding: 15px;
              background: white;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              page-break-inside: avoid;
            }
            
            .person-name {
              font-weight: bold;
              margin-bottom: 5px;
              color: #2d3748;
            }
            
            .person-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 14px;
              color: #718096;
            }
            
            .print-footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 12px;
            }
            
            @media print {
              body {
                padding: 10px;
              }
              
              .print-header h1 {
                font-size: 20px;
              }
              
              .person-item {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${this.currentTree.name}</h1>
            <div class="print-meta">
              <div>Создано: ${new Date(this.currentTree.created_at).toLocaleDateString('ru-RU')}</div>
              <div>Дата печати: ${new Date().toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
          
          <div class="tree-stats">
            <div class="stat-item">
              <div class="stat-value">${this.people.length}</div>
              <div class="stat-label">Людей</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.relationships.length}</div>
              <div class="stat-label">Связей</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.events.length}</div>
              <div class="stat-label">Событий</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.media.length}</div>
              <div class="stat-label">Медиа</div>
            </div>
          </div>
          
          ${this.currentTree.description ? `
            <div style="margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px;">
              <h3 style="margin-bottom: 10px; color: #4a5568;">Описание</h3>
              <p>${this.currentTree.description}</p>
            </div>
          ` : ''}
          
          <div class="people-list">
            <h3 style="margin-bottom: 15px; color: #4a5568;">Члены семьи</h3>
            ${this.people.map(person => `
              <div class="person-item">
                <div class="person-name">
                  ${person.first_name} ${person.last_name}
                  ${person.middle_name ? ` ${person.middle_name}` : ''}
                </div>
                <div class="person-info">
                  <div>
                    <strong>Пол:</strong> ${person.gender === 'male' ? 'Мужской' : 'Женский'}
                  </div>
                  <div>
                    <strong>Статус:</strong> ${person.is_living ? 'Жив(а)' : 'Умер(ла)'}
                  </div>
                  ${person.birth_date ? `
                    <div>
                      <strong>Рождение:</strong> ${new Date(person.birth_date).toLocaleDateString('ru-RU')}
                      ${person.birth_place ? `, ${person.birth_place}` : ''}
                    </div>
                  ` : ''}
                  ${person.death_date ? `
                    <div>
                      <strong>Смерть:</strong> ${new Date(person.death_date).toLocaleDateString('ru-RU')}
                      ${person.death_place ? `, ${person.death_place}` : ''}
                    </div>
                  ` : ''}
                </div>
                ${person.biography ? `
                  <div style="margin-top: 10px; font-size: 14px; color: #4a5568;">
                    ${person.biography.substring(0, 200)}${person.biography.length > 200 ? '...' : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="print-footer">
            <p>Создано в приложении "История моей семьи"</p>
            <p>© ${new Date().getFullYear()} История моей семьи. Все права защищены.</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => {
                if (window.history.length > 1) {
                  window.close();
                }
              }, 1000);
            }
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Ошибка печати:', error);
      window.showNotification('Ошибка печати: ' + error.message, 'error');
    } finally {
      window.hideLoader();
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌳 Tree Engine V2 инициализирован');
  
  // Создаем глобальный экземпляр
  if (!window.treeEngine) {
    window.treeEngine = new FamilyTreeEngine();
  }
  
  // Проверяем наличие приглашения в URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('invite');
  
  if (inviteToken && window.currentUser) {
    setTimeout(() => {
      window.treeEngine.acceptInvitation(inviteToken);
    }, 1000);
  }
});

// Экспортируем класс
window.FamilyTreeEngine = FamilyTreeEngine;

console.log('✅ Tree Engine V2 загружен');