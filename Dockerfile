# Use the official Golang image as the base image
FROM golang:1.21-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the Go application source code into the container
COPY . .

# Fetch all packages
RUN go mod tidy

# Build the Go application
RUN go build -o main .

# Expose the port specified by the PORT environment variable (default to 8080)
EXPOSE $PORT

# Set environment variables
ENV PORT=$PORT
ENV PASSWORD=$PASSWORD

# Command to run the Go application
CMD ["./main"]
