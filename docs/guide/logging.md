# Structured Logging

Learn how to use Ginji's built-in structured logging with Go's `slog` package.

## Overview

Ginji integrates Go's `log/slog` package for structured, machine-readable logging. Every application has a `Logger` field initialized automatically based on the application mode.

## Engine Logger

### Automatic Initialization

The logger is created when you call `ginji.New()`:

```go
app := ginji.New()  // Logger is automatically initialized

// In debug mode: JSON logs with debug level
// In release mode: JSON logs with info level
```

### Using the Logger

Access the logger via `app.Logger`:

```go
app.Get("/users/:id", func(c *ginji.Context) {
    userID := c.Param("id")
    
    // Log with structured attributes
    app.Logger.Info("User accessed",
        slog.String("user_id", userID),
        slog.String("ip", c.Req.RemoteAddr),
    )
    
    c.JSON(200, ginji.H{"user_id": userID})
})
```

## Log Levels

### Available Levels

```go
app.Logger.Debug("Detailed debugging information")
app.Logger.Info("General informational messages")
app.Logger.Warn("Warning messages")
app.Logger.Error("Error messages")
```

### Setting Log Level

Configure via `slog.HandlerOptions`:

```go
app := ginji.New()

// Custom logger with warn level
app.Logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelWarn,  // Only warnings and errors
}))
```

## Structured Attributes

### Common Patterns

```go
// User events
app.Logger.Info("User login",
    slog.String("user_id", userID),
    slog.String("email", email),
    slog.Time("login_at", time.Now()),
)

// Database operations
app.Logger.Info("Database query",
    slog.String("query", "SELECT * FROM users"),
    slog.Duration("duration", elapsed),
    slog.Int("rows", rowCount),
)

// Errors
app.Logger.Error("Database error",
    slog.String("error", err.Error()),
    slog.String("operation", "insert_user"),
)

// Business metrics
app.Logger.Info("Order placed",
    slog.String("order_id", orderID),
    slog.Float64("amount", total),
    slog.String("currency", "USD"),
)
```

## Log Handlers

### JSON Handler (Default)

Best for production - machine parseable:

```go
app.Logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
```

**Output**:
```json
{"time":"2024-12-05T10:15:00Z","level":"INFO","msg":"User login","user_id":"123","email":"user@example.com"}
```

### Text Handler

Better for development - human readable:

```go
app.Logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelDebug,
}))
```

**Output**:
```
time=2024-12-05T10:15:00.000Z level=INFO msg="User login" user_id=123 email=user@example.com
```

## Request Logging Middleware

Use the logger middleware for automatic HTTP request logging:

```go
import (
    "github.com/ginjigo/ginji"
    "github.com/ginjigo/middleware"
)

func main() {
    app := ginji.New()
    
    // Automatic request/response logging
    app.Use(middleware.Logger())
    
    app.Get("/", handler)
    app.Listen(":3000")
}
```

See [Logger Middleware](/middleware/logger) for full details.

## Best Practices

### 1. Use Structured Attributes

❌ **Don't**:
```go
app.Logger.Info(fmt.Sprintf("User %s logged in", userID))
```

✅ **Do**:
```go
app.Logger.Info("User logged in", slog.String("user_id", userID))
```

### 2. Choose Appropriate Levels

- `Debug` - Detailed tracing, disabled in production
- `Info` - Normal operations (user login, API calls)
- `Warn` - Unexpected but handled (retry, fallback)
- `Error` - Failures requiring attention

### 3. Add Context

Include relevant context for debugging:

```go
app.Logger.Error("Failed to create user",
    slog.String("error", err.Error()),
    slog.String("email", email),
    slog.String("request_id", requestID),
    slog.String("ip", c.Req.RemoteAddr),
)
```

### 4. Avoid Sensitive Data

Never log passwords, tokens, or PII:

```go
// ❌ DON'T
app.Logger.Info("User created", slog.String("password", password))

// ✅ DO
app.Logger.Info("User created", slog.String("user_id", userID))
```

## Integration Examples

### With Error Handling

```go
user, err := userService.GetByID(id)
if err != nil {
    app.Logger.Error("User not found",
        slog.String("user_id", id),
        slog.String("error", err.Error()),
    )
    return c.JSON(404, ginji.H{"error": "User not found"})
}

app.Logger.Info("User retrieved", slog.String("user_id", id))
c.JSON(200, user)
```

### With Metrics

```go
start := time.Now()
result, err := expensiveOperation()
duration := time.Since(start)

app.Logger.Info("Operation completed",
    slog.Duration("duration", duration),
    slog.Bool("success", err == nil),
)
```

### With Middleware

```go
func RequestIDMiddleware() ginji.Middleware {
    return func(c *ginji.Context) {
        requestID := generateID()
        c.Set("request_id", requestID)
        
        app.Logger.Info("Request started",
            slog.String("request_id", requestID),
            slog.String("path", c.Req.URL.Path),
        )
        
        c.Next()
    }
}
```

## Configuration by Environment

```go
func setupLogger(env string) *slog.Logger {
    var handler slog.Handler
    
    switch env {
    case "production":
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: slog.LevelInfo,
        })
    case "development":
        handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
            Level: slog.LevelDebug,
        })
    default:
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: slog.LevelWarn,
        })
    }
    
    return slog.New(handler)
}

func main() {
    app := ginji.New()
    app.Logger = setupLogger(os.Getenv("ENV"))
    // ...
}
```

## See Also

- [Logger Middleware](/middleware/logger) - Automatic request logging
- [Best Practices](/advanced/best-practices#logging) - Production logging tips
- [Examples](https://github.com/ginjigo/ginji/tree/main/examples/logging) - Full example
