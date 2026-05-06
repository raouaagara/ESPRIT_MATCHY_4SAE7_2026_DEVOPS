package tn.esprit.matchy_sub.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tn.esprit.matchy_sub.client.UserBackendFeignClient;

import java.util.Map;

/**
 * Client to fetch user information from the Matchy node backend (matchy_db).
 * The Subscription microservice does NOT store users locally — it relies on
 * matchy backend as the single source of truth.
 */
@Component
@Slf4j
public class UserClient {

    private final UserBackendFeignClient backendFeignClient;

    public UserClient(UserBackendFeignClient backendFeignClient) {
        this.backendFeignClient = backendFeignClient;
    }

    /**
     * Fetch user info from matchy backend using OpenFeign.
     * Returns map: { id, fullName, name, email, role, avatar, status, ... } or null.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUser(Long userId) {
        if (userId == null) return null;
        try {
            return backendFeignClient.getUserById(userId);
        } catch (Exception e) {
            log.warn("UserClient: failed to fetch user {} from backend-service: {}", userId, e.getMessage());
            return null;
        }
    }

    public String getUserName(Long userId) {
        Map<String, Object> u = getUser(userId);
        if (u == null) return null;
        Object name = u.getOrDefault("name", u.get("fullName"));
        return name == null ? null : String.valueOf(name);
    }

    public String getUserEmail(Long userId) {
        Map<String, Object> u = getUser(userId);
        if (u == null) return null;
        Object email = u.get("email");
        return email == null ? null : String.valueOf(email);
    }
}
