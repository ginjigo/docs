# CLI Reference

The Ginji CLI provides powerful code generation tools to streamline your development workflow. From scaffolding new projects to generating boilerplate code, the CLI helps you get up and running quickly.

## Installation

Install the Ginji CLI using Go:

```bash
go install github.com/ginjigo/ginji/cmd/ginji@latest
```

Make sure your `$GOPATH/bin` is in your PATH:

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

Verify the installation:

```bash
ginji --help
```

## Available Commands

### `ginji new`
Create a new Ginji project with an interactive setup wizard. Choose your database, ORM, middleware, and deployment options.

[Learn more →](/cli/new)

### `ginji generate handler`
Generate HTTP handler functions with optional JSON binding support.

[Learn more →](/cli/generate-handler)

### `ginji generate middleware`
Generate custom middleware functions that fit seamlessly into the Ginji middleware chain.

[Learn more →](/cli/generate-middleware)

### `ginji generate crud`
Generate complete CRUD (Create, Read, Update, Delete) handlers for a resource with RESTful routes.

[Learn more →](/cli/generate-crud)

## Quick Examples

**Create a new project:**
```bash
ginji new my-api
```

**Generate a handler:**
```bash
ginji generate handler GetUser --json
```

**Generate middleware:**
```bash
ginji generate middleware Auth
```

**Generate CRUD operations:**
```bash
ginji generate crud User
```

## Command Aliases

The CLI supports short aliases for common commands:

- `g` → `generate`
- `h` → `handler`
- `mw` → `middleware`

**Example:**
```bash
ginji g h GetUser --json
# Same as: ginji generate handler GetUser --json
```

## Getting Help

Display help for any command:

```bash
ginji --help
ginji generate --help
```

## Next Steps

- [Create your first project](/cli/new)
- [Generate handlers](/cli/generate-handler)
- [Learn about middleware](/guide/middleware)
