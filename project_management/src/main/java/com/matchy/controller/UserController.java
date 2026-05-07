package com.matchy.controller;

import com.matchy.entity.User;
import com.matchy.service.GoogleOAuthService;
import com.matchy.service.UserService;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class UserController {

    @Autowired private UserService userService;

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(userService.login(body.get("email"), body.get("password")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User created = userService.createUser(user);
            created.setPassword(null);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Forgot Password
    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            userService.sendResetLink(body.get("email"));
        } catch (Exception ignored) {}
        // Toujours répondre OK pour ne pas révéler si l'email existe
        return ResponseEntity.ok(Map.of("message", "Reset link sent if email exists"));
    }

    // ── Reset Password
    @PostMapping("/api/auth/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            boolean success = userService.resetPassword(body.get("token"), body.get("newPassword"));
            if (success) return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
            .map(u -> { u.setPassword(null); return ResponseEntity.ok(u); })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/users/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        List<User> users = userService.getUsersByRole(role);
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updated = userService.updateUser(id, user);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @PatchMapping("/api/users/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            User u = userService.updateStatus(id, body.get("status"));
            u.setPassword(null);
            return ResponseEntity.ok(u);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/users/stats/dashboard")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        return ResponseEntity.ok(userService.getDashboardStats());
    }
    @Autowired private GoogleOAuthService googleOAuthService;

@GetMapping("/api/auth/google")
public ResponseEntity<?> googleAuth() {
    return ResponseEntity.ok(Map.of("url", googleOAuthService.getGoogleAuthUrl()));
}

@GetMapping("/api/auth/google/callback")
public ResponseEntity<?> googleCallback(@RequestParam String code, HttpServletResponse response) throws Exception {
    try {
        Map<String, Object> result = googleOAuthService.handleGoogleCallback(code);
        String token = (String) result.get("token");
        // Redirect to frontend with token
        response.sendRedirect("http://localhost:4200/auth/google/callback?token=" + token);
        return null;
    } catch (Exception e) {
        response.sendRedirect("http://localhost:4200/backoffice/login?error=google_failed");
        return null;
    }
}
}