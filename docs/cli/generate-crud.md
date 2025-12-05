# ginji generate crud

Generate complete CRUD (Create, Read, Update, Delete) handlers for a resource with RESTful routes.

## Usage

```bash
ginji generate crud <resource>
```

**Aliases:**
```bash
ginji g crud <resource>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `resource` | Resource name (singular, e.g., "User") | Yes |

## Example

Generate CRUD operations for a User resource:

```bash
ginji generate crud User
```

**Generated file:** `handlers/user.go`

```go
package handlers

import (
	"github.com/ginjigo/ginji"
)

// UserHandler provides CRUD operations for user
type UserHandler struct {
	// TODO: Add dependencies (database, services, etc.)
}

// NewUserHandler creates a new UserHandler
func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

// ListUsers handles GET /users
func (h *UserHandler) ListUsers(c *ginji.Context) {
	// TODO: Implement list logic
	_ = c.JSON(200, ginji.H{
		"users": []interface{}{},
	})
}

// GetUser handles GET /users/:id
func (h *UserHandler) GetUser(c *ginji.Context) {
	id := c.Param("id")
	
	// TODO: Implement get logic
	_ = c.JSON(200, ginji.H{
		"id": id,
	})
}

// CreateUser handles POST /users
func (h *UserHandler) CreateUser(c *ginji.Context) {
	var request struct {
		// TODO: Define create request structure
	}
	
	if err := c.BindValidate(&request); err != nil {
		_ = c.JSON(400, ginji.H{"error": err.Error()})
		return
	}
	
	// TODO: Implement create logic
	_ = c.JSON(201, ginji.H{
		"message": "User created",
	})
}

// UpdateUser handles PUT /users/:id
func (h *UserHandler) UpdateUser(c *ginji.Context) {
	id := c.Param("id")
	
	var request struct {
		// TODO: Define update request structure
	}
	
	if err := c.BindValidate(&request); err != nil {
		_ = c.JSON(400, ginji.H{"error": err.Error()})
		return
	}
	
	// TODO: Implement update logic
	_ = c.JSON(200, ginji.H{
		"id":      id,
		"message": "User updated",
	})
}

// DeleteUser handles DELETE /users/:id
func (h *UserHandler) DeleteUser(c *ginji.Context) {
	id := c.Param("id")
	
	// TODO: Implement delete logic
	_ = c.JSON(200, ginji.H{
		"id":      id,
		"message": "User deleted",
	})
}

// RegisterUserRoutes registers all user routes
func RegisterUserRoutes(app *ginji.Engine) {
	handler := NewUserHandler()
	
	app.Get("/users", handler.ListUsers).
		Summary("List all users").
		Tags("user")
	
	app.Get("/users/:id", handler.GetUser).
		Summary("Get a user by ID").
		Tags("user")
	
	app.Post("/users", handler.CreateUser).
		Summary("Create a new user").
		Tags("user")
	
	app.Put("/users/:id", handler.UpdateUser).
		Summary("Update a user").
		Tags("user")
	
	app.Delete("/users/:id", handler.DeleteUser).
		Summary("Delete a user").
		Tags("user")
}
```

## Generated Routes

The command generates these RESTful routes:

```
✓ Generated CRUD handler: handlers/user.go
  Routes:
    GET    /users
    GET    /users/:id
    POST   /users
    PUT    /users/:id
    DELETE /users/:id
```

## Resource Naming

The CLI handles pluralization and formatting:

| Input | Handler Name | Routes | File Name |
|-------|--------------|--------|-----------|
| `User` | `UserHandler` | `/users` | `user.go` |
| `Product` | `ProductHandler` | `/products` | `product.go` |
| `Category` | `CategoryHandler` | `/categories` | `category.go` |

## Using Generated CRUD Handlers

### Register Routes

In your `main.go`:

```go
package main

import (
    "github.com/ginjigo/ginji"
    "your-project/handlers"
)

func main() {
    app := ginji.New()
    
    // Register all CRUD routes
    handlers.RegisterUserRoutes(app)
    
    app.Listen(":3000")
}
```

### With Route Groups

```go
api := app.Group("/api/v1")
handlers.RegisterUserRoutes(api)

// Routes will be:
// /api/v1/users
// /api/v1/users/:id
```

### With Middleware

```go
func RegisterUserRoutes(app *ginji.Engine) {
    handler := NewUserHandler()
    
    users := app.Group("/users")
    
    // Public routes
    users.Get("", handler.ListUsers)
    users.Get("/:id", handler.GetUser)
    
    // Protected routes
    users.Post("", handler.CreateUser, middleware.Auth())
    users.Put("/:id", handler.UpdateUser, middleware.Auth())
    users.Delete("/:id", handler.DeleteUser, middleware.Auth(), middleware.Admin())
}
```

## Implementing CRUD Logic

### Add Dependencies

```go
type UserHandler struct {
    db     *gorm.DB
    logger Logger
}

