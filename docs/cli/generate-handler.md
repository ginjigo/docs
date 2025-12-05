# ginji generate handler

Generate HTTP handler functions with optional JSON binding support.

## Usage

```bash
ginji generate handler <name> [--json]
```

**Aliases:**
```bash
ginji g h <name> [--json]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Handler name (will be converted to PascalCase) | Yes |
| `--json` | Generate handler with JSON request binding | No |

## Examples

### Basic Handler

Generate a simple handler:

```bash
ginji generate handler GetUser
```

**Generated file:** `handlers/get-user.go`

```go
package handlers

import "github.com/ginjigo/ginji"

// GetUser handles get-user operations
func GetUser(c *ginji.Context) {
	// TODO: Implement handler logic
	
	_ = c.JSON(200, ginji.H{
		"message": "GetUser endpoint",
	})
}
```

### Handler with JSON Binding

Generate a handler with JSON request validation:

```bash
ginji generate handler CreateUser --json
```

**Generated file:** `handlers/create-user.go`

```go
package handlers

import "github.com/ginjigo/ginji"

// CreateUser handles create-user operations
func CreateUser(c *ginji.Context) {
	// TODO: Implement handler logic
	var request struct {
		// TODO: Define request structure
	}
	
	if err := c.BindValidate(&request); err != nil {
		_ = c.JSON(400, ginji.H{"error": err.Error()})
		return
	}
	
	_ = c.JSON(200, ginji.H{
		"message": "CreateUser endpoint",
	})
}
```

## Name Formatting

The CLI automatically formats your handler name:

| Input | Function Name | File Name |
|-------|--------------|-----------|
| `GetUser` | `GetUser` | `get-user.go` |
| `create_user` | `CreateUser` | `create-user.go` |
| `UPDATE-PROFILE` | `UpdateProfile` | `update-profile.go` |

## Using Generated Handlers

After generating a handler, register it with your Ginji application:

```go
package main

import (
    "github.com/ginjigo/ginji"
    "your-project/handlers"
)

func main() {
    app := ginji.New()
    
    // Register the handler
    app.Get("/users/:id", handlers.GetUser).
        Summary("Get user by ID").
        Tags("users")
    
    app.Listen(":3000")
}
```

## Customizing Generated Code

The generated handler is a starting point. Customize it for your needs:

### Add Request Validation

```go
type GetUserRequest struct {
    ID string `path:"id" ginji:"required,uuid"`
}

func GetUser(c *ginji.Context) {
    var req GetUserRequest
    if err := c.BindValidate(&req); err != nil {
        c.AbortWithError(400, err)
        return
    }
    
    // Use req.ID...
}
```

### Add Response Type

```go
type UserResponse struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func GetUser(c *ginji.Context) {
    user := UserResponse{
        ID:    "123",
        Name:  "John Doe",
        Email: "john@example.com",
    }
    
    c.JSON(200, user)
}
```

### Add Error Handling

```go
func GetUser(c *ginji.Context) {
    id := c.Param("id")
    
    user, err := db.GetUserByID(id)
    if err != nil {
        c.AbortWithError(404, ginji.NewHTTPError(404, "User not found"))
        return
    }
    
    c.JSON(200, user)
}
```

## Best Practices

1. **Use descriptive names** - `GetUserProfile` is better than `Get`
2. **Follow RESTful conventions** - Use verbs like Get, Create, Update, Delete
3. **Add validation** - Always validate and sanitize input
4. **Handle errors** - Provide meaningful error messages
5. **Document your handlers** - Add OpenAPI tags and summaries

## Related Commands

- [Generate CRUD operations](/cli/generate-crud) - Generate all CRUD handlers at once
- [Generate middleware](/cli/generate-middleware) - Generate custom middleware

## See Also

- [Routing Guide](/guide/routing)
- [Validation Guide](/guide/validation)
- [Error Handling](/guide/error-handling)
