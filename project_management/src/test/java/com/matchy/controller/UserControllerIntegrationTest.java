package com.matchy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchy.entity.User;
import com.matchy.repository.UserRepository;
import com.matchy.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WalletRepository walletRepository;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        // Nettoyer la base avant chaque test
        walletRepository.deleteAll();
        userRepository.deleteAll();

        // Créer un utilisateur de test
        User user = new User();
        user.setFirstName("Integration");
        user.setLastName("Test");
        user.setEmail("integration@test.com");
        user.setPassword("Test1234");
        user.setRole(User.Role.CLIENT);

        mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(user)));

        // Login pour récupérer le token
        MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                Map.of("email", "integration@test.com", "password", "Test1234")
            )))
            .andReturn();

        String response = result.getResponse().getContentAsString();
        Map<?, ?> map = objectMapper.readValue(response, Map.class);
        token = (String) map.get("token");
    }

    // ── Auth ─────────────────────────────────────────────────────
    @Test
    void login_shouldReturn200_withValidCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                Map.of("email", "integration@test.com", "password", "Test1234")
            )))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.user.email").value("integration@test.com"));
    }

    @Test
    void login_shouldReturn400_withWrongPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                Map.of("email", "integration@test.com", "password", "wrongpass")
            )))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    void register_shouldReturn400_whenEmailAlreadyExists() throws Exception {
        User duplicate = new User();
        duplicate.setFirstName("Dup");
        duplicate.setLastName("User");
        duplicate.setEmail("integration@test.com");
        duplicate.setPassword("Test1234");
        duplicate.setRole(User.Role.CLIENT);

        mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(duplicate)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Email already exists"));
    }

    // ── Users protégés ───────────────────────────────────────────
    @Test
    void getUsers_shouldReturn401_withoutToken() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isForbidden());
    }

    @Test
    void getUsers_shouldReturn200_withValidToken() throws Exception {
        mockMvc.perform(get("/api/users")
            .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getUserById_shouldReturn200_withValidToken() throws Exception {
        Long id = userRepository.findByEmail("integration@test.com").get().getId();

        mockMvc.perform(get("/api/users/" + id)
            .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("integration@test.com"));
    }

    @Test
    void getUserById_shouldReturn404_whenNotFound() throws Exception {
        mockMvc.perform(get("/api/users/99999")
            .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
    }

    @Test
    void deleteUser_shouldReturn200_withAdminToken() throws Exception {
        // DELETE /api/users/** requires ADMIN role — register + login as ADMIN
        User admin = new User();
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setEmail("admin@test.com");
        admin.setPassword("Admin1234");
        admin.setRole(User.Role.ADMIN);

        mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(admin)));

        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                Map.of("email", "admin@test.com", "password", "Admin1234")
            )))
            .andReturn();

        Map<?, ?> adminMap = objectMapper.readValue(
            adminResult.getResponse().getContentAsString(), Map.class);
        String adminToken = (String) adminMap.get("token");

        Long id = userRepository.findByEmail("integration@test.com").get().getId();

        mockMvc.perform(delete("/api/users/" + id)
            .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User deleted"));
    }

    @Test
    void deleteUser_shouldReturn403_withClientToken() throws Exception {
        Long id = userRepository.findByEmail("integration@test.com").get().getId();

        // CLIENT role cannot delete users — expects 403
        mockMvc.perform(delete("/api/users/" + id)
            .header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
    }
}
