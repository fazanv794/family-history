console.log('🌳 Tree Engine загружается...');


window.treeBuilder = window.treeBuilder || {
    currentStep: 1,
    totalSteps: 5,
    familyData: {
        self: null,
        parents: [],
        spouse: null,
        children: [],
        siblings: [],
        grandparents: [],
        grandchildren: [],
        other: []
    },
    mode: 'auto' 
};


document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌳 Инициализация Tree Engine...');
    
    
    if (window.currentUser && window.supabaseClient) {
        await loadFamilyTreeFromSupabase();
    }
    

    loadFromLocalStorage();
    
 
    if (window.treeData && window.treeData.relatives && window.treeData.relatives.length > 0) {
        updateTreeInterface(window.treeData.relatives, window.treeData.name);
        updateTreeStats();
    }
    
   
    setupTreePageHandlers();
});



window.loadFamilyTreeFromSupabase = async function() {
    if (!window.currentUser || !window.supabaseClient) {
        console.log('⚠️ Пользователь не авторизован или Supabase не доступен');
        return false;
    }
    
    try {
        window.showLoader('Загрузка семейного дерева...');
        
        const userId = window.currentUser.id;
        
        // Загружаем всех членов семьи
        const { data: members, error: membersError } = await window.supabaseClient
            .from('family_members')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        
        if (membersError) throw membersError;
        
        // Загружаем все связи
        const { data: relationships, error: relError } = await window.supabaseClient
            .from('family_relationships')
            .select('*')
            .eq('user_id', userId);
        
        if (relError) throw relError;
        
        // Загружаем все события
        const { data: events, error: eventsError } = await window.supabaseClient
            .from('family_events')
            .select('*')
            .eq('user_id', userId)
            .order('event_date', { ascending: false });
        
        if (eventsError) throw eventsError;
        
        // Загружаем все медиа
        const { data: media, error: mediaError } = await window.supabaseClient
            .from('family_media')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (mediaError) throw mediaError;
        
        // Сохраняем в глобальные переменные
        window.familyMembers = members || [];
        window.familyRelationships = relationships || [];
        window.familyEvents = events || [];
        window.familyMedia = media || [];
        
        // Преобразуем в формат для дерева
        if (typeof convertToTreeFormat === 'function') {
            convertToTreeFormat();
        }
        
        console.log('✅ Семейное дерево загружено из Supabase:', {
            members: window.familyMembers.length,
            relationships: window.familyRelationships.length,
            events: window.familyEvents.length,
            media: window.familyMedia.length
        });
        
        window.hideLoader();
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки из Supabase:', error);
        window.hideLoader();
        window.showNotification('Ошибка загрузки данных', 'error');
        return false;
    }
};

// Сохранение члена семьи в Supabase
async function saveFamilyMemberToSupabase(personData) {
    if (!window.currentUser || !window.supabaseClient) {
        console.log('⚠️ Пользователь не авторизован, сохраняем локально');
        return null;
    }
    
    try {
        const memberData = {
            user_id: window.currentUser.id,
            first_name: personData.firstName,
            last_name: personData.lastName,
            middle_name: personData.middleName || null,
            birth_date: personData.birthDate || null,
            death_date: personData.deathDate || null,
            gender: personData.gender || 'other',
            photo_url: personData.photoUrl || null,
            biography: personData.biography || null
        };
        
        let result;
        
        if (personData.id && personData.id.toString().includes('-')) {
            // Это UUID - обновляем существующую запись
            const { data, error } = await window.supabaseClient
                .from('family_members')
                .update(memberData)
                .eq('id', personData.id)
                .eq('user_id', window.currentUser.id)
                .select();
            
            if (error) throw error;
            result = data?.[0] || null;
        } else {
            // Создаем новую запись
            const { data, error } = await window.supabaseClient
                .from('family_members')
                .insert([memberData])
                .select();
            
            if (error) throw error;
            result = data?.[0] || null;
        }
        
        if (result) {
            console.log('✅ Член семьи сохранен в Supabase:', result.first_name, result.last_name);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения в Supabase:', error);
        window.showNotification('Ошибка сохранения в базу данных', 'error');
        return null;
    }
}

// Сохранение связи в Supabase
async function saveRelationshipToSupabase(personId, relatedToId, relationshipType) {
    if (!window.currentUser || !window.supabaseClient || !personId || !relatedToId) {
        return null;
    }
    
    try {
        // Проверяем, существует ли уже такая связь
        const { data: existing, error: checkError } = await window.supabaseClient
            .from('family_relationships')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .eq('person_id', personId)
            .eq('related_to_id', relatedToId)
            .eq('relationship_type', relationshipType);
        
        if (checkError) throw checkError;
        
        if (existing && existing.length > 0) {
            return existing[0]; // Связь уже существует
        }
        
        // Создаем новую связь
        const { data, error } = await window.supabaseClient
            .from('family_relationships')
            .insert([{
                user_id: window.currentUser.id,
                person_id: personId,
                related_to_id: relatedToId,
                relationship_type: relationshipType
            }])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Связь сохранена в Supabase:', relationshipType);
        return data?.[0] || null;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения связи:', error);
        return null;
    }
}

// Сохранение события в Supabase
async function saveEventToSupabase(eventData) {
    if (!window.currentUser || !window.supabaseClient) {
        return null;
    }
    
    try {
        const eventPayload = {
            user_id: window.currentUser.id,
            person_id: eventData.person_id || null,
            title: eventData.title,
            event_date: eventData.event_date || eventData.date,
            event_type: eventData.event_type || 'other',
            description: eventData.description || null,
            media_url: eventData.media_url || null
        };
        
        const { data, error } = await window.supabaseClient
            .from('family_events')
            .insert([eventPayload])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Событие сохранено в Supabase');
        return data?.[0] || null;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения события:', error);
        return null;
    }
}

// Сохранение медиа в Supabase
async function saveMediaToSupabase(mediaData) {
    if (!window.currentUser || !window.supabaseClient) {
        return null;
    }
    
    try {
        const mediaPayload = {
            user_id: window.currentUser.id,
            person_id: mediaData.person_id || null,
            file_url: mediaData.file_url,
            file_type: mediaData.file_type || window.getMediaTypeFromUrl(mediaData.file_url),
            file_name: mediaData.file_name || null,
            file_size: mediaData.file_size || null,
            file_type_mime: mediaData.file_type_mime || null,
            description: mediaData.description || null,
            is_external: mediaData.is_external || false
        };
        
        const { data, error } = await window.supabaseClient
            .from('family_media')
            .insert([mediaPayload])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Медиа сохранено в Supabase');
        return data?.[0] || null;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения медиа:', error);
        return null;
    }
}

// Загрузка фото в Supabase Storage
async function uploadPhotoToSupabase(file, personId) {
    if (!window.currentUser || !window.supabaseClient || !window.supabaseClient.storage) {
        console.log('⚠️ Storage не доступен');
        return await window.readFileAsDataURL(file);
    }
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${window.currentUser.id}/${personId}/${Date.now()}.${fileExt}`;
        const filePath = `family-photos/${fileName}`;
        
        const { error: uploadError } = await window.supabaseClient.storage
            .from('family-photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = window.supabaseClient.storage
            .from('family-photos')
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки фото:', error);
        return await window.readFileAsDataURL(file);
    }
}

// ================ ПРЕОБРАЗОВАНИЕ ДАННЫХ ================

// Преобразование данных из Supabase в формат для дерева
function convertToTreeFormat() {
    if (!window.familyMembers || window.familyMembers.length === 0) {
        return;
    }
    
    const relatives = [];
    const relationships = window.familyRelationships || [];
    
    // Создаем карту связей
    const relationMap = {};
    relationships.forEach(rel => {
        if (!relationMap[rel.person_id]) {
            relationMap[rel.person_id] = [];
        }
        relationMap[rel.person_id].push({
            relatedToId: rel.related_to_id,
            type: rel.relationship_type
        });
    });
    
    // Преобразуем каждого члена семьи
    window.familyMembers.forEach(member => {
        // Находим связи для этого члена
        let relationType = 'other';
        let relatedToId = null;
        
        if (relationMap[member.id]) {
            // Ищем связь типа 'self' или берем первую
            const selfRel = relationMap[member.id].find(r => r.type === 'self');
            if (selfRel) {
                relationType = 'self';
            } else if (relationMap[member.id].length > 0) {
                relationType = relationMap[member.id][0].type;
                relatedToId = relationMap[member.id][0].relatedToId;
            }
        }
        
        relatives.push({
            id: member.id,
            firstName: member.first_name,
            lastName: member.last_name,
            middleName: member.middle_name,
            birthDate: member.birth_date,
            deathDate: member.death_date,
            gender: member.gender,
            relation: relationType,
            photoUrl: member.photo_url,
            biography: member.biography,
            relatedToId: relatedToId
        });
    });
    
    // Обновляем window.treeData
    window.treeData = window.treeData || {
        name: 'Мое семейное дерево',
        created: new Date().toISOString(),
        relatives: relatives
    };
    
    // Обновляем window.treeBuilder
    organizeRelativesByType(relatives);
}

// Организация родственников по типам
function organizeRelativesByType(relatives) {
    window.treeBuilder.familyData = {
        self: null,
        parents: [],
        spouse: null,
        children: [],
        siblings: [],
        grandparents: [],
        grandchildren: [],
        other: []
    };
    
    relatives.forEach(person => {
        switch(person.relation) {
            case 'self':
                window.treeBuilder.familyData.self = person;
                break;
            case 'father':
            case 'mother':
                window.treeBuilder.familyData.parents.push(person);
                break;
            case 'spouse':
            case 'partner':
                window.treeBuilder.familyData.spouse = person;
                break;
            case 'son':
            case 'daughter':
                window.treeBuilder.familyData.children.push(person);
                break;
            case 'brother':
            case 'sister':
                window.treeBuilder.familyData.siblings.push(person);
                break;
            case 'grandfather':
            case 'grandmother':
                window.treeBuilder.familyData.grandparents.push(person);
                break;
            case 'grandson':
            case 'granddaughter':
                window.treeBuilder.familyData.grandchildren.push(person);
                break;
            default:
                window.treeBuilder.familyData.other.push(person);
        }
    });
}


// Запуск построителя дерева
window.startTreeBuilder = function(mode = 'auto') {
    console.log('🚀 Запуск построителя дерева, режим:', mode);
    
    window.treeBuilder.mode = mode;
    window.treeBuilder.currentStep = 1;
    
function showTreeBuilderModal() {
    console.log('🏗️ Открытие построителя дерева');
    
    // Проверяем существование модального окна
    let builderModal = document.getElementById('tree-builder-modal');
    
    // Если модальное окно уже существует, удаляем его
    if (builderModal) {
        builderModal.remove();
    }
    
    // Создаем новое модальное окно
    builderModal = document.createElement('div');
    builderModal.id = 'tree-builder-modal';
    builderModal.className = 'modal hidden';
    builderModal.style.maxWidth = '800px';
    
    // Заполняем содержимое
    builderModal.innerHTML = `
        <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <h3 style="color: white; margin: 0;">
                <i class="fas fa-tree"></i> 
                ${window.treeBuilder?.mode === 'auto' ? 'Автоматическое построение дерева' : 'Ручное построение дерева'}
            </h3>
            <button class="modal-close" style="color: white;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 25px;">
            <div id="tree-builder-progress" style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #718096;">Шаг ${window.treeBuilder?.currentStep || 1} из ${window.treeBuilder?.totalSteps || 5}</span>
                    <span style="color: #667eea; font-weight: 600;" id="builder-step-name">Начало</span>
                </div>
                <div class="progress-bar" style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div class="progress-fill" style="width: ${((window.treeBuilder?.currentStep || 1) / (window.treeBuilder?.totalSteps || 5)) * 100}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: width 0.3s;"></div>
                </div>
            </div>
            
            <div id="tree-builder-content" style="min-height: 400px;">
                <!-- Контент будет загружен динамически -->
            </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between; padding: 20px 25px;">
            <button class="btn btn-secondary" id="builder-prev-btn" ${window.treeBuilder?.currentStep === 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-left"></i> Назад
            </button>
            <div>
                <button class="btn btn-outline" id="builder-skip-btn" style="margin-right: 10px;">
                    Пропустить
                </button>
                <button class="btn" id="builder-next-btn">
                    ${window.treeBuilder?.currentStep === window.treeBuilder?.totalSteps ? 'Завершить' : 'Далее'} 
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в body
    document.body.appendChild(builderModal);
    
    // Рендерим содержимое шага
    const content = builderModal.querySelector('#tree-builder-content');
    if (content) {
        content.innerHTML = renderBuilderStep();
    }
    
    // Показываем модальное окно через глобальную функцию
    if (typeof window.showModal === 'function') {
        window.showModal('tree-builder-modal');
    } else {
        // Fallback если функция showModal не доступна
        console.error('❌ Функция showModal не найдена');
        alert('Ошибка открытия построителя. Пожалуйста, обновите страницу.');
    }
    
    // Добавляем обработчики после показа модального окна
    setTimeout(() => {
        const modal = document.getElementById('tree-builder-modal');
        if (modal) {
            setupBuilderModalHandlers(modal);
        }
    }, 100);
}
    
    // Показываем модальное окно
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.classList.remove('hidden');
        
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = modalHTML;
        const modal = modalWrapper.firstElementChild;
        overlay.appendChild(modal);
        
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);
        
        // Добавляем обработчики
        setupBuilderModalHandlers(modal);
    }
}

