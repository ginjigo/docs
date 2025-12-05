# Schema-Based Validation

## Overview

Ginji's schema-based validation system provides a declarative, type-safe way to validate request data. Inspired by Elysia.js, it offers fluent API builders for defining validation rules that are both readable and maintainable.

## Quick Start

```go
import "github.com/ginjigo/schema"

// Define a schema
userSchema := schema.NewSchema(map[string]schema.Field{
    "email": *schema.String().Required().IsEmail(),
    "age":   *schema.Integer().Min(18).Max(120),
    "role":  *schema.String().Enum("admin", "user", "guest"),
})

// Use with route
app.Post("/users", handler).Body(userSchema)
```

## Field Types

### String

```go
schema.String().
    Required().          // Field is required
    MinLength(3).        // Minimum 3 characters
    MaxLength(50).       // Maximum 50 characters
    Pattern(`^[a-z]+$`). // Must match regex
    IsEmail().           // Must be valid email
    IsURL().             // Must be valid URL
    Enum("a", "b", "c"). // Must be one of these values
    Default("default").  // Default value if not provided
    Describe("desc")     // Documentation string
```

### Number & Integer

```go
// Float numbers
schema.Number().
    Required().
    Min(0.0).
    Max(100.0)

// Integers only
schema.Integer().
    Required().
    Min(18).
    Max(120)
```

### Boolean

```go
schema.Boolean().
    Required().
    Default(false)
```

### Array

```go
// Array of strings
schema.Array(schema.String().MinLength(2)).
    Min(1).  // At least 1 item
    Max(10)  // At most 10 items

// Array of numbers
schema.Array(schema.Integer().Min(0))
```

### Object (Nested)

```go
addressSchema := schema.NewSchema(map[string]schema.Field{
    "street": *schema.String().Required(),
    "city":   *schema.String().Required(),
    "zip":    *schema.String().Pattern(`^\d{5}$`),
})

// Use as nested object
userSchema := schema.NewSchema(map[string]schema.Field{
    "name":    *schema.String().Required(),
    "address": *schema.Object(addressSchema.Properties),
})
```

## Route-Level Validation

Attach schemas to routes for automatic validation:

```go
app.Post("/users", createUserHandler).
    Body(userSchema).            // Validate request body
    Summary("Create user").      // OpenAPI summary
    Tags("users")                // OpenAPI tags

app.Get("/search", searchHandler).
    Query(searchQuerySchema).    // Validate query params
    Summary("Search users")

app.Put("/users/:id", updateHandler).
    Params(idParamsSchema).      // Validate URL params
    Body(updateSchema)           // Validate body
```

## Manual Validation

Validate data manually in handlers:

```go
app.Post("/users", func(c *ginji.Context) {
    var data map[string]any
    if err := c.BindJSON(&data); err != nil {
        return c.Fail(400, "Invalid JSON")
    }

    // Validate against schema
    var errors []schema.ValidationError
    for field, value := range data {
        if fieldSchema, ok := userSchema.Properties[field]; ok {
            errors = append(errors, fieldSchema.Validate(value, field)...)
        }
    }

    if len(errors) > 0 {
        return c.FailWithData(422, "Validation failed", ginji.H{
            "errors": errors,
        })
    }

    // Data is valid
    return c.JSONOK(ginji.H{"user": data})
})
```

## Validation Error Format

Validation errors provide detailed information:

```json
{
  "field": "email",
  "message": "must be a valid email",
  "tag": "email",
  "value": "not-an-email"
}
```

Multiple errors:

```json
{
  "error": "Validation failed",
  "code": 422,
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email",
      "tag": "email",
      "value": "invalid"
    },
    {
      "field": "age",
      "message": "must be at least 18",
      "tag": "min",
      "value": 15
    }
  ]
}
```

## Complete Example

