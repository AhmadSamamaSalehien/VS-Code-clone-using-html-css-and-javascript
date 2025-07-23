/**
 * File Manager for handling file operations and storage
 */
export class FileManager {
    constructor() {
        this.files = new Map(); // fileId -> file data
        this.folders = new Map(); // folderId -> folder data
        this.nextId = 1;
        this.eventListeners = {};
        
        this.init();
    }

    /**
     * Initialize the file manager
     */
    init() {
        this.loadFromStorage();
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
     * Generate unique ID
     */
    generateId() {
        return `item_${this.nextId++}_${Date.now()}`;
    }

    /**
     * Create a new file
     */
    createFile(name, content = '', parentFolder = null) {
        const file = {
            id: this.generateId(),
            name: name,
            content: content,
            type: 'file',
            createdAt: new Date(),
            modifiedAt: new Date(),
            parent: parentFolder,
            isModified: false,
            path: parentFolder ? `${parentFolder.path}/${name}` : name
        };
        
        this.files.set(file.id, file);
        
        if (parentFolder) {
            parentFolder.children.push(file);
        }
        
        this.saveToStorage();
        this.emit('fileAdded', file);
        
        return file;
    }

    /**
     * Add existing file
     */
    addFile(name, content = '', parentFolder = null) {
        return this.createFile(name, content, parentFolder);
    }

    /**
     * Create a new folder
     */
    createFolder(name, parentFolder = null) {
        const folder = {
            id: this.generateId(),
            name: name,
            type: 'folder',
            children: [],
            createdAt: new Date(),
            parent: parentFolder,
            path: parentFolder ? `${parentFolder.path}/${name}` : name
        };
        
        this.folders.set(folder.id, folder);
        
        if (parentFolder) {
            parentFolder.children.push(folder);
        }
        
        this.saveToStorage();
        this.emit('folderAdded', folder);
        
        return folder;
    }

    /**
     * Get file by ID
     */
    getFile(id) {
        return this.files.get(id);
    }

    /**
     * Get folder by ID
     */
    getFolder(id) {
        return this.folders.get(id);
    }

    /**
     * Get all files
     */
    getFiles() {
        return Array.from(this.files.values());
    }

    /**
     * Get all folders
     */
    getFolders() {
        return Array.from(this.folders.values());
    }

    /**
     * Get root files (files not in any folder)
     */
    getRootFiles() {
        return this.getFiles().filter(file => !file.parent);
    }

    /**
     * Get root folders (folders not in any parent folder)
     */
    getRootFolders() {
        return this.getFolders().filter(folder => !folder.parent);
    }

    /**
     * Remove file
     */
    removeFile(file) {
        // Remove from parent folder if exists
        if (file.parent) {
            const index = file.parent.children.indexOf(file);
            if (index > -1) {
                file.parent.children.splice(index, 1);
            }
        }
        
        this.files.delete(file.id);
        this.saveToStorage();
        this.emit('fileRemoved', file);
    }

    /**
     * Remove folder and all its contents
     */
    removeFolder(folder) {
        // Recursively remove all children
        folder.children.forEach(child => {
            if (child.type === 'file') {
                this.removeFile(child);
            } else {
                this.removeFolder(child);
            }
        });
        
        // Remove from parent folder if exists
        if (folder.parent) {
            const index = folder.parent.children.indexOf(folder);
            if (index > -1) {
                folder.parent.children.splice(index, 1);
            }
        }
        
        this.folders.delete(folder.id);
        this.saveToStorage();
        this.emit('folderRemoved', folder);
    }

    /**
     * Rename file
     */
    renameFile(file, newName) {
        const oldName = file.name;
        file.name = newName;
        file.modifiedAt = new Date();
        file.path = file.parent ? `${file.parent.path}/${newName}` : newName;
        
        this.saveToStorage();
        this.emit('fileRenamed', file, oldName);
        
        return file;
    }

    /**
     * Rename folder
     */
    renameFolder(folder, newName) {
        const oldName = folder.name;
        folder.name = newName;
        folder.path = folder.parent ? `${folder.parent.path}/${newName}` : newName;
        
        // Update paths of all children
        this.updateChildrenPaths(folder);
        
        this.saveToStorage();
        this.emit('folderRenamed', folder, oldName);
        
        return folder;
    }

    /**
     * Update paths of all children recursively
     */
    updateChildrenPaths(folder) {
        folder.children.forEach(child => {
            child.path = `${folder.path}/${child.name}`;
            if (child.type === 'folder') {
                this.updateChildrenPaths(child);
            }
        });
    }

    /**
     * Move file to folder
     */
    moveFile(file, targetFolder) {
        // Remove from current parent
        if (file.parent) {
            const index = file.parent.children.indexOf(file);
            if (index > -1) {
                file.parent.children.splice(index, 1);
            }
        }
        
        // Add to new parent
        file.parent = targetFolder;
        if (targetFolder) {
            targetFolder.children.push(file);
            file.path = `${targetFolder.path}/${file.name}`;
        } else {
            file.path = file.name;
        }
        
        this.saveToStorage();
        this.emit('fileMoved', file, targetFolder);
        
        return file;
    }

    /**
     * Move folder to another folder
     */
    moveFolder(folder, targetFolder) {
        // Remove from current parent
        if (folder.parent) {
            const index = folder.parent.children.indexOf(folder);
            if (index > -1) {
                folder.parent.children.splice(index, 1);
            }
        }
        
        // Add to new parent
        folder.parent = targetFolder;
        if (targetFolder) {
            targetFolder.children.push(folder);
            folder.path = `${targetFolder.path}/${folder.name}`;
        } else {
            folder.path = folder.name;
        }
        
        // Update all children paths
        this.updateChildrenPaths(folder);
        
        this.saveToStorage();
        this.emit('folderMoved', folder, targetFolder);
        
        return folder;
    }

    /**
     * Update file content
     */
    updateFileContent(file, content) {
        file.content = content;
        file.modifiedAt = new Date();
        file.isModified = true;
        
        this.saveToStorage();
        this.emit('fileContentChanged', file);
        
        return file;
    }

    /**
     * Mark file as saved
     */
    markFileAsSaved(file) {
        file.isModified = false;
        this.saveToStorage();
        this.emit('fileSaved', file);
    }

    /**
     * Search files by name
     */
    searchFiles(query) {
        const allFiles = this.getFiles();
        const lowerQuery = query.toLowerCase();
        
        return allFiles.filter(file => 
            file.name.toLowerCase().includes(lowerQuery) ||
            file.content.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Search folders by name
     */
    searchFolders(query) {
        const allFolders = this.getFolders();
        const lowerQuery = query.toLowerCase();
        
        return allFolders.filter(folder => 
            folder.name.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get file statistics
     */
    getStats() {
        const files = this.getFiles();
        const folders = this.getFolders();
        
        return {
            totalFiles: files.length,
            totalFolders: folders.length,
            modifiedFiles: files.filter(f => f.isModified).length,
            totalSize: files.reduce((size, file) => size + (file.content || '').length, 0),
            fileTypes: this.getFileTypeStats(files)
        };
    }

    /**
     * Get file type statistics
     */
    getFileTypeStats(files) {
        const stats = {};
        
        files.forEach(file => {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
            stats[ext] = (stats[ext] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Export all data
     */
    exportData() {
        return {
            files: Array.from(this.files.entries()),
            folders: Array.from(this.folders.entries()),
            nextId: this.nextId,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import data
     */
    importData(data) {
        try {
            this.files.clear();
            this.folders.clear();
            
            // Import files
            if (data.files) {
                data.files.forEach(([id, file]) => {
                    this.files.set(id, file);
                });
            }
            
            // Import folders
            if (data.folders) {
                data.folders.forEach(([id, folder]) => {
                    this.folders.set(id, folder);
                });
            }
            
            // Update next ID
            if (data.nextId) {
                this.nextId = data.nextId;
            }
            
            this.saveToStorage();
            this.emit('dataImported');
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.files.clear();
        this.folders.clear();
        this.nextId = 1;
        
        this.saveToStorage();
        this.emit('dataCleared');
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            const data = this.exportData();
            localStorage.setItem('codeEditor_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to storage:', error);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('codeEditor_data');
            if (data) {
                const parsedData = JSON.parse(data);
                this.importData(parsedData);
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
        }
    }

    /**
     * Get file by path
     */
    getFileByPath(path) {
        return this.getFiles().find(file => file.path === path);
    }

    /**
     * Get folder by path
     */
    getFolderByPath(path) {
        return this.getFolders().find(folder => folder.path === path);
    }

    /**
     * Check if file name exists in parent
     */
    fileNameExists(name, parent = null) {
        const siblings = parent ? parent.children : this.getRootFiles();
        return siblings.some(item => item.name === name && item.type === 'file');
    }

    /**
     * Check if folder name exists in parent
     */
    folderNameExists(name, parent = null) {
        const siblings = parent ? parent.children : this.getRootFolders();
        return siblings.some(item => item.name === name && item.type === 'folder');
    }

    /**
     * Generate unique file name
     */
    generateUniqueFileName(baseName, parent = null) {
        let counter = 1;
        let name = baseName;
        
        while (this.fileNameExists(name, parent)) {
            const parts = baseName.split('.');
            if (parts.length > 1) {
                const ext = parts.pop();
                const nameWithoutExt = parts.join('.');
                name = `${nameWithoutExt} (${counter}).${ext}`;
            } else {
                name = `${baseName} (${counter})`;
            }
            counter++;
        }
        
        return name;
    }

    /**
     * Generate unique folder name
     */
    generateUniqueFolderName(baseName, parent = null) {
        let counter = 1;
        let name = baseName;
        
        while (this.folderNameExists(name, parent)) {
            name = `${baseName} (${counter})`;
            counter++;
        }
        
        return name;
    }
}
