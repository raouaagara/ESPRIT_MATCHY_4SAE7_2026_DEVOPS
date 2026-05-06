package com.matchy.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
        System.out.println("\n===========================================");
        System.out.println("✅ Eureka Server Started Successfully!");
        System.out.println("📊 Dashboard: http://localhost:8761");
        System.out.println("===========================================\n");
    }
}
