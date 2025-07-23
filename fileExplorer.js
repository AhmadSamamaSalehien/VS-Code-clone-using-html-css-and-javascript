/**
 * File Explorer component for managing the file tree
 */
export class FileExplorer {
    constructor(fileManager) {
        this.fileManager = fileManager;
        this.container = document.getElementById('fileExplorer');
        this.selectedFile = null;
        this.expandedFolders = new Set();
        this.eventListeners = {};
        
        this.init();
    }

    /**
     * Initialize the file explorer
     */
    init() {
        this.render();
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
     * Render the file tree
     */
    render() {
        const files = this.fileManager.getFiles();
        const folders = this.fileManager.getFolders();
        
        if (files.length === 0 && folders.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        this.container.innerHTML = '';
        
        // Render folders first
        folders.forEach(folder => {
            this.renderFolder(folder);
        });
        
        // Render files
        files.forEach(file => {
            this.renderFile(file);
        });
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No files or folders</p>
                <small>Create a new file or folder to get started</small>
            </div>
        `;
    }

    /**
     * Render a folder
     */
    renderFolder(folder) {
        const isExpanded = this.expandedFolders.has(folder.id);
        const folderElement = document.createElement('div');
        folderElement.className = 'folder-item';
        folderElement.innerHTML = `
            <div class="file-item folder" data-type="folder" data-id="${folder.id}">
                <i class="fas ${isExpanded ? 'fa-folder-open' : 'fa-folder'}"></i>
                <span class="file-name">${folder.name}</span>
            </div>
            ${isExpanded ? `<div class="folder-children" data-folder-id="${folder.id}"></div>` : ''}
        `;
        
        this.container.appendChild(folderElement);
        
        // Render folder contents if expanded
        if (isExpanded) {
            const childrenContainer = folderElement.querySelector('.folder-children');
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    this.renderFolderChild(child, childrenContainer);
                } else {
                    this.renderFileChild(child, childrenContainer);
                }
            });
        }
    }

    /**
     * Render a child folder
     */
    renderFolderChild(folder, container) {
        const isExpanded = this.expandedFolders.has(folder.id);
        const folderElement = document.createElement('div');
        folderElement.className = 'folder-item';
        folderElement.innerHTML = `
            <div class="file-item folder" data-type="folder" data-id="${folder.id}">
                <i class="fas ${isExpanded ? 'fa-folder-open' : 'fa-folder'}"></i>
                <span class="file-name">${folder.name}</span>
            </div>
            ${isExpanded ? `<div class="folder-children" data-folder-id="${folder.id}"></div>` : ''}
        `;
        
        container.appendChild(folderElement);
    }

    /**
     * Render a file
     */
    renderFile(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.dataset.type = 'file';
        fileElement.dataset.id = file.id;
        
        const icon = this.getFileIcon(file.name);
        const isModified = file.isModified ? ' <span class="file-modified">●</span>' : '';
        
        fileElement.innerHTML = `
            <i class="${icon}"></i>
            <span class="file-name">${file.name}${isModified}</span>
        `;
        
        this.container.appendChild(fileElement);
    }

    /**
     * Render a child file
     */
    renderFileChild(file, container) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.dataset.type = 'file';
        fileElement.dataset.id = file.id;
        
        const icon = this.getFileIcon(file.name);
        const isModified = file.isModified ? ' <span class="file-modified">●</span>' : '';
        
        fileElement.innerHTML = `
            <i class="${icon}"></i>
            <span class="file-name">${file.name}${isModified}</span>
        `;
        
        container.appendChild(fileElement);
    }

    /**
     * Get file icon based on extension
     */
    getFileIcon(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const icons = {
            'html': 'fas fa-file-code file-icon html',
            'css': 'fas fa-file-code file-icon css',
            'js': 'fas fa-file-code file-icon js',
            'json': 'fas fa-file-code file-icon json',
            'md': 'fas fa-file-alt file-icon md',
            'txt': 'fas fa-file-alt',
        };
        return icons[ext] || 'fas fa-file';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;
            
            const type = fileItem.dataset.type;
            const id = fileItem.dataset.id;
            
            if (type === 'folder') {
                this.toggleFolder(id);
            } else if (type === 'file') {
                this.selectFile(id);
            }
        });
        
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;
            
            const type = fileItem.dataset.type;
            const id = fileItem.dataset.id;
            
            if (type === 'file') {
                const file = this.fileManager.getFile(id);
                this.emit('contextMenu', e, file);
            }
        });
        
        this.container.addEventListener('dblclick', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;
            
            const type = fileItem.dataset.type;
            const id = fileItem.dataset.id;
            
            if (type === 'file') {
                const file = this.fileManager.getFile(id);
                this.emit('fileSelect', file);
            }
        });
    }

    /**
     * Toggle folder expansion
     */
    toggleFolder(folderId) {
        if (this.expandedFolders.has(folderId)) {
            this.expandedFolders.delete(folderId);
        } else {
            this.expandedFolders.add(folderId);
        }
        this.render();
    }

    /**
     * Select a file
     */
    selectFile(fileId) {
        // Remove previous selection
        const previousSelected = this.container.querySelector('.file-item.active');
        if (previousSelected) {
            previousSelected.classList.remove('active');
        }
        
        // Add selection to current file
        const fileElement = this.container.querySelector(`[data-id="${fileId}"]`);
        if (fileElement) {
            fileElement.classList.add('active');
        }
        
        const file = this.fileManager.getFile(fileId);
        if (file) {
            this.selectedFile = file;
            this.emit('fileSelect', file);
        }
    }

    /**
     * Mark file as modified
     */
    markFileAsModified(file) {
        file.isModified = true;
        this.updateFileDisplay(file);
    }

    /**
     * Unmark file as modified
     */
    unmarkFileAsModified(file) {
        file.isModified = false;
        this.updateFileDisplay(file);
    }

    /**
     * Update file display
     */
    updateFileDisplay(file) {
        const fileElement = this.container.querySelector(`[data-id="${file.id}"]`);
        if (!fileElement) return;
        
        const fileNameElement = fileElement.querySelector('.file-name');
        if (!fileNameElement) return;
        
        const isModified = file.isModified ? ' <span class="file-modified">●</span>' : '';
        fileNameElement.innerHTML = `${file.name}${isModified}`;
    }

    /**
     * Refresh the file explorer
     */
    refresh() {
        this.render();
    }

    /**
     * Get selected file
     */
    getSelectedFile() {
        return this.selectedFile;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        const selectedElement = this.container.querySelector('.file-item.active');
        if (selectedElement) {
            selectedElement.classList.remove('active');
        }
        this.selectedFile = null;
    }

    /**
     * Focus on file
     */
    focusFile(file) {
        this.selectFile(file.id);
        
        // Scroll to file if needed
        const fileElement = this.container.querySelector(`[data-id="${file.id}"]`);
        if (fileElement) {
            fileElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Expand folder containing file
     */
    expandToFile(file) {
        // If file is in a folder, expand that folder
        if (file.parent) {
            this.expandedFolders.add(file.parent.id);
            this.render();
        }
    }

    /**
     * Get file tree as flat array for search
     */
    getFileTree() {
        const files = this.fileManager.getFiles();
        const folders = this.fileManager.getFolders();
        
        return [...files, ...folders];
    }

    /**
     * Filter files based on search term
     */
    filterFiles(searchTerm) {
        if (!searchTerm) {
            this.render();
            return;
        }
        
        const allFiles = this.getFileTree();
        const filteredFiles = allFiles.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredFiles(filteredFiles);
    }

    /**
     * Render filtered files
     */
    renderFilteredFiles(files) {
        this.container.innerHTML = '';
        
        if (files.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No files found</p>
                    <small>Try a different search term</small>
                </div>
            `;
            return;
        }
        
        files.forEach(file => {
            if (file.type === 'file') {
                this.renderFile(file);
            } else {
                this.renderFolder(file);
            }
        });
    }
}
