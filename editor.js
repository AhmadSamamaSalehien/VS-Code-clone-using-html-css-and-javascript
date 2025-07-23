/**
 * Editor component for managing Monaco Editor and tabs
 */
export class Editor {
    constructor() {
        this.monacoEditor = null;
        this.container = document.getElementById('monacoEditor');
        this.welcomeContainer = document.getElementById('editorWelcome');
        this.tabsContainer = document.getElementById('tabs');
        this.openTabs = new Map(); // fileId -> tab data
        this.activeTab = null;
        this.eventListeners = {};
        
        this.init();
    }

    /**
     * Initialize the editor
     */
    init() {
        this.createMonacoEditor();
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
     * Create Monaco Editor instance
     */
    createMonacoEditor() {
        this.monacoEditor = monaco.editor.create(this.container, {
            theme: 'vs-code-dark',
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            renderIndentGuides: true,
            folding: true,
            bracketMatching: 'always',
            autoIndent: 'full',
            formatOnType: true,
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            parameterHints: { enabled: true },
            quickSuggestions: true,
            contextmenu: true,
            mouseWheelZoom: true,
            rulers: [80, 120],
            renderLineHighlight: 'line',
            selectionHighlight: true,
            occurrencesHighlight: true,
            roundedSelection: false,
            selectOnLineNumbers: true,
            glyphMargin: true,
            fixedOverflowWidgets: true
        });
        
        // Initially hide the editor
        this.container.style.display = 'none';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Monaco editor events
        this.monacoEditor.onDidChangeModelContent(() => {
            if (this.activeTab) {
                this.markTabAsModified(this.activeTab);
                this.emit('fileChange', this.activeTab.file);
            }
        });
        
        this.monacoEditor.onDidChangeCursorPosition((e) => {
            this.emit('cursorChange', e.position);
        });
        
        this.monacoEditor.onDidFocusEditorText(() => {
            if (this.activeTab) {
                this.updateStatusBar(this.activeTab.file);
            }
        });
        
        // Tab container events
        this.tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;
            
            const fileId = tab.dataset.fileId;
            
            if (e.target.classList.contains('tab-close')) {
                e.stopPropagation();
                this.closeTab(fileId);
            } else {
                this.switchToTab(fileId);
            }
        });
        
