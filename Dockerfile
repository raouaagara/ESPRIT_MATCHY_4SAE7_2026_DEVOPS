FROM amazoncorretto:17
EXPOSE 8081
ADD target/content-service-0.0.1-SNAPSHOT.jar content-service.jar
ENTRYPOINT ["java", "-jar","content-service.jar"]