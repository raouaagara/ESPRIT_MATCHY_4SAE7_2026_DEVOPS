package com.matchy.service;

import com.matchy.entity.PredictionSuccessEntity;
import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.entity.User;
import com.matchy.repository.PredictionSuccessRepository;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import com.matchy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PredictionSuccessServiceTest {

    @Mock private PredictionSuccessRepository predictionRepository;
    @Mock private UserRepository              userRepository;
    @Mock private ProjectRepository           projectRepository;
    @Mock private ProposalRepository          proposalRepository;

    @InjectMocks private PredictionSuccessService predictionService;

    private User    freelancer;
    private Project project;

    @BeforeEach
    void setUp() {
        freelancer = new User();
        freelancer.setId(1L);
        freelancer.setFirstName("Alice");
        freelancer.setLastName("Dev");
        freelancer.setSkills("java,spring,mysql");
        freelancer.setRating(4.5);
        freelancer.setProjectsCount(8);

        project = new Project();
        project.setId(10L);
        project.setTitle("Backend API");
        project.setCategory("WEB");
        project.setRequiredSkills(List.of("java", "spring"));
        project.setBudget(1500.0);
    }

    // ── predictSuccess ───────────────────────────────────────────

    @Test
    void predictSuccess_shouldReturnPrediction_withValidData() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(proposalRepository.countByFreelancerId(1L)).thenReturn(5L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(3L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.PENDING)).thenReturn(1L);
        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 10L)).thenReturn(Optional.empty());
        when(predictionRepository.save(any(PredictionSuccessEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        PredictionSuccessEntity result = predictionService.predictSuccess(1L, 10L);

        assertNotNull(result);
        assertEquals(1L,  result.getFreelancerId());
        assertEquals(10L, result.getProjectId());
        assertNotNull(result.getFinalScore());
        assertNotNull(result.getPredictionLevel());
        assertTrue(result.getFinalScore() >= 0 && result.getFinalScore() <= 100);
    }

    @Test
    void predictSuccess_shouldThrow_whenProjectNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> predictionService.predictSuccess(1L, 99L));
    }

    @Test
    void predictSuccess_shouldThrow_whenFreelancerNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
            () -> predictionService.predictSuccess(99L, 10L));
    }

    @Test
    void predictSuccess_shouldReturnHighLevel_whenSkillsMatch_andGoodReputation() {
        // All skills match, high rating, many projects
        freelancer.setSkills("java,spring,mysql,docker");
        freelancer.setRating(5.0);
        freelancer.setProjectsCount(25);

        when(userRepository.findById(1L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(proposalRepository.countByFreelancerId(1L)).thenReturn(20L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(18L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.PENDING)).thenReturn(0L);
        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 10L)).thenReturn(Optional.empty());
        when(predictionRepository.save(any(PredictionSuccessEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        PredictionSuccessEntity result = predictionService.predictSuccess(1L, 10L);

        assertEquals("ÉLEVÉ", result.getPredictionLevel());
        assertTrue(result.getFinalScore() >= 70);
    }

    @Test
    void predictSuccess_shouldReturnLowLevel_whenNoSkillsAndNoExperience() {
        freelancer.setSkills("photoshop");  // no match with java/spring
        freelancer.setRating(null);
        freelancer.setProjectsCount(0);

        when(userRepository.findById(1L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(proposalRepository.countByFreelancerId(1L)).thenReturn(0L);
        // When total = 0, successRateScore = 0 without calling countByStatus
        lenient().when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(0L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.PENDING)).thenReturn(0L);
        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 10L)).thenReturn(Optional.empty());
        when(predictionRepository.save(any(PredictionSuccessEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        PredictionSuccessEntity result = predictionService.predictSuccess(1L, 10L);

        assertEquals("FAIBLE", result.getPredictionLevel());
        assertTrue(result.getFinalScore() < 40);
    }

    @Test
    void predictSuccess_shouldUpdateExisting_whenPredictionAlreadyExists() {
        PredictionSuccessEntity existing = new PredictionSuccessEntity();
        existing.setId(50L);
        existing.setFreelancerId(1L);
        existing.setProjectId(10L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(proposalRepository.countByFreelancerId(1L)).thenReturn(5L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(2L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.PENDING)).thenReturn(1L);
        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 10L)).thenReturn(Optional.of(existing));
        when(predictionRepository.save(any(PredictionSuccessEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        PredictionSuccessEntity result = predictionService.predictSuccess(1L, 10L);

        // Should reuse the existing entity (same id)
        assertEquals(50L, result.getId());
        verify(predictionRepository).save(existing);
    }

    // ── getPrediction ────────────────────────────────────────────

    @Test
    void getPrediction_shouldReturnPrediction_whenExists() {
        PredictionSuccessEntity entity = new PredictionSuccessEntity();
        entity.setFreelancerId(1L);
        entity.setProjectId(10L);
        entity.setFinalScore(75.0);

        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 10L))
            .thenReturn(Optional.of(entity));

        Optional<PredictionSuccessEntity> result = predictionService.getPrediction(1L, 10L);

        assertTrue(result.isPresent());
        assertEquals(75.0, result.get().getFinalScore());
    }

    @Test
    void getPrediction_shouldReturnEmpty_whenNotFound() {
        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 99L))
            .thenReturn(Optional.empty());

        Optional<PredictionSuccessEntity> result = predictionService.getPrediction(1L, 99L);

        assertFalse(result.isPresent());
    }

    // ── getFreelancerPredictions ─────────────────────────────────

    @Test
    void getFreelancerPredictions_shouldReturnAllPredictions() {
        PredictionSuccessEntity p1 = new PredictionSuccessEntity();
        p1.setFreelancerId(1L);
        p1.setProjectId(10L);

        PredictionSuccessEntity p2 = new PredictionSuccessEntity();
        p2.setFreelancerId(1L);
        p2.setProjectId(20L);

        when(predictionRepository.findByFreelancerId(1L)).thenReturn(List.of(p1, p2));

        List<PredictionSuccessEntity> result = predictionService.getFreelancerPredictions(1L);

        assertEquals(2, result.size());
    }

    // ── Availability score logic ─────────────────────────────────

    @Test
    void predictSuccess_shouldGiveFullAvailabilityScore_whenNoPendingProposals() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(freelancer));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(proposalRepository.countByFreelancerId(1L)).thenReturn(3L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(1L);
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.PENDING)).thenReturn(0L);
        when(predictionRepository.findByFreelancerIdAndProjectId(1L, 10L)).thenReturn(Optional.empty());
        when(predictionRepository.save(any(PredictionSuccessEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        PredictionSuccessEntity result = predictionService.predictSuccess(1L, 10L);

        // availabilityScore = 100 when 0 pending proposals
        assertEquals(100.0, result.getAvailabilityScore());
    }
}
