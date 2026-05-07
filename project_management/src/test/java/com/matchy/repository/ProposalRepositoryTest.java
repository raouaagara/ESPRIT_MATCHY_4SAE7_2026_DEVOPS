package com.matchy.repository;

import com.matchy.entity.Proposal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests CRUD — ProposalRepository
 * Base H2 en mémoire, aucun service mocké.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("CRUD — ProposalRepository")
class ProposalRepositoryTest {

    @Autowired
    private ProposalRepository proposalRepository;

    private Proposal pr1, pr2, pr3;

    @BeforeEach
    void setUp() {
        proposalRepository.deleteAll();

        pr1 = new Proposal();
        pr1.setProjectId(1L);
        pr1.setProjectTitle("Java API");
        pr1.setFreelancerId(5L);
        pr1.setFreelancerName("Bob Dev");
        pr1.setFreelancerEmail("bob@test.com");
        pr1.setClientId(10L);
        pr1.setCoverLetter("I am the best fit for this project.");
        pr1.setProposedBudget(900.0);
        pr1.setDeliveryTime("2 weeks");
        pr1.setStatus(Proposal.ProposalStatus.PENDING);

        pr2 = new Proposal();
        pr2.setProjectId(1L);
        pr2.setProjectTitle("Java API");
        pr2.setFreelancerId(6L);
        pr2.setFreelancerName("Alice Dev");
        pr2.setFreelancerEmail("alice@test.com");
        pr2.setClientId(10L);
        pr2.setCoverLetter("I have 5 years of experience.");
        pr2.setProposedBudget(1100.0);
        pr2.setStatus(Proposal.ProposalStatus.ACCEPTED);

        pr3 = new Proposal();
        pr3.setProjectId(2L);
        pr3.setProjectTitle("Mobile App");
        pr3.setFreelancerId(5L);
        pr3.setFreelancerName("Bob Dev");
        pr3.setFreelancerEmail("bob@test.com");
        pr3.setClientId(10L);
        pr3.setCoverLetter("Mobile is my specialty.");
        pr3.setProposedBudget(1500.0);
        pr3.setStatus(Proposal.ProposalStatus.REJECTED);

        proposalRepository.saveAll(List.of(pr1, pr2, pr3));
    }

    // ── CREATE ────────────────────────────────────────────────────

    @Test
    @DisplayName("CREATE — doit persister une proposition et générer un ID")
    void create_shouldPersistProposal_andGenerateId() {
        Proposal newProposal = new Proposal();
        newProposal.setProjectId(3L);
        newProposal.setFreelancerId(7L);
        newProposal.setFreelancerName("Charlie Dev");
        newProposal.setFreelancerEmail("charlie@test.com");
        newProposal.setCoverLetter("I can do this.");
        newProposal.setProposedBudget(800.0);
        newProposal.setStatus(Proposal.ProposalStatus.PENDING);

        Proposal saved = proposalRepository.save(newProposal);

        assertNotNull(saved.getId());
        assertEquals(Proposal.ProposalStatus.PENDING, saved.getStatus());
        assertNotNull(saved.getCreatedAt());
    }

    // ── READ ──────────────────────────────────────────────────────

    @Test
    @DisplayName("READ — findById doit retourner la proposition existante")
    void findById_shouldReturnProposal_whenExists() {
        Optional<Proposal> result = proposalRepository.findById(pr1.getId());
        assertTrue(result.isPresent());
        assertEquals("Bob Dev", result.get().getFreelancerName());
    }

    @Test
    @DisplayName("READ — findById doit retourner vide si inexistant")
    void findById_shouldReturnEmpty_whenNotFound() {
        assertFalse(proposalRepository.findById(99999L).isPresent());
    }

    @Test
    @DisplayName("READ — findAll doit retourner toutes les propositions")
    void findAll_shouldReturnAllProposals() {
        assertEquals(3, proposalRepository.findAll().size());
    }

