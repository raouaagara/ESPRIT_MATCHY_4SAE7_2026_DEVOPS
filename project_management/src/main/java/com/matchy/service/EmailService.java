package com.matchy.service;

import com.matchy.entity.User;
import com.matchy.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${services.user.url:http://localhost:8081}")
    private String userServiceUrl;

    private void sendEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("Email sent to " + to + " - " + subject);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    private String buildEmail(String badgeText, String headline, String bodyContent, String ctaText, String ctaUrl) {
        String cta = (ctaText == null || ctaUrl == null)
            ? ""
            : "<div style='margin-top:22px'><a href='" + ctaUrl + "' style='display:inline-block;padding:12px 24px;border-radius:999px;background:linear-gradient(90deg,#7C77FF,#FF5E7D);color:#fff;text-decoration:none;font-weight:700'>" + ctaText + " →</a></div>";
        return "<!DOCTYPE html><html><body style='margin:0;background:#0d1028;font-family:Segoe UI,Arial,sans-serif;color:#ffffff;'>"
            + "<div style='max-width:620px;margin:0 auto;background:#141835;border-radius:0 0 18px 18px;overflow:hidden'>"
            + "<div style='padding:28px 28px 24px;background:linear-gradient(120deg,#5d7bff,#e44b7a)'>"
            + "<div style='font-size:34px;font-weight:800;letter-spacing:1px'>MATCHY</div>"
            + "<div style='font-size:11px;opacity:.9;letter-spacing:.7px'>TUNISIA'S #1 FREELANCE MARKETPLACE</div>"
            + "<div style='margin-top:14px;display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.2);font-size:11px;font-weight:700'>" + badgeText + "</div>"
            + "</div>"
            + "<div style='padding:28px'>"
            + "<h2 style='margin:0 0 12px;font-size:26px;line-height:1.2'>" + headline + "</h2>"
            + "<div style='color:#c8cbe8;line-height:1.65;font-size:15px'>" + bodyContent + "</div>"
            + cta
            + "<div style='margin-top:24px;padding:14px;border:1px solid #2a4f91;border-radius:10px;background:#182043;color:#b8c3ff;font-size:13px'>⚡ Freelancers who apply early have a significantly higher chance of being selected.</div>"
            + "<div style='margin-top:22px;font-size:11px;color:#7f88b8;text-align:center'>You received this email because you're registered on Matchy.<br/>Questions? <a href='mailto:support@matchy.tn' style='color:#9cb2ff'>support@matchy.tn</a></div>"
            + "<div style='margin-top:14px;padding-top:14px;border-top:1px solid #262c54;text-align:center;font-size:11px;color:#6f78a5'>© 2026 Matchy</div>"
            + "</div></div></body></html>";
    }

    public void sendWelcomeFreelancer(String toEmail, String firstName) {
        String html = buildEmail(
            "Welcome!",
            "Welcome to Matchy, " + firstName + "!",
            "<p>Your freelancer account is now active.</p>",
            "Browse Projects",
            "http://localhost:4200/freelancer/projects"
        );
        sendEmail(toEmail, "Welcome to Matchy, " + firstName + "!", html);
    }

    public void sendWelcomeClient(String toEmail, String firstName) {
        String html = buildEmail(
            "Welcome!",
            "Welcome to Matchy, " + firstName + "!",
            "<p>Your client account is now active.</p>",
            "Post a Project",
            "http://localhost:4200/client/projects/new"
        );
        sendEmail(toEmail, "Welcome to Matchy, " + firstName + "!", html);
    }

    public void sendProposalAccepted(String toEmail, String firstName, String projectTitle, String clientName) {
        String html = buildEmail(
            "Accepted",
            "Congratulations, " + firstName + "!",
            "<p>Your proposal for <b>" + projectTitle + "</b> was accepted by " + clientName + ".</p>",
            "View My Project",
            "http://localhost:4200/freelancer/proposals"
        );
        sendEmail(toEmail, "Your proposal was accepted - " + projectTitle, html);
    }

    public void sendProposalRejected(String toEmail, String firstName, String projectTitle) {
        String html = buildEmail(
            "Not Selected",
            "Update for your proposal",
            "<p>Your proposal for <b>" + projectTitle + "</b> was not selected this time.</p>",
            "Explore Projects",
            "http://localhost:4200/freelancer/projects"
        );
        sendEmail(toEmail, "Proposal result - " + projectTitle, html);
    }

    public void sendNewProposalToClient(String toEmail, String firstName, String projectTitle, String freelancerName, String freelancerBio) {
        String bio = (freelancerBio == null || freelancerBio.isBlank()) ? "Profile available on the platform" : freelancerBio;
        String html = buildEmail(
            "New Proposal",
            "New proposal received, " + firstName,
            "<p><b>" + freelancerName + "</b> submitted a proposal for <b>" + projectTitle + "</b>.</p><p>" + bio + "</p>",
            "View Proposal",
            "http://localhost:4200/client/projects"
        );
        sendEmail(toEmail, "New proposal received - " + projectTitle, html);
    }

    public void notifyFreelancersNewProject(String projectTitle, Long projectId, String deadline) {
        List<User> freelancers = fetchFreelancers();
        if (freelancers.isEmpty()) {
            freelancers = userRepository.findByRole(User.Role.FREELANCER);
        }
        String deadlineText = (deadline == null || deadline.isBlank()) ? "No specific deadline" : deadline;
        for (User freelancer : freelancers) {
            if (freelancer.getStatus() == User.UserStatus.ACTIVE) {
                String html = buildEmail(
                    "New Opportunity",
                    "New project available, " + freelancer.getFirstName(),
                    "<p>A new project has just been posted on Matchy.</p><p><b>Project:</b> " + projectTitle + "<br/><b>Status:</b> Open for proposals<br/><b>Deadline:</b> " + deadlineText + "</p>",
                    "View Project & Apply",
                    "http://localhost:4200/freelancer/projects"
                );
                sendEmail(freelancer.getEmail(), "New project on Matchy: " + projectTitle, html);
            }
        }
    }

    public void sendResetPassword(String toEmail, String firstName, String resetLink) {
        String html = buildEmail(
            "Password Reset",
            "Reset your password, " + firstName,
            "<p>This reset link is valid for 30 minutes.</p>",
            "Reset My Password",
            resetLink
        );
        sendEmail(toEmail, "Reset your Matchy password", html);
    }

    public void sendDeadlineReminderFreelancer(String toEmail, String firstName, String projectTitle, String deadline) {
        String html = buildEmail(
            "Deadline Reminder",
            "Deadline reminder, " + firstName,
            "<p>Your project delivery deadline is approaching.</p><p><b>Project:</b> " + projectTitle + "<br/><b>Due date:</b> " + deadline + "</p>",
            "Open My Projects",
            "http://localhost:4200/freelancer/projects"
        );
        sendEmail(toEmail, "Deadline approaching - " + projectTitle, html);
    }

    public void sendDeadlineReminderClient(String toEmail, String firstName, String projectTitle, String deadline) {
        String html = buildEmail(
            "Deadline Reminder",
            "Project deadline reminder, " + firstName,
            "<p>Your project has an upcoming deadline.</p><p><b>Project:</b> " + projectTitle + "<br/><b>Due date:</b> " + deadline + "</p>",
            "Open My Projects",
            "http://localhost:4200/client/projects"
        );
        sendEmail(toEmail, "Project deadline reminder - " + projectTitle, html);
    }

    private List<User> fetchFreelancers() {
        try {
            User[] response = new RestTemplate().getForObject(
                userServiceUrl + "/api/users/role/FREELANCER",
                User[].class
            );
            if (response == null || response.length == 0) return Collections.emptyList();
            return Arrays.asList(response);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
