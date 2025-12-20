/**
 * Простая и надежная система модальных окон
 */

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.zIndex = 10000;
        this.initStyles();
    }

    // Инициализация CSS стилей
    initStyles() {
        if (document.getElementById('modal-system-styles')) return;

        const styles = `
            .ms-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .ms-modal-overlay.active {
                opacity: 1;
            }
            
            .ms-modal {
                background: white;
                border-radius: 12px;
                padding: 0;
                min-width: 300px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                transform: translateY(20px);
                transition: transform 0.3s ease;
                display: flex;
                flex-direction: column;
            }
            
            .ms-modal.active {
                transform: translateY(0);
            }
            
            .ms-modal-header {
                padding: 20px 24px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ms-modal-title {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: #212529;
            }
            
            .ms-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6c757d;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .ms-modal-close:hover {
                background: #e9ecef;
                color: #212529;
            }
            
            .ms-modal-body {
                padding: 24px;
                flex: 1;
                overflow-y: auto;
            }
            
            .ms-modal-footer {
                padding: 20px 24px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            
            .ms-modal-button {
                padding: 10px 20px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .ms-modal-button-primary {
                background: #4361ee;
                color: white;
            }
            
            .ms-modal-button-primary:hover {
                background: #3a56d4;
            }
            
            .ms-modal-button-secondary {
                background: #6c757d;
                color: white;
            }
            
            .ms-modal-button-secondary:hover {
                background: #5a6268;
            }
            
            body.ms-modal-open {
                overflow: hidden;
                padding-right: 15px;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = 'modal-system-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Создание модального окна
    createModal(id, options = {}) {
        const {
            title = 'Модальное окно',
            content = '',
            buttons = [],
            width = '500px',
            closeOnOverlay = true,
            showCloseButton = true
        } = options;

        // Удаляем старое окно с таким же ID
        this.closeModal(id);

        // Создаем оверлей
        const overlay = document.createElement('div');
        overlay.className = 'ms-modal-overlay';
        overlay.id = `ms-overlay-${id}`;

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'ms-modal';
        modal.id = `ms-modal-${id}`;
        modal.style.width = width;

        // Заголовок
        const header = document.createElement('div');
        header.className = 'ms-modal-header';

        const titleElement = document.createElement('h3');
        titleElement.className = 'ms-modal-title';
        titleElement.textContent = title;

        header.appendChild(titleElement);

        if (showCloseButton) {
            const closeButton = document.createElement('button');
            closeButton.className = 'ms-modal-close';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = () => this.closeModal(id);
            header.appendChild(closeButton);
        }

        // Тело
        const body = document.createElement('div');
        body.className = 'ms-modal-body';
        
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.appendChild(content);
        } else if (typeof content === 'function') {
            body.appendChild(content());
        }

        // Футер с кнопками
        const footer = document.createElement('div');
        footer.className = 'ms-modal-footer';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `ms-modal-button ms-modal-button-${btn.type || 'secondary'}`;
            button.textContent = btn.text;
            button.onclick = (e) => {
                if (btn.onClick) btn.onClick(e);
                if (btn.closeOnClick !== false) this.closeModal(id);
            };
            footer.appendChild(button);
        });

        // Собираем всё вместе
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);

        // Добавляем в DOM
        document.body.appendChild(overlay);

        // Блокируем скролл body
        document.body.classList.add('ms-modal-open');

        // Закрытие по клику на оверлей
        if (closeOnOverlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.closeModal(id);
                }
            };
        }

        // Закрытие по ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(id);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Сохраняем обработчик
        this.modals.set(id, { overlay, escHandler });

        // Анимация появления
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);

        return overlay;
    }

    // Закрытие модального окна
    closeModal(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { overlay, escHandler } = modalData;

        // Удаляем обработчик ESC
        document.removeEventListener('keydown', escHandler);

        // Анимация исчезновения
        overlay.querySelector('.ms-modal').classList.remove('active');
        overlay.classList.remove('active');

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.modals.delete(id);

            // Разблокируем скролл, если нет других модалок
            if (this.modals.size === 0) {
                document.body.classList.remove('ms-modal-open');
            }
        }, 300);
    }

    // Показать модальное окно
    showModal(id) {
        const modalData = this.modals.get(id);
        if (modalData) {
            modalData.overlay.style.display = 'flex';
        }
    }

    // Скрыть модальное окно
    hideModal(id) {
        const modalData = this.modals.get(id);
        if (modalData) {
            modalData.overlay.style.display = 'none';
        }
    }

    // Проверить, открыто ли модальное окно
    isOpen(id) {
        return this.modals.has(id);
    }

    // Закрыть все модальные окна
    closeAll() {
        this.modals.forEach((_, id) => this.closeModal(id));
    }
}

// Глобальный экземпляр
window.ModalSystem = new ModalSystem();

// Утилиты для быстрого использования
window.Modal = {
    // Простое модальное окно
    alert: function(title, message) {
        return window.ModalSystem.createModal('alert_' + Date.now(), {
            title,
            content: `<p>${message}</p>`,
            buttons: [{
                text: 'OK',
                type: 'primary',
                closeOnClick: true
            }]
        });
    },

    // Подтверждение
    confirm: function(title, message, onConfirm) {
        return window.ModalSystem.createModal('confirm_' + Date.now(), {
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    closeOnClick: true
                },
                {
                    text: 'Подтвердить',
                    type: 'primary',
                    onClick: onConfirm
                }
            ]
        });
    },

    // Промпт (ввод текста)
    prompt: function(title, placeholder, onConfirm) {
        const inputId = 'modal-input-' + Date.now();
        const content = `
            <p>${title}</p>
            <input type="text" 
                   id="${inputId}" 
                   placeholder="${placeholder || 'Введите значение'}"
                   style="width: 100%; padding: 10px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">
        `;

        return window.ModalSystem.createModal('prompt_' + Date.now(), {
            title,
            content,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary',
                    closeOnClick: true
                },
                {
                    text: 'OK',
                    type: 'primary',
                    onClick: () => {
                        const input = document.getElementById(inputId);
                        if (onConfirm) onConfirm(input.value);
                    }
                }
            ]
        });
    }
};