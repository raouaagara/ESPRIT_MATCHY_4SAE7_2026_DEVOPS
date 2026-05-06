package com.matchy.service;

import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository  projectRepository;
    @Mock private ProposalRepository proposalRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService        emailService;
    @Mock private PaymentService      paymentService;

    @InjectMocks private ProjectService projectService;

    private Project sampleProject;

    @BeforeEach
    void setUp() {
        sampleProject = new Project();
        sampleProject.setId(1L);
        sampleProject.setTitle("Test Project");
        sampleProject.setDescription("A test description");
        sampleProject.setClientId(10L);
        sampleProject.setClientName("Alice Client");
        sampleProject.setClientEmail("alice@test.com");
        sampleProject.setCategory("WEB");
        sampleProject.setStatus(Project.ProjectStatus.OPEN);
        sampleProject.setBudget(1000.0);
        sampleProject.setProposalsCount(0);
    }

    // ── createProject ────────────────────────────────────────────

    @Test
    void createProject_shouldSaveAndNotify() {
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);

        Project result = projectService.createProject(sampleProject, "10", "Alice Client", "alice@test.com");

        assertNotNull(result);
        assertEquals("Test Project", result.getTitle());
        verify(projectRepository).save(any(Project.class));
        verify(notificationService).notifyNewProjectToFreelancers(anyString(), anyLong(), any());
        verify(emailService).notifyFreelancersNewProject(anyString(), anyLong(), any());
    }

    @Test
    void createProject_shouldThrow_whenTitleIsBlank() {
        sampleProject.setTitle("  ");
        assertThrows(RuntimeException.class,
            () -> projectService.createProject(sampleProject, "10", "Alice", "alice@test.com"));
        verify(projectRepository, never()).save(any());
    }

    @Test
    void createProject_shouldSetDefaultCategory_whenCategoryIsNull() {
        sampleProject.setCategory(null);
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.createProject(sampleProject, "10", "Alice", "alice@test.com");

        assertEquals("OTHER", result.getCategory());
    }

    @Test
    void createProject_shouldSetStatusToOpen() {
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.createProject(sampleProject, "10", "Alice", "alice@test.com");

        assertEquals(Project.ProjectStatus.OPEN, result.getStatus());
    }

    // ── getProjectById ───────────────────────────────────────────

    @Test
    void getProjectById_shouldReturnProject_whenExists() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));

        Optional<Project> result = projectService.getProjectById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getProjectById_shouldReturnEmpty_whenNotFound() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Project> result = projectService.getProjectById(99L);

        assertFalse(result.isPresent());
    }

    // ── updateStatus ─────────────────────────────────────────────

    @Test
    void updateStatus_shouldChangeStatus_whenValid() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.updateStatus(1L, "IN_PROGRESS");

        assertEquals(Project.ProjectStatus.IN_PROGRESS, result.getStatus());
    }

    @Test
    void updateStatus_shouldThrow_whenProjectNotFound() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> projectService.updateStatus(99L, "OPEN"));
    }

    @Test
    void updateStatus_shouldThrow_whenStatusInvalid() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));

        assertThrows(RuntimeException.class, () -> projectService.updateStatus(1L, "INVALID_STATUS"));
    }

    // ── deleteProject ────────────────────────────────────────────

    @Test
    void deleteProject_shouldCallRepository() {
        doNothing().when(projectRepository).deleteById(1L);

        projectService.deleteProject(1L);

        verify(projectRepository).deleteById(1L);
    }

    // ── getStats ─────────────────────────────────────────────────

    @Test
    void getStats_shouldReturnCorrectCounts() {
        when(projectRepository.count()).thenReturn(10L);
        when(projectRepository.countByStatus(Project.ProjectStatus.OPEN)).thenReturn(4L);
        when(projectRepository.countByStatus(Project.ProjectStatus.IN_PROGRESS)).thenReturn(3L);
        when(projectRepository.countByStatus(Project.ProjectStatus.COMPLETED)).thenReturn(3L);

        Map<String, Long> stats = projectService.getStats();

        assertEquals(10L, stats.get("total"));
        assertEquals(4L,  stats.get("open"));
        assertEquals(3L,  stats.get("inProgress"));
        assertEquals(3L,  stats.get("completed"));
    }

    // ── submitDelivery ───────────────────────────────────────────

    @Test
    void submitDelivery_shouldSetStatusToDelivered() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.submitDelivery(1L, "https://github.com/delivery", "Done!");

        assertEquals(Project.ProjectStatus.DELIVERED, result.getStatus());
        assertEquals("https://github.com/delivery", result.getDeliveryLink());
        assertEquals("Done!", result.getDeliveryMessage());
    }

    @Test
    void submitDelivery_shouldThrow_whenProjectNotFound() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> projectService.submitDelivery(99L, "link", "msg"));
    }

    // ── completeProject ──────────────────────────────────────────

    @Test
    void completeProject_shouldSetStatusToCompleted_andProcessPayment() {
        Proposal proposal = new Proposal();
        proposal.setId(5L);
        proposal.setFreelancerId(20L);
        proposal.setStatus(Proposal.ProposalStatus.ACCEPTED);

        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(proposalRepository.findById(5L)).thenReturn(Optional.of(proposal));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        when(proposalRepository.save(any(Proposal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentService.processPayment(anyLong(), anyLong(), anyLong())).thenReturn(null);

        Map<String, Object> result = projectService.completeProject(1L, 10L, 5L);

        assertNotNull(result.get("project"));
        assertNotNull(result.get("message"));
        assertEquals(Project.ProjectStatus.COMPLETED, sampleProject.getStatus());
        verify(paymentService).processPayment(1L, 10L, 20L);
    }

    @Test
    void completeProject_shouldThrow_whenProjectNotFound() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> projectService.completeProject(99L, 10L, 5L));
    }

    // ── requestRevision ──────────────────────────────────────────

    @Test
    void requestRevision_shouldSetStatusToInProgress() {
        sampleProject.setStatus(Project.ProjectStatus.DELIVERED);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.requestRevision(1L, "Please fix the UI", 10L);

        assertEquals(Project.ProjectStatus.IN_PROGRESS, result.getStatus());
        assertEquals("Please fix the UI", result.getClientFeedback());
    }

    // ── incrementProposalsCount ──────────────────────────────────

    @Test
    void incrementProposalsCount_shouldIncrementByOne() {
        sampleProject.setProposalsCount(3);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.incrementProposalsCount(1L);

        assertEquals(4, result.getProposalsCount());
    }

    // ── getProjectsByStatus ──────────────────────────────────────

    @Test
    void getProjectsByStatus_shouldThrow_whenStatusInvalid() {
        assertThrows(RuntimeException.class,
            () -> projectService.getProjectsByStatus("UNKNOWN"));
    }

    @Test
    void getProjectsByStatus_shouldReturnProjects_whenStatusValid() {
        when(projectRepository.findByStatus(Project.ProjectStatus.OPEN))
            .thenReturn(List.of(sampleProject));

        List<Project> result = projectService.getProjectsByStatus("OPEN");

        assertEquals(1, result.size());
    }
}
