package com.matchy.repository;

import com.matchy.entity.Project;
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
 * Tests CRUD — ProjectRepository
 * Base H2 en mémoire, aucun service mocké.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("CRUD — ProjectRepository")
class ProjectRepositoryTest {

    @Autowired
    private ProjectRepository projectRepository;

    private Project p1, p2, p3;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();

        p1 = new Project();
        p1.setTitle("Java API");
        p1.setDescription("Build a REST API");
        p1.setClientId(10L);
        p1.setClientEmail("alice@test.com");
        p1.setCategory("WEB");
        p1.setStatus(Project.ProjectStatus.OPEN);
        p1.setBudget(1000.0);
        p1.setProposalsCount(0);

        p2 = new Project();
        p2.setTitle("Mobile App");
        p2.setDescription("Build a mobile app");
        p2.setClientId(10L);
        p2.setClientEmail("alice@test.com");
        p2.setCategory("MOBILE");
        p2.setStatus(Project.ProjectStatus.IN_PROGRESS);
        p2.setBudget(2000.0);
        p2.setProposalsCount(3);

        p3 = new Project();
        p3.setTitle("Design Work");
        p3.setDescription("UI/UX design");
        p3.setClientId(20L);
        p3.setClientEmail("bob@test.com");
        p3.setCategory("DESIGN");
        p3.setStatus(Project.ProjectStatus.COMPLETED);
        p3.setBudget(500.0);
        p3.setProposalsCount(1);

        projectRepository.saveAll(List.of(p1, p2, p3));
    }

    // ── CREATE ────────────────────────────────────────────────────

    @Test
    @DisplayName("CREATE — doit persister un projet et générer un ID")
    void create_shouldPersistProject_andGenerateId() {
        Project newProject = new Project();
        newProject.setTitle("New Project");
        newProject.setDescription("Description");
        newProject.setClientId(30L);
        newProject.setCategory("WEB");
        newProject.setStatus(Project.ProjectStatus.OPEN);
        newProject.setBudget(800.0);
        newProject.setProposalsCount(0);

        Project saved = projectRepository.save(newProject);

        assertNotNull(saved.getId());
        assertEquals("New Project", saved.getTitle());
        assertEquals(Project.ProjectStatus.OPEN, saved.getStatus());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("CREATE — doit auto-remplir createdAt via @PrePersist")
    void create_shouldAutoFillTimestamps() {
        Project saved = projectRepository.save(p1);
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }

    // ── READ ──────────────────────────────────────────────────────

    @Test
    @DisplayName("READ — findById doit retourner le projet existant")
    void findById_shouldReturnProject_whenExists() {
        Optional<Project> result = projectRepository.findById(p1.getId());
        assertTrue(result.isPresent());
        assertEquals("Java API", result.get().getTitle());
    }

    @Test
    @DisplayName("READ — findById doit retourner vide si inexistant")
    void findById_shouldReturnEmpty_whenNotFound() {
        Optional<Project> result = projectRepository.findById(99999L);
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("READ — findAll doit retourner tous les projets")
    void findAll_shouldReturnAllProjects() {
        List<Project> all = projectRepository.findAll();
        assertEquals(3, all.size());
    }

    @Test
    @DisplayName("READ — findByClientId doit filtrer par client")
    void findByClientId_shouldReturnProjectsForClient() {
        List<Project> result = projectRepository.findByClientId(10L);
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(p -> p.getClientId().equals(10L)));
    }

    @Test
    @DisplayName("READ — findByStatus doit filtrer par statut")
    void findByStatus_shouldReturnProjectsWithStatus() {
        List<Project> open = projectRepository.findByStatus(Project.ProjectStatus.OPEN);
        assertEquals(1, open.size());
        assertEquals("Java API", open.get(0).getTitle());
    }

    @Test
    @DisplayName("READ — findByClientIdAndStatus doit combiner les deux filtres")
    void findByClientIdAndStatus_shouldFilterCorrectly() {
        List<Project> result = projectRepository.findByClientIdAndStatus(10L, Project.ProjectStatus.IN_PROGRESS);
        assertEquals(1, result.size());
        assertEquals("Mobile App", result.get(0).getTitle());
    }

    @Test
    @DisplayName("READ — countByStatus doit compter correctement")
    void countByStatus_shouldReturnCorrectCount() {
        assertEquals(1L, projectRepository.countByStatus(Project.ProjectStatus.OPEN));
        assertEquals(1L, projectRepository.countByStatus(Project.ProjectStatus.IN_PROGRESS));
        assertEquals(1L, projectRepository.countByStatus(Project.ProjectStatus.COMPLETED));
        assertEquals(0L, projectRepository.countByStatus(Project.ProjectStatus.CANCELLED));
    }

    // ── UPDATE ────────────────────────────────────────────────────

    @Test
    @DisplayName("UPDATE — doit modifier le titre et le budget")
    void update_shouldModifyTitleAndBudget() {
        p1.setTitle("Updated Title");
        p1.setBudget(1500.0);
        Project updated = projectRepository.save(p1);

        assertEquals("Updated Title", updated.getTitle());
        assertEquals(1500.0, updated.getBudget());
    }

    @Test
    @DisplayName("UPDATE — doit changer le statut")
    void update_shouldChangeStatus() {
        p1.setStatus(Project.ProjectStatus.IN_PROGRESS);
        Project updated = projectRepository.save(p1);

        assertEquals(Project.ProjectStatus.IN_PROGRESS, updated.getStatus());
    }

    @Test
    @DisplayName("UPDATE — doit persister les champs de livraison")
    void update_shouldPersistDeliveryFields() {
        p2.setDeliveryLink("https://github.com/delivery");
        p2.setDeliveryMessage("Work is done!");
        p2.setStatus(Project.ProjectStatus.DELIVERED);
        Project updated = projectRepository.save(p2);

        assertEquals("https://github.com/delivery", updated.getDeliveryLink());
        assertEquals("Work is done!", updated.getDeliveryMessage());
        assertEquals(Project.ProjectStatus.DELIVERED, updated.getStatus());
    }

    // ── DELETE ────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE — doit supprimer un projet par ID")
    void deleteById_shouldRemoveProject() {
        Long id = p1.getId();
        projectRepository.deleteById(id);

        assertFalse(projectRepository.findById(id).isPresent());
        assertEquals(2, projectRepository.count());
    }

    @Test
    @DisplayName("DELETE — deleteAll doit vider la table")
    void deleteAll_shouldClearTable() {
        projectRepository.deleteAll();
        assertEquals(0, projectRepository.count());
    }

    // ── COUNT ─────────────────────────────────────────────────────

    @Test
    @DisplayName("COUNT — count() doit retourner le nombre total")
    void count_shouldReturnTotalProjects() {
        assertEquals(3, projectRepository.count());
    }
}