        this.tabsContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.tabsContainer.scrollLeft += e.deltaY;
        });
    }

    /**
     * Open file in editor
     */
    openFile(file) {
        // Check if file is already open
        if (this.openTabs.has(file.id)) {
            this.switchToTab(file.id);
            return;
        }
        
        // Create new tab
        const tab = {
            id: file.id,
            file: file,
            element: this.createTabElement(file),
            isModified: false,
            model: null
        };
        
        // Create Monaco model for the file
        const language = this.getLanguageFromExtension(file.name);
        tab.model = monaco.editor.createModel(file.content || '', language);
        
        // Add tab to container
        this.tabsContainer.appendChild(tab.element);
        this.openTabs.set(file.id, tab);
        
        // Switch to the new tab
        this.switchToTab(file.id);
        
        // Hide welcome screen and show editor
        this.showEditor();
    }

    /**
     * Create tab element
     */
    createTabElement(file) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.fileId = file.id;
        
        const icon = this.getFileIcon(file.name);
        
        tab.innerHTML = `
            <i class="${icon}"></i>
            <span class="tab-label">${file.name}</span>
            <i class="fas fa-times tab-close"></i>
        `;
        
        return tab;
    }

    /**
     * Get file icon based on extension
     */
    getFileIcon(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const icons = {
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'js': 'fab fa-js-square',
            'json': 'fas fa-file-code',
            'md': 'fab fa-markdown',
            'txt': 'fas fa-file-alt'
        };
        return icons[ext] || 'fas fa-file';
    }

    /**
     * Get Monaco language from file extension
     */
    getLanguageFromExtension(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const languages = {
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'md': 'markdown',
            'txt': 'plaintext'
        };
        return languages[ext] || 'plaintext';
    }

    /**
     * Switch to tab
     */
    switchToTab(fileId) {
        const tab = this.openTabs.get(fileId);
        if (!tab) return;
        
        // Update active tab styling
        const previousActive = this.tabsContainer.querySelector('.tab.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }
        
        tab.element.classList.add('active');
        
        // Switch Monaco model
        this.monacoEditor.setModel(tab.model);
        
        // Update active tab reference
        this.activeTab = tab;
        
        // Focus editor
        this.monacoEditor.focus();
        
        // Update status bar
        this.updateStatusBar(tab.file);
    }

    /**
     * Close tab
     */
    closeTab(fileId) {
        const tab = this.openTabs.get(fileId);
        if (!tab) return;
        
        // Check if file is modified
        if (tab.isModified) {
            const shouldSave = confirm(`File "${tab.file.name}" has unsaved changes. Save before closing?`);
            if (shouldSave) {
                this.saveFile(tab.file);
            }
        }
        
        // Remove tab element
        tab.element.remove();
        
        // Dispose Monaco model
        if (tab.model) {
            tab.model.dispose();
        }
        
        // Remove from open tabs
        this.openTabs.delete(fileId);
        
        // Emit event
        this.emit('tabClose', tab.file);
        
        // Switch to another tab or show welcome screen
        if (this.activeTab && this.activeTab.id === fileId) {
            this.activeTab = null;
            
            // Find another tab to switch to
            const remainingTabs = Array.from(this.openTabs.values());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0].id);
            } else {
                this.showWelcome();
            }
        }
    }

    /**
     * Close current tab
     */
    closeCurrentTab() {
        if (this.activeTab) {
            this.closeTab(this.activeTab.id);
        }
    }

    /**
     * Close file
     */
    closeFile(file) {
        this.closeTab(file.id);
    }

    /**
     * Mark tab as modified
     */
    markTabAsModified(tab) {
        if (tab.isModified) return;
        
        tab.isModified = true;
        const label = tab.element.querySelector('.tab-label');
        if (label) {
            label.textContent = `${tab.file.name} ●`;
        }
    }

    /**
     * Mark tab as saved
     */
    markTabAsSaved(tab) {
        tab.isModified = false;
        const label = tab.element.querySelector('.tab-label');
        if (label) {
            label.textContent = tab.file.name;
        }
    }

    /**
     * Save current file
     */
    saveCurrentFile() {
        if (!this.activeTab) return;
        
        this.saveFile(this.activeTab.file);
    }

    /**
     * Save file
     */
    saveFile(file) {
        const tab = this.openTabs.get(file.id);
        if (!tab) return;
        
        // Get content from Monaco editor
        const content = tab.model.getValue();
        
        // Update file content
        file.content = content;
        
        // Mark as saved
        this.markTabAsSaved(tab);
        
        // Download file
        this.downloadFile(file);
    }

    /**
     * Download file
     */
    downloadFile(file) {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Update file tab
     */
    updateFileTab(file) {
        const tab = this.openTabs.get(file.id);
        if (!tab) return;
        
        // Update tab label
        const label = tab.element.querySelector('.tab-label');
        if (label) {
            const modifiedIndicator = tab.isModified ? ' ●' : '';
            label.textContent = `${file.name}${modifiedIndicator}`;
        }
        
        // Update tab icon
        const icon = tab.element.querySelector('i:first-child');
        if (icon) {
            icon.className = this.getFileIcon(file.name);
        }
    }

    /**
     * Show editor
     */
    showEditor() {
        this.welcomeContainer.style.display = 'none';
        this.container.style.display = 'block';
        this.monacoEditor.layout();
    }

    /**
     * Show welcome screen
     */
    showWelcome() {
        this.container.style.display = 'none';
        this.welcomeContainer.style.display = 'flex';
        
        // Clear Monaco editor model
        this.monacoEditor.setModel(null);
    }

    /**
     * Update status bar
     */
    updateStatusBar(file) {
        const language = this.getLanguageDisplayName(file.name);
        const statusLanguage = document.getElementById('statusLanguage');
        if (statusLanguage) {
            statusLanguage.textContent = language;
        }
    }

    /**
     * Get language display name
     */
    getLanguageDisplayName(fileName) {
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
     * Resize editor
     */
    resize() {
        if (this.monacoEditor) {
            this.monacoEditor.layout();
        }
    }

    /**
     * Get current file
     */
    getCurrentFile() {
        return this.activeTab ? this.activeTab.file : null;
    }

    /**
     * Get all open files
     */
    getOpenFiles() {
        return Array.from(this.openTabs.values()).map(tab => tab.file);
    }

    /**
     * Check if file is open
     */
    isFileOpen(file) {
        return this.openTabs.has(file.id);
    }

    /**
     * Focus editor
     */
    focus() {
        if (this.monacoEditor) {
            this.monacoEditor.focus();
        }
    }

    /**
     * Insert text at cursor
     */
    insertText(text) {
        if (!this.monacoEditor) return;
        
        const selection = this.monacoEditor.getSelection();
        const range = new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
        );
        
        this.monacoEditor.executeEdits('insert-text', [{
            range: range,
            text: text
        }]);
    }

    /**
     * Get selected text
     */
    getSelectedText() {
        if (!this.monacoEditor) return '';
        
        const selection = this.monacoEditor.getSelection();
        return this.monacoEditor.getModel().getValueInRange(selection);
    }

    /**
     * Format document
     */
    async formatDocument() {
        if (!this.monacoEditor) return;
        
        await this.monacoEditor.trigger('editor', 'editor.action.formatDocument');
    }

    /**
     * Trigger auto-completion
     */
    triggerSuggest() {
        if (!this.monacoEditor) return;
        
        this.monacoEditor.trigger('editor', 'editor.action.triggerSuggest');
    }
}
