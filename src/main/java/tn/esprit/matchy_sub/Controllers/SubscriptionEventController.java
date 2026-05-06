package tn.esprit.matchy_sub.Controllers;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.matchy_sub.client.EventFeignClient;
import tn.esprit.matchy_sub.dto.EvenementDTO;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Controller that exposes event-related data to subscription clients
 * by calling event-service via OpenFeign.
 */
@RestController
@RequestMapping("/api/subscription/events")
@AllArgsConstructor
@Slf4j
public class SubscriptionEventController {

    private final EventFeignClient eventFeignClient;

    /**
     * Returns upcoming events from event-service.
     * Subscribers can see what events are available.
     */
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingEvents() {
        try {
            List<EvenementDTO> events = eventFeignClient.getUpcomingEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.warn("Could not fetch upcoming events from event-service: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "events", Collections.emptyList(),
                    "warning", "Event service temporarily unavailable"
            ));
        }
    }

    /**
     * Returns all event registrations for a given user from event-service.
     * Useful to display a subscriber's event history.
     */
    @GetMapping("/user/{userId}/registrations")
    public ResponseEntity<?> getUserEventRegistrations(@PathVariable Long userId) {
        try {
            List<Object> registrations = eventFeignClient.getRegistrationsByUser(userId);
            return ResponseEntity.ok(registrations);
        } catch (Exception e) {
            log.warn("Could not fetch registrations for user {} from event-service: {}", userId, e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "registrations", Collections.emptyList(),
                    "warning", "Event service temporarily unavailable"
            ));
        }
    }

    /**
     * Returns a specific event by ID from event-service.
     */
    @GetMapping("/{eventId}")
    public ResponseEntity<?> getEventById(@PathVariable Long eventId) {
        try {
            EvenementDTO event = eventFeignClient.getEventById(eventId);
            return ResponseEntity.ok(event);
        } catch (feign.FeignException.NotFound e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.warn("Could not fetch event {} from event-service: {}", eventId, e.getMessage());
            return ResponseEntity.status(503)
                    .body(Map.of("error", "Event service temporarily unavailable"));
        }
    }
}
