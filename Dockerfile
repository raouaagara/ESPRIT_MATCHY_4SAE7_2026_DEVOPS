FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /workspace

COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM amazoncorretto:17
WORKDIR /app
COPY --from=builder /workspace/target/content-service-0.0.1-SNAPSHOT.jar content-service.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "content-service.jar"]

