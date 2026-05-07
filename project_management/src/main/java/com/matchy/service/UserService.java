package com.matchy.service;

import com.matchy.entity.PasswordResetToken;
import com.matchy.entity.User;
import com.matchy.entity.Wallet;
import com.matchy.repository.PasswordResetTokenRepository;
import com.matchy.repository.UserRepository;
import com.matchy.repository.WalletRepository;
import com.matchy.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserService {

    @Autowired private UserRepository              userRepository;
    @Autowired private BCryptPasswordEncoder       passwordEncoder;
    @Autowired private JwtUtil                     jwtUtil;
    @Autowired private EmailService                emailService;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private WalletRepository            walletRepository; // ✅ nouveau

    public List<User> getAllUsers() { return userRepository.findAll(); }
    public Optional<User> getUserById(Long id) { return userRepository.findById(id); }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(User.Role.valueOf(role.toUpperCase()));
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail()))
            throw new RuntimeException("Email already exists");

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);

        // ✅ Créer automatiquement un wallet pour chaque nouvel utilisateur
        Wallet wallet = new Wallet(saved);
        walletRepository.save(wallet);

        try {
            if (saved.getRole() == User.Role.FREELANCER) {
                emailService.sendWelcomeFreelancer(saved.getEmail(), saved.getFirstName());
            } else if (saved.getRole() == User.Role.CLIENT) {
                emailService.sendWelcomeClient(saved.getEmail(), saved.getFirstName());
            }
        } catch (Exception e) {
            System.err.println("Welcome email failed: " + e.getMessage());
        }

        return saved;
    }

    public User updateUser(Long id, User details) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setFirstName(details.getFirstName());
        user.setLastName(details.getLastName());
        user.setBio(details.getBio());
        user.setSkills(details.getSkills());
        user.setLocation(details.getLocation());
        if (details.getPassword() != null && !details.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(details.getPassword()));
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        walletRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    public User updateStatus(Long id, String status) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(User.UserStatus.valueOf(status.toUpperCase()));
        return userRepository.save(user);
    }

    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new RuntimeException("Invalid credentials");
        String token = jwtUtil.generateToken(
            user.getId(), user.getEmail(), user.getRole().name(),
            user.getFirstName(), user.getLastName()
        );
        user.setPassword(null);
        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("user", user);
        return res;
    }

    public Map<String, Long> getDashboardStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("totalUsers",          userRepository.count());
        stats.put("totalAdmins",         userRepository.countByRole(User.Role.ADMIN));
        stats.put("totalClients",        userRepository.countByRole(User.Role.CLIENT));
        stats.put("totalFreelancers",    userRepository.countByRole(User.Role.FREELANCER));
        stats.put("activeUsers",         userRepository.countActiveUsers());
        stats.put("verifiedFreelancers", userRepository.countVerifiedUsers());
        return stats;
    }

    public void sendResetLink(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return;
        String token = UUID.randomUUID().toString();
        passwordResetTokenRepository.save(new PasswordResetToken(token, email));
        String resetLink = "http://localhost:4200/backoffice/reset-password?token=" + token;
        emailService.sendResetPassword(email, userOpt.get().getFirstName(), resetLink);
    }

    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty() || tokenOpt.get().isExpired()) return false;
        String email = tokenOpt.get().getEmail();
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.delete(tokenOpt.get());
        return true;
    }
}
