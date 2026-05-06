package com.matchy;

import com.matchy.entity.MatchResult;
import com.matchy.entity.Project;
import com.matchy.entity.Proposal;
import com.matchy.entity.User;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import com.matchy.repository.UserRepository;
import com.matchy.service.MatchingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProposalRepository proposalRepository;

    @InjectMocks
    private MatchingService matchingService;

    @Test
    void getTopFreelancersForProject_shouldReturnOnlyActiveWithPositiveScore() {
        Project project = new Project();
        project.setId(10L);
        project.setRequiredSkills(List.of("java", "spring"));
        project.setBudget(1000.0);

        User active = new User();
        active.setId(1L);
        active.setFirstName("Alice");
        active.setLastName("Dev");
        active.setSkills("java,spring,sql");
        active.setStatus(User.UserStatus.ACTIVE);
        active.setVerified(true);

        User inactive = new User();
        inactive.setId(2L);
        inactive.setFirstName("Bob");
        inactive.setLastName("Dev");
        inactive.setSkills("java,spring");
        inactive.setStatus(User.UserStatus.SUSPENDED);

        Proposal recent = new Proposal();
        recent.setProjectId(10L);
        recent.setProposedBudget(1000.0);

        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findByRole(User.Role.FREELANCER)).thenReturn(List.of(active, inactive));
        when(proposalRepository.countByFreelancerIdAndStatus(1L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(3L);
        when(proposalRepository.findByFreelancerId(1L)).thenReturn(List.of(recent));

        List<MatchResult> results = matchingService.getTopFreelancersForProject(10L);

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getFreelancerId());
        assertTrue(results.get(0).getTotalScore() > 0);
    }

    @Test
    void getTopProjectsForFreelancer_shouldExcludeAppliedAndNonOpenProjects() {
        User freelancer = new User();
        freelancer.setId(7L);
        freelancer.setSkills("angular,typescript");
        freelancer.setStatus(User.UserStatus.ACTIVE);

        Project openProject = new Project();
        openProject.setId(101L);
        openProject.setTitle("Frontend app");
        openProject.setCategory("WEB");
        openProject.setRequiredSkills(List.of("angular"));
        openProject.setBudget(500.0);
        openProject.setStatus(Project.ProjectStatus.OPEN);

        Project alreadyApplied = new Project();
        alreadyApplied.setId(102L);
        alreadyApplied.setTitle("Applied");
        alreadyApplied.setCategory("WEB");
        alreadyApplied.setRequiredSkills(List.of("angular"));
        alreadyApplied.setBudget(500.0);
        alreadyApplied.setStatus(Project.ProjectStatus.OPEN);

        Project closed = new Project();
        closed.setId(103L);
        closed.setTitle("Closed");
        closed.setCategory("WEB");
        closed.setRequiredSkills(List.of("angular"));
        closed.setBudget(500.0);
        closed.setStatus(Project.ProjectStatus.COMPLETED);

        Proposal myProposal = new Proposal();
        myProposal.setProjectId(102L);
        myProposal.setProposedBudget(500.0);

        when(userRepository.findById(7L)).thenReturn(Optional.of(freelancer));
        when(proposalRepository.findByFreelancerId(7L)).thenReturn(List.of(myProposal));
        when(projectRepository.findAll()).thenReturn(List.of(openProject, alreadyApplied, closed));
        when(proposalRepository.countByFreelancerIdAndStatus(7L, Proposal.ProposalStatus.ACCEPTED)).thenReturn(0L);

        List<MatchResult> results = matchingService.getTopProjectsForFreelancer(7L);

        assertEquals(1, results.size());
        assertEquals(101L, results.get(0).getFreelancerId());
        assertFalse(results.stream().anyMatch(r -> r.getFreelancerId().equals(102L)));
        assertFalse(results.stream().anyMatch(r -> r.getFreelancerId().equals(103L)));
    }

    @Test
    void getTopFreelancersForProject_shouldThrowWhenProjectNotFound() {
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> matchingService.getTopFreelancersForProject(999L));
    }
}
