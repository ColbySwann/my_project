# syntax=docker/dockerfile:1

# Build stage: needs both a JDK (for Gradle/the backend) and Node/Yarn (for
# the frontend build that bootJar depends on — see build.gradle).
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

COPY . .
# Guards against Windows checkouts converting gradlew's line endings to
# CRLF, which corrupts its #!/bin/sh shebang inside this Linux stage
# (surfaces as "./gradlew: not found" even though the file is right there).
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
RUN ./gradlew bootJar --no-daemon

# Runtime stage: just a JRE and the one jar — no Node/Gradle/build tools in
# the final image.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/build/libs/socktical-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
