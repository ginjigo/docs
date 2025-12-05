# Enhanced Context API Documentation

## Overview

Ginji's Context API has been enhanced with modern developer experience patterns inspired by Hono.js and Elysia.js, making your code cleaner and more concise while maintaining full backwards compatibility.

## Request Wrapper

Access request data through a cleaner namespace:

```go
app.Get("/user/:id", func(c *ginji.Context) {
    // New way - cleaner namespace
    id := c.Request.Param("id")
    name := c.Request.Query("name")
    role := c.Request.QueryDefault("role", "user")
    
    // Old way still works for backwards compatibility
    oldID := c.Param("id")
    oldName := c.Query("name")
})
```

### Available Methods

- **`c.Request.Param(key)`** - Get URL parameter
- **`c.Request.Query(key)`** - Get query parameter
- **`c.Request.QueryDefault(key, default)`** - Get query parameter with default value

## Convenience Response Methods

Send common responses with less boilerplate:

```go
// New convenience methods
c.JSONOK(data)           // Same as: c.JSON(200, data)
c.TextOK("message")      // Same as: c.Text(200, "message")
c.HTMLOK("<h1>Hi</h1>")  // Same as: c.HTML(200, "<h1>Hi</h1>")
```

## Quick Error Responses

Send error responses in one line:

```go
// Simple error
if token == "" {
    return c.Fail(401, "Unauthorized")
}

// Error with additional data
if err := validateInput(data); err != nil {
    return c.FailWithData(400, "Validation failed", ginji.H{
        "details": err.Error(),
    })
}
```

## Context Variable Storage

Cleaner aliases for storing values in context:

```go
// New way
c.Var("user_id", 123)
userID, exists := c.GetVar("user_id")

// Old way (still works)
c.Set("user_id", 123)
userID, exists := c.Get("user_id")
```

## Migration from Old API

All old APIs still work! You can migrate gradually:

| Old API | New API | Notes |
|---------|---------|-------|
| `c.Param("id")` | `c.Request.Param("id")` | Both work |
| `c.Query("name")` | `c.Request.Query("name")` | Both work |
| `c.JSON(200, data)` | `c.JSONOK(data)` | Shorthand for 200 OK |
| `c.Set(k, v)` | `c.Var(k, v)` | Cleaner alias |
| `c.Get(k)` | `c.GetVar(k)` | Cleaner alias |

## Example: Before and After

### Before
```go
app.Get("/user/:id", func(c *ginji.Context) {
    id := c.Param("id")
    name := c.Query("name")
    role := "user"
    if r := c.Query("role"); r != "" {
        role = r
    }
    
    c.JSON(http.StatusOK, ginji.H{
        "id":   id,
        "name": name,
        "role": role,
    })
})
```

### After
```go
app.Get("/user/:id", func(c *ginji.Context) {
    _ = c.JSONOK(ginji.H{
        "id":   c.Request.Param("id"),
        "name": c.Request.Query("name"),
        "role": c.Request.QueryDefault("role", "user"),
    })
})
```

**Result**: Code reduced from 11 lines to 6 lines (45% reduction) with improved readability.
