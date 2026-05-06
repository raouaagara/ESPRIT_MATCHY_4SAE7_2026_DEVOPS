# -------------------------
# 1️⃣ Build avec Maven
# -------------------------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copier pom.xml (optimisation cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copier le code
COPY src ./src

# Build du jar
RUN mvn clean package -DskipTests

# -------------------------
# 2️⃣ Runtime léger
# -------------------------
FROM amazoncorretto:17

WORKDIR /app

# Copier le jar généré
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]