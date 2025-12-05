# Graceful Shutdown

Learn how to implement graceful shutdown in your Ginji applications for zero-downtime deployments.

## Why Graceful Shutdown?

Graceful shutdown ensures:
- **In-flight requests complete** before server stops
- **Plugins clean up resources** (database connections, file handles)
- **No abrupt connection terminations**
- **Safe deployments** with rolling updates

## Basic Usage

Use `ListenWithShutdown()` instead of `Listen()`:

```go
package main

import (
    "time"
    "github.com/ginjigo/ginji"
)

func main() {
    app := ginji.New()
    
    app.Get("/", func(c *ginji.Context) {
        c.JSON(200, ginji.H{"message": "Hello"})
    })
    
    // Graceful shutdown with 30-second timeout
    if err := app.ListenWithShutdown(":3000", 30*time.Second); err != nil {
        app.Logger.Error("Server error", slog.String("error", err.Error()))
    }
}
```

## How It Works

When the server receives `SIGINT` (Ctrl+C) or `SIGTERM`:

1. **Stop accepting new connections**
2. **Stop plugins** (cleanup resources)
3. **Wait for in-flight requests** (up to timeout duration)
4. **Shutdown gracefully** (or force close after timeout)

## HTTPS with Graceful Shutdown

For TLS/HTTPS servers:

```go
err := app.ListenTLSWithShutdown(
    ":443",
    "server.crt",
    "server.key",
    30*time.Second,
)
```

## Timeout Configuration

Choose appropriate timeout based on your longest request:

```go
// Short-lived API requests
app.ListenWithShutdown(":3000", 10*time.Second)

// Long-running operations
app.ListenWithShutdown(":3000", 60*time.Second)

// Background jobs
app.ListenWithShutdown(":3000", 5*time.Minute)
```

## Plugin Cleanup

Plugins are automatically stopped during shutdown:

```go
type MyPlugin struct {
    db *sql.DB
}

func (p *MyPlugin) Start() error {
    // Initialize resources
    db, err := sql.Open("postgres", "...")
    p.db = db
    return err
}

func (p *MyPlugin) Stop() error {
    // Cleanup runs automatically during shutdown
    app.Logger.Info("Closing database connections")
    return p.db.Close()
}

app.UsePlugin(myPlugin)
app.ListenWithShutdown(":3000", 30*time.Second)
// When receiving SIGTERM, plugin.Stop() is called
```

## Handling Long-Running Requests

For endpoints that take time to complete:

```go
app.Get("/export", func(c *ginji.Context) {
    // This will complete before shutdown (if within timeout)
    time.Sleep(10 * time.Second)
    
    data := generateReport()
    c.JSON(200, data)
})
```

**Important**: If a request exceeds the shutdown timeout, it will be forcefully terminated.

## Kubernetes Deployment

Configure proper termination grace period:

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 45  # Must be > shutdown timeout
      containers:
      - name: ginji-app
        image: myapp:latest
        ports:
        - containerPort: 3000
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]  # Allow time for load balancer de-registration
```

## Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    stop_grace_period: 45s  # Must be > shutdown timeout
    stop_signal: SIGTERM
```

## Complete Example

```go
package main

import (
    "log"
    "time"
    
    "github.com/ginjigo/ginji"
    "github.com/ginjigo/middleware"
)

func main() {
    app := ginji.New()
    
    // Middleware
    app.Use(middleware.Logger())
    app.Use(middleware.Recovery())
    
    // Routes
    app.Get("/", func(c *ginji.Context) {
        c.JSON(200, ginji.H{"status": "ok"})
    })
    
    app.Get("/long", func(c *ginji.Context) {
        // Simulate long operation
        app.Logger.Info("Long request started")
        time.Sleep(5 * time.Second)
        app.Logger.Info("Long request completed")
        c.JSON(200, ginji.H{"status": "completed"})
    })
    
    // Graceful shutdown with 30-second timeout
    app.Logger.Info("Server starting on :3000")
    
    if err := app.ListenWithShutdown(":3000", 30*time.Second); err != nil {
        log.Fatal(err)
    }
}
```

## Testing Graceful Shutdown

```bash
# Terminal 1: Start server
go run main.go

# Terminal 2: Start long request
curl http://localhost:3000/long &

# Terminal 1: Send SIGTERM (within 5 seconds of starting request)
# Press Ctrl+C

# Observe: Request completes before server stops
```

**Expected Logs**:
```
Server starting on :3000
Long request started
Received shutdown signal
Long request completed
Server gracefully stopped
```

## Comparison

| Method | Shutdown Handling | Use Case |
|--------|-------------------|----------|
| `Listen()` | Immediate termination | Development only |
| `ListenWithShutdown()` | Graceful with timeout | **Production** (recommended) |
| Custom `http.Server` | Manual implementation | Advanced customization |

## Best Practices

1. **Set appropriate timeouts** - Longer than your longest request
2. **Use in production** - Always use graceful shutdown for prod deployments
3. **Test shutdown behavior** - Verify long requests complete
4. **Monitor shutdown logs** - Check for forced terminations
5. **Configure K8s properly** - `terminationGracePeriod` > shutdown timeout

## See Also

- [Best Practices](/advanced/best-practices#graceful-shutdown) - Production guidelines
- [Plugin System](/guide/plugins) - Creating plugins with cleanup
- [Examples](https://github.com/ginjigo/ginji/tree/main/examples/graceful-shutdown) - Full example