// Рендеринг текущего шага построителя
function renderBuilderStep() {
    const step = window.treeBuilder.currentStep;
    const mode = window.treeBuilder.mode;
    const data = window.treeBuilder.familyData;
    
    switch(step) {
        case 1:
            document.getElementById('builder-step-name')?.textContent = 'Информация о вас';
            return renderSelfStep(data.self);
        case 2:
            document.getElementById('builder-step-name')?.textContent = 'Родители';
            return renderParentsStep(data.parents);
        case 3:
            document.getElementById('builder-step-name')?.textContent = 'Супруг(а)';
            return renderSpouseStep(data.spouse);
        case 4:
            document.getElementById('builder-step-name')?.textContent = 'Дети';
            return renderChildrenStep(data.children);
        case 5:
            document.getElementById('builder-step-name')?.textContent = 'Обзор и завершение';
            return renderOverviewStep();
        default:
            return '<p>Шаг не найден</p>';
    }
}

// Шаг 1: Информация о себе
function renderSelfStep(selfData) {
    const self = selfData || {
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'male'
    };
    
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; color: #667eea; margin-bottom: 15px;">
                <i class="fas fa-user-circle"></i>
            </div>
            <h3 style="color: #2d3748; margin-bottom: 10px;">Расскажите о себе</h3>
            <p style="color: #718096; margin-bottom: 25px;">Это будет центральная персона вашего генеалогического дерева</p>
        </div>
        
        <form id="builder-self-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="builder-self-firstname">Имя *</label>
                    <input type="text" id="builder-self-firstname" class="form-control" value="${self.firstName}" placeholder="Введите имя" required>
                </div>
                <div class="form-group">
                    <label for="builder-self-lastname">Фамилия *</label>
                    <input type="text" id="builder-self-lastname" class="form-control" value="${self.lastName}" placeholder="Введите фамилию" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="builder-self-birthdate">Дата рождения</label>
                    <input type="date" id="builder-self-birthdate" class="form-control" value="${self.birthDate || ''}">
                </div>
                <div class="form-group">
                    <label for="builder-self-gender">Пол</label>
                    <select id="builder-self-gender" class="form-control" required>
                        <option value="male" ${self.gender === 'male' ? 'selected' : ''}>Мужской</option>
                        <option value="female" ${self.gender === 'female' ? 'selected' : ''}>Женский</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="builder-self-photo">Фото профиля</label>
                <div class="file-upload-area" id="self-photo-upload" style="cursor: pointer;">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Нажмите для загрузки фото</p>
                    <small style="color: #a0aec0;">Поддерживаются JPG, PNG, GIF</small>
                    <input type="file" id="builder-self-photo" accept="image/*" style="display: none;">
                </div>
                <div id="self-photo-preview" style="display: none; margin-top: 15px; text-align: center;">
                    <img src="" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 50%; border: 4px solid #667eea;">
                    <button type="button" class="btn btn-small" id="self-photo-remove" style="margin-top: 10px;">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="builder-self-bio">О себе</label>
                <textarea id="builder-self-bio" class="form-control" rows="4" placeholder="Расскажите немного о себе...">${self.biography || ''}</textarea>
            </div>
        </form>
    `;
}

// Шаг 2: Родители
function renderParentsStep(parentsData) {
    const father = parentsData.find(p => p.gender === 'male') || { firstName: '', lastName: '', birthDate: '' };
    const mother = parentsData.find(p => p.gender === 'female') || { firstName: '', lastName: '', birthDate: '' };
    
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; color: #667eea; margin-bottom: 15px;">
                <i class="fas fa-users"></i>
            </div>
            <h3 style="color: #2d3748; margin-bottom: 10px;">Добавьте родителей</h3>
            <p style="color: #718096; margin-bottom: 25px;">Информация о ваших родителях</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
            <div style="border-right: 1px solid #e2e8f0; padding-right: 25px;">
                <h4 style="color: #4299e1; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-male"></i> Отец
                </h4>
                
                <form id="builder-father-form">
                    <div class="form-group">
                        <label for="builder-father-firstname">Имя</label>
                        <input type="text" id="builder-father-firstname" class="form-control" value="${father.firstName || ''}" placeholder="Имя отца">
                    </div>
                    <div class="form-group">
                        <label for="builder-father-lastname">Фамилия</label>
                        <input type="text" id="builder-father-lastname" class="form-control" value="${father.lastName || ''}" placeholder="Фамилия отца">
                    </div>
                    <div class="form-group">
                        <label for="builder-father-birthdate">Дата рождения</label>
                        <input type="date" id="builder-father-birthdate" class="form-control" value="${father.birthDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="builder-father-deathdate">Дата смерти (если есть)</label>
                        <input type="date" id="builder-father-deathdate" class="form-control" value="${father.deathDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="builder-father-photo">Фото</label>
                        <input type="file" id="builder-father-photo" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-small" onclick="document.getElementById('builder-father-photo').click();">
                            <i class="fas fa-camera"></i> Загрузить фото
                        </button>
                    </div>
                </form>
            </div>
            
            <div>
                <h4 style="color: #ed64a6; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-female"></i> Мать
                </h4>
                
                <form id="builder-mother-form">
                    <div class="form-group">
                        <label for="builder-mother-firstname">Имя</label>
                        <input type="text" id="builder-mother-firstname" class="form-control" value="${mother.firstName || ''}" placeholder="Имя матери">
                    </div>
                    <div class="form-group">
                        <label for="builder-mother-lastname">Фамилия</label>
                        <input type="text" id="builder-mother-lastname" class="form-control" value="${mother.lastName || ''}" placeholder="Фамилия матери">
                    </div>
                    <div class="form-group">
                        <label for="builder-mother-birthdate">Дата рождения</label>
                        <input type="date" id="builder-mother-birthdate" class="form-control" value="${mother.birthDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="builder-mother-deathdate">Дата смерти (если есть)</label>
                        <input type="date" id="builder-mother-deathdate" class="form-control" value="${mother.deathDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="builder-mother-photo">Фото</label>
                        <input type="file" id="builder-mother-photo" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-small" onclick="document.getElementById('builder-mother-photo').click();">
                            <i class="fas fa-camera"></i> Загрузить фото
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <div style="margin-top: 25px; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div class="checkbox-group">
                <input type="checkbox" id="builder-parents-unknown" style="width: auto;">
                <label for="builder-parents-unknown">Я не знаю информацию о родителях</label>
            </div>
        </div>
    `;
}

