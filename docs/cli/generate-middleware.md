# ginji generate middleware

Generate custom middleware functions that integrate seamlessly with the Ginji middleware chain.

## Usage

```bash
ginji generate middleware <name>
```

**Aliases:**
```bash
ginji g mw <name>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Middleware name (will be converted to PascalCase) | Yes |

## Examples

### Generate Middleware

Generate a custom middleware:

```bash
ginji generate middleware Auth
```

**Generated file:** `middleware/auth.go`

```go
package middleware

import "github.com/ginjigo/ginji"

// Auth is a middleware that processes auth
func Auth() ginji.Middleware {
	return func(c *ginji.Context) {
		// TODO: Implement middleware logic before handler
		
		// Call the next handler
		c.Next()
		
		// TODO: Implement middleware logic after handler
	}
}
```

### More Examples

```bash
# Generate request ID middleware
ginji generate middleware RequestID

# Generate API key validation
ginji generate middleware APIKey

# Generate rate limiter
ginji generate middleware RateLimit
```

## Name Formatting

The CLI automatically formats middleware names:

| Input | Function Name | File Name |
|-------|--------------|-----------|
| `Auth` | `Auth` | `auth.go` |
| `request_id` | `RequestId` | `request-id.go` |
| `API-KEY` | `ApiKey` | `api-key.go` |

## Using Generated Middleware

After generating middleware, use it in your application:

### Global Middleware

Apply to all routes:

```go
package main

import (
    "github.com/ginjigo/ginji"
    "your-project/middleware"
)

func main() {
    app := ginji.New()
    
    // Apply middleware globally
    app.Use(middleware.Auth())
    
    app.Get("/protected", handlers.Protected)
    app.Listen(":3000")
}
```

### Route-Specific Middleware

Apply to specific routes:

```go
app.Get("/admin", handlers.AdminDashboard, middleware.Auth())

// Or with route groups
admin := app.Group("/admin", middleware.Auth())
admin.Get("/users", handlers.ListUsers)
admin.Get("/settings", handlers.Settings)
```

## Middleware Patterns

### Pre-Handler Logic

Execute code before the handler runs:

```go
func Auth() ginji.Middleware {
    return func(c *ginji.Context) {
        token := c.Header("Authorization")
        
        if token == "" {
            c.AbortWithError(401, ginji.ErrUnauthorized)
            return
        }
        
        user, err := validateToken(token)
        if err != nil {
            c.AbortWithError(401, ginji.ErrUnauthorized)
            return
        }
        
        // Store user in context for handlers
        c.Set("user", user)
        
        // Continue to next handler
        c.Next()
    }
}
```

### Post-Handler Logic

Execute code after the handler runs:

```go
func ResponseTime() ginji.Middleware {
    return func(c *ginji.Context) {
        start := time.Now()
        
        // Process request
        c.Next()
        
        // Calculate response time
        duration := time.Since(start)
        c.Header("X-Response-Time", duration.String())
    }
}
```

### Wrap Handler

Execute code before and after:

```go
func Logger() ginji.Middleware {
    return func(c *ginji.Context) {
        log.Printf("→ %s %s", c.Req.Method, c.Req.URL.Path)
        
        c.Next()
        
        log.Printf("← %d %s", c.StatusCode(), c.Req.URL.Path)
    }
}
```

## Advanced Examples

### Middleware with Configuration

```go
type AuthConfig struct {
    Secret string
    Header string
}

func AuthWithConfig(config AuthConfig) ginji.Middleware {
    if config.Header == "" {
        config.Header = "Authorization"
    }
    
    return func(c *ginji.Context) {
        token := c.Header(config.Header)
        
        // Validate with config.Secret...
        c.Next()
    }
}
```

**Usage:**
```go
app.Use(middleware.AuthWithConfig(middleware.AuthConfig{
    Secret: "my-secret-key",
    Header: "X-API-Key",
}))
```

### Conditional Middleware

```go
func RateLimit() ginji.Middleware {
    limiter := newRateLimiter()
    
    return func(c *ginji.Context) {
        // Skip rate limiting for health checks
        if c.Req.URL.Path == "/health" {
            c.Next()
            return
        }
        
        ip := c.Req.RemoteAddr
        if !limiter.Allow(ip) {
            c.AbortWithError(429, ginji.ErrTooManyRequests)
            return
        }
        
        c.Next()
    }
}
```

## Best Practices

1. **Keep middleware focused** - Each middleware should do one thing well
2. **Call c.Next()** - Always call it unless you want to stop the chain
3. **Handle errors properly** - Use `c.AbortWithError()` to stop execution
4. **Be mindful of order** - Middleware executes in the order it's registered
5. **Store data in context** - Use `c.Set()` to pass data to handlers
6. **Document behavior** - Add comments explaining what the middleware does

## Middleware Execution Order

```go
app.Use(middleware.Logger())     // 1st: Runs first
app.Use(middleware.Auth())        // 2nd: Runs second
app.Use(middleware.RateLimit())   // 3rd: Runs third

app.Get("/api/users", handler)    // 4th: Handler runs last

// Then they execute in reverse for post-handler logic:
// Logger (post) ← Auth (post) ← RateLimit (post) ← Handler
```

## Related Commands

- [Generate handler](/cli/generate-handler) - Generate HTTP handlers
- [Generate CRUD](/cli/generate-crud) - Generate CRUD operations

## See Also

- [Middleware Guide](/guide/middleware)
- [Built-in Middleware](/middleware/)
- [Context API](/guide/context)
