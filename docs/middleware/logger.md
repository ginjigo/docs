# Logger Middleware

The logger middleware provides structured HTTP request/response logging using Go's `slog` package.

## Features

- **Structured Logging** - JSON-formatted logs for machine parsing
- **Automatic Log Levels** - Info (2xx), Warn (4xx), Error (5xx)
- **Skip Paths** - Exclude health checks or other noisy endpoints
- **Custom Skip Logic** - Use a function to determine what to skip
- **Rich Context** - Method, path, status, latency, IP, user agent

## Basic Usage

```go
import (
    "github.com/ginjigo/ginji"
    "github.com/ginjigo/middleware"
)

func main() {
    app := ginji.New()
    
    // Add logger middleware
    app.Use(middleware.Logger())
    
    app.Get("/", func(c *ginji.Context) {
        c.JSON(200, ginji.H{"message": "Hello"})
    })
    
    app.Listen(":3000")
}
```

**Output** (JSON):
```json
{
  "time":"2024-12-05T10:15:00Z",
  "level":"INFO",
  "msg":"Request processed",
  "status":200,
  "method":"GET",
  "path":"/",
  "ip":"127.0.0.1:54321",
  "latency":"1.234ms",
  "user_agent":"curl/7.88.0"
}
```

## Configuration

### Skip Paths

Exclude specific paths from logging (e.g., health checks):

```go
app.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    SkipPaths: []string{"/health", "/metrics"},
}))
```

### Skip Function

Use custom logic to determine what to skip:

```go
app.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    SkipFunc: func(c *ginji.Context) bool {
        // Skip logging for requests with X-Skip-Log header
        return c.Header("X-Skip-Log") == "true"
    },
}))
```

### Custom Logger

Use your own `slog.Logger` instance:

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelDebug,
}))

app.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    Logger: logger,
}))
```

## Log Levels

The middleware automatically selects log levels based on HTTP status codes:

| Status Code | Level | Message |
|-------------|-------|---------|
| 2xx | `INFO` | "Request processed" |
| 4xx | `WARN` | "Client error" |
| 5xx | `ERROR` | "Server error" |

## Logged Attributes

Each log entry includes:

- `status` - HTTP status code
- `method` - HTTP method (GET, POST, etc.)
- `path` - Request path
- `ip` - Client IP address
- `latency` - Request duration
- `user_agent` - Client user agent
- `query` - Query string (if present)
- `aborted` - Whether request was aborted (if true)

## Using Engine Logger

Access the engine's logger in your handlers:

```go
app.Get("/users/:id", func(c *ginji.Context) {
    userID := c.Param("id")
    
    // Log custom events
    app.Logger.Info("User profile accessed",
        slog.String("user_id", userID),
        slog.String("ip", c.Req.RemoteAddr),
    )
    
    c.JSON(200, ginji.H{"user_id": userID})
})
```

## Example Output

```json
{
  "time":"2024-12-05T10:15:00.123Z",
  "level":"INFO",
  "msg":"Request processed",
  "status":200,
  "method":"GET",
  "path":"/api/users/123",
  "ip":"192.168.1.100:54321",
  "latency":"15.234ms",
  "user_agent":"Mozilla/5.0..."
}
{
  "time":"2024-12-05T10:15:01.456Z",
  "level":"WARN",
  "msg":"Client error",
  "status":404,
  "method":"GET",
  "path":"/api/notfound",
  "ip":"192.168.1.100:54322",
  "latency":"0.345ms",
  "user_agent":"curl/7.88.0"
}
{
  "time":"2024-12-05T10:15:02.789Z",
  "level":"ERROR",
  "msg":"Server error",
  "status":500,
  "method":"POST",
  "path":"/api/tasks",
  "ip":"192.168.1.100:54323",
  "latency":"120.567ms",
  "user_agent":"PostmanRuntime/7.32.3"
}
```

## See Also

- [Structured Logging Guide](/guide/logging) - Comprehensive logging guide
- [Best Practices](/advanced/best-practices#logging) - Logging best practices
- [Examples](https://github.com/ginjigo/ginji/tree/main/examples/logging) - Full example
