# Error Handling Guide

## Overview

Ginji provides comprehensive error handling capabilities including stack traces in debug mode, validation error formatting, and custom error handlers.

## Default Error Handling

By default, Ginji handles errors automatically when you use the error handling middleware:

```go
app := ginji.New()

// Add error handling middleware
app.Use(ginji.DefaultErrorHandler())

app.Get("/user/:id", func(c*ginji.Context) {
    user, err := db.GetUser(c.Request.Param("id"))
    if err != nil {
        // Error will be handled automatically
        c.Error(err)
        return
    }
    _ = c.JSONOK(user)
})
```

## HTTP Errors

Create structured HTTP errors:

```go
// Using predefined errors
return c.AbortWithError(404, ginji.ErrNotFound)

// Creating custom errors
return c.AbortWithError(400, ginji.NewHTTPError(400, "Invalid input"))

// With additional details
err := ginji.NewHTTPError(400, "Validation failed").WithDetails(ginji.H{
    "fields": []string{"email", "password"},
})
return c.AbortWithError(400, err)
```

## Quick Error Responses

Use convenience methods for common error patterns:

```go
// Simple error response
if !authorized {
    return c.Fail(401, "Unauthorized")
}

// Error with data
if err := validate(input); err != nil {
    return c.FailWithData(400, "Validation failed", ginji.H{
        "error": err.Error(),
    })
}
```

## Validation Errors

Ginji formats validation errors with field-level details:

```go
app.Post("/register", func(c *ginji.Context) {
    var input RegisterInput
    if err := c.BindValidate(&input); err != nil {
        // Automatically formatted as validation error
        c.AbortWithError(422, err)
        return
    }
    // ... handle registration
})
```

Response format:
```json
{
  "error": "Validation failed",
  "code": 422,
  "errors": [
    {
      "field": "email",
      "message": "email is required",
      "tag": "required"
    }
  ]
}
```

## Custom Error Handler

Override the default error handling:

```go
app := ginji.New()

// Set custom error handler
app.SetErrorHandler(func(c *ginji.Context, err error) {
    // Log to your logging system
    logger.Error("Request error", "err", err, "path", c.Req.URL.Path)
    
    // Custom error response
    _ = c.JSON(500, ginji.H{
        "success": false,
        "error":   "Something went wrong",
        "request_id": c.GetString("request_id"),
    })
})
```

## Stack Traces in Debug Mode

In debug mode, errors include stack traces:

```go
ginji.SetMode(ginji.DebugMode)

app := ginji.New()
// Errors will now include stack traces in responses
```

Response with stack trace:
```json
{
  "error": "Internal server error",
  "code": 500,
  "stack": "\n  /path/to/handler.go:42 main.handler\n  /path/to/ginji/router.go:123 router.handle"
}
```

> **⚠️ Warning**: Stack traces are never included in release mode for security.

## Error Response Format

Standard error response structure:

```json
{
  "error": "Error message",
  "code": 400,
  "details": {},           // optional
  "stack": "...",          // debug mode only
  "errors": []             // validation errors only
}
```

## Best Practices

1. **Use DefaultErrorHandler middleware** - Ensures errors are properly handled
2. **Use HTTPError for structured errors** - Provides consistent error responses
3. **Disable debug mode in production** - Prevents stack trace leakage
4. **Use Fail() for common errors** - Quick one-liner error responses
5. **Log errors in custom handler** - Integrate with your logging system

## Example: Complete Error Handling

```go
package main

import (
    "github.com/ginjigo/ginji"
)

func main() {
    app := ginji.New()
    
    // Add error handling
    app.Use(ginji.DefaultErrorHandler())
    
    // Custom 404 handler
    app.UsePlugin(notFoundPlugin())
    
    app.Get("/user/:id", func(c *ginji.Context) {
        id := c.Request.Param("id")
        
        // Validate input
        if id == "" {
            return c.Fail(400, "User ID is required")
        }
        
        // Fetch user
        user, err := fetchUser(id)
        if err != nil {
            if err == ErrUserNotFound {
                return c.Fail(404, "User not found")
            }
            // Internal error
            c.Error(err)
            return
        }
        
        _ = c.JSONOK(user)
    })
    
    _ = app.Listen(":3000")
}
```