    @Test
    @DisplayName("READ — findByProjectId doit filtrer par projet")
    void findByProjectId_shouldReturnProposalsForProject() {
        List<Proposal> result = proposalRepository.findByProjectId(1L);
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(p -> p.getProjectId().equals(1L)));
    }

    @Test
    @DisplayName("READ — findByFreelancerId doit filtrer par freelancer")
    void findByFreelancerId_shouldReturnProposalsForFreelancer() {
        List<Proposal> result = proposalRepository.findByFreelancerId(5L);
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(p -> p.getFreelancerId().equals(5L)));
    }

    @Test
    @DisplayName("READ — existsByProjectIdAndFreelancerId doit détecter les doublons")
    void existsByProjectIdAndFreelancerId_shouldDetectDuplicate() {
        assertTrue(proposalRepository.existsByProjectIdAndFreelancerId(1L, 5L));
        assertFalse(proposalRepository.existsByProjectIdAndFreelancerId(1L, 99L));
    }

    @Test
    @DisplayName("READ — countByFreelancerId doit compter les propositions d'un freelancer")
    void countByFreelancerId_shouldReturnCorrectCount() {
        assertEquals(2L, proposalRepository.countByFreelancerId(5L));
        assertEquals(1L, proposalRepository.countByFreelancerId(6L));
        assertEquals(0L, proposalRepository.countByFreelancerId(99L));
    }

    @Test
    @DisplayName("READ — countByStatus doit compter par statut")
    void countByStatus_shouldReturnCorrectCount() {
        assertEquals(1L, proposalRepository.countByStatus(Proposal.ProposalStatus.PENDING));
        assertEquals(1L, proposalRepository.countByStatus(Proposal.ProposalStatus.ACCEPTED));
        assertEquals(1L, proposalRepository.countByStatus(Proposal.ProposalStatus.REJECTED));
        assertEquals(0L, proposalRepository.countByStatus(Proposal.ProposalStatus.WITHDRAWN));
    }

    @Test
    @DisplayName("READ — countByFreelancerIdAndStatus doit combiner les deux filtres")
    void countByFreelancerIdAndStatus_shouldFilterCorrectly() {
        assertEquals(0L, proposalRepository.countByFreelancerIdAndStatus(5L, Proposal.ProposalStatus.ACCEPTED));
        assertEquals(1L, proposalRepository.countByFreelancerIdAndStatus(6L, Proposal.ProposalStatus.ACCEPTED));
        assertEquals(1L, proposalRepository.countByFreelancerIdAndStatus(5L, Proposal.ProposalStatus.REJECTED));
    }

    // ── UPDATE ────────────────────────────────────────────────────

    @Test
    @DisplayName("UPDATE — doit changer le statut vers ACCEPTED")
    void update_shouldChangeStatusToAccepted() {
        pr1.setStatus(Proposal.ProposalStatus.ACCEPTED);
        Proposal updated = proposalRepository.save(pr1);
        assertEquals(Proposal.ProposalStatus.ACCEPTED, updated.getStatus());
    }

    @Test
    @DisplayName("UPDATE — doit persister le feedback client")
    void update_shouldPersistClientFeedback() {
        pr1.setClientFeedback("Great work, accepted!");
        Proposal updated = proposalRepository.save(pr1);
        assertEquals("Great work, accepted!", updated.getClientFeedback());
    }

    @Test
    @DisplayName("UPDATE — doit modifier le budget proposé")
    void update_shouldModifyProposedBudget() {
        pr1.setProposedBudget(750.0);
        Proposal updated = proposalRepository.save(pr1);
        assertEquals(750.0, updated.getProposedBudget());
    }

    // ── DELETE ────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE — doit supprimer une proposition par ID")
    void deleteById_shouldRemoveProposal() {
        Long id = pr1.getId();
        proposalRepository.deleteById(id);
        assertFalse(proposalRepository.findById(id).isPresent());
        assertEquals(2, proposalRepository.count());
    }

    @Test
    @DisplayName("DELETE — deleteAll doit vider la table")
    void deleteAll_shouldClearTable() {
        proposalRepository.deleteAll();
        assertEquals(0, proposalRepository.count());
    }
}
