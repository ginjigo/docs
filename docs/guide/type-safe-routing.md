# Enhanced Type-Safe Routing

## Overview

Ginji's enhanced type-safe routing provides compile-time type safety with improved runtime performance through reflection caching and better error messages.

## Quick Start

```go
import "github.com/ginjigo/ginji"

type CreateUserReq struct {
    Name  string `json:"name"`
    Email string `json:"email" ginji:"required,email"`
}

type UserResponse struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

app.Post("/users", ginji.TypedHandlerFunc(
    func(c *ginji.Context, req CreateUserReq) (UserResponse, error) {
        // Request is automatically bound and validated
        return UserResponse{
            ID:    123,
            Name:  req.Name,
            Email: req.Email,
        }, nil
    },
))
```

## Features

### 1. Automatic Request Binding

Typed handlers automatically bind from:
- **JSON body** (POST, PUT, PATCH)
- **Query parameters** (GET, DELETE)
- **URL parameters** (all methods)
- **Form data** (POST with form content-type)

```go
type SearchReq struct {
    Query string `query:"q"`
    Page  int    `query:"page"`
}

app.Get("/search", ginji.TypedHandlerFunc(
    func(c *ginji.Context, req SearchReq) ([]Result, error) {
        // req.Query and req.Page are populated from ?q=...&page=...
        return searchResults(req.Query, req.Page), nil
    },
))
```

### 2. Automatic Validation

Struct tags are automatically validated:

```go
type UpdateUserReq struct {
    Name string `json:"name" ginji:"required,min=2,max=50"`
    Age  int    `json:"age" ginji:"min=18,max=120"`
}

app.Put("/users/:id", ginji.TypedHandlerFunc(
    func(c *ginji.Context, req UpdateUserReq) (User, error) {
        // Validation happens before this handler is called
        // If validation fails, 422 error is returned automatically
        return updateUser(req), nil
    },
))
```

### 3. Type-Safe Responses

Return values are automatically marshaled to JSON:

```go
app.Get("/user/:id", ginji.TypedHandlerFunc(
    func(c *ginji.Context, req struct{ ID string }) (UserResponse, error) {
        user, err := getUser(req.ID)
        if err != nil {
            return UserResponse{}, err // Automatically becomes 500 error
        }
        return user, nil // Automatically becomes 200 JSON response
    },
))
```

### 4. Custom Status Codes

Use `TypedHandlerWithStatusFunc` for custom status codes:

```go
app.Post("/users", ginji.TypedHandlerWithStatusFunc(
    func(c *ginji.Context, req CreateUserReq) (int, UserResponse, error) {
        user := createUser(req)
        return 201, user, nil // Returns 201 Created
    },
))
```

### 5. Empty Requests/Responses

Use `EmptyRequest` for handlers without input or output:

```go
// No request body needed
app.Get("/status", ginji.TypedHandlerFunc(
    func(c *ginji.Context, _ ginji.EmptyRequest) (StatusResponse, error) {
        return StatusResponse{Status: "OK"}, nil
    },
))

// No response body (returns 204 No Content)
app.Delete("/users/:id", ginji.TypedHandlerFunc(
    func(c *ginji.Context, req struct{ ID string }) (ginji.EmptyRequest, error) {
        deleteUser(req.ID)
        return ginji.EmptyRequest{}, nil
    },
))
```

## Enhanced Error Messages

The enhanced system provides detailed error messages:

### Before
```
Invalid request: json: cannot unmarshal number into Go struct field
```

### After
```
Failed to bind request to type main.CreateUserReq: binding from JSON body (Content-Type: application/json) failed: json: cannot unmarshal number into Go struct field .Name of type string
```

Error messages include:
- Target type name with package path
- Binding source (JSON body, query parameters, etc.)
- Content-Type header
- Detailed cause

## Performance Optimizations

### Reflection Caching

Type checks are cached at handler creation time:

```go
// Type checks happen ONCE when handler is registered
handler := ginji.TypedHandlerFunc(func(c *ginji.Context, req MyReq) (MyRes, error) {
    // No reflection overhead at request time
    return MyRes{}, nil
})

// Subsequent requests use cached type information
app.Post("/endpoint", handler)
```

**Performance**: ~50% faster than uncached reflection

### Benchmark Results

```
BenchmarkTypedHandler-8   444814   2275 ns/op   7600 B/op   44 allocs/op
```

## BindingError Type

Detailed error information for debugging:

```go
type BindingError struct {
    Source      string  // "JSON body", "query parameters", etc.
    ContentType string  // Content-Type header
    Cause       error   // Underlying error
}
```

Access in error handlers:

```go
app.SetErrorHandler(func(c *ginji.Context, err error) {
    if bindErr, ok := err.(*ginji.BindingError); ok {
        log.Printf("Binding failed from %s: %v", bindErr.Source, bindErr.Cause)
    }
})
```

