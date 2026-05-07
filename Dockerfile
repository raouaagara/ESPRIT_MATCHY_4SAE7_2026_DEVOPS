FROM amazoncorretto:17

WORKDIR /app

COPY app.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]