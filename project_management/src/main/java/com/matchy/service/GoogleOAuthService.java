package com.matchy.service;

import com.matchy.entity.User;
import com.matchy.repository.UserRepository;
import com.matchy.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class GoogleOAuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private EmailService emailService;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.redirect.uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> handleGoogleCallback(String code) {
        // 1. Exchange code for access token
        String tokenUrl = "https://oauth2.googleapis.com/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "code=" + code +
            "&client_id=" + clientId +
            "&client_secret=" + clientSecret +
            "&redirect_uri=" + redirectUri +
            "&grant_type=authorization_code";

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, request, Map.class);
        String accessToken = (String) tokenResponse.getBody().get("access_token");

        // 2. Get user info from Google
        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> userRequest = new HttpEntity<>(authHeaders);

        ResponseEntity<Map> userResponse = restTemplate.exchange(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            HttpMethod.GET, userRequest, Map.class
        );

        Map<String, Object> googleUser = userResponse.getBody();
        String email = (String) googleUser.get("email");
        String firstName = (String) googleUser.get("given_name");
        String lastName = (String) googleUser.get("family_name");
        String picture = (String) googleUser.get("picture");

        // 3. Find or create user
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName != null ? firstName : "User");
            user.setLastName(lastName != null ? lastName : "");
            user.setPassword("GOOGLE_OAUTH_" + java.util.UUID.randomUUID());
            user.setRole(User.Role.CLIENT);
            user.setStatus(User.UserStatus.ACTIVE);
            user = userRepository.save(user);

            try {
                emailService.sendWelcomeClient(email, firstName);
            } catch (Exception e) {
                System.err.println("Welcome email failed: " + e.getMessage());
            }
        }

        // 4. Generate JWT
        String token = jwtUtil.generateToken(
            user.getId(), user.getEmail(), user.getRole().name(),
            user.getFirstName(), user.getLastName()
        );

        user.setPassword(null);
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);
        return result;
    }

    public String getGoogleAuthUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth" +
            "?client_id=" + clientId +
            "&redirect_uri=" + redirectUri +
            "&response_type=code" +
            "&scope=email%20profile" +
            "&access_type=offline";
    }
}