## Complete Example

```go
package main

import (
    "github.com/ginjigo/ginji"
)

type CreateUserReq struct {
    Name  string `json:"name" ginji:"required,min=2,max=50"`
    Email string `json:"email" ginji:"required,email"`
    Age   int    `json:"age" ginji:"min=18,max=120"`
}

type UpdateUserReq struct {
    Name string `json:"name" ginji:"min=2,max=50"`
    Age  *int   `json:"age" ginji:"min=18,max=120"` // Pointer = optional
}

type UserResponse struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
    Age   int    `json:"age"`
}

type UserListResponse struct {
    Users []UserResponse `json:"users"`
    Total int            `json:"total"`
}

func main() {
    app := ginji.New()
    app.Use(ginji.Logger())
    app.Use(ginji.DefaultErrorHandler())

    // Create user (returns 201)
    app.Post("/users", ginji.TypedHandlerWithStatusFunc(
        func(c *ginji.Context, req CreateUserReq) (int, UserResponse, error) {
            // Validation automatic
            user := UserResponse{
                ID:    generateID(),
                Name:  req.Name,
                Email: req.Email,
                Age:   req.Age,
            }
            return 201, user, nil
        },
    ))

    // Get user
    app.Get("/users/:id", ginji.TypedHandlerFunc(
        func(c *ginji.Context, req struct{ ID string }) (UserResponse, error) {
            user, err := dbGetUser(req.ID)
            if err != nil {
                return UserResponse{}, ginji.NewHTTPError(404, "User not found")
            }
            return user, nil
        },
    ))

    // List users with pagination
    app.Get("/users", ginji.TypedHandlerFunc(
        func(c *ginji.Context, req struct {
            Page  int    `query:"page"`
            Limit int    `query:"limit"`
            Sort  string `query:"sort"`
        }) (UserListResponse, error) {
            users, total := dbListUsers(req.Page, req.Limit, req.Sort)
            return UserListResponse{
                Users: users,
                Total: total,
            }, nil
        },
    ))

    // Update user
    app.Put("/users/:id", ginji.TypedHandlerFunc(
        func(c *ginji.Context, req struct {
            ID   string        `param:"id"`
            Data UpdateUserReq `json:"inline"`
        }) (UserResponse, error) {
            user, err := dbUpdateUser(req.ID, req.Data)
            if err != nil {
                return UserResponse{}, err
            }
            return user, nil
        },
    ))

    // Delete user (no response body)
    app.Delete("/users/:id", ginji.TypedHandlerFunc(
        func(c *ginji.Context, req struct{ ID string }) (ginji.EmptyRequest, error) {
            if err := dbDeleteUser(req.ID); err != nil {
                return ginji.EmptyRequest{}, err
            }
            return ginji.EmptyRequest{}, nil // Returns 204 No Content
        },
    ))

    _ = app.Listen(":3000")
}
```

## Migration Guide

### From Regular Handlers

**Before**:
```go
app.Post("/users", func(c *ginji.Context) {
    var req CreateUserReq
    if err := c.BindJSON(&req); err != nil {
        _ = c.Fail(400, "Invalid JSON")
        return
    }
    if err := c.BindValidate(&req); err != nil {
        _ = c.Fail(422, "Validation failed")
        return
    }
    
    user := createUser(req)
    _ = c.JSON(201, user)
})
```

**After**:
```go
app.Post("/users", ginji.TypedHandlerWithStatusFunc(
    func(c *ginji.Context, req CreateUserReq) (int, UserResponse, error) {
        return 201, createUser(req), nil
    },
))
```

**Benefits**:
- 70% less code
- Type safety at compile time
- Automatic validation
- Better error messages

## Best Practices

1. **Use struct tags for validation**
   ```go
   type Request struct {
       Email string `json:"email" ginji:"required,email"`
   }
   ```

2. **Return HTTPError for custom errors**
   ```go
   if notFound {
       return Response{}, ginji.NewHTTPError(404, "Not found")
   }
   ```

3. **Use EmptyRequest for no input**
   ```go
   func(c *ginji.Context, _ ginji.EmptyRequest) (Response, error)
   ```

4. **Use pointers for optional fields**
   ```go
   type UpdateReq struct {
       Name *string `json:"name"` // Optional
   }
   ```

5. **Combine with Context methods**
   ```go
   func(c *ginji.Context, req Request) (Response, error) {
       userID := c.Request.Param("userID") // Access context as needed
       return process(userID, req), nil
   }
   ```

## See Also

- [Schema Validation Guide](./schema-validation.md)
- [Error Handling Guide](./error-handling-modern.md)
- [Context API Guide](./modern-context-api.md)
