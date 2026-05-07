package com.matchy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchy.entity.Project;
import com.matchy.repository.UserRepository;
import com.matchy.service.NotificationService;
import com.matchy.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired private MockMvc       mockMvc;
    @Autowired private ObjectMapper  objectMapper;

    @MockBean private ProjectService      projectService;
    @MockBean private UserRepository      userRepository;
    @MockBean private NotificationService notificationService;

    private Project sampleProject;

    @BeforeEach
    void setUp() {
        sampleProject = new Project();
        sampleProject.setId(1L);
        sampleProject.setTitle("Test Project");
        sampleProject.setDescription("Description");
        sampleProject.setClientId(10L);
        sampleProject.setCategory("WEB");
        sampleProject.setStatus(Project.ProjectStatus.OPEN);
        sampleProject.setBudget(1000.0);
        sampleProject.setProposalsCount(0);
    }

    // ── GET /api/projects ────────────────────────────────────────

    @Test
    @WithMockUser
    void getAll_shouldReturn200_withProjectList() throws Exception {
        when(projectService.getAllProjects()).thenReturn(List.of(sampleProject));

        mockMvc.perform(get("/api/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].title").value("Test Project"));
    }

    @Test
    @WithMockUser
    void getAll_shouldFilterByClientId() throws Exception {
        when(projectService.getProjectsByClient(10L)).thenReturn(List.of(sampleProject));

        mockMvc.perform(get("/api/projects").param("clientId", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].clientId").value(10));
    }

    @Test
    @WithMockUser
    void getAll_shouldFilterByStatus() throws Exception {
        when(projectService.getProjectsByStatus("OPEN")).thenReturn(List.of(sampleProject));

        mockMvc.perform(get("/api/projects").param("status", "OPEN"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("OPEN"));
    }

    // ── GET /api/projects/open ───────────────────────────────────

    @Test
    @WithMockUser
    void getOpen_shouldReturn200() throws Exception {
        when(projectService.getOpenProjects()).thenReturn(List.of(sampleProject));

        mockMvc.perform(get("/api/projects/open"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    // ── GET /api/projects/{id} ───────────────────────────────────

    @Test
    @WithMockUser
    void getById_shouldReturn200_whenFound() throws Exception {
        when(projectService.getProjectById(1L)).thenReturn(Optional.of(sampleProject));

        mockMvc.perform(get("/api/projects/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.title").value("Test Project"));
    }

    @Test
    @WithMockUser
    void getById_shouldReturn404_whenNotFound() throws Exception {
        when(projectService.getProjectById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/projects/99"))
            .andExpect(status().isNotFound());
    }

    // ── DELETE /api/projects/{id} ────────────────────────────────

    @Test
    @WithMockUser
    void delete_shouldReturn200() throws Exception {
        doNothing().when(projectService).deleteProject(1L);

        mockMvc.perform(delete("/api/projects/1")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Project deleted"));
    }

    // ── PATCH /api/projects/{id}/status ─────────────────────────

    @Test
    @WithMockUser
    void updateStatus_shouldReturn200_whenValid() throws Exception {
        sampleProject.setStatus(Project.ProjectStatus.IN_PROGRESS);
        when(projectService.updateStatus(1L, "IN_PROGRESS")).thenReturn(sampleProject);

        mockMvc.perform(patch("/api/projects/1/status")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "IN_PROGRESS"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @WithMockUser
    void updateStatus_shouldReturn400_whenServiceThrows() throws Exception {
        when(projectService.updateStatus(1L, "INVALID"))
            .thenThrow(new RuntimeException("Invalid status"));

        mockMvc.perform(patch("/api/projects/1/status")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "INVALID"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    // ── GET /api/projects/stats ──────────────────────────────────

    @Test
    @WithMockUser
    void getStats_shouldReturn200_withCounts() throws Exception {
        when(projectService.getStats()).thenReturn(
            Map.of("total", 10L, "open", 4L, "inProgress", 3L, "completed", 3L));

        mockMvc.perform(get("/api/projects/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(10))
            .andExpect(jsonPath("$.open").value(4));
    }

    // ── PATCH /api/projects/{id}/deliver ─────────────────────────

    @Test
    @WithMockUser
    void deliver_shouldReturn200_whenValid() throws Exception {
        sampleProject.setStatus(Project.ProjectStatus.DELIVERED);
        sampleProject.setDeliveryLink("https://github.com/delivery");
        when(projectService.submitDelivery(1L, "https://github.com/delivery", "Done"))
            .thenReturn(sampleProject);

        mockMvc.perform(patch("/api/projects/1/deliver")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("deliveryLink", "https://github.com/delivery", "deliveryMessage", "Done"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    // ── PATCH /api/projects/{id}/proposals/increment ─────────────

    @Test
    @WithMockUser
    void incrementProposals_shouldReturn200() throws Exception {
        sampleProject.setProposalsCount(1);
        when(projectService.incrementProposalsCount(1L)).thenReturn(sampleProject);

        mockMvc.perform(patch("/api/projects/1/proposals/increment")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.proposalsCount").value(1));
    }
}