func NewUserHandler(db *gorm.DB, logger Logger) *UserHandler {
    return &UserHandler{
        db:     db,
        logger: logger,
    }
}
```

### Define Models

```go
type User struct {
    ID        uint      `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

type CreateUserRequest struct {
    Name  string `json:"name" ginji:"required,min=2"`
    Email string `json:"email" ginji:"required,email"`
}

type UpdateUserRequest struct {
    Name  string `json:"name,omitempty"`
    Email string `json:"email,omitempty" ginji:"email"`
}
```

### Implement Handlers

**List:**
```go
func (h *UserHandler) ListUsers(c *ginji.Context) {
    var users []User
    if err := h.db.Find(&users).Error; err != nil {
        c.AbortWithError(500, err)
        return
    }
    
    c.JSON(200, users)
}
```

**Get:**
```go
func (h *UserHandler) GetUser(c *ginji.Context) {
    id := c.Param("id")
    
    var user User
    if err := h.db.First(&user, id).Error; err != nil {
        c.AbortWithError(404, ginji.NewHTTPError(404, "User not found"))
        return
    }
    
    c.JSON(200, user)
}
```

**Create:**
```go
func (h *UserHandler) CreateUser(c *ginji.Context) {
    var req CreateUserRequest
    if err := c.BindValidate(&req); err != nil {
        c.AbortWithError(400, err)
        return
    }
    
    user := User{
        Name:  req.Name,
        Email: req.Email,
    }
    
    if err := h.db.Create(&user).Error; err != nil {
        c.AbortWithError(500, err)
        return
    }
    
    c.JSON(201, user)
}
```

**Update:**
```go
func (h *UserHandler) UpdateUser(c *ginji.Context) {
    id := c.Param("id")
    
    var user User
    if err := h.db.First(&user, id).Error; err != nil {
        c.AbortWithError(404, ginji.NewHTTPError(404, "User not found"))
        return
    }
    
    var req UpdateUserRequest
    if err := c.BindValidate(&req); err != nil {
        c.AbortWithError(400, err)
        return
    }
    
    if req.Name != "" {
        user.Name = req.Name
    }
    if req.Email != "" {
        user.Email = req.Email
    }
    
    if err := h.db.Save(&user).Error; err != nil {
        c.AbortWithError(500, err)
        return
    }
    
    c.JSON(200, user)
}
```

**Delete:**
```go
func (h *UserHandler) DeleteUser(c *ginji.Context) {
    id := c.Param("id")
    
    result := h.db.Delete(&User{}, id)
    if result.Error != nil {
        c.AbortWithError(500, result.Error)
        return
    }
    
    if result.RowsAffected == 0 {
        c.AbortWithError(404, ginji.NewHTTPError(404, "User not found"))
        return
    }
    
    c.JSON(200, ginji.H{"message": "User deleted"})
}
```

## Advanced Features

### Pagination

```go
func (h *UserHandler) ListUsers(c *ginji.Context) {
    page := c.QueryInt("page", 1)
    limit := c.QueryInt("limit", 10)
    offset := (page - 1) * limit
    
    var users []User
    var total int64
    
    h.db.Model(&User{}).Count(&total)
    h.db.Offset(offset).Limit(limit).Find(&users)
    
    c.JSON(200, ginji.H{
        "data":  users,
        "total": total,
        "page":  page,
        "limit": limit,
    })
}
```

### Filtering

```go
func (h *UserHandler) ListUsers(c *ginji.Context) {
    query := h.db.Model(&User{})
    
    if name := c.Query("name"); name != "" {
        query = query.Where("name LIKE ?", "%"+name+"%")
    }
    
    if email := c.Query("email"); email != "" {
        query = query.Where("email = ?", email)
    }
    
    var users []User
    query.Find(&users)
    
    c.JSON(200, users)
}
```

## Best Practices

1. **Use dependency injection** - Inject database and services via constructor
2. **Validate input** - Always use `BindValidate` for request bodies
3. **Handle errors** - Provide meaningful error messages
4. **Add pagination** - For list endpoints
5. **Use proper status codes** - 200 OK, 201 Created, 404 Not Found, etc.
6. **Add authentication** - Protect write operations
7. **Add OpenAPI docs** - Use Summary() and Tags() for documentation

## Related Commands

- [Generate handler](/cli/generate-handler) - Generate individual handlers
- [Generate middleware](/cli/generate-middleware) - Generate middleware

## See Also

- [Routing Guide](/guide/routing)
- [Validation Guide](/guide/validation)
- [Error Handling](/guide/error-handling)
