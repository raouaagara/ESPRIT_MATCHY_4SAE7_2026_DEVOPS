package com.matchy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchy.entity.Proposal;
import com.matchy.repository.UserRepository;
import com.matchy.service.ProposalService;
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

@WebMvcTest(ProposalController.class)
class ProposalControllerTest {

    @Autowired private MockMvc      mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private ProposalService proposalService;
    @MockBean private UserRepository  userRepository;

    private Proposal sampleProposal;

    @BeforeEach
    void setUp() {
        sampleProposal = new Proposal();
        sampleProposal.setId(1L);
        sampleProposal.setProjectId(10L);
        sampleProposal.setProjectTitle("My Project");
        sampleProposal.setFreelancerId(5L);
        sampleProposal.setFreelancerName("Bob Dev");
        sampleProposal.setFreelancerEmail("bob@test.com");
        sampleProposal.setCoverLetter("I am the best fit.");
        sampleProposal.setProposedBudget(900.0);
        sampleProposal.setStatus(Proposal.ProposalStatus.PENDING);
    }

    // ── GET /api/proposals ───────────────────────────────────────

    @Test
    @WithMockUser
    void getAll_shouldReturn200_withProposalList() throws Exception {
        when(proposalService.getAllProposals()).thenReturn(List.of(sampleProposal));

        mockMvc.perform(get("/api/proposals"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].freelancerName").value("Bob Dev"));
    }

    @Test
    @WithMockUser
    void getAll_shouldFilterByProjectId() throws Exception {
        when(proposalService.getProposalsByProject(10L)).thenReturn(List.of(sampleProposal));

        mockMvc.perform(get("/api/proposals").param("projectId", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].projectId").value(10));
    }

    @Test
    @WithMockUser
    void getAll_shouldFilterByFreelancerId() throws Exception {
        when(proposalService.getProposalsByFreelancer(5L)).thenReturn(List.of(sampleProposal));

        mockMvc.perform(get("/api/proposals").param("freelancerId", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].freelancerId").value(5));
    }

    // ── GET /api/proposals/{id} ──────────────────────────────────

    @Test
    @WithMockUser
    void getById_shouldReturn200_whenFound() throws Exception {
        when(proposalService.getProposalById(1L)).thenReturn(Optional.of(sampleProposal));

        mockMvc.perform(get("/api/proposals/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser
    void getById_shouldReturn404_whenNotFound() throws Exception {
        when(proposalService.getProposalById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/proposals/99"))
            .andExpect(status().isNotFound());
    }

    // ── PATCH /api/proposals/{id}/status ────────────────────────

    @Test
    @WithMockUser
    void updateStatus_shouldReturn200_whenAccepted() throws Exception {
        sampleProposal.setStatus(Proposal.ProposalStatus.ACCEPTED);
        when(proposalService.updateStatus(1L, "ACCEPTED", null)).thenReturn(sampleProposal);

        mockMvc.perform(patch("/api/proposals/1/status")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "ACCEPTED"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    @WithMockUser
    void updateStatus_shouldReturn400_whenServiceThrows() throws Exception {
        when(proposalService.updateStatus(99L, "ACCEPTED", null))
            .thenThrow(new RuntimeException("Proposal not found"));

        mockMvc.perform(patch("/api/proposals/99/status")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "ACCEPTED"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    // ── DELETE /api/proposals/{id} ───────────────────────────────

    @Test
    @WithMockUser
    void delete_shouldReturn200() throws Exception {
        doNothing().when(proposalService).deleteProposal(1L);

        mockMvc.perform(delete("/api/proposals/1")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Proposal deleted"));
    }

    // ── GET /api/proposals/stats ─────────────────────────────────

    @Test
    @WithMockUser
    void getStats_shouldReturn200_withCounts() throws Exception {
        when(proposalService.getStats()).thenReturn(
            Map.of("total", 20L, "pending", 10L, "accepted", 6L, "rejected", 4L));

        mockMvc.perform(get("/api/proposals/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(20))
            .andExpect(jsonPath("$.pending").value(10));
    }

    // ── GET /api/proposals/analytics/{freelancerId} ──────────────

    @Test
    @WithMockUser
    void getFreelancerAnalytics_shouldReturn200() throws Exception {
        when(proposalService.getFreelancerAnalytics(5L)).thenReturn(
            Map.of("totalProposals", 10L, "acceptedProposals", 5L, "globalAcceptanceRate", 50.0));

        mockMvc.perform(get("/api/proposals/analytics/5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalProposals").value(10))
            .andExpect(jsonPath("$.globalAcceptanceRate").value(50.0));
    }

    @Test
    @WithMockUser
    void getFreelancerAnalytics_shouldReturn400_whenServiceThrows() throws Exception {
        when(proposalService.getFreelancerAnalytics(99L))
            .thenThrow(new RuntimeException("Freelancer not found"));

        mockMvc.perform(get("/api/proposals/analytics/99"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    // ── POST /api/proposals/optimizer ───────────────────────────

    @Test
    @WithMockUser
    void optimizeProposal_shouldReturn200_withScore() throws Exception {
        when(proposalService.optimizeProposal(any())).thenReturn(
            Map.of("totalScore", 75, "breakdown", Map.of(), "suggestions", List.of()));

        mockMvc.perform(post("/api/proposals/optimizer")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("coverLetter", "I am ready to start.", "projectBudget", 1000, "proposedBudget", 950))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalScore").value(75));
    }
}
