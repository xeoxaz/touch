import { MongoClient, Db } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017";
const DB_NAME = "touch";
const COLLECTION_NAME = "todos";

// ANSI Color codes
const Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  bgCyan: '\x1b[46m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  fgBlack: '\x1b[30m',
};

type Mode = 'list' | 'input' | 'edit';

interface Todo {
  _id?: string;
  text: string;
  completed: boolean;
}

class TodoCLI {
  private todos: Todo[] = [];
  private selectedIndex = 0;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private mode: Mode = 'list';
  private inputBuffer = "";
  private menuIndex = 0; // 0: toggle, 1: edit, 2: new, 3: delete, 4: quit

  constructor() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf-8");

    let escapeTimer: NodeJS.Timeout | null = null;

    process.stdin.on("data", (key) => {
      // Handle standalone Escape key with a small delay
      if (key === "\u001B") {
        escapeTimer = setTimeout(() => {
          this.handleInput(key);
          escapeTimer = null;
        }, 50);
      } else {
        // Cancel escape timer if we get another key
        if (escapeTimer) {
          clearTimeout(escapeTimer);
          escapeTimer = null;
        }
        this.handleInput(key);
      }
    });
  }

  async initialize() {
    try {
      // Show boot message
      console.log(`\n${Colors.cyan}${Colors.bold}📝 Touch - Todo List CLI${Colors.reset}`);
      console.log(`${Colors.gray}Checking database connection...${Colors.reset}`);
      
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      
      // Test database connectivity
      await this.testDatabaseConnection();
      
      this.db = this.client.db(DB_NAME);

      // Ensure collection exists
      const collections = await this.db.listCollections().toArray();
      if (!collections.find(c => c.name === COLLECTION_NAME)) {
        await this.db.createCollection(COLLECTION_NAME);
      }

      // Load todos from database
      await this.loadTodos();
      console.log(`${Colors.green}✓ Database ready${Colors.reset}\n`);
      this.render();
    } catch (error) {
      console.error(`${Colors.red}✗ Failed to connect to MongoDB${Colors.reset}`);
      if (error instanceof Error) {
        console.error(`${Colors.gray}Error: ${error.message}${Colors.reset}`);
      }
      process.exit(1);
    }
  }

  private async testDatabaseConnection() {
    if (!this.client) {
      throw new Error("MongoClient not initialized");
    }
    try {
      await this.client.db("admin").command({ ping: 1 });
    } catch (error) {
      throw new Error("Unable to reach MongoDB at " + MONGODB_URI);
    }
  }

  private async loadTodos() {
    if (!this.db) return;
    try {
      this.todos = await this.db
        .collection(COLLECTION_NAME)
        .find()
        .toArray() as Todo[];
    } catch (error) {
      console.error("Error loading todos:", error);
    }
  }

  private async saveTodos() {
    if (!this.db) return;
    try {
      await this.db.collection(COLLECTION_NAME).deleteMany({});
      if (this.todos.length > 0) {
        await this.db.collection(COLLECTION_NAME).insertMany(this.todos);
      }
    } catch (error) {
      console.error("Error saving todos:", error);
    }
  }

  private handleInput(key: string) {
    if (this.mode === 'input' || this.mode === 'edit') {
      switch (key) {
        case "\u001B[C": // Right arrow
          this.menuIndex = Math.min(1, this.menuIndex + 1);
          this.render();
          break;
        case "\u001B[D": // Left arrow
          this.menuIndex = Math.max(0, this.menuIndex - 1);
          this.render();
          break;
        case "\r": // Enter only
          this.executeToolbarAction();
          break;
        case "\u007f": // Backspace
        case "\b":
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.render();
          break;
        default:
          // Regular character input
          if (key.length === 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) < 127) {
            this.inputBuffer += key;
            this.render();
          }
          break;
      }
      return;
    }

    // List mode input handling
    switch (key) {
      case "\u001B[A": // Up arrow - navigate list only
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.render();
        break;
      case "\u001B[B": // Down arrow - navigate list only
        this.selectedIndex = Math.min(this.todos.length - 1, this.selectedIndex + 1);
        this.render();
        break;
      case "\u001B[C": // Right arrow - navigate toolbar only
        this.menuIndex = Math.min(4, this.menuIndex + 1);
        this.render();
        break;
      case "\u001B[D": // Left arrow - navigate toolbar only
        this.menuIndex = Math.max(0, this.menuIndex - 1);
        this.render();
        break;
      case "\r": // Enter - execute current toolbar action
        this.executeToolbarAction();
        break;
      case "\u0003": // Ctrl+C - exit
        this.exit();
        break;
    }
  }

  private executeToolbarAction() {
    if (this.mode === 'edit') {
      const editActions = [
        () => {
          // Save edit
          if (this.inputBuffer.trim()) {
            this.todos[this.selectedIndex].text = this.inputBuffer;
            this.saveTodos();
            this.resetToList();
          }
        },
        () => {
          // Cancel edit
          this.resetToList();
        },
      ];

      if (this.menuIndex >= 0 && this.menuIndex < editActions.length) {
        editActions[this.menuIndex]();
      }
    } else if (this.mode === 'input') {
      const inputActions = [
        () => {
          // Save
          if (this.inputBuffer.trim()) {
            this.addTodo(this.inputBuffer);
            this.resetToList();
          }
        },
        () => {
          // Cancel
          this.resetToList();
        },
      ];

      if (this.menuIndex >= 0 && this.menuIndex < inputActions.length) {
        inputActions[this.menuIndex]();
      }
    } else {
      const listActions = [
        () => this.toggleTodo(this.selectedIndex),
        () => {
          // Edit selected todo
          this.mode = 'edit';
          this.inputBuffer = this.todos[this.selectedIndex].text;
          this.menuIndex = 0;
          this.render();
        },
        () => {
          // New todo
          this.mode = 'input';
          this.inputBuffer = "";
          this.menuIndex = 0;
          this.render();
        },
        () => this.deleteTodo(this.selectedIndex),
        () => this.exit(),
      ];

      if (this.menuIndex >= 0 && this.menuIndex < listActions.length) {
        listActions[this.menuIndex]();
      }
    }
  }

  private toggleTodo(index: number) {
    if (index >= 0 && index < this.todos.length) {
      this.todos[index].completed = !this.todos[index].completed;
      this.saveTodos();
      this.render();
    }
  }

  private addTodo(text: string) {
    this.todos.push({
      text,
      completed: false,
    });
    this.selectedIndex = this.todos.length - 1;
    this.saveTodos();
    this.render();
  }

  private deleteTodo(index: number) {
    if (index >= 0 && index < this.todos.length) {
      this.todos.splice(index, 1);
      this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, this.todos.length - 1));
      this.saveTodos();
      this.render();
    }
  }

  private resetToList() {
    this.inputBuffer = "";
    this.mode = 'list';
    this.menuIndex = 0;
    this.render();
  }

  private render() {
    console.clear();
    console.log(`\n${Colors.bold}${Colors.cyan}📝 Todo List CLI${Colors.reset}\n`);
    console.log(`${Colors.gray}Use arrow buttons to navigate${Colors.reset}\n`);

    // Always show toolbar
    this.renderToolbar();

    if (this.mode === 'edit') {
      console.log(`\n${Colors.yellow}Edit todo:${Colors.reset}\n`);
      console.log(`${Colors.cyan}>${Colors.reset} ${this.inputBuffer}\n`);
      return;
    }

    if (this.mode === 'input') {
      console.log(`\n${Colors.yellow}Add new todo:${Colors.reset}\n`);
      console.log(`${Colors.cyan}>${Colors.reset} ${this.inputBuffer}\n`);
      return;
    }

    console.log("\n");

    if (this.todos.length === 0) {
      console.log(`${Colors.gray}No todos yet. Press 'A' to add one!${Colors.reset}`);
      return;
    }

    this.todos.forEach((todo, index) => {
      const isSelected = index === this.selectedIndex;
      const checkbox = todo.completed ? `${Colors.green}✓${Colors.reset}` : " ";
      const text = todo.completed
        ? `${Colors.gray}\x1b[9m${todo.text}${Colors.reset}`
        : todo.text;

      if (isSelected) {
        // Background highlight (cyan background with black text)
        console.log(`${Colors.bgCyan}${Colors.fgBlack}➤ [${checkbox}] ${text}${Colors.reset}`);
      } else {
        console.log(`  [${checkbox}] ${text}`);
      }
    });

    console.log("\n");
  }

  private renderToolbar() {
    let buttons: string[];

    if (this.mode === 'edit' || this.mode === 'input') {
      buttons = [
        `${Colors.green}[save]${Colors.reset}`,
        `${Colors.red}[cancel]${Colors.reset}`
      ];
    } else {
      buttons = [
        `${Colors.cyan}[toggle]${Colors.reset}`,
        `${Colors.yellow}[edit]${Colors.reset}`,
        `${Colors.green}[new]${Colors.reset}`,
        `${Colors.red}[delete]${Colors.reset}`,
        `${Colors.gray}[quit]${Colors.reset}`
      ];
    }

    const menuLine = buttons.map((btn, idx) => {
      if (idx === this.menuIndex) {
        // Highlight with background
        const buttonText = btn.replace(/\x1b\[\d+m/g, '').replace(/\[|\]/g, '');
        return `${Colors.bgCyan}${Colors.fgBlack}[${buttonText}]${Colors.reset}`;
      }
      return btn;
    }).join("   ");

    console.log(menuLine);
  }

  private async exit() {
    await this.saveTodos();
    if (this.client) {
      await this.client.close();
    }
    process.stdin.setRawMode(false);
    process.stdin.pause();
    console.log(`\n${Colors.cyan}Goodbye! 👋${Colors.reset}`);
    console.log(`${Colors.gray}Created by: Xeoxaz${Colors.reset}\n`);
    process.exit(0);
  }

  async start() {
    await this.initialize();
  }
}

const app = new TodoCLI();
app.start();