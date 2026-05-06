package com.matchy.service;

import com.matchy.entity.Notification;
import com.matchy.entity.User;
import com.matchy.repository.NotificationRepository;
import com.matchy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class NotificationService {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private UserRepository userRepository;

    @Value("${services.user.url:http://localhost:8081}")
    private String userServiceUrl;

    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findByRecipientIdAndReadFalse(userId);
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public Notification create(Notification n) {
        Notification saved = notificationRepository.save(n);
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + n.getRecipientId(), saved);
        } catch (Exception e) {
            System.out.println("[NOTIF] WebSocket skipped: " + e.getMessage());
        }
        return saved;
    }

    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }

    public void notifyNewProjectToFreelancers(String projectTitle, Long projectId, String deadline) {
        List<User> freelancers = fetchFreelancers();
        if (freelancers.isEmpty()) {
            freelancers = userRepository.findByRole(User.Role.FREELANCER);
        }
        String deadlineText = (deadline == null || deadline.isBlank()) ? "No specific deadline" : deadline;
        for (User freelancer : freelancers) {
            Notification n = new Notification();
            n.setRecipientId(freelancer.getId());
            n.setRecipientEmail(freelancer.getEmail());
            n.setTitle("New Project Available 🚀");
            n.setMessage("A new project has been posted: \"" + projectTitle + "\" · Deadline: " + deadlineText);
            n.setType(Notification.NotificationType.PROJECT_CREATED);
            n.setRelatedEntityId(String.valueOf(projectId));
            n.setRelatedEntityType("PROJECT");
            create(n);
        }
    }

    public void notifyProposalReceived(Long clientId, String clientEmail, String freelancerName, String projectTitle) {
        Notification n = new Notification();
        n.setRecipientId(clientId);
        n.setRecipientEmail(clientEmail);
        n.setTitle("New Proposal Received 📝");
        n.setMessage(freelancerName + " submitted a proposal for: \"" + projectTitle + "\"");
        n.setType(Notification.NotificationType.PROPOSAL_RECEIVED);
        create(n);
    }

    public void notifyProposalAccepted(Long freelancerId, String freelancerEmail, String projectTitle) {
        Notification n = new Notification();
        n.setRecipientId(freelancerId);
        n.setRecipientEmail(freelancerEmail);
        n.setTitle("Proposal Accepted! 🎉");
        n.setMessage("Your proposal for \"" + projectTitle + "\" has been accepted!");
        n.setType(Notification.NotificationType.PROPOSAL_ACCEPTED);
        create(n);
    }

    public void notifyProposalRejected(Long freelancerId, String freelancerEmail, String projectTitle) {
        Notification n = new Notification();
        n.setRecipientId(freelancerId);
        n.setRecipientEmail(freelancerEmail);
        n.setTitle("Proposal Not Selected");
        n.setMessage("Your proposal for \"" + projectTitle + "\" was not selected this time.");
        n.setType(Notification.NotificationType.PROPOSAL_REJECTED);
        create(n);
    }

    public void notifyDeadlineReminder(Long recipientId, String recipientEmail, String projectTitle, String deadline) {
        Notification n = new Notification();
        n.setRecipientId(recipientId);
        n.setRecipientEmail(recipientEmail);
        n.setTitle("Deadline Reminder ⏰");
        n.setMessage("Reminder: project \"" + projectTitle + "\" has an upcoming deadline (" + deadline + ").");
        n.setType(Notification.NotificationType.SYSTEM);
        create(n);
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
