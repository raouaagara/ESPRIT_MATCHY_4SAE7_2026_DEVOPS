package tn.esprit.matchy_sub.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;
import tn.esprit.matchy_sub.repositories.PlanRepository;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PlanImp — Tests CRUD")
class PlanServiceTest {

    @Mock
    private PlanRepository planRepository;

    @InjectMocks
    private PlanImp planService;

    private Plan freePlan;
    private Plan proPlan;
    private Plan premiumPlan;

    @BeforeEach
    void setUp() {
        freePlan = Plan.builder()
                .id(1L).name(PlanType.FREE).price(0.0)
                .currency("TND").billingCycle("monthly")
                .durationInDays(30).active(true)
                .description("Free plan").build();

        proPlan = Plan.builder()
                .id(2L).name(PlanType.PRO).price(29.0)
                .currency("TND").billingCycle("monthly")
                .durationInDays(30).active(true)
                .description("Pro plan").build();

        premiumPlan = Plan.builder()
                .id(3L).name(PlanType.PREMIUM).price(69.0)
                .currency("TND").billingCycle("monthly")
                .durationInDays(30).active(true)
                .description("Premium plan").build();
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createPlan — sauvegarde et retourne le plan")
    void createPlan_savesAndReturns() {
        when(planRepository.save(proPlan)).thenReturn(proPlan);

        Plan result = planService.createPlan(proPlan);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo(PlanType.PRO);
        assertThat(result.getPrice()).isEqualTo(29.0);
        verify(planRepository).save(proPlan);
    }

    @Test
    @DisplayName("createPlan — plan FREE avec prix 0")
    void createPlan_freePlanWithZeroPrice() {
        when(planRepository.save(freePlan)).thenReturn(freePlan);

        Plan result = planService.createPlan(freePlan);

        assertThat(result.getPrice()).isEqualTo(0.0);
        assertThat(result.getName()).isEqualTo(PlanType.FREE);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById — retourne le plan existant")
    void findById_returnsExistingPlan() {
        when(planRepository.findById(2L)).thenReturn(Optional.of(proPlan));

        Plan result = planService.findById(2L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getName()).isEqualTo(PlanType.PRO);
    }

    @Test
    @DisplayName("findById — lève exception si plan introuvable")
    void findById_throwsWhenNotFound() {
        when(planRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> planService.findById(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("findAll — retourne tous les plans")
    void findAll_returnsAllPlans() {
        when(planRepository.findAll()).thenReturn(Arrays.asList(freePlan, proPlan, premiumPlan));

        List<Plan> result = planService.findAll();

        assertThat(result).hasSize(3);
        assertThat(result).extracting(Plan::getName)
                .containsExactlyInAnyOrder(PlanType.FREE, PlanType.PRO, PlanType.PREMIUM);
    }

    @Test
    @DisplayName("findAll — retourne liste vide si aucun plan")
    void findAll_returnsEmptyList() {
        when(planRepository.findAll()).thenReturn(List.of());

        List<Plan> result = planService.findAll();

        assertThat(result).isEmpty();
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateplan — met à jour le prix et retourne le plan modifié")
    void updatePlan_updatesAndReturns() {
        Plan updated = Plan.builder()
                .id(2L).name(PlanType.PRO).price(39.0)
                .currency("TND").active(true).build();
        when(planRepository.save(any(Plan.class))).thenReturn(updated);

        Plan result = planService.updateplan(2L, updated);

        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getPrice()).isEqualTo(39.0);
        verify(planRepository).save(updated);
    }

    @Test
    @DisplayName("updateplan — force l'ID passé en paramètre")
    void updatePlan_forcesId() {
        Plan incoming = Plan.builder().name(PlanType.PREMIUM).price(79.0).build();
        Plan saved = Plan.builder().id(3L).name(PlanType.PREMIUM).price(79.0).build();
        when(planRepository.save(any(Plan.class))).thenReturn(saved);

        Plan result = planService.updateplan(3L, incoming);

        assertThat(incoming.getId()).isEqualTo(3L); // ID forcé sur l'objet
        assertThat(result.getId()).isEqualTo(3L);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deletePlan — appelle deleteById avec le bon ID")
    void deletePlan_callsDeleteById() {
        doNothing().when(planRepository).deleteById(1L);

        planService.deletePlan(1L);

        verify(planRepository).deleteById(1L);
    }
}