// Шаг 3: Супруг(а)
function renderSpouseStep(spouseData) {
    const spouse = spouseData || {
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'female'
    };
    
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; color: #ed64a6; margin-bottom: 15px;">
                <i class="fas fa-heart"></i>
            </div>
            <h3 style="color: #2d3748; margin-bottom: 10px;">Добавьте супруга(у)</h3>
            <p style="color: #718096; margin-bottom: 25px;">Информация о вашем супруге или партнере</p>
        </div>
        
        <form id="builder-spouse-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="builder-spouse-firstname">Имя</label>
                    <input type="text" id="builder-spouse-firstname" class="form-control" value="${spouse.firstName || ''}" placeholder="Имя супруга(и)">
                </div>
                <div class="form-group">
                    <label for="builder-spouse-lastname">Фамилия</label>
                    <input type="text" id="builder-spouse-lastname" class="form-control" value="${spouse.lastName || ''}" placeholder="Фамилия супруга(и)">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="builder-spouse-birthdate">Дата рождения</label>
                    <input type="date" id="builder-spouse-birthdate" class="form-control" value="${spouse.birthDate || ''}">
                </div>
                <div class="form-group">
                    <label for="builder-spouse-gender">Пол</label>
                    <select id="builder-spouse-gender" class="form-control">
                        <option value="female" ${spouse.gender === 'female' ? 'selected' : ''}>Женский</option>
                        <option value="male" ${spouse.gender === 'male' ? 'selected' : ''}>Мужской</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="builder-spouse-weddingdate">Дата свадьбы</label>
                <input type="date" id="builder-spouse-weddingdate" class="form-control">
            </div>
            
            <div class="form-group">
                <label for="builder-spouse-photo">Фото</label>
                <input type="file" id="builder-spouse-photo" accept="image/*" style="display: none;">
                <button type="button" class="btn btn-small" onclick="document.getElementById('builder-spouse-photo').click();">
                    <i class="fas fa-camera"></i> Загрузить фото
                </button>
            </div>
        </form>
        
        <div style="margin-top: 25px; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div class="checkbox-group">
                <input type="checkbox" id="builder-no-spouse" style="width: auto;">
                <label for="builder-no-spouse">У меня нет супруга(и) / партнера</label>
            </div>
        </div>
    `;
}

// Шаг 4: Дети
function renderChildrenStep(childrenData) {
    const children = childrenData || [];
    
    let childrenHTML = '';
    
    if (children.length === 0) {
        childrenHTML = `
            <div style="text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-child" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                <p style="margin-bottom: 20px;">У вас пока нет добавленных детей</p>
                <button class="btn" id="builder-add-child-btn">
                    <i class="fas fa-plus"></i> Добавить ребенка
                </button>
            </div>
        `;
    } else {
        childrenHTML = `
            <div style="margin-bottom: 20px;">
                <button class="btn" id="builder-add-child-btn" style="width: 100%;">
                    <i class="fas fa-plus"></i> Добавить еще ребенка
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${children.map((child, index) => `
                    <div style="background: #f7fafc; border-radius: 8px; padding: 15px; border-left: 4px solid ${child.gender === 'male' ? '#4299e1' : '#ed64a6'};">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <div style="font-weight: 600;">${child.firstName || 'Без имени'} ${child.lastName || ''}</div>
                                <div style="font-size: 0.85rem; color: #718096; margin-top: 5px;">
                                    ${child.birthDate ? `Родился: ${new Date(child.birthDate).toLocaleDateString('ru-RU')}` : 'Дата не указана'}
                                </div>
                                <div style="font-size: 0.85rem; color: #667eea; margin-top: 5px;">
                                    ${child.gender === 'male' ? 'Сын' : 'Дочь'}
                                </div>
                            </div>
                            <button class="btn-icon" onclick="removeChild(${index})" style="color: #f56565;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; color: #48bb78; margin-bottom: 15px;">
                <i class="fas fa-baby"></i>
            </div>
            <h3 style="color: #2d3748; margin-bottom: 10px;">Добавьте детей</h3>
            <p style="color: #718096; margin-bottom: 25px;">Информация о ваших детях</p>
        </div>
        
        <div id="builder-children-container">
            ${childrenHTML}
        </div>
        
        <div style="margin-top: 25px; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div class="checkbox-group">
                <input type="checkbox" id="builder-no-children" style="width: auto;">
                <label for="builder-no-children">У меня нет детей</label>
            </div>
        </div>
    `;
}

// Шаг 5: Обзор и завершение
function renderOverviewStep() {
    const data = window.treeBuilder.familyData;
    const self = data.self || {};
    const parentsCount = data.parents.length;
    const hasSpouse = data.spouse ? 1 : 0;
    const childrenCount = data.children.length;
    const siblingsCount = data.siblings.length;
    const totalRelatives = 1 + parentsCount + hasSpouse + childrenCount + siblingsCount;
    
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; color: #667eea; margin-bottom: 15px;">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 style="color: #2d3748; margin-bottom: 10px;">Ваше семейное дерево готово!</h3>
            <p style="color: #718096; margin-bottom: 25px;">Проверьте информацию перед сохранением</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div style="background: #f7fafc; border-radius: 10px; padding: 20px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 50px; height: 50px; background: #48bb78; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${self.firstName ? self.firstName.charAt(0).toUpperCase() : 'Я'}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${self.firstName || 'Вы'} ${self.lastName || ''}</div>
                        <div style="font-size: 0.85rem; color: #48bb78;">Центральная персона</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${parentsCount}</div>
                        <div style="font-size: 0.85rem; color: #718096;">Родителей</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${hasSpouse}</div>
                        <div style="font-size: 0.85rem; color: #718096;">Супруг(а)</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${childrenCount}</div>
                        <div style="font-size: 0.85rem; color: #718096;">Детей</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: white; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">${siblingsCount}</div>
                        <div style="font-size: 0.85rem; color: #718096;">Братьев/сестер</div>
                    </div>
                </div>
            </div>
            
            <div style="background: #f7fafc; border-radius: 10px; padding: 20px;">
                <h4 style="color: #2d3748; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-cog"></i> Настройки дерева
                </h4>
                
                <div class="form-group">
                    <label for="builder-tree-name">Название дерева</label>
                    <input type="text" id="builder-tree-name" class="form-control" value="${window.treeData?.name || 'Мое семейное дерево'}">
                </div>
                
                <div style="margin-top: 20px;">
                    <div class="checkbox-group">
                        <input type="checkbox" id="builder-save-private" style="width: auto;" checked>
                        <label for="builder-save-private">Сделать дерево приватным</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="builder-allow-comments" style="width: auto;" checked>
                        <label for="builder-allow-comments">Разрешить комментарии</label>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <p style="color: #48bb78; font-size: 0.95rem;">
                <i class="fas fa-check-circle"></i> 
                Всего в дереве: <strong>${totalRelatives}</strong> человек
            </p>
            <p style="color: #718096; font-size: 0.9rem; margin-top: 10px;">
                После сохранения вы сможете добавлять больше родственников, фотографии и события
            </p>
        </div>
    `;
}

// Настройка обработчиков модального окна построителя
function setupBuilderModalHandlers(modal) {
    // Закрытие модального окна
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.closeAllModals();
        });
    }
    
    // Кнопка "Назад"
    const prevBtn = modal.querySelector('#builder-prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (window.treeBuilder.currentStep > 1) {
                window.treeBuilder.currentStep--;
                updateBuilderStep(modal);
            }
        });
    }
    
    // Кнопка "Далее" / "Завершить"
    const nextBtn = modal.querySelector('#builder-next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            // Сохраняем данные текущего шага
            await saveCurrentStepData();
            
            if (window.treeBuilder.currentStep === window.treeBuilder.totalSteps) {
                // Завершаем построение
                await completeTreeBuilding();
                window.closeAllModals();
            } else {
                // Переходим к следующему шагу
                window.treeBuilder.currentStep++;
                updateBuilderStep(modal);
            }
        });
    }
    
    // Кнопка "Пропустить"
    const skipBtn = modal.querySelector('#builder-skip-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if (window.treeBuilder.currentStep < window.treeBuilder.totalSteps) {
                window.treeBuilder.currentStep++;
                updateBuilderStep(modal);
            } else {
                window.closeAllModals();
            }
        });
    }
    
    // Добавляем специфичные обработчики для текущего шага
    addStepSpecificHandlers(modal);
}

// Обновление шага построителя
function updateBuilderStep(modal) {
    const content = modal.querySelector('#tree-builder-content');
    const prevBtn = modal.querySelector('#builder-prev-btn');
    const nextBtn = modal.querySelector('#builder-next-btn');
    const stepName = document.getElementById('builder-step-name');
    const progressFill = modal.querySelector('.progress-fill');
    
    if (content) {
        content.innerHTML = renderBuilderStep();
    }
    
    if (prevBtn) {
        prevBtn.disabled = window.treeBuilder.currentStep === 1;
    }
    
    if (nextBtn) {
        nextBtn.innerHTML = window.treeBuilder.currentStep === window.treeBuilder.totalSteps 
            ? 'Завершить <i class="fas fa-check"></i>' 
            : 'Далее <i class="fas fa-arrow-right"></i>';
    }
    
    if (progressFill) {
        progressFill.style.width = `${(window.treeBuilder.currentStep / window.treeBuilder.totalSteps) * 100}%`;
    }
    
    if (stepName) {
        const stepTitles = ['Начало', 'Информация о вас', 'Родители', 'Супруг(а)', 'Дети', 'Обзор'];
        stepName.textContent = stepTitles[window.treeBuilder.currentStep] || `Шаг ${window.treeBuilder.currentStep}`;
    }
    
    // Добавляем специфичные обработчики
    addStepSpecificHandlers(modal);
}

// Добавление обработчиков для текущего шага
function addStepSpecificHandlers(modal) {
    const step = window.treeBuilder.currentStep;
    
    switch(step) {
        case 1:
            // Обработчик загрузки фото
            const photoUpload = modal.querySelector('#self-photo-upload');
            const photoInput = modal.querySelector('#builder-self-photo');
            
            if (photoUpload && photoInput) {
                photoUpload.addEventListener('click', () => photoInput.click());
                
                photoInput.addEventListener('change', function(e) {
                    if (this.files && this.files[0]) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const preview = modal.querySelector('#self-photo-preview');
                            const img = preview.querySelector('img');
                            img.src = e.target.result;
                            preview.style.display = 'block';
                            photoUpload.style.display = 'none';
                        };
                        reader.readAsDataURL(this.files[0]);
                    }
                });
            }
            
            const removePhotoBtn = modal.querySelector('#self-photo-remove');
            if (removePhotoBtn) {
                removePhotoBtn.addEventListener('click', function() {
                    const preview = modal.querySelector('#self-photo-preview');
                    const upload = modal.querySelector('#self-photo-upload');
                    const input = modal.querySelector('#builder-self-photo');
                    
                    preview.style.display = 'none';
                    upload.style.display = 'block';
                    input.value = '';
                });
            }
            break;
            
        case 4:
            // Обработчик добавления ребенка
            const addChildBtn = modal.querySelector('#builder-add-child-btn');
            if (addChildBtn) {
                addChildBtn.addEventListener('click', () => {
                    showAddChildModal();
                });
            }
            
            // Обработчик чекбокса "нет детей"
            const noChildrenCheckbox = modal.querySelector('#builder-no-children');
            if (noChildrenCheckbox) {
                noChildrenCheckbox.addEventListener('change', function() {
                    if (this.checked) {
                        window.treeBuilder.familyData.children = [];
                        updateBuilderStep(modal);
                    }
                });
            }
            break;
    }
}

// Показать модальное окно добавления ребенка
function showAddChildModal() {
    const modalHTML = `
        <div id="add-child-modal" class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Добавить ребенка</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-child-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="child-firstname">Имя *</label>
                            <input type="text" id="child-firstname" class="form-control" placeholder="Имя ребенка" required>
                        </div>
                        <div class="form-group">
                            <label for="child-lastname">Фамилия</label>
                            <input type="text" id="child-lastname" class="form-control" placeholder="Фамилия">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="child-birthdate">Дата рождения</label>
                            <input type="date" id="child-birthdate" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="child-gender">Пол</label>
                            <select id="child-gender" class="form-control" required>
                                <option value="male">Мужской</option>
                                <option value="female">Женский</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="child-photo">Фото</label>
                        <input type="file" id="child-photo" accept="image/*">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary cancel-btn">Отмена</button>
                <button class="btn" id="save-child-btn">Добавить</button>
            </div>
        </div>
    `;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.classList.remove('hidden');
        
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = modalHTML;
        const modal = modalWrapper.firstElementChild;
        overlay.appendChild(modal);
        
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);
        
        // Обработчик сохранения
        const saveBtn = modal.querySelector('#save-child-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async function() {
                const firstName = modal.querySelector('#child-firstname').value;
                const lastName = modal.querySelector('#child-lastname').value || window.treeBuilder.familyData.self?.lastName || '';
                const birthDate = modal.querySelector('#child-birthdate').value;
                const gender = modal.querySelector('#child-gender').value;
                const photoInput = modal.querySelector('#child-photo');
                
                if (!firstName) {
                    window.showNotification('Введите имя ребенка', 'error');
                    return;
                }
                
                const child = {
                    id: Date.now(),
                    firstName: firstName,
                    lastName: lastName,
                    birthDate: birthDate,
                    gender: gender,
                    relation: gender === 'male' ? 'son' : 'daughter'
                };
                
                // Загружаем фото если есть
                if (photoInput.files && photoInput.files[0]) {
                    const reader = new FileReader();
                    reader.onload = async function(e) {
                        child.photoUrl = e.target.result;
                        
                        if (window.currentUser && window.supabaseClient) {
                            const uploadedUrl = await uploadPhotoToSupabase(photoInput.files[0], 'temp-' + Date.now());
                            if (uploadedUrl) {
                                child.photoUrl = uploadedUrl;
                            }
                        }
                        
                        addChildToTree(child);
                    };
                    reader.readAsDataURL(photoInput.files[0]);
                } else {
                    addChildToTree(child);
                }
            });
        }
        
        // Обработчики закрытия
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', window.closeAllModals);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', window.closeAllModals);
        }
    }
}

// Добавление ребенка в дерево
function addChildToTree(child) {
    if (!window.treeBuilder.familyData.children) {
        window.treeBuilder.familyData.children = [];
    }
    
    window.treeBuilder.familyData.children.push(child);
    window.closeAllModals();
    
    // Обновляем шаг с детьми
    const builderModal = document.querySelector('#tree-builder-modal');
    if (builderModal) {
        updateBuilderStep(builderModal);
    }
    
    window.showNotification('Ребенок добавлен', 'success');
}

// Удаление ребенка
window.removeChild = function(index) {
    if (window.treeBuilder.familyData.children && window.treeBuilder.familyData.children[index]) {
        window.treeBuilder.familyData.children.splice(index, 1);
        
        const builderModal = document.querySelector('#tree-builder-modal');
        if (builderModal) {
            updateBuilderStep(builderModal);
        }
        
        window.showNotification('Ребенок удален', 'success');
    }
};

// Сохранение данных текущего шага
async function saveCurrentStepData() {
    const step = window.treeBuilder.currentStep;
    const modal = document.querySelector('#tree-builder-modal');
    
    switch(step) {
        case 1:
            // Сохраняем данные о себе
            if (modal) {
                const firstName = modal.querySelector('#builder-self-firstname')?.value;
                const lastName = modal.querySelector('#builder-self-lastname')?.value;
                const birthDate = modal.querySelector('#builder-self-birthdate')?.value;
                const gender = modal.querySelector('#builder-self-gender')?.value;
                const bio = modal.querySelector('#builder-self-bio')?.value;
                const photoInput = modal.querySelector('#builder-self-photo');
                
                let photoUrl = window.treeBuilder.familyData.self?.photoUrl || null;
                
                // Если есть новое фото
                if (photoInput && photoInput.files && photoInput.files[0]) {
                    if (window.currentUser && window.supabaseClient) {
                        photoUrl = await uploadPhotoToSupabase(photoInput.files[0], 'self-' + Date.now());
                    } else {
                        const reader = await window.readFileAsDataURL(photoInput.files[0]);
                        photoUrl = reader;
                    }
                }
                
                window.treeBuilder.familyData.self = {
                    id: window.treeBuilder.familyData.self?.id || Date.now(),
                    firstName: firstName || '',
                    lastName: lastName || '',
                    birthDate: birthDate || '',
                    gender: gender || 'male',
                    biography: bio || '',
                    photoUrl: photoUrl,
                    relation: 'self'
                };
            }
            break;
            
        case 2:
            // Сохраняем данные о родителях
            if (modal) {
                const noParents = modal.querySelector('#builder-parents-unknown')?.checked;
                
                if (noParents) {
                    window.treeBuilder.familyData.parents = [];
                } else {
                    const fatherFirstname = modal.querySelector('#builder-father-firstname')?.value;
                    const fatherLastname = modal.querySelector('#builder-father-lastname')?.value;
                    const fatherBirthdate = modal.querySelector('#builder-father-birthdate')?.value;
                    const fatherDeathdate = modal.querySelector('#builder-father-deathdate')?.value;
                    
                    const motherFirstname = modal.querySelector('#builder-mother-firstname')?.value;
                    const motherLastname = modal.querySelector('#builder-mother-lastname')?.value;
                    const motherBirthdate = modal.querySelector('#builder-mother-birthdate')?.value;
                    const motherDeathdate = modal.querySelector('#builder-mother-deathdate')?.value;
                    
                    window.treeBuilder.familyData.parents = [];
                    
                    if (fatherFirstname) {
                        window.treeBuilder.familyData.parents.push({
                            id: Date.now() + 1,
                            firstName: fatherFirstname,
                            lastName: fatherLastname || '',
                            birthDate: fatherBirthdate || '',
                            deathDate: fatherDeathdate || '',
                            gender: 'male',
                            relation: 'father'
                        });
                    }
                    
                    if (motherFirstname) {
                        window.treeBuilder.familyData.parents.push({
                            id: Date.now() + 2,
                            firstName: motherFirstname,
                            lastName: motherLastname || '',
                            birthDate: motherBirthdate || '',
                            deathDate: motherDeathdate || '',
                            gender: 'female',
                            relation: 'mother'
                        });
                    }
                }
            }
            break;
            
        case 3:
            // Сохраняем данные о супруге
            if (modal) {
                const noSpouse = modal.querySelector('#builder-no-spouse')?.checked;
                
                if (noSpouse) {
                    window.treeBuilder.familyData.spouse = null;
                } else {
                    const firstName = modal.querySelector('#builder-spouse-firstname')?.value;
                    const lastName = modal.querySelector('#builder-spouse-lastname')?.value;
                    const birthDate = modal.querySelector('#builder-spouse-birthdate')?.value;
                    const gender = modal.querySelector('#builder-spouse-gender')?.value;
                    
                    if (firstName) {
                        window.treeBuilder.familyData.spouse = {
                            id: window.treeBuilder.familyData.spouse?.id || Date.now() + 3,
                            firstName: firstName,
                            lastName: lastName || '',
                            birthDate: birthDate || '',
                            gender: gender || 'female',
                            relation: 'spouse'
                        };
                    }
                }
            }
            break;
    }
}

// Завершение построения дерева
async function completeTreeBuilding() {
    window.showLoader('Сохранение семейного дерева...');
    
    try {
        // Собираем всех родственников
        const relatives = [];
        const self = window.treeBuilder.familyData.self;
        
        if (self) {
            self.relation = 'self';
            relatives.push(self);
        }
        
        // Добавляем родителей
        window.treeBuilder.familyData.parents.forEach(parent => {
            relatives.push(parent);
        });
        
        // Добавляем супруга
        if (window.treeBuilder.familyData.spouse) {
            relatives.push(window.treeBuilder.familyData.spouse);
        }
        
        // Добавляем детей
        window.treeBuilder.familyData.children.forEach(child => {
            relatives.push(child);
        });
        
        // Сохраняем в глобальную переменную
        window.treeData = {
            name: document.getElementById('builder-tree-name')?.value || 'Мое семейное дерево',
            created: new Date().toISOString(),
            relatives: relatives
        };
        
        // Сохраняем в localStorage
        window.saveToLocalStorage();
        
        // Если пользователь авторизован, сохраняем в Supabase
        if (window.currentUser && window.supabaseClient) {
            await saveTreeToSupabase(relatives);
        }
        
        // Обновляем интерфейс
        updateTreeInterface(relatives, window.treeData.name);
        updateTreeStats();
        
        // Показываем контролы
        const controlsPanel = document.getElementById('tree-controls-panel');
        if (controlsPanel) {
            controlsPanel.style.display = 'flex';
        }
        
        window.showNotification('✅ Семейное дерево успешно создано!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения дерева:', error);
        window.showNotification('Ошибка при сохранении дерева', 'error');
    } finally {
        window.hideLoader();
    }
}

// Сохранение дерева в Supabase
async function saveTreeToSupabase(relatives) {
    if (!window.currentUser || !window.supabaseClient) {
        return false;
    }
    
    try {
        // Сохраняем каждого члена семьи
        for (const person of relatives) {
            const savedMember = await saveFamilyMemberToSupabase(person);
            
            if (savedMember) {
                // Обновляем ID
                person.id = savedMember.id;
                
                // Если это "Я", сохраняем связь "self"
                if (person.relation === 'self') {
                    await saveRelationshipToSupabase(savedMember.id, savedMember.id, 'self');
                }
                
                // Сохраняем связи с родителями
                if (person.relation === 'father' || person.relation === 'mother') {
                    const selfPerson = relatives.find(r => r.relation === 'self');
                    if (selfPerson && selfPerson.id) {
                        await saveRelationshipToSupabase(selfPerson.id, savedMember.id, person.relation);
                    }
                }
                
                // Сохраняем связи с супругом
                if (person.relation === 'spouse') {
                    const selfPerson = relatives.find(r => r.relation === 'self');
                    if (selfPerson && selfPerson.id) {
                        await saveRelationshipToSupabase(selfPerson.id, savedMember.id, 'spouse');
                        await saveRelationshipToSupabase(savedMember.id, selfPerson.id, 'spouse');
                    }
                }
                
                // Сохраняем связи с детьми
                if (person.relation === 'son' || person.relation === 'daughter') {
                    const selfPerson = relatives.find(r => r.relation === 'self');
                    if (selfPerson && selfPerson.id) {
                        await saveRelationshipToSupabase(selfPerson.id, savedMember.id, person.relation);
                        await saveRelationshipToSupabase(savedMember.id, selfPerson.id, person.relation === 'son' ? 'father' : 'mother');
                    }
                }
            }
        }
        
        console.log('✅ Дерево сохранено в Supabase');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения в Supabase:', error);
        return false;
    }
}

// ================ ВИЗУАЛИЗАЦИЯ ДЕРЕВА ================

// Создание интерактивного SVG-дерева
window.createInteractiveTree = function(relatives, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Группируем по поколениям
    const generations = groupByGenerations(relatives);
    
    // Создаем SVG элемент
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "600");
    svg.setAttribute("viewBox", "0 0 1000 600");
    svg.style.cursor = "grab";
    
    // Создаем группу для масштабирования/перемещения
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "tree-group");
    svg.appendChild(g);
    
    // Добавляем фон
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "1000");
    rect.setAttribute("height", "600");
    rect.setAttribute("fill", "#f8fafc");
    g.appendChild(rect);
    
    // Позиционируем узлы
    const nodePositions = calculateNodePositions(generations);
    
    // Рисуем соединительные линии
    drawConnections(nodePositions, g);
    
    // Рисуем узлы
    drawNodes(nodePositions, g);
    
    // Добавляем интерактивность
    addTreeInteractivity(svg, g);
    
    container.appendChild(svg);
};

// Группировка по поколениям
function groupByGenerations(relatives) {
    const generations = {
        'grandparents': [],
        'parents': [],
        'current': [],
        'children': [],
        'grandchildren': []
    };
    
    relatives.forEach(person => {
        const relation = person.relation || '';
        
        if (relation.includes('grandparent') || relation.includes('grandfather') || relation.includes('grandmother')) {
            generations.grandparents.push(person);
        } else if (relation === 'father' || relation === 'mother' || relation === 'parent') {
            generations.parents.push(person);
        } else if (relation === 'self' || relation === 'spouse' || relation === 'partner' || relation === 'brother' || relation === 'sister') {
            generations.current.push(person);
        } else if (relation === 'son' || relation === 'daughter' || relation === 'child') {
            generations.children.push(person);
        } else if (relation.includes('grandson') || relation.includes('granddaughter') || relation.includes('grandchild')) {
            generations.grandchildren.push(person);
        }
    });
    
    return generations;
}

// Расчет позиций узлов
function calculateNodePositions(generations) {
    const positions = [];
    const startX = 200;
    const startY = 80;
    const xSpacing = 180;
    const ySpacing = 120;
    
    // Бабушки и дедушки
    if (generations.grandparents && generations.grandparents.length > 0) {
        const count = generations.grandparents.length;
        const offset = (count - 1) * xSpacing / 2;
        
        generations.grandparents.forEach((person, index) => {
            positions.push({
                person: person,
                x: startX + (index * xSpacing) - offset,
                y: startY,
                generation: 'grandparents'
            });
        });
    }
    
    // Родители
    if (generations.parents && generations.parents.length > 0) {
        const count = generations.parents.length;
        const offset = (count - 1) * xSpacing / 2;
        
        generations.parents.forEach((person, index) => {
            positions.push({
                person: person,
                x: startX + (index * xSpacing) - offset,
                y: startY + ySpacing,
                generation: 'parents'
            });
        });
    }
    
    // Текущее поколение
    if (generations.current && generations.current.length > 0) {
        const selfIndex = generations.current.findIndex(p => p.relation === 'self');
        const sortedCurrent = [...generations.current];
        
        if (selfIndex !== -1) {
            const self = sortedCurrent.splice(selfIndex, 1)[0];
            sortedCurrent.unshift(self);
        }
        
        const count = sortedCurrent.length;
        const offset = (count - 1) * xSpacing / 2;
        
        sortedCurrent.forEach((person, index) => {
            positions.push({
                person: person,
                x: startX + (index * xSpacing) - offset,
                y: startY + (ySpacing * 2),
                generation: 'current',
                isSelf: person.relation === 'self'
            });
        });
    }
    
    // Дети
    if (generations.children && generations.children.length > 0) {
        const count = generations.children.length;
        const offset = (count - 1) * xSpacing / 2;
        
        generations.children.forEach((person, index) => {
            positions.push({
                person: person,
                x: startX + (index * xSpacing) - offset,
                y: startY + (ySpacing * 3),
                generation: 'children'
            });
        });
    }
    
    // Внуки
    if (generations.grandchildren && generations.grandchildren.length > 0) {
        const count = generations.grandchildren.length;
        const offset = (count - 1) * xSpacing / 2;
        
        generations.grandchildren.forEach((person, index) => {
            positions.push({
                person: person,
                x: startX + (index * xSpacing) - offset,
                y: startY + (ySpacing * 4),
                generation: 'grandchildren'
            });
        });
    }
    
    return positions;
}

// Рисование соединительных линий
function drawConnections(positions, g) {
    // Группируем по поколениям
    const byGeneration = {};
    positions.forEach(pos => {
        if (!byGeneration[pos.generation]) {
            byGeneration[pos.generation] = [];
        }
        byGeneration[pos.generation].push(pos);
    });
    
    // Соединяем родителей с детьми
    if (byGeneration.parents && byGeneration.current) {
        byGeneration.parents.forEach(parent => {
            byGeneration.current.forEach(child => {
                if (child.person.relation === 'self') {
                    drawLine(parent.x, parent.y + 20, child.x, child.y - 20, g);
                }
            });
        });
    }
    
    // Соединяем супругов
    if (byGeneration.current) {
        const self = byGeneration.current.find(p => p.person.relation === 'self');
        const spouse = byGeneration.current.find(p => p.person.relation === 'spouse' || p.person.relation === 'partner');
        
        if (self && spouse) {
            drawLine(self.x + 40, self.y, spouse.x - 40, spouse.y, g, true);
        }
    }
    
    // Соединяем родителей с детьми
    if (byGeneration.current && byGeneration.children) {
        byGeneration.current.forEach(parent => {
            if (parent.person.relation === 'self' || parent.person.relation === 'spouse') {
                byGeneration.children.forEach(child => {
                    drawLine(parent.x, parent.y + 20, child.x, child.y - 20, g);
                });
            }
        });
    }
}

// Рисование линии
function drawLine(x1, y1, x2, y2, g, isHorizontal = false) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#a0aec0");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-dasharray", isHorizontal ? "5,5" : "none");
    g.appendChild(line);
}

// Рисование узлов
function drawNodes(positions, g) {
    positions.forEach(pos => {
        const person = pos.person;
        const isSelf = pos.isSelf || person.relation === 'self';
        const gender = person.gender || 'other';
        
        // Группа для узла
        const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nodeGroup.setAttribute("class", `tree-node ${gender} ${isSelf ? 'self' : ''}`);
        nodeGroup.setAttribute("transform", `translate(${pos.x - 70}, ${pos.y - 40})`);
        nodeGroup.style.cursor = "pointer";
        
        // Фон узла
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "140");
        rect.setAttribute("height", "80");
        rect.setAttribute("rx", "10");
        rect.setAttribute("ry", "10");
        
        if (isSelf) {
            rect.setAttribute("fill", "#f0fff4");
            rect.setAttribute("stroke", "#48bb78");
        } else if (gender === 'male') {
            rect.setAttribute("fill", "#ebf8ff");
            rect.setAttribute("stroke", "#4299e1");
        } else if (gender === 'female') {
            rect.setAttribute("fill", "#fff5f7");
            rect.setAttribute("stroke", "#ed64a6");
        } else {
            rect.setAttribute("fill", "#f7fafc");
            rect.setAttribute("stroke", "#a0aec0");
        }
        
        rect.setAttribute("stroke-width", "2");
        nodeGroup.appendChild(rect);
        
        // Имя
        const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameText.setAttribute("x", "70");
        nameText.setAttribute("y", "25");
        nameText.setAttribute("text-anchor", "middle");
        nameText.setAttribute("font-size", "12");
        nameText.setAttribute("font-weight", "bold");
        nameText.setAttribute("fill", "#2d3748");
        nameText.textContent = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Без имени';
        nodeGroup.appendChild(nameText);
        
        // Отношение
        const relationText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        relationText.setAttribute("x", "70");
        relationText.setAttribute("y", "45");
        relationText.setAttribute("text-anchor", "middle");
        relationText.setAttribute("font-size", "10");
        relationText.setAttribute("fill", "#718096");
        relationText.textContent = getRelationText(person.relation);
        nodeGroup.appendChild(relationText);
        
        // Дата рождения
        if (person.birthDate) {
            const dateText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dateText.setAttribute("x", "70");
            dateText.setAttribute("y", "65");
            dateText.setAttribute("text-anchor", "middle");
            dateText.setAttribute("font-size", "9");
            dateText.setAttribute("fill", "#a0aec0");
            dateText.textContent = person.birthDate;
            nodeGroup.appendChild(dateText);
        }
        
        // Добавляем обработчик клика
        nodeGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            showPersonDetails(person);
        });
        
        g.appendChild(nodeGroup);
    });
}

// Добавление интерактивности
function addTreeInteractivity(svg, g) {
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let transform = { x: 0, y: 0, scale: 1 };
    
    // Масштабирование колесиком мыши
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        
        transform.scale = Math.max(0.3, Math.min(3, transform.scale + delta));
        updateTransform();
    });
    
    // Перемещение
    svg.addEventListener('mousedown', (e) => {
        isPanning = true;
        startPoint = { x: e.clientX - transform.x, y: e.clientY - transform.y };
        svg.style.cursor = 'grabbing';
    });
    
    svg.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        
        transform.x = e.clientX - startPoint.x;
        transform.y = e.clientY - startPoint.y;
        updateTransform();
    });
    
    svg.addEventListener('mouseup', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    svg.addEventListener('mouseleave', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });
    
    function updateTransform() {
        g.setAttribute('transform', 
            `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`
        );
    }
}

// Показать детальную информацию о человеке
function showPersonDetails(person) {
    const modalHTML = `
        <div id="person-details-modal" class="modal" style="max-width: 600px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h3 style="color: white; margin: 0;">
                    <i class="fas fa-user"></i> ${person.firstName || ''} ${person.lastName || ''}
                </h3>
                <button class="modal-close" style="color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 25px;">
                <div style="display: flex; gap: 25px; margin-bottom: 25px;">
                    <div style="flex-shrink: 0;">
                        <div style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 4px solid ${person.gender === 'male' ? '#4299e1' : '#ed64a6'};">
                            ${person.photoUrl ? 
                                `<img src="${person.photoUrl}" alt="${person.firstName}" style="width: 100%; height: 100%; object-fit: cover;">` :
                                `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: bold;">
                                    ${person.firstName ? person.firstName.charAt(0).toUpperCase() : '?'}
                                </div>`
                            }
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="margin-bottom: 15px;">
                            <div style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">Отношение</div>
                            <div style="font-weight: 600; color: #2d3748;">${getRelationText(person.relation)}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <div style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">Дата рождения</div>
                                <div style="font-weight: 500;">${person.birthDate || 'Не указана'}</div>
                            </div>
                            <div>
                                <div style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">Дата смерти</div>
                                <div style="font-weight: 500;">${person.deathDate || '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <div style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">Биография</div>
                    <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; color: #4a5568; line-height: 1.6; min-height: 100px;">
                        ${person.biography || 'Нет биографии'}
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="edit-person-btn">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn" id="add-event-btn">
                        <i class="fas fa-calendar-plus"></i> Добавить событие
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary cancel-btn">Закрыть</button>
            </div>
        </div>
    `;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.classList.remove('hidden');
        
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = modalHTML;
        const modal = modalWrapper.firstElementChild;
        overlay.appendChild(modal);
        
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);
        
        // Обработчики закрытия
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', window.closeAllModals);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', window.closeAllModals);
        }
        
        // Обработчик редактирования
        const editBtn = modal.querySelector('#edit-person-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.closeAllModals();
                showEditPersonModal(person);
            });
        }
        
        // Обработчик добавления события
        const addEventBtn = modal.querySelector('#add-event-btn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                window.closeAllModals();
                window.showModal('add-event-modal');
                
                // Предзаполняем данные
                setTimeout(() => {
                    const eventTitle = document.getElementById('event-title');
                    if (eventTitle) {
                        eventTitle.value = `Событие для ${person.firstName} ${person.lastName}`;
                    }
                }, 100);
            });
        }
    }
}

// Показать модальное окно редактирования человека
function showEditPersonModal(person) {
    const modalHTML = `
        <div id="edit-person-modal" class="modal" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Редактировать данные</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-person-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-firstname">Имя *</label>
                            <input type="text" id="edit-firstname" class="form-control" value="${person.firstName || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-lastname">Фамилия *</label>
                            <input type="text" id="edit-lastname" class="form-control" value="${person.lastName || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-birthdate">Дата рождения</label>
                            <input type="date" id="edit-birthdate" class="form-control" value="${person.birthDate || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-deathdate">Дата смерти</label>
                            <input type="date" id="edit-deathdate" class="form-control" value="${person.deathDate || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-gender">Пол</label>
                        <select id="edit-gender" class="form-control">
                            <option value="male" ${person.gender === 'male' ? 'selected' : ''}>Мужской</option>
                            <option value="female" ${person.gender === 'female' ? 'selected' : ''}>Женский</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-relation">Родство</label>
                        <select id="edit-relation" class="form-control">
                            <option value="self" ${person.relation === 'self' ? 'selected' : ''}>Я</option>
                            <option value="father" ${person.relation === 'father' ? 'selected' : ''}>Отец</option>
                            <option value="mother" ${person.relation === 'mother' ? 'selected' : ''}>Мать</option>
                            <option value="spouse" ${person.relation === 'spouse' ? 'selected' : ''}>Супруг(а)</option>
                            <option value="son" ${person.relation === 'son' ? 'selected' : ''}>Сын</option>
                            <option value="daughter" ${person.relation === 'daughter' ? 'selected' : ''}>Дочь</option>
                            <option value="brother" ${person.relation === 'brother' ? 'selected' : ''}>Брат</option>
                            <option value="sister" ${person.relation === 'sister' ? 'selected' : ''}>Сестра</option>
                            <option value="grandfather" ${person.relation === 'grandfather' ? 'selected' : ''}>Дедушка</option>
                            <option value="grandmother" ${person.relation === 'grandmother' ? 'selected' : ''}>Бабушка</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-bio">Биография</label>
                        <textarea id="edit-bio" class="form-control" rows="4">${person.biography || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-photo">Фото</label>
                        <input type="file" id="edit-photo" accept="image/*">
                        ${person.photoUrl ? `<p style="margin-top: 10px; font-size: 0.85rem; color: #48bb78;"><i class="fas fa-check-circle"></i> Текущее фото загружено</p>` : ''}
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary cancel-btn">Отмена</button>
                <button class="btn" id="save-person-edit-btn">Сохранить</button>
            </div>
        </div>
    `;
    
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.classList.remove('hidden');
        
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = modalHTML;
        const modal = modalWrapper.firstElementChild;
        overlay.appendChild(modal);
        
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);
        
        // Обработчики закрытия
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', window.closeAllModals);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', window.closeAllModals);
        }
        
        // Обработчик сохранения
        const saveBtn = modal.querySelector('#save-person-edit-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async function() {
                const firstName = modal.querySelector('#edit-firstname').value;
                const lastName = modal.querySelector('#edit-lastname').value;
                const birthDate = modal.querySelector('#edit-birthdate').value;
                const deathDate = modal.querySelector('#edit-deathdate').value;
                const gender = modal.querySelector('#edit-gender').value;
                const relation = modal.querySelector('#edit-relation').value;
                const bio = modal.querySelector('#edit-bio').value;
                const photoInput = modal.querySelector('#edit-photo');
                
                if (!firstName || !lastName) {
                    window.showNotification('Заполните имя и фамилию', 'error');
                    return;
                }
                
                // Обновляем данные
                person.firstName = firstName;
                person.lastName = lastName;
                person.birthDate = birthDate;
                person.deathDate = deathDate;
                person.gender = gender;
                person.relation = relation;
                person.biography = bio;
                
                // Загружаем новое фото если есть
                if (photoInput.files && photoInput.files[0]) {
                    if (window.currentUser && window.supabaseClient) {
                        const uploadedUrl = await uploadPhotoToSupabase(photoInput.files[0], person.id);
                        if (uploadedUrl) {
                            person.photoUrl = uploadedUrl;
                        }
                    } else {
                        const reader = await window.readFileAsDataURL(photoInput.files[0]);
                        person.photoUrl = reader;
                    }
                }
                
                // Сохраняем в Supabase
                if (window.currentUser && window.supabaseClient) {
                    await saveFamilyMemberToSupabase(person);
                }
                
                // Сохраняем в localStorage
                window.saveToLocalStorage();
                
                window.closeAllModals();
                window.showNotification('✅ Данные обновлены', 'success');
                
                // Обновляем дерево
                if (window.treeData && window.treeData.relatives) {
                    const index = window.treeData.relatives.findIndex(p => p.id === person.id);
                    if (index !== -1) {
                        window.treeData.relatives[index] = person;
                    }
                    
                    updateTreeInterface(window.treeData.relatives, window.treeData.name);
                }
            });
        }
    }
}

// ================ ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ================

// Обновление интерфейса дерева
window.updateTreeInterface = function(relatives, treeName) {
    const container = document.getElementById('tree-visualization-container');
    const emptyState = document.getElementById('tree-empty-state');
    const controlsPanel = document.getElementById('tree-controls-panel');
    
    if (!container) return;
    
    if (!relatives || relatives.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (controlsPanel) controlsPanel.style.display = 'none';
        return;
    }
    
    // Скрываем пустое состояние
    if (emptyState) emptyState.style.display = 'none';
    if (controlsPanel) controlsPanel.style.display = 'flex';
    
    // Используем SVG визуализацию
    window.createInteractiveTree(relatives, 'tree-visualization-container');
};

// Обновление статистики дерева
window.updateTreeStats = function() {
    const relatives = window.treeData?.relatives || [];
    const count = relatives.length;
    
    // Подсчитываем уникальные деревья
    const uniqueTrees = 1; // Пока одно дерево
    
    // Подсчитываем поколения
    let generations = 0;
    const relations = relatives.map(p => p.relation);
    
    if (relations.includes('grandparent')) generations = Math.max(generations, 1);
    if (relations.includes('parent') || relations.includes('father') || relations.includes('mother')) generations = Math.max(generations, 2);
    if (relations.includes('self')) generations = Math.max(generations, 3);
    if (relations.includes('child') || relations.includes('son') || relations.includes('daughter')) generations = Math.max(generations, 4);
    if (relations.includes('grandchild')) generations = Math.max(generations, 5);
    
    if (generations === 0 && count > 0) generations = 1;
    
    // Подсчитываем года истории
    let years = 0;
    const birthDates = relatives
        .map(p => p.birthDate)
        .filter(d => d)
        .map(d => new Date(d).getFullYear())
        .filter(y => !isNaN(y));
    
    if (birthDates.length > 0) {
        const minYear = Math.min(...birthDates);
        const maxYear = Math.max(...birthDates);
        years = maxYear - minYear;
    }
    
    // Обновляем DOM
    const statRelatives = document.getElementById('stat-relatives');
    const statTrees = document.getElementById('stat-trees');
    const statDepth = document.getElementById('stat-depth');
    const statYears = document.getElementById('stat-years');
    
    if (statRelatives) statRelatives.textContent = count;
    if (statTrees) statTrees.textContent = uniqueTrees;
    if (statDepth) statDepth.textContent = generations;
    if (statYears) statYears.textContent = years || '—';
};

// ================ ЭКСПОРТ И ПЕЧАТЬ ================

// Сохранение дерева как изображение
window.saveTreeAsImage = function() {
    if (!window.treeData?.relatives?.length) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    const container = document.getElementById('tree-visualization-container');
    if (!container) {
        window.showNotification('Контейнер дерева не найден', 'error');
        return;
    }
    
    window.showLoader('Сохранение изображения...');
    
    try {
        if (typeof html2canvas === 'undefined') {
            window.showNotification('Библиотека html2canvas не загружена', 'error');
            fallbackSaveTreeAsImage();
            return;
        }
        
        html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `family-tree-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            window.showNotification('✅ Дерево сохранено как изображение!', 'success');
            window.hideLoader();
        }).catch(error => {
            console.error('Ошибка html2canvas:', error);
            fallbackSaveTreeAsImage();
        });
    } catch (error) {
        console.error('Ошибка сохранения изображения:', error);
        fallbackSaveTreeAsImage();
    }
};

// Альтернативный метод сохранения
function fallbackSaveTreeAsImage() {
    const container = document.getElementById('tree-visualization-container');
    const treeName = window.treeData?.name || 'Мое семейное дерево';
    const relativesCount = window.treeData?.relatives?.length || 0;
    
    let treeText = `Генеалогическое дерево: ${treeName}\n`;
    treeText += `Дата сохранения: ${new Date().toLocaleDateString('ru-RU')}\n`;
    treeText += `Количество родственников: ${relativesCount}\n\n`;
    
    if (window.treeData?.relatives) {
        treeText += "Список родственников:\n";
        window.treeData.relatives.forEach((person, index) => {
            treeText += `${index + 1}. ${person.firstName} ${person.lastName}\n`;
            treeText += `   Отношение: ${getRelationText(person.relation)}\n`;
            treeText += `   Пол: ${person.gender === 'male' ? 'Мужской' : 'Женский'}\n`;
            if (person.birthDate) {
                treeText += `   Дата рождения: ${person.birthDate}\n`;
            }
            treeText += '\n';
        });
    }
    
    const blob = new Blob([treeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    window.showNotification('✅ Информация о дереве сохранена в файл!', 'success');
    window.hideLoader();
}

// Печать дерева
window.printTree = function() {
    if (!window.treeData?.relatives?.length) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    window.showNotification('Подготовка к печати...', 'info');
    
    const treeName = window.treeData?.name || 'Генеалогическое древо';
    const relativesCount = window.treeData?.relatives?.length || 0;
    const createdDate = window.treeData?.created ? 
        new Date(window.treeData.created).toLocaleDateString('ru-RU') : 
        new Date().toLocaleDateString('ru-RU');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${treeName}</title>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                    color: #333; 
                    padding: 30px; 
                    max-width: 1200px; 
                    margin: 0 auto; 
                }
                .print-header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px; 
                    border-bottom: 2px solid #2d3748; 
                }
                .print-header h1 { color: #2d3748; margin-bottom: 10px; }
                .print-meta { color: #718096; font-size: 14px; margin-bottom: 20px; }
                .generation { margin-bottom: 40px; }
                .generation-title { 
                    color: #4a5568; 
                    font-size: 18px; 
                    font-weight: 600; 
                    margin-bottom: 20px; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid #e2e8f0; 
                }
                .person-row { 
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: 20px; 
                    justify-content: center; 
                }
                .person-card { 
                    background: white; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 8px; 
                    padding: 15px; 
                    width: 180px; 
                    text-align: center; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
                }
                .person-card.male { border-left: 4px solid #4299e1; }
                .person-card.female { border-left: 4px solid #ed64a6; }
                .person-card.self { border-left: 4px solid #48bb78; font-weight: 600; }
                .person-avatar { 
                    width: 70px; 
                    height: 70px; 
                    border-radius: 50%; 
                    margin: 0 auto 10px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: bold; 
                    font-size: 24px; 
                }
                .person-avatar.male { background: #4299e1; }
                .person-avatar.female { background: #ed64a6; }
                .person-avatar.self { background: #48bb78; }
                .person-name { font-weight: 600; margin-bottom: 5px; }
                .person-relation { font-size: 12px; color: #667eea; margin-bottom: 5px; }
                .person-date { font-size: 11px; color: #718096; }
                .print-footer { 
                    text-align: center; 
                    margin-top: 40px; 
                    padding-top: 20px; 
                    border-top: 1px solid #e2e8f0; 
                    color: #718096; 
                    font-size: 12px; 
                }
                @media print {
                    body { padding: 10px; }
                    .person-card { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>${treeName}</h1>
                <div class="print-meta">
                    <div>Всего родственников: ${relativesCount}</div>
                    <div>Дата создания: ${createdDate}</div>
                    <div>Дата печати: ${new Date().toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
            
            <div class="tree-print-container">
                ${generatePrintableTree()}
            </div>
            
            <div class="print-footer">
                <p>Создано в приложении "История моей семьи"</p>
                <p>© ${new Date().getFullYear()} История моей семьи. Все права защищены.</p>
            </div>
            
            <script>
                window.onload = function() { window.print(); window.close(); }
            <\/script>
        </body>
        </html>`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
};

// Генерация печатной версии дерева
function generatePrintableTree() {
    const relatives = window.treeData?.relatives || [];
    if (relatives.length === 0) {
        return '<p style="text-align: center; color: #718096; padding: 40px;">Дерево пока не создано</p>';
    }
    
    // Группируем родственников
    const selfPerson = relatives.find(p => p.relation === 'self');
    const parents = relatives.filter(p => p.relation === 'father' || p.relation === 'mother');
    const spouse = relatives.find(p => p.relation === 'spouse' || p.relation === 'partner');
    const children = relatives.filter(p => p.relation === 'son' || p.relation === 'daughter');
    const siblings = relatives.filter(p => p.relation === 'brother' || p.relation === 'sister');
    const grandparents = relatives.filter(p => p.relation === 'grandfather' || p.relation === 'grandmother');
    const grandchildren = relatives.filter(p => p.relation === 'grandson' || p.relation === 'granddaughter');
    
    let html = '';
    
    // Поколение бабушек и дедушек
    if (grandparents.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Бабушки и дедушки</div>';
        html += '<div class="person-row">';
        grandparents.forEach(gp => {
            html += createPrintablePersonCard(gp);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Поколение родителей
    if (parents.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Родители</div>';
        html += '<div class="person-row">';
        parents.forEach(parent => {
            html += createPrintablePersonCard(parent);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Центральное поколение
    html += '<div class="generation">';
    html += '<div class="generation-title">Центральное поколение</div>';
    html += '<div class="person-row">';
    
    if (selfPerson) {
        html += createPrintablePersonCard(selfPerson, true);
    }
    
    if (spouse) {
        html += createPrintablePersonCard(spouse);
    }
    
    if (siblings.length > 0) {
        siblings.forEach(sibling => {
            html += createPrintablePersonCard(sibling);
        });
    }
    
    html += '</div>';
    html += '</div>';
    
    // Поколение детей
    if (children.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Дети</div>';
        html += '<div class="person-row">';
        children.forEach(child => {
            html += createPrintablePersonCard(child);
        });
        html += '</div>';
        html += '</div>';
    }
    
    // Поколение внуков
    if (grandchildren.length > 0) {
        html += '<div class="generation">';
        html += '<div class="generation-title">Внуки</div>';
        html += '<div class="person-row">';
        grandchildren.forEach(gc => {
            html += createPrintablePersonCard(gc);
        });
        html += '</div>';
        html += '</div>';
    }
    
    return html;
}

// Создание карточки для печати
function createPrintablePersonCard(person, isSelf = false) {
    const genderClass = person.gender === 'male' ? 'male' : 'female';
    const selfClass = isSelf ? 'self' : '';
    const relationText = getRelationText(person.relation);
    const initials = `${person.firstName?.charAt(0) || ''}${person.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
    
    return `
        <div class="person-card ${genderClass} ${selfClass}">
            <div class="person-avatar ${genderClass} ${selfClass}">
                ${person.photoUrl ? 
                    `<img src="${person.photoUrl}" alt="${person.firstName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                    initials
                }
            </div>
            <div class="person-name">${person.firstName || ''} ${person.lastName || ''}</div>
            <div class="person-relation">${relationText}</div>
            ${person.birthDate ? `<div class="person-date">${person.birthDate}</div>` : ''}
        </div>
    `;
}

// Экспорт в JSON
window.exportTreeAsJson = function() {
    if (!window.treeData || !window.treeData.relatives || window.treeData.relatives.length === 0) {
        window.showNotification('Сначала постройте дерево', 'error');
        return;
    }
    
    const exportData = {
        ...window.treeData,
        exportDate: new Date().toISOString(),
        exportFormat: 'JSON',
        version: '1.0',
        user: window.currentUser ? {
            id: window.currentUser.id,
            email: window.currentUser.email
        } : null
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    window.showNotification('✅ Дерево экспортировано в JSON!', 'success');
};

// ================ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ================

// Получение текста отношения
window.getRelationText = function(relation) {
    const relations = {
        'self': 'Я',
        'father': 'Отец',
        'mother': 'Мать',
        'spouse': 'Супруг(а)',
        'partner': 'Партнер',
        'son': 'Сын',
        'daughter': 'Дочь',
        'brother': 'Брат',
        'sister': 'Сестра',
        'grandfather': 'Дедушка',
        'grandmother': 'Бабушка',
        'grandson': 'Внук',
        'granddaughter': 'Внучка',
        'uncle': 'Дядя',
        'aunt': 'Тетя',
        'cousin': 'Двоюродный брат/сестра',
        'nephew': 'Племянник',
        'niece': 'Племянница',
        'great_grandfather': 'Прадедушка',
        'great_grandmother': 'Прабабушка',
        'great_grandson': 'Правнук',
        'great_granddaughter': 'Правнучка',
        'other': 'Родственник'
    };
    return relations[relation] || relation || 'Родственник';
};

// Загрузка из localStorage
function loadFromLocalStorage() {
    try {
        const savedTreeData = localStorage.getItem('family_tree_data');
        if (savedTreeData) {
            window.treeData = JSON.parse(savedTreeData);
            console.log('🌳 Дерево загружено из localStorage');
        }
        
        const savedBuilder = localStorage.getItem('family_tree_builder');
        if (savedBuilder) {
            window.treeBuilder = JSON.parse(savedBuilder);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки из localStorage:', error);
    }
}

// Сохранение в localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('family_tree_data', JSON.stringify(window.treeData));
        localStorage.setItem('family_tree_builder', JSON.stringify(window.treeBuilder));
    } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
    }
}

// Настройка обработчиков для страницы дерева
function setupTreePageHandlers() {
    // Кнопка "Добавить родственника"
    const addPersonBtn = document.getElementById('add-person-to-tree-btn');
    if (addPersonBtn) {
        addPersonBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.showModal('add-person-modal');
        });
    }
    
    // Кнопка "Создать дерево"
    const startBuilderBtn = document.getElementById('start-builder-btn');
    if (startBuilderBtn) {
        startBuilderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.startTreeBuilder('auto');
        });
    }
}

// ================ ЭКСПОРТ ФУНКЦИЙ ================

// Экспортируем все функции в глобальную область видимости
window.startTreeBuilder = window.startTreeBuilder;
window.saveTreeAsImage = window.saveTreeAsImage;
window.printTree = window.printTree;
window.exportTreeAsJson = window.exportTreeAsJson;
window.updateTreeStats = window.updateTreeStats;
window.updateTreeInterface = window.updateTreeInterface;
window.createInteractiveTree = window.createInteractiveTree;
window.getRelationText = window.getRelationText;
window.showPersonDetails = showPersonDetails;
window.removeChild = window.removeChild;

// Сохраняем в localStorage при изменении
window.addEventListener('treeDataChanged', function() {
    saveToLocalStorage();
});

console.log('✅ Tree Engine полностью загружен');