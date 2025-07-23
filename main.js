// Import modules
import { FileExplorer } from './fileExplorer.js';
import { Editor } from './editor.js';
import { FileManager } from './fileManager.js';
import { ContextMenu } from './contextMenu.js';

/**
 * Main application class that orchestrates all components
 */
class CodeEditor {
    constructor() {
        this.fileExplorer = null;
        this.editor = null;
        this.fileManager = null;
        this.contextMenu = null;
        this.isResizing = false;
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize Monaco Editor first
            await this.initMonaco();
            
            // Initialize components
            this.initComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup resize functionality
            this.setupResize();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            console.log('Code Editor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Code Editor:', error);
            this.showError('Failed to initialize the editor. Please refresh the page.');
        }
    }

    /**
     * Initialize Monaco Editor
     */
    async initMonaco() {
        return new Promise((resolve, reject) => {
            require.config({ 
                paths: { 
                    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
                }
            });
            
            require(['vs/editor/editor.main'], () => {
                // Configure Monaco themes
                monaco.editor.defineTheme('vs-code-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'comment', foreground: '6A9955' },
                        { token: 'keyword', foreground: '569CD6' },
                        { token: 'string', foreground: 'CE9178' },
                        { token: 'number', foreground: 'B5CEA8' },
                        { token: 'operator', foreground: 'D4D4D4' },
                        { token: 'tag', foreground: '569CD6' },
                        { token: 'attribute.name', foreground: '92C5F8' },
                        { token: 'attribute.value', foreground: 'CE9178' },
                    ],
                    colors: {
                        'editor.background': '#1e1e1e',
                        'editor.foreground': '#cccccc',
                        'editor.lineHighlightBackground': '#ffffff0a',
                        'editor.selectionBackground': '#007acc',
                        'editorLineNumber.foreground': '#808080',
                    }
                });
                
                resolve();
            }, reject);
        });
    }

    /**
     * Initialize all components
     */
    initComponents() {
        this.fileManager = new FileManager();
        this.fileExplorer = new FileExplorer(this.fileManager);
        this.editor = new Editor();
        this.contextMenu = new ContextMenu();
        
        // Setup component communication
        this.setupComponentCommunication();
    }

    /**
     * Setup communication between components
     */
    setupComponentCommunication() {
        // File explorer events
        this.fileExplorer.on('fileSelect', (file) => {
            this.editor.openFile(file);
            this.updateStatusBar(file);
        });

        this.fileExplorer.on('fileCreate', (file) => {
            this.editor.openFile(file);
        });

        this.fileExplorer.on('contextMenu', (event, file) => {
            this.contextMenu.show(event, file);
        });

        // Editor events
        this.editor.on('fileChange', (file) => {
            this.fileExplorer.markFileAsModified(file);
        });

        this.editor.on('tabClose', (file) => {
            this.fileExplorer.unmarkFileAsModified(file);
        });

        this.editor.on('cursorChange', (position) => {
            this.updateCursorPosition(position);
        });

        // Context menu events
        this.contextMenu.on('action', (action, file) => {
            this.handleContextAction(action, file);
        });

        // File manager events
        this.fileManager.on('fileAdded', (file) => {
            this.fileExplorer.refresh();
        });

        this.fileManager.on('fileRemoved', (file) => {
            this.editor.closeFile(file);
            this.fileExplorer.refresh();
        });
    }

    /**
     * Setup main event listeners
     */
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Open file buttons
        document.getElementById('openFileBtn').addEventListener('click', () => {
            fileInput.click();
        });
        
        document.getElementById('welcomeOpenFile').addEventListener('click', () => {
            fileInput.click();
        });

        // New file/folder buttons
        document.getElementById('newFileBtn').addEventListener('click', () => {
            this.createNewFile();
        });
        
        document.getElementById('welcomeNewFile').addEventListener('click', () => {
            this.createNewFile();
        });
        
        document.getElementById('newFolderBtn').addEventListener('click', () => {
            this.createNewFolder();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.fileExplorer.refresh();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Prevent default drag and drop
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });

        // Hide context menu on click
        document.addEventListener('click', () => {
            this.contextMenu.hide();
        });
    }

    /**
     * Setup resizable sidebar
     */
    setupResize() {
        const resizeHandle = document.getElementById('resizeHandle');
        const sidebar = document.getElementById('sidebar');
        
        resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            resizeHandle.classList.add('dragging');
            
            const startX = e.clientX;
            const startWidth = sidebar.offsetWidth;
            
            const handleMouseMove = (e) => {
                if (!this.isResizing) return;
                
                const newWidth = startWidth + (e.clientX - startX);
                const minWidth = 200;
                const maxWidth = 400;
                
                if (newWidth >= minWidth && newWidth <= maxWidth) {
                    sidebar.style.width = `${newWidth}px`;
                    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
                }
            };
            
            const handleMouseUp = () => {
                this.isResizing = false;
                resizeHandle.classList.remove('dragging');
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                this.editor.resize();
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + O - Open file
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                document.getElementById('fileInput').click();
            }
            
            // Ctrl/Cmd + N - New file
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewFile();
            }
            
            // Ctrl/Cmd + S - Save file
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.editor.saveCurrentFile();
            }
            
            // Ctrl/Cmd + W - Close tab
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                this.editor.closeCurrentTab();
            }
            
            // Ctrl/Cmd + Shift + P - Command palette (placeholder)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.showCommandPalette();
            }
            
            // F1 - Command palette (placeholder)
            if (e.key === 'F1') {
                e.preventDefault();
                this.showCommandPalette();
            }
        });
    }

    /**
     * Handle file selection from input
     */
    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            try {
                const content = await this.readFileContent(file);
                const managedFile = this.fileManager.addFile(file.name, content);
                this.editor.openFile(managedFile);
            } catch (error) {
                console.error('Error reading file:', error);
                this.showError(`Failed to read file: ${file.name}`);
            }
        }
        
        // Clear input
        event.target.value = '';
    }

    /**
     * Handle file drop
     */
    async handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        
        for (const file of files) {
            try {
                const content = await this.readFileContent(file);
                const managedFile = this.fileManager.addFile(file.name, content);
                this.editor.openFile(managedFile);
            } catch (error) {
                console.error('Error reading dropped file:', error);
                this.showError(`Failed to read file: ${file.name}`);
            }
        }
    }

    /**
     * Read file content as text
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Create new file
     */
    createNewFile() {
        const name = prompt('Enter file name (with extension):');
        if (!name) return;
        
        if (!this.isValidFileName(name)) {
            this.showError('Invalid file name. Please use .html, .css, or .js extension.');
            return;
        }
        
        const file = this.fileManager.createFile(name);
        this.editor.openFile(file);
    }

    /**
     * Create new folder
     */
    createNewFolder() {
        const name = prompt('Enter folder name:');
        if (!name) return;
        
        if (!this.isValidFolderName(name)) {
            this.showError('Invalid folder name.');
            return;
        }
        
        this.fileManager.createFolder(name);
    }

    /**
     * Validate file name
     */
    isValidFileName(name) {
        const validExtensions = ['.html', '.css', '.js', '.txt', '.json', '.md'];
        return validExtensions.some(ext => name.toLowerCase().endsWith(ext));
    }

    /**
     * Validate folder name
     */
    isValidFolderName(name) {
        return /^[a-zA-Z0-9_-]+$/.test(name);
    }

    /**
     * Handle context menu actions
     */
    handleContextAction(action, file) {
        switch (action) {
            case 'rename':
                this.renameFile(file);
                break;
            case 'delete':
                this.deleteFile(file);
                break;
            case 'copy-path':
                this.copyFilePath(file);
                break;
        }
    }

    /**
     * Rename file
     */
    renameFile(file) {
        const newName = prompt('Enter new name:', file.name);
        if (!newName || newName === file.name) return;
        
        if (!this.isValidFileName(newName)) {
            this.showError('Invalid file name.');
            return;
        }
        
        this.fileManager.renameFile(file, newName);
        this.editor.updateFileTab(file);
    }

    /**
     * Delete file
     */
    deleteFile(file) {
        if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
        
        this.fileManager.removeFile(file);
    }

    /**
     * Copy file path to clipboard
     */
    async copyFilePath(file) {
        try {
            await navigator.clipboard.writeText(file.path || file.name);
            this.showSuccess('Path copied to clipboard');
        } catch (error) {
            console.error('Failed to copy path:', error);
            this.showError('Failed to copy path');
        }
    }

    /**
     * Update status bar
     */
    updateStatusBar(file) {
        const language = this.getFileLanguage(file.name);
        document.getElementById('statusLanguage').textContent = language;
    }

    /**
     * Update cursor position in status bar
     */
    updateCursorPosition(position) {
        const statusLine = document.getElementById('statusLine');
        statusLine.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    }

    /**
     * Get file language from extension
     */
    getFileLanguage(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const languages = {
            'html': 'HTML',
            'css': 'CSS',
            'js': 'JavaScript',
            'json': 'JSON',
            'md': 'Markdown',
            'txt': 'Plain Text'
        };
        return languages[ext] || 'Plain Text';
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            // Mobile/desktop transition
            this.adjustLayoutForScreenSize();
        }
        
        // Resize editor
        this.editor.resize();
    }

    /**
     * Adjust layout for screen size
     */
    adjustLayoutForScreenSize() {
        const sidebar = document.getElementById('sidebar');
        
        if (this.isMobile) {
            sidebar.classList.remove('open');
        }
    }

    /**
     * Show command palette (placeholder)
     */
    showCommandPalette() {
        // Placeholder for future command palette implementation
        this.showInfo('Command palette coming soon!');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '13px',
            zIndex: '10000',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            error: '#f14c4c',
            success: '#89d185',
            info: '#007acc'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeEditor();
});

export { CodeEditor };
