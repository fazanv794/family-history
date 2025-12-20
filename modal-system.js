/**
 * ModalSystem - Простая и надежная система модальных окон
 */

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.zIndex = 10000;
        this.initStyles();
        console.log('✅ ModalSystem инициализирован');
    }

    initStyles() {
        if (document.getElementById('modal-system-styles')) return;

        const styles = `
            /* Основные стили модальных окон */
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
                z-index: ${this.zIndex};
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .ms-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .ms-modal {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow: hidden;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            
            .ms-modal.active {
                transform: translateY(0);
            }
            
            .ms-modal-header {
                padding: 16px 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
                position: relative;
            }
            
            .ms-modal-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .ms-modal-close {
                position: absolute;
                top: 12px;
                right: 12px;
                background: none;
                border: none;
                font-size: 24px;
                line-height: 1;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .ms-modal-close:hover {
                background: #e9ecef;
                color: #333;
            }
            
            .ms-modal-body {
                padding: 20px;
                max-height: calc(90vh - 130px);
                overflow-y: auto;
            }
            
            .ms-modal-footer {
                padding: 16px 20px;
                background: #f8f9fa;
                border-top: 1px solid #dee2e6;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .ms-btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
                background: white;
                color: #333;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .ms-btn:hover {
                background: #f8f9fa;
            }
            
            .ms-btn-primary {
                background: #007bff;
                border-color: #007bff;
                color: white;
            }
            
            .ms-btn-primary:hover {
                background: #0056b3;
                border-color: #0056b3;
            }
            
            .ms-btn-secondary {
                background: #6c757d;
                border-color: #6c757d;
                color: white;
            }
            
            .ms-btn-secondary:hover {
                background: #545b62;
                border-color: #4e555b;
            }
            
            .ms-btn-success {
                background: #28a745;
                border-color: #28a745;
                color: white;
            }
            
            .ms-btn-success:hover {
                background: #1e7e34;
                border-color: #1c7430;
            }
            
            /* Стили для форм */
            .ms-form-group {
                margin-bottom: 16px;
            }
            
            .ms-form-label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #333;
                font-size: 14px;
            }
            
            .ms-form-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .ms-form-control:focus {
                outline: none;
                border-color: #80bdff;
                box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
            }
            
            .ms-form-textarea {
                min-height: 80px;
                resize: vertical;
            }
            
            .ms-form-row {
                display: flex;
                gap: 12px;
            }
            
            .ms-form-row .ms-form-group {
                flex: 1;
            }
            
            /* Сообщения и уведомления */
            .ms-alert {
                padding: 12px 16px;
                border-radius: 4px;
                margin-bottom: 16px;
                font-size: 14px;
            }
            
            .ms-alert-info {
                background-color: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
            }
            
            .ms-alert-success {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            
            .ms-alert-warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
            }
            
            /* Список родственников */
            .ms-relative-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                margin-bottom: 8px;
                background: white;
            }
            
            .ms-relative-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #007bff;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 12px;
                flex-shrink: 0;
            }
            
            .ms-relative-info {
                flex: 1;
            }
            
            .ms-relative-name {
                font-weight: 600;
                margin: 0 0 4px 0;
                font-size: 14px;
            }
            
            .ms-relative-details {
                font-size: 12px;
                color: #6c757d;
                margin: 0;
            }
            
            .ms-relative-actions {
                display: flex;
                gap: 6px;
            }
            
            .ms-action-btn {
                padding: 4px 8px;
                border: none;
                border-radius: 3px;
                font-size: 12px;
                cursor: pointer;
            }
            
            .ms-action-btn-edit {
                background: #007bff;
                color: white;
            }
            
            .ms-action-btn-delete {
                background: #dc3545;
                color: white;
            }
            
            /* Прогресс бар */
            .ms-progress {
                height: 20px;
                background: #e9ecef;
                border-radius: 10px;
                overflow: hidden;
                margin: 20px 0;
            }
            
            .ms-progress-bar {
                height: 100%;
                background: #007bff;
                transition: width 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: 600;
            }
            
            body.ms-modal-open {
                overflow: hidden;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = 'modal-system-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    createModal(id, options = {}) {
        // Закрываем старое окно с таким же ID
        this.closeModal(id);

        const defaultOptions = {
            title: 'Модальное окно',
            content: '',
            buttons: [],
            width: '500px',
            closeOnOverlay: true,
            showCloseButton: true,
            onClose: null
        };

        const config = { ...defaultOptions, ...options };

        // Создаем overlay
        const overlay = document.createElement('div');
        overlay.className = 'ms-modal-overlay';
        overlay.id = `ms-overlay-${id}`;

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'ms-modal';
        modal.id = `ms-modal-${id}`;
        modal.style.width = config.width;

        // Заголовок
        const header = document.createElement('div');
        header.className = 'ms-modal-header';
        header.innerHTML = `
            <h3 class="ms-modal-title">${config.title}</h3>
            ${config.showCloseButton ? '<button class="ms-modal-close">&times;</button>' : ''}
        `;

        // Тело
        const body = document.createElement('div');
        body.className = 'ms-modal-body';
        
        const contentDiv = document.createElement('div');
        if (typeof config.content === 'string') {
            contentDiv.innerHTML = config.content;
        } else if (config.content instanceof HTMLElement) {
            contentDiv.appendChild(config.content);
        }
        
        body.appendChild(contentDiv);

        // Футер с кнопками
        let footer = null;
        if (config.buttons && config.buttons.length > 0) {
            footer = document.createElement('div');
            footer.className = 'ms-modal-footer';
            
            config.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `ms-btn ms-btn-${btn.type || 'secondary'}`;
                button.textContent = btn.text;
                button.onclick = (e) => {
                    if (btn.onClick) {
                        const result = btn.onClick(e);
                        if (result !== false && btn.closeOnClick !== false) {
                            this.closeModal(id);
                        }
                    } else if (btn.closeOnClick !== false) {
                        this.closeModal(id);
                    }
                };
                footer.appendChild(button);
            });
        }

        // Собираем всё вместе
        if (footer) {
            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
        } else {
            modal.appendChild(header);
            modal.appendChild(body);
        }
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        document.body.classList.add('ms-modal-open');

        // Обработчики событий
        if (config.showCloseButton) {
            overlay.querySelector('.ms-modal-close').onclick = () => {
                this.closeModal(id);
                if (config.onClose) config.onClose();
            };
        }

        if (config.closeOnOverlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.closeModal(id);
                    if (config.onClose) config.onClose();
                }
            };
        }

        // Закрытие по ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(id);
                if (config.onClose) config.onClose();
            }
        };
        document.addEventListener('keydown', escHandler);

        // Сохраняем данные
        this.modals.set(id, {
            overlay,
            escHandler,
            config
        });

        // Анимация появления
        setTimeout(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        }, 10);

        return overlay;
    }

    closeModal(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { overlay, escHandler } = modalData;

        // Удаляем обработчик ESC
        document.removeEventListener('keydown', escHandler);

        // Анимация закрытия
        const modal = overlay.querySelector('.ms-modal');
        modal.classList.remove('active');
        overlay.classList.remove('active');

        // Удаляем через время
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.modals.delete(id);

            // Если нет открытых модалок, разблокируем скролл
            if (this.modals.size === 0) {
                document.body.classList.remove('ms-modal-open');
            }
        }, 300);
    }

    closeAll() {
        this.modals.forEach((_, id) => this.closeModal(id));
    }

    updateContent(id, content) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { overlay } = modalData;
        const contentDiv = overlay.querySelector('.ms-modal-body > div');
        if (contentDiv) {
            if (typeof content === 'string') {
                contentDiv.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                contentDiv.innerHTML = '';
                contentDiv.appendChild(content);
            }
        }
    }
}

// Создаем глобальный экземпляр
window.ModalSystem = new ModalSystem();

// Простые утилиты для быстрого доступа
window.Modal = {
    alert: function(title, message) {
        return window.ModalSystem.createModal('alert_' + Date.now(), {
            title,
            content: `<div class="ms-alert ms-alert-info">${message}</div>`,
            buttons: [{
                text: 'OK',
                type: 'primary'
            }]
        });
    },

    confirm: function(title, message, onConfirm) {
        return window.ModalSystem.createModal('confirm_' + Date.now(), {
            title,
            content: `<div class="ms-alert ms-alert-warning">${message}</div>`,
            buttons: [
                {
                    text: 'Отмена',
                    type: 'secondary'
                },
                {
                    text: 'Подтвердить',
                    type: 'primary',
                    onClick: onConfirm
                }
            ]
        });
    }
};

console.log('✅ ModalSystem готов к использованию');