```go
package main

import (
    "github.com/ginjigo/ginji"
    "github.com/ginjigo/schema"
)

func main() {
    app := ginji.New()
    app.Use(ginji.Logger())
    app.Use(ginji.DefaultErrorHandler())

    // Define schema
    userSchema := schema.NewSchema(map[string]schema.Field{
        "email": *schema.String().
            Required().
            IsEmail().
            Describe("User email address"),
        "name": *schema.String().
            Required().
            MinLength(2).
            MaxLength(50),
        "age": *schema.Integer().
            Min(18).
            Max(120),
        "role": *schema.String().
            Enum("admin", "user", "guest").
            Default("user"),
        "tags": *schema.Array(schema.String().MinLength(2)).
            Min(1).
            Max(5),
    })

    // Create user with validation
    app.Post("/users", func(c *ginji.Context) {
        var user map[string]any
        if err := c.BindJSON(&user); err != nil {
            return c.Fail(400, "Invalid JSON")
        }

        // Validate
        var errors []schema.ValidationError
        for field, value := range user {
            if fs, ok := userSchema.Properties[field]; ok {
                errors = append(errors, fs.Validate(value, field)...)
            }
        }

        if len(errors) > 0 {
            return c.FailWithData(422, "Validation failed", ginji.H{
                "errors": errors,
            })
        }

        return c.JSONOK(ginji.H{
            "message": "User created",
            "user":    user,
        })
    }).Body(userSchema)

    _ = app.Listen(":3000")
}
```

## Comparison with Struct Tags

Ginji supports both approaches:

### Struct Tags (Existing)

```go
type User struct {
    Email string `json:"email" ginji:"required,email"`
    Age   int    `json:"age" ginji:"min=18,max=120"`
}

app.Post("/users", func(c *ginji.Context) {
    var user User
    if err := c.BindValidate(&user); err != nil {
        return c.Fail(422, err.Error())
    }
    // user is validated
})
```

### Schema Builders (New)

```go
userSchema := schema.NewSchema(map[string]schema.Field{
    "email": *schema.String().Required().IsEmail(),
    "age":   *schema.Integer().Min(18).Max(120),
})

app.Post("/users", handler).Body(userSchema)
```

### When to Use Each

**Use Struct Tags** when:
- You have well-defined Go structs
- Type safety at compile-time is important
- Simple validation rules

**Use Schema Builders** when:
- Working with dynamic data (maps)
- Need runtime schema generation
- Want explicit, readable validation
- Building APIs with OpenAPI documentation
- Complex nested validations

## Best Practices

1. **Define schemas as constants** for reuse:
   ```go
   var (
       UserSchema   = schema.NewSchema(...)
       UpdateSchema = schema.NewSchema(...)
   )
   ```

2. **Use descriptive field names** in errors:
   ```go
   errors := fieldSchema.Validate(value, "user.email")
   // Error: "user.email must be a valid email"
   ```

3. **Combine with error handling middleware**:
   ```go
   app.Use(ginji.DefaultErrorHandler())
   ```

4. **Add descriptions** for API documentation:
   ```go
   schema.String().
       Required().
       Describe("User's primary email address")
   ```

5. **Reuse nested schemas**:
   ```go
   addressSchema := schema.NewSchema(...)
   
   userSchema := schema.NewSchema(map[string]schema.Field{
       "address": *schema.Object(addressSchema.Properties),
   })
   ```

## Migration Guide

### From Manual Validation

**Before**:
```go
if user.Email == "" {
    return c.Fail(400, "Email is required")
}
if !emailRegex.MatchString(user.Email) {
    return c.Fail(400, "Invalid email")
}
```

**After**:
```go
emailField := schema.String().Required().IsEmail()
errors := emailField.Validate(user.Email, "email")
if len(errors) > 0 {
    return c.FailWithData(422, "Validation failed", ginji.H{
        "errors": errors,
    })
}
```

### From Struct Tags

Struct tags still work! Schema builders are additive:

```go
// Option 1: Keep using struct tags
type User struct {
    Email string `ginji:"required,email"`
}

// Option 2: Use schema builders
userSchema := schema.NewSchema(...)

// Option 3: Use both!
// Struct tags for Go type safety
// Schemas for API documentation
```

## See Also

- [Error Handling Guide](./error-handling-modern.md)
- [Context API Guide](./modern-context-api.md)
- [Examples](https://github.com/ginjigo/ginji/tree/main/examples/schema-validation)
