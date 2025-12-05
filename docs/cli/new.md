# ginji new

Create a new Ginji project with an interactive setup wizard that guides you through configuring your application.

## Usage

```bash
ginji new [project-name]
```

If you don't provide a project name, you'll be prompted to enter one interactively.

## Interactive Setup

The `ginji new` command provides an interactive terminal UI that walks you through several configuration steps:

### 1. Project Name

Enter a name for your project. This will be used as the directory name and in generated files.

```bash
ginji new my-awesome-api
```

### 2. Database Selection

Choose your preferred database:

- **None** - No database configuration
- **SQLite** - Lightweight, file-based database
- **PostgreSQL** - Production-grade relational database
- **MySQL** - Popular relational database

### 3. ORM Selection

Choose an ORM/database toolkit:

- **None** - Manual database handling
- **GORM** - Feature-rich ORM with migrations
- **sqlc** - Type-safe SQL from queries
- **ent** - Entity framework with schema-as-code

### 4. Middleware Selection

Select built-in middleware to include (use **Space** to toggle):

- **Logger** - HTTP request logging
- **Recovery** - Panic recovery
- **CORS** - Cross-Origin Resource Sharing

### 5. Deployment

Choose a deployment configuration:

- **None** - No deployment files
- **Docker** - Dockerfile and docker-compose.yml

### 6. Tests

Choose whether to generate test files and examples.

## Example Session

```bash
$ ginji new my-api

Create New Ginji Project

my-api

Select Database

> PostgreSQL
  MySQL
  SQLite
  None

Select ORM

> GORM
  sqlc
  ent
  None

Select Middleware (Space to select)

> [x] Logger
  [x] Recovery
  [ ] CORS

Select Deployment

> Docker
  None

Generate Tests?

> Yes
  No

Generating Project...

✓ Project ready at my-api

Next steps:
  cd my-api
  go mod tidy
  go run cmd/server/main.go
```

## Generated Project Structure

After running `ginji new`, you'll get a well-organized project:

```
my-api/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── handlers/                # HTTP handlers
│   └── .gitkeep
├── middleware/              # Custom middleware
│   └── .gitkeep
├── models/                  # Data models (if ORM selected)
│   └── .gitkeep
├── config/                  # Configuration files
│   └── config.go
├── Dockerfile              # Docker config (if selected)
├── docker-compose.yml      # Docker Compose (if selected)
├── go.mod
├── go.sum
└── README.md
```

## Navigation Controls

- **↑/↓** or **k/j** - Navigate options
- **Space** - Toggle selection (middleware step)
- **Enter** - Confirm selection and move to next step
- **Ctrl+C** or **Esc** - Cancel and exit

## Next Steps

After creating your project:

1. **Navigate to the project:**
   ```bash
   cd my-api
   ```

2. **Install dependencies:**
   ```bash
   go mod tidy
   ```

3. **Run the server:**
   ```bash
   go run cmd/server/main.go
   ```

4. **Generate code:**
   - [Generate handlers](/cli/generate-handler)
   - [Generate middleware](/cli/generate-middleware)
   - [Generate CRUD operations](/cli/generate-crud)

## Tips

- Use arrow keys or vim-style **j/k** keys to navigate
- The generated project includes sensible defaults and best practices
- Database and ORM configurations are automatically wired together
- All generated code follows Ginji conventions
