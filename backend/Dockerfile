# ==========================================
# Multi-stage Cloud Dockerfile for AmazingDeal Backend
# Target: Render Free Tier / Oracle Cloud Always Free VM
# Runtime: Alpine Linux + Eclipse Temurin Java 21 JRE
# ==========================================

# Stage 1: Build JAR using Maven
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace/app

# Copy Maven wrapper and POM first for layer caching
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
# Download dependencies offline cache
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build jar
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal Production JRE Image (<180MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add unprivileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy compiled executable JAR from builder
COPY --from=builder --chown=appuser:appgroup /workspace/app/target/*.jar app.jar

# Cloud container port
ENV PORT=8080
EXPOSE 8080

# Low-RAM memory optimization flags for free-tier containers (512MB RAM on Render)
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-XX:+OptimizeStringConcat", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
