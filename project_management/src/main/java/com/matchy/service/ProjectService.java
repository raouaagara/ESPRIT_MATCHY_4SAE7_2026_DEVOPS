package com.matchy.service;

import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class ProjectService {

    @Autowired private ProjectRepository  projectRepository;
    @Autowired private ProposalRepository proposalRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private EmailService        emailService;
    @Autowired private PaymentService      paymentService;

    public List<Project>     getAllProjects()              { return projectRepository.findAll(); }
    public Optional<Project> getProjectById(Long id)      { return projectRepository.findById(id); }
    public List<Project>     getProjectsByClient(Long id) { return projectRepository.findByClientId(id); }
    public List<Project>     getOpenProjects()            { return projectRepository.findByStatus(Project.ProjectStatus.OPEN); }

    public List<Project> getProjectsByStatus(String status) {
        try {
            return projectRepository.findByStatus(Project.ProjectStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    public Project createProject(Project project, String userId, String userName, String userEmail) {
        if (project.getTitle() == null || project.getTitle().isBlank())
            throw new RuntimeException("Title is required");
        project.setClientId(Long.parseLong(userId));
        project.setClientName(userName);
        project.setClientEmail(userEmail);
        project.setStatus(Project.ProjectStatus.OPEN);
        project.setProposalsCount(0);
        if (project.getCategory() == null || project.getCategory().isBlank())
            project.setCategory("OTHER");
        Project saved = projectRepository.save(project);
        notificationService.notifyNewProjectToFreelancers(saved.getTitle(), saved.getId(), saved.getDeadline());
        emailService.notifyFreelancersNewProject(saved.getTitle(), saved.getId(), saved.getDeadline());
        return saved;
    }

    public Project updateProject(Long id, Project details) {
        Project p = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        p.setTitle(details.getTitle());
        p.setDescription(details.getDescription());
        p.setCategory(details.getCategory());
        p.setBudget(details.getBudget());
        p.setBudgetType(details.getBudgetType());
        p.setRequiredSkills(details.getRequiredSkills());
        p.setDeadline(details.getDeadline());
        p.setDuration(details.getDuration());
        p.setExperienceLevel(details.getExperienceLevel());
        if (details.getStatus() != null) p.setStatus(details.getStatus());
        return projectRepository.save(p);
    }

    public void deleteProject(Long id) { projectRepository.deleteById(id); }

    public Project updateStatus(Long id, String status) {
        Project p = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        try {
            p.setStatus(Project.ProjectStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
        return projectRepository.save(p);
    }

    public Project incrementProposalsCount(Long id) {
        Project p = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        p.setProposalsCount(p.getProposalsCount() + 1);
        return projectRepository.save(p);
    }

    public Map<String, Long> getStats() {
        Map<String, Long> s = new LinkedHashMap<>();
        s.put("total",      projectRepository.count());
        s.put("open",       projectRepository.countByStatus(Project.ProjectStatus.OPEN));
        s.put("inProgress", projectRepository.countByStatus(Project.ProjectStatus.IN_PROGRESS));
        s.put("completed",  projectRepository.countByStatus(Project.ProjectStatus.COMPLETED));
        return s;
    }

    // ── Freelancer soumet le livrable ───────────────────────
    public Project submitDelivery(Long projectId, String deliveryLink, String deliveryMessage) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + projectId));
        project.setDeliveryLink(deliveryLink);
        project.setDeliveryMessage(deliveryMessage);
        project.setStatus(Project.ProjectStatus.DELIVERED);
        return projectRepository.save(project);
    }

    // ── Client confirme livrable + paiement simulé ──────────
    public Map<String, Object> completeProject(Long projectId, Long clientId, Long proposalId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + projectId));

        // 1. Récupérer le freelancerId + mettre à jour la proposal
        Long freelancerId = null;
        if (proposalId != null && proposalId > 0) {
            Optional<Proposal> proposalOpt = proposalRepository.findById(proposalId);
            if (proposalOpt.isPresent()) {
                Proposal proposal = proposalOpt.get();
                freelancerId = proposal.getFreelancerId();
                proposal.setStatus(Proposal.ProposalStatus.COMPLETED);
                proposalRepository.save(proposal);
            }
        }

        // 2. Changer statut projet → COMPLETED
        project.setStatus(Project.ProjectStatus.COMPLETED);
        projectRepository.save(project);

        // 3. Créer la transaction de paiement simulée
        Object transaction = null;
        if (freelancerId != null) {
            transaction = paymentService.processPayment(projectId, clientId, freelancerId);
        }

        // 4. Retourner résultat complet
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("project",     project);
        result.put("transaction", transaction);
        result.put("message",     "Projet complété et paiement effectué !");
        return result;
    }

    // ── Client demande révision ─────────────────────────────
    public Project requestRevision(Long projectId, String revisionMessage, Long clientId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + projectId));
        project.setStatus(Project.ProjectStatus.IN_PROGRESS);
        project.setClientFeedback(revisionMessage);
        return projectRepository.save(project);
    }

    // ── Projets livrés pour un client ──────────────────────
    public List<Project> getDeliveredProjects(Long clientId) {
        return projectRepository.findByClientIdAndStatus(clientId, Project.ProjectStatus.DELIVERED);
    }

    public Map<String, Object> sendDeadlineReminders() {
        List<Project> projects = projectRepository.findAll();
        int remindersSent = 0;
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        for (Project project : projects) {
            if (project.getDeadline() == null || project.getDeadline().isBlank()) continue;
            if (project.getStatus() == Project.ProjectStatus.COMPLETED || project.getStatus() == Project.ProjectStatus.CANCELLED) continue;

            LocalDate deadlineDate;
            try {
                deadlineDate = LocalDate.parse(project.getDeadline());
            } catch (DateTimeParseException ex) {
                continue;
            }
            if (!deadlineDate.equals(tomorrow)) continue;

            if (project.getClientId() != null && project.getClientEmail() != null && !project.getClientEmail().isBlank()) {
                notificationService.notifyDeadlineReminder(project.getClientId(), project.getClientEmail(), project.getTitle(), project.getDeadline());
                emailService.sendDeadlineReminderClient(
                    project.getClientEmail(),
                    project.getClientName() == null || project.getClientName().isBlank() ? "Client" : project.getClientName(),
                    project.getTitle(),
                    project.getDeadline()
                );
                remindersSent++;
            }

            proposalRepository.findByProjectId(project.getId()).stream()
                .filter(p -> p.getStatus() == Proposal.ProposalStatus.ACCEPTED)
                .findFirst()
                .ifPresent(accepted -> {
                    if (accepted.getFreelancerId() != null && accepted.getFreelancerEmail() != null && !accepted.getFreelancerEmail().isBlank()) {
                        notificationService.notifyDeadlineReminder(
                            accepted.getFreelancerId(),
                            accepted.getFreelancerEmail(),
                            project.getTitle(),
                            project.getDeadline()
                        );
                        emailService.sendDeadlineReminderFreelancer(
                            accepted.getFreelancerEmail(),
                            accepted.getFreelancerName() == null || accepted.getFreelancerName().isBlank() ? "Freelancer" : accepted.getFreelancerName(),
                            project.getTitle(),
                            project.getDeadline()
                        );
                    }
                });
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Deadline reminder process completed");
        result.put("targetDate", tomorrow.toString());
        result.put("notificationsSent", remindersSent);
        return result;
    }
}