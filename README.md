# Touch - CLI Todo List Manager

A modern, interactive CLI todo list manager with MongoDB persistence. Built with TypeScript and Bun.

[![Release](https://img.shields.io/badge/release-v1.1.0-blue)](https://github.com/xeoxaz/touch/releases/tag/v1.1.0)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## Features

✨ **Interactive CLI Interface**
- Navigate using arrow keys only (no hotkeys clutter)
- Left/Right arrows to control toolbar buttons
- Up/Down arrows to navigate todo list
- Beautiful colored output with syntax highlighting

🎨 **Color-Coded UI**
- Cyan: Header, toggle button
- Yellow: Edit prompts and button
- Green: New button and completed checkmarks
- Red: Delete and cancel buttons
- Gray: Disabled/secondary actions

📝 **Full Todo Management**
- ✅ **Toggle** - Mark todos as complete/incomplete
- ✏️ **Edit** - Modify existing todo text
- ➕ **New** - Create new todos with text input
- 🗑️ **Delete** - Remove todos permanently
- 💫 **Persist** - All data saved to MongoDB

🛠️ **Developer-Friendly**
- Built on TypeScript for type safety
- Bun runtime for speed
- Clean, refactored codebase
- MongoDB for reliable data storage

## Installation

### Prerequisites
- [Bun](https://bun.sh) runtime installed
- MongoDB running locally on `localhost:27017`

### Setting Up MongoDB

#### Option 1: MongoDB Community Server (Local Installation)

**Windows:**
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a service and start automatically
4. Verify with: `mongosh` (MongoDB Shell)

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Option 2: Docker (Recommended for Easy Setup)

```bash
# Pull and run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify connection
docker exec mongodb mongosh --eval "db.adminCommand('ping')"
```

#### Verify Connection
The app includes an automatic database health check at startup. When you run `bun start`, it will:
- ✓ Test MongoDB connectivity
- ✓ Create the database and collection if needed
- ✓ Load existing todos

If MongoDB is not running, you'll see a clear error message.

### Setup

```bash
# Clone or navigate to project directory
cd touch

# Install dependencies
bun install

# Run the app
bun start
```

## Usage

### Navigation
| Key | Action |
|-----|--------|
| ↑/↓ | Navigate todo list |
| ←/→ | Select toolbar buttons |
| ENTER | Execute selected button |
| CTRL+C | Emergency exit |

### Toolbar Actions

**List Mode:**
- `[toggle]` - Mark selected todo complete/incomplete
- `[edit]` - Open edit mode for selected todo
- `[new]` - Create a new todo
- `[delete]` - Delete selected todo
- `[quit]` - Exit application

**Edit/Input Mode:**
- `[save]` - Save changes/new todo
- `[cancel]` - Discard changes and return to list

### Example Workflow
1. Enter app - toolbar defaults to `[toggle]`
2. ↓ Navigate to a todo you want to edit
3. → Navigate to `[edit]` button
4. ENTER - Start editing
5. Type your new text
6. ← Navigate to `[save]`
7. ENTER - Save and return to list

## Architecture

### Tech Stack
- **Language**: TypeScript
- **Runtime**: Bun
- **Database**: MongoDB
- **UI**: Terminal-based with ANSI colors

### Code Structure
- Single-file implementation (`index.ts`)
- Mode-based state management (list/input/edit)
- Clean separation of concerns:
  - Input handling
  - Rendering
  - Database operations
  - UI state management

### Key Features
- Responsive keyboard handling with escape sequence parsing
- Efficient database operations (batch save/load)
- Color-coded UI for better UX
- Mode-based toolbar switching

## Data Model

Each todo is stored in MongoDB with the following structure:
```typescript
interface Todo {
  _id?: string;        // MongoDB ObjectId
  text: string;        // Todo text content
  completed: boolean;  // Completion status
}
```

**Database**: `touch`
**Collection**: `todos`

## Project Stats

- **Language**: TypeScript
- **Lines of Code**: ~400
- **Dependencies**: 1 (mongodb)
- **Runtime**: Bun

## Future Enhancements

- [ ] Categories/Tags support
- [ ] Due dates
- [ ] Priority levels
- [ ] Search/Filter functionality
- [ ] Dark/Light themes
- [ ] Custom color schemes
- [ ] Backup/Export options
- [ ] Multi-user support

## Created By

**Xeoxaz**

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Found a bug? Have a feature idea? Feel free to open an issue or submit a pull request!

---

Made with ❤️ for command-line enthusiasts.
