# VS-Code-clone-using-html-css-and-javascript
I have made this project using html, css and javascript

# Web Code Editor

## Overview

This is a web-based code editor built with vanilla JavaScript and Monaco Editor. It provides a VS Code-like interface with file management, syntax highlighting, and a modern dark theme. The application is designed as a single-page application (SPA) with a modular architecture using ES6 modules.

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla JavaScript with ES6 modules
- **Editor Engine**: Monaco Editor (VS Code's editor)
- **Styling**: Custom CSS with CSS variables for theming
- **Module Pattern**: Component-based architecture with event-driven communication
- **Storage**: Browser localStorage for file persistence

### Key Design Decisions
1. **No Framework Dependency**: Uses vanilla JavaScript to minimize bundle size and complexity
2. **Monaco Editor Integration**: Leverages Microsoft's Monaco Editor for professional code editing features
3. **Event-Driven Architecture**: Components communicate through custom event systems
4. **Responsive Design**: Adapts to mobile and desktop viewports
5. **Modular CSS**: Separate stylesheets for core styles and editor-specific styles

## Key Components

### 1. FileManager (`js/fileManager.js`)
- **Purpose**: Core data layer for file and folder operations
- **Responsibilities**: 
  - CRUD operations for files and folders
  - Local storage persistence
  - ID generation and management
- **Storage**: Uses browser localStorage with automatic save/load

### 2. FileExplorer (`js/fileExplorer.js`)
- **Purpose**: File tree visualization and navigation
- **Responsibilities**:
  - Render file/folder hierarchy
  - Handle file selection and expansion
  - Provide empty state when no files exist
- **Integration**: Consumes FileManager data and emits file selection events

### 3. Editor (`js/editor.js`)
- **Purpose**: Monaco Editor wrapper with tab management
- **Responsibilities**:
  - Monaco Editor lifecycle management
  - Tab system for multiple open files
  - Content synchronization with FileManager
- **Features**: Syntax highlighting, autocomplete, error detection

### 4. ContextMenu (`js/contextMenu.js`)
- **Purpose**: Right-click context menu for file operations
- **Responsibilities**:
  - File/folder operations (rename, delete, etc.)
  - Context-aware menu items
  - Event delegation for menu actions

### 5. Main Application (`js/main.js`)
- **Purpose**: Application orchestrator and entry point
- **Responsibilities**:
  - Component initialization and wiring
  - Global event handling
  - Keyboard shortcuts
  - Resize functionality

## Data Flow

1. **File Operations**: FileManager → FileExplorer (UI update) → Editor (if file is open)
2. **File Selection**: FileExplorer → Main App → Editor (open/switch tabs)
3. **Content Changes**: Editor → FileManager (auto-save) → FileExplorer (dirty state indicators)
4. **Context Actions**: ContextMenu → Main App → FileManager → UI Components

## External Dependencies

### CDN Dependencies
- **Monaco Editor**: Microsoft's code editor (loaded from CDN)
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Custom fonts for better typography

### Browser APIs
- **localStorage**: File persistence across sessions
- **File API**: File upload/download operations
- **Clipboard API**: Copy/paste functionality

## Deployment Strategy

### Static Hosting
- **Type**: Client-side only application
- **Requirements**: Any static web server (Apache, Nginx, Netlify, Vercel)
- **Assets**: HTML, CSS, JavaScript files only
- **No Backend**: All data stored in browser localStorage

### Performance Considerations
- Monaco Editor loaded asynchronously
- CSS variables for efficient theming
- Event delegation for memory efficiency
- Lazy loading of file content

I am aslo sharing some pictures of the projects below:

1. Welcome Page

<img width="1200" height="689" alt="Welcome" src="https://github.com/user-attachments/assets/0eac9e2e-5ea8-4742-88e6-614b5e08126f" />

2. Files View

<img width="1200" height="689" alt="FilesView" src="https://github.com/user-attachments/assets/c4e4ecd4-56d5-498b-894e-2cb3c4235736" />

3. html Code

<img width="1200" height="689" alt="htmlView" src="https://github.com/user-attachments/assets/c91bfcf5-b88e-4cfe-a9a3-e3843ea6cb6a" />

4. css code

<img width="1200" height="689" alt="cssView" src="https://github.com/user-attachments/assets/66f0b554-1e1f-4f0f-bf7b-1159e7a75027" />

5. Javascript code

<img width="1200" height="689" alt="jsView" src="https://github.com/user-attachments/assets/df7ddfb7-f3a4-40bb-946a-96325ee3b5f2" />

6. Search in file using "Control + F " key

<img width="1200" height="689" alt="find" src="https://github.com/user-attachments/assets/54a89683-966c-4109-8bc9-1152473b0809" />
