# Best Practices

Follow these best practices for production-ready Ginji applications.

## Project Structure

```
myapp/
├── main.go
├── handlers/
│   ├── users.go
│   ├── posts.go
│   └── auth.go
├── middleware/
│   └── custom.go
├── models/
│   ├── user.go
│   └── post.go
├── services/
│   ├── user_service.go
│   └── post_service.go
├── config/
│   └── config.go
└── tests/
    └── handlers_test.go
```

## Error Handling

Always handle errors properly:

```go
app.Get("/users/:id", func(c *ginji.Context) {
    id := c.Param("id")
    
    user, err := userService.Find(id)
    if err != nil {
        c.AbortWithError(ginji.NewNotFoundError("User not found"))
        return
    }
    
    c.JSON(ginji.StatusOK, user)
})
```

## Validation

Validate all input:

```go
type CreateUserRequest struct {
    Email    string `json:"email" ginji:"required,email"`
    Password string `json:"password" ginji:"required,min=8"`
    Age      int    `json:"age" ginji:"required,gte=18"`
}

app.Post("/users", func(c *ginji.Context) {
    var req CreateUserRequest
    if err := c.BindJSON(&req); err != nil {
        return // Validation errors handled automatically
    }
    
    // Proceed with valid data
})
```

## Security

### Use HTTPS

```go
app.ListenTLS(":443", "cert.pem", "key.pem")
```

### Security Headers

```go
app.Use(middleware.SecureStrict())
```

### Rate Limiting

```go
app.Use(middleware.RateLimitPerMinute(100))
```

### Authentication

```go
protected := app.Group("/api")
protected.Use(middleware.BearerAuth(validateToken))
```

## Configuration

Use environment variables:

```go
type Config struct {
    Port     string
    Database string
    JWTSecret string
}

func LoadConfig() *Config {
    return &Config{
        Port:     getEnv("PORT", "8080"),
        Database: getEnv("DATABASE_URL", "postgres://localhost/mydb"),
        JWTSecret: getEnv("JWT_SECRET", ""),
    }
}

func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}
```

## Logging

Use structured logging with the logger middleware:

```go
import (
    "github.com/ginjigo/middleware"
)

app.Use(middleware.Logger())  // Automatic structured logging

// Log custom events in handlers
app.Get("/users/:id", func(c *ginji.Context) {
    app.Logger.Info("User accessed",
        slog.String("user_id", c.Param("id")),
        slog.String("ip", c.Req.RemoteAddr),
    )
    // ...
})
```

See [Logging Guide](/guide/logging) for comprehensive details.

## Graceful Shutdown

Always use graceful shutdown in production:

```go
import "time"

func main() {
    app := ginji.New()
    
    // Routes and middleware...
    
    // Graceful shutdown with 30-second timeout
    // Stops plugins, waits for in-flight requests
    if err := app.ListenWithShutdown(":8080", 30*time.Second); err != nil {
        app.Logger.Error("Server error", slog.String("error", err.Error()))
    }
}
```

## Testing

Write comprehensive tests:

```go
func TestUserAPI(t *testing.T) {
    app := setupTestApp()
    
    tests := []struct {
        name   string
        method string
        path   string
        body   any
        want   int
    }{
        {"list users", "GET", "/users", nil, 200},
        {"create user", "POST", "/users", validUser, 201},
        {"invalid user", "POST", "/users", invalidUser, 400},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            w := ginji.PerformJSONRequest(app, tt.method, tt.path, tt.body)
            ginji.AssertStatus(t, w, tt.want)
        })
    }
}
```

## Deployment

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o main .

FROM alpine:latest
COPY --from=builder /app/main /main
EXPOSE 8080
CMD ["/main"]
```

### Health Checks

```go
app.Use(middleware.Health())
```

## Monitoring

Add metrics:

```go
var (
    requestCount = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
        },
        []string{"method", "path", "status"},
    )
)

app.Use(func(next ginji.Handler) ginji.Handler {
    return func(c *ginji.Context) {
        next(c)
        
        requestCount.WithLabelValues(
            c.Req.Method,
            c.Req.URL.Path,
            fmt.Sprintf("%d", c.Writer.Status()),
        ).Inc()
    }
})
```

## Checklist

- ✅ Use HTTPS in production
- ✅ Enable security headers
- ✅ Implement rate limiting
- ✅ Add authentication/authorization
- ✅ Validate all input
- ✅ Handle errors properly
- ✅ Use structured logging
- ✅ Add health checks
- ✅ Implement graceful shutdown
- ✅ Write tests
- ✅ Monitor with metrics
- ✅ Use environment variables for config
