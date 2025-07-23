/**
 * Context Menu component for file operations
 */
export class ContextMenu {
    constructor() {
        this.menu = document.getElementById('contextMenu');
        this.currentFile = null;
        this.eventListeners = {};
        
        this.init();
    }

    /**
     * Initialize the context menu
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Emit event
     */
    emit(event, ...args) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(...args));
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Menu item clicks
        this.menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-item');
            if (!item) return;
            
            const action = item.dataset.action;
            if (action && this.currentFile) {
                this.emit('action', action, this.currentFile);
            }
            
            this.hide();
        });
        
        // Hide menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target)) {
                this.hide();
            }
        });
        
        // Hide menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
        
        // Prevent context menu from being cut off
        this.menu.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Show context menu
     */
    show(event, file) {
        event.preventDefault();
        event.stopPropagation();
        
        this.currentFile = file;
        
        // Position the menu
        this.positionMenu(event.clientX, event.clientY);
        
        // Show the menu
        this.menu.style.display = 'block';
        
        // Update menu items based on file type
        this.updateMenuItems(file);
        
        // Focus the menu for keyboard navigation
        this.menu.focus();
    }

    /**
     * Hide context menu
     */
    hide() {
        this.menu.style.display = 'none';
        this.currentFile = null;
    }

    /**
     * Position menu at coordinates
     */
    positionMenu(x, y) {
        const menuRect = this.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate position to prevent menu from going off-screen
        let menuX = x;
        let menuY = y;
        
        // Adjust horizontal position
        if (x + menuRect.width > viewportWidth) {
            menuX = viewportWidth - menuRect.width - 10;
        }
        
        // Adjust vertical position
        if (y + menuRect.height > viewportHeight) {
            menuY = viewportHeight - menuRect.height - 10;
        }
        
        // Ensure menu is not positioned off the left or top edge
        menuX = Math.max(10, menuX);
        menuY = Math.max(10, menuY);
        
        this.menu.style.left = `${menuX}px`;
        this.menu.style.top = `${menuY}px`;
    }

    /**
     * Update menu items based on file
     */
    updateMenuItems(file) {
        const items = this.menu.querySelectorAll('.context-item');
        
        items.forEach(item => {
            const action = item.dataset.action;
            
            // Show/hide items based on context
            switch (action) {
                case 'rename':
                    item.style.display = 'flex';
                    break;
                case 'delete':
                    item.style.display = 'flex';
                    break;
                case 'copy-path':
                    item.style.display = 'flex';
                    break;
                default:
                    item.style.display = 'flex';
            }
        });
        
        // Update item text based on file type
        this.updateItemText(file);
    }

    /**
     * Update menu item text
     */
    updateItemText(file) {
        const deleteItem = this.menu.querySelector('[data-action="delete"]');
        if (deleteItem) {
            const icon = deleteItem.querySelector('i');
            const text = file.type === 'folder' ? 'Delete Folder' : 'Delete File';
            deleteItem.innerHTML = `${icon.outerHTML} ${text}`;
        }
        
        const renameItem = this.menu.querySelector('[data-action="rename"]');
        if (renameItem) {
            const icon = renameItem.querySelector('i');
            const text = file.type === 'folder' ? 'Rename Folder' : 'Rename File';
            renameItem.innerHTML = `${icon.outerHTML} ${text}`;
        }
    }

    /**
     * Add custom menu item
     */
    addMenuItem(action, text, icon, callback) {
        const item = document.createElement('div');
        item.className = 'context-item';
        item.dataset.action = action;
        item.innerHTML = `<i class="${icon}"></i> ${text}`;
        
        this.menu.appendChild(item);
        
        // Add event listener for custom action
        this.on('action', (actionType, file) => {
            if (actionType === action) {
                callback(file);
            }
        });
    }

    /**
     * Remove menu item
     */
    removeMenuItem(action) {
        const item = this.menu.querySelector(`[data-action="${action}"]`);
        if (item) {
            item.remove();
        }
    }

    /**
     * Add separator
     */
    addSeparator() {
        const separator = document.createElement('div');
        separator.className = 'context-separator';
        this.menu.appendChild(separator);
    }

    /**
     * Clear all custom items
     */
    clearCustomItems() {
        const customItems = this.menu.querySelectorAll('.context-item:not([data-default])');
        customItems.forEach(item => item.remove());
        
        const customSeparators = this.menu.querySelectorAll('.context-separator:not([data-default])');
        customSeparators.forEach(separator => separator.remove());
    }

    /**
     * Enable/disable menu item
     */
    setItemEnabled(action, enabled) {
        const item = this.menu.querySelector(`[data-action="${action}"]`);
        if (item) {
            if (enabled) {
                item.classList.remove('disabled');
                item.style.pointerEvents = 'auto';
                item.style.opacity = '1';
            } else {
                item.classList.add('disabled');
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.5';
            }
        }
    }

    /**
     * Check if menu is visible
     */
    isVisible() {
        return this.menu.style.display === 'block';
    }

    /**
     * Get current file
     */
    getCurrentFile() {
        return this.currentFile;
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        if (!this.isVisible()) return;
        
        const items = Array.from(this.menu.querySelectorAll('.context-item:not(.disabled)'));
        const currentFocused = this.menu.querySelector('.context-item.focused');
        let currentIndex = currentFocused ? items.indexOf(currentFocused) : -1;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                currentIndex = (currentIndex + 1) % items.length;
                this.focusItem(items[currentIndex]);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                this.focusItem(items[currentIndex]);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (currentFocused) {
                    currentFocused.click();
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hide();
                break;
        }
    }

    /**
     * Focus menu item
     */
    focusItem(item) {
        // Remove previous focus
        const previousFocused = this.menu.querySelector('.context-item.focused');
        if (previousFocused) {
            previousFocused.classList.remove('focused');
        }
        
        // Add focus to new item
        if (item) {
            item.classList.add('focused');
        }
    }

    /**
     * Set menu theme
     */
    setTheme(theme) {
        this.menu.dataset.theme = theme;
    }

    /**
     * Get menu position
     */
    getPosition() {
        const rect = this.menu.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Set menu size
     */
    setSize(width, height) {
        if (width) {
            this.menu.style.width = `${width}px`;
        }
        if (height) {
            this.menu.style.height = `${height}px`;
        }
    }
}

// Add keyboard navigation styles
const style = document.createElement('style');
style.textContent = `
    .context-item.focused {
        background-color: var(--accent-primary) !important;
        color: white !important;
    }
    
    .context-item.disabled {
        opacity: 0.5;
        pointer-events: none;
    }
    
    .context-menu[data-theme="light"] {
        background-color: #f8f8f8;
        border-color: #e0e0e0;
        color: #333;
    }
    
    .context-menu[data-theme="light"] .context-item:hover {
        background-color: #e8e8e8;
    }
`;
document.head.appendChild(style);
