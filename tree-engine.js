// tree-engine.js - Упрощенный рабочий движок дерева

console.log('🌳 Tree Engine загружается...');

// Проверяем зависимости
if (typeof window.showNotification === 'undefined') {
    console.warn('showNotification не определена, создаем заглушку');
    window.showNotification = function(message, type) {
        console.log(`[${type}] ${message}`);
        alert(message);
    };
}

if (typeof window.showLoader === 'undefined') {
    console.warn('showLoader не определена, создаем заглушку');
    window.showLoader = function(text) {
        console.log(`[LOADER] ${text}`);
    };
    window.hideLoader = function() {
        console.log('[LOADER] Скрыт');
    };
}

// Экспортируем функции
window.autoBuildTree = function() {
    if (typeof buildFamilyTree !== 'undefined') {
        buildFamilyTree();
    } else {
        console.error('buildFamilyTree не определена');
        window.showNotification('Функция построения дерева не загружена', 'error');
    }
};

window.saveTreeAsImage = function() {
    if (typeof saveTreeAsImage !== 'undefined') {
        saveTreeAsImage();
    } else {
        console.error('saveTreeAsImage не определена');
        window.showNotification('Функция сохранения изображения не загружена', 'error');
    }
};

window.printTree = function() {
    if (typeof printTree !== 'undefined') {
        printTree();
    } else {
        console.error('printTree не определена');
        window.showNotification('Функция печати не загружена', 'error');
    }
};

window.showPersonInfo = function(personId) {
    window.showNotification('Информация о человеке будет отображена здесь', 'info');
};

console.log('✅ Tree Engine загружен (упрощенная рабочая версия)');