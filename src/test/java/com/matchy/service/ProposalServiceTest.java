package com.matchy.service;

import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.entity.User;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import com.matchy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProposalServiceTest {

    @Mock private ProposalRepository  proposalRepository;
    @Mock private ProjectRepository   projectRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService        emailService;
    @Mock private UserRepository      userRepository;
    @Mock private GamificationService gamificationService;

    @InjectMocks private ProposalService proposalService;

    private Proposal sampleProposal;
    private Project  sampleProject;
    private User     sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(5L);
        sampleUser.setFirstName("Bob");
        sampleUser.setLastName("Freelancer");
        sampleUser.setEmail("bob@test.com");

        sampleProject = new Project();
        sampleProject.setId(1L);
        sampleProject.setTitle("My Project");
        sampleProject.setClientId(10L);
        sampleProject.setClientEmail("client@test.com");
        sampleProject.setProposalsCount(0);

        sampleProposal = new Proposal();
        sampleProposal.setId(100L);
        sampleProposal.setProjectId(1L);
        sampleProposal.setFreelancerId(5L);
        sampleProposal.setFreelancerName("Bob Freelancer");
        sampleProposal.setFreelancerEmail("bob@test.com");
        sampleProposal.setCoverLetter("I am the best fit for this project.");
        sampleProposal.setProposedBudget(900.0);
        sampleProposal.setStatus(Proposal.ProposalStatus.PENDING);
    }

    // ── createProposal ───────────────────────────────────────────

    @Test
    void createProposal_shouldSaveProposal_whenNoDuplicate() {
        when(proposalRepository.existsByProjectIdAndFreelancerId(1L, 5L)).thenReturn(false);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(sampleUser));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(sampleProposal);
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);
        doNothing().when(gamificationService).onProposalSubmitted(anyLong());

        Proposal result = proposalService.createProposal(sampleProposal, "5", "Bob Freelancer", "bob@test.com");

        assertNotNull(result);
        assertEquals(Proposal.ProposalStatus.PENDING, result.getStatus());
        verify(proposalRepository).save(any(Proposal.class));
    }

    @Test
    void createProposal_shouldThrow_whenAlreadyApplied() {
        when(proposalRepository.existsByProjectIdAndFreelancerId(1L, 5L)).thenReturn(true);

        assertThrows(RuntimeException.class,
            () -> proposalService.createProposal(sampleProposal, "5", "Bob", "bob@test.com"));
        verify(proposalRepository, never()).save(any());
    }

    @Test
    void createProposal_shouldIncrementProjectProposalsCount() {
        sampleProject.setProposalsCount(2);
        when(proposalRepository.existsByProjectIdAndFreelancerId(1L, 5L)).thenReturn(false);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(sampleUser));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(sampleProposal);
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(gamificationService).onProposalSubmitted(anyLong());

        proposalService.createProposal(sampleProposal, "5", "Bob", "bob@test.com");

        verify(projectRepository, atLeastOnce()).save(argThat(p -> p.getProposalsCount() == 3));
    }

    // ── updateStatus ─────────────────────────────────────────────

    @Test
    void updateStatus_shouldAcceptProposal_andNotify() {
        when(proposalRepository.findById(100L)).thenReturn(Optional.of(sampleProposal));
        when(proposalRepository.save(any(Proposal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(sampleUser));
        doNothing().when(gamificationService).onProposalAccepted(anyLong());

        Proposal result = proposalService.updateStatus(100L, "ACCEPTED", null);

        assertEquals(Proposal.ProposalStatus.ACCEPTED, result.getStatus());
        verify(notificationService).notifyProposalAccepted(anyLong(), anyString(), any());
        verify(gamificationService).onProposalAccepted(5L);
    }

    @Test
    void updateStatus_shouldRejectProposal_andNotify() {
        when(proposalRepository.findById(100L)).thenReturn(Optional.of(sampleProposal));
        when(proposalRepository.save(any(Proposal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(sampleUser));
        doNothing().when(gamificationService).onProposalRejected(anyLong());

        Proposal result = proposalService.updateStatus(100L, "REJECTED", "Not a good fit");

        assertEquals(Proposal.ProposalStatus.REJECTED, result.getStatus());
        assertEquals("Not a good fit", result.getClientFeedback());
        verify(gamificationService).onProposalRejected(5L);
    }

    @Test
    void updateStatus_shouldThrow_whenProposalNotFound() {
        when(proposalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> proposalService.updateStatus(999L, "ACCEPTED", null));
    }

    // ── deleteProposal ───────────────────────────────────────────

    @Test
    void deleteProposal_shouldCallRepository() {
        doNothing().when(proposalRepository).deleteById(100L);

        proposalService.deleteProposal(100L);

        verify(proposalRepository).deleteById(100L);
    }

    // ── getStats ─────────────────────────────────────────────────

    @Test
    void getStats_shouldReturnCorrectCounts() {
        when(proposalRepository.count()).thenReturn(20L);
        when(proposalRepository.countByStatus(Proposal.ProposalStatus.PENDING)).thenReturn(10L);
        when(proposalRepository.countByStatus(Proposal.ProposalStatus.ACCEPTED)).thenReturn(6L);
        when(proposalRepository.countByStatus(Proposal.ProposalStatus.REJECTED)).thenReturn(4L);

        Map<String, Long> stats = proposalService.getStats();

        assertEquals(20L, stats.get("total"));
        assertEquals(10L, stats.get("pending"));
        assertEquals(6L,  stats.get("accepted"));
        assertEquals(4L,  stats.get("rejected"));
    }

    // ── optimizeProposal ─────────────────────────────────────────

    @Test
    void optimizeProposal_shouldReturnScore_withValidPayload() {
        Map<String, Object> payload = Map.of(
            "coverLetter",        "I am ready to start immediately. I have 5 years of experience in Java Spring Boot. " +
                                  "I can deliver this project on time. Looking forward to discussing the details. Thank you.",
            "projectTitle",       "Spring Boot API",
            "projectDescription", "Build a REST API with Spring Boot and MySQL",
            "projectBudget",      1000.0,
            "proposedBudget",     950.0
        );

        Map<String, Object> result = proposalService.optimizeProposal(payload);

        assertNotNull(result);
        assertTrue(result.containsKey("totalScore"));
        assertTrue(result.containsKey("breakdown"));
        assertTrue(result.containsKey("suggestions"));
        int score = (int) result.get("totalScore");
        assertTrue(score >= 0 && score <= 100);
    }

    @Test
    void optimizeProposal_shouldReturnLowScore_withEmptyCoverLetter() {
        Map<String, Object> payload = Map.of(
            "coverLetter",   "",
            "projectBudget", 1000.0,
            "proposedBudget", 500.0
        );

        Map<String, Object> result = proposalService.optimizeProposal(payload);

        int score = (int) result.get("totalScore");
        assertTrue(score < 30, "Empty cover letter should yield a low score");
    }

    @Test
    void optimizeProposal_shouldGiveHighBudgetScore_whenBudgetAligned() {
        Map<String, Object> payload = Map.of(
            "coverLetter",   "Short letter.",
            "projectBudget", 1000.0,
            "proposedBudget", 1000.0  // exact match → 25 pts
        );

        Map<String, Object> result = proposalService.optimizeProposal(payload);

        @SuppressWarnings("unchecked")
        Map<String, Object> breakdown = (Map<String, Object>) result.get("breakdown");
        assertEquals(25, breakdown.get("budgetCoherence"));
    }

    // ── getFreelancerAnalytics ───────────────────────────────────

    @Test
    void getFreelancerAnalytics_shouldReturnZeroRate_whenNoProposals() {        when(proposalRepository.findByFreelancerId(5L)).thenReturn(List.of());

        Map<String, Object> analytics = proposalService.getFreelancerAnalytics(5L);

        assertEquals(0L,   analytics.get("totalProposals"));
        assertEquals(0L,   analytics.get("acceptedProposals"));
        assertEquals(0.0,  analytics.get("globalAcceptanceRate"));
    }

    @Test
    void getFreelancerAnalytics_shouldCalculateAcceptanceRate() throws Exception {
        Proposal p1 = new Proposal();
        p1.setProjectId(1L);
        p1.setStatus(Proposal.ProposalStatus.ACCEPTED);
        // Set timestamps via reflection since @PrePersist manages them
        java.lang.reflect.Field createdAt1 = Proposal.class.getDeclaredField("createdAt");
        createdAt1.setAccessible(true);
        createdAt1.set(p1, LocalDateTime.now().minusDays(2));
        java.lang.reflect.Field updatedAt1 = Proposal.class.getDeclaredField("updatedAt");
        updatedAt1.setAccessible(true);
        updatedAt1.set(p1, LocalDateTime.now().minusDays(1));

        Proposal p2 = new Proposal();
        p2.setProjectId(2L);
        p2.setStatus(Proposal.ProposalStatus.REJECTED);
        java.lang.reflect.Field createdAt2 = Proposal.class.getDeclaredField("createdAt");
        createdAt2.setAccessible(true);
        createdAt2.set(p2, LocalDateTime.now().minusDays(3));
        java.lang.reflect.Field updatedAt2 = Proposal.class.getDeclaredField("updatedAt");
        updatedAt2.setAccessible(true);
        updatedAt2.set(p2, LocalDateTime.now().minusDays(2));

        when(proposalRepository.findByFreelancerId(5L)).thenReturn(List.of(p1, p2));
        when(projectRepository.findById(anyLong())).thenReturn(Optional.empty());

        Map<String, Object> analytics = proposalService.getFreelancerAnalytics(5L);

        assertEquals(2L,   analytics.get("totalProposals"));
        assertEquals(1L,   analytics.get("acceptedProposals"));
        assertEquals(50.0, analytics.get("globalAcceptanceRate"));
    }
}
