package tn.esprit.matchy_sub.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.esprit.matchy_sub.dto.EvenementDTO;

import java.util.List;

/**
 * Feign client for inter-service communication with event-service.
 * Used by subscription-service to retrieve events registered by a user,
 * enabling enriched subscription dashboards.
 */
@FeignClient(name = "event-service", path = "/api")
public interface EventFeignClient {

    /**
     * Retrieve all registrations for a given user from event-service.
     */
    @GetMapping("/registrations/user/{userId}")
    List<Object> getRegistrationsByUser(@PathVariable("userId") Long userId);

    /**
     * Retrieve all upcoming events — useful to display to subscribers.
     */
    @GetMapping("/evenements/upcoming")
    List<EvenementDTO> getUpcomingEvents();

    /**
     * Retrieve a specific event by ID.
     */
    @GetMapping("/evenements/{id}")
    EvenementDTO getEventById(@PathVariable("id") Long id);
}
