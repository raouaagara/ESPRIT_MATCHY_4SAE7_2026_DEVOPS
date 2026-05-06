package tn.esprit.matchy_sub.services;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.matchy_sub.entities.PromoCode;
import tn.esprit.matchy_sub.repositories.PromoCodeRepository;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PromoCodeService — Unit Tests")
class PromoCodeServiceTest {

    @Mock PromoCodeRepository promoCodeRepository;
    @InjectMocks PromoCodeService promoCodeService;

    private PromoCode buildPromoCode(Long id, String code, int discount, boolean active) {
        PromoCode p = new PromoCode();
        p.setId(id);
        p.setCode(code);
        p.setDiscountPercent(discount);
        p.setActive(active);
        p.setCreatedAt(LocalDateTime.now());
        p.setUsageCount(0);
        return p;
    }

    // ── CRUD Tests ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateCode() — creates active code with 10% discount")
    void generateCode_createsActiveCodeWith10Percent() {
        when(promoCodeRepository.save(any())).thenAnswer(inv -> {
            PromoCode p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        PromoCode result = promoCodeService.generateCode("Summer promo");

        assertThat(result.getCode()).startsWith("MATCHY-");
        assertThat(result.getDiscountPercent()).isEqualTo(10);
        assertThat(result.getActive()).isTrue();
        assertThat(result.getNotes()).isEqualTo("Summer promo");
        assertThat(result.getUsageCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("createCode() — creates code with custom discount")
    void createCode_createsWithCustomDiscount() {
        when(promoCodeRepository.findByCode("SAVE20")).thenReturn(Optional.empty());
        when(promoCodeRepository.save(any())).thenAnswer(inv -> {
            PromoCode p = inv.getArgument(0);
            p.setId(2L);
            return p;
        });

        PromoCode result = promoCodeService.createCode("SAVE20", 20, "20% off");

        assertThat(result.getCode()).isEqualTo("SAVE20");
        assertThat(result.getDiscountPercent()).isEqualTo(20);
        assertThat(result.getActive()).isTrue();
    }

    @Test
    @DisplayName("createCode() — throws when code already exists")
    void createCode_throwsWhenDuplicate() {
        PromoCode existing = buildPromoCode(1L, "SAVE20", 20, true);
        when(promoCodeRepository.findByCode("SAVE20")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> promoCodeService.createCode("SAVE20", 20, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("SAVE20");
    }

    @Test
    @DisplayName("getAllCodes() — returns all codes")
    void getAllCodes_returnsAll() {
        List<PromoCode> codes = List.of(
                buildPromoCode(1L, "CODE1", 10, true),
                buildPromoCode(2L, "CODE2", 15, false)
        );
        when(promoCodeRepository.findAll()).thenReturn(codes);

        List<PromoCode> result = promoCodeService.getAllCodes();

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("getActiveCodes() — returns only active codes")
    void getActiveCodes_returnsOnlyActive() {
        List<PromoCode> active = List.of(buildPromoCode(1L, "CODE1", 10, true));
        when(promoCodeRepository.findByActive(true)).thenReturn(active);

        List<PromoCode> result = promoCodeService.getActiveCodes();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getActive()).isTrue();
    }

    @Test
    @DisplayName("deactivateCode() — sets active to false")
    void deactivateCode_setsActiveFalse() {
        PromoCode code = buildPromoCode(1L, "CODE1", 10, true);
        when(promoCodeRepository.findById(1L)).thenReturn(Optional.of(code));
        when(promoCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PromoCode result = promoCodeService.deactivateCode(1L);

        assertThat(result.getActive()).isFalse();
        assertThat(result.getDeactivatedAt()).isNotNull();
    }

    @Test
    @DisplayName("reactivateCode() — sets active to true")
    void reactivateCode_setsActiveTrue() {
        PromoCode code = buildPromoCode(1L, "CODE1", 10, false);
        when(promoCodeRepository.findById(1L)).thenReturn(Optional.of(code));
        when(promoCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PromoCode result = promoCodeService.reactivateCode(1L);

        assertThat(result.getActive()).isTrue();
        assertThat(result.getDeactivatedAt()).isNull();
    }

    @Test
    @DisplayName("deleteCode() — deletes existing code")
    void deleteCode_deletesExisting() {
        when(promoCodeRepository.existsById(1L)).thenReturn(true);

        promoCodeService.deleteCode(1L);

        verify(promoCodeRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteCode() — throws when not found")
    void deleteCode_throwsWhenNotFound() {
        when(promoCodeRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> promoCodeService.deleteCode(99L))
                .isInstanceOf(RuntimeException.class);
    }

    // ── Business Logic Tests ──────────────────────────────────────────────────

    @Test
    @DisplayName("validateCode() — returns valid with 10% discount for active code")
    void validateCode_returnsValidDiscount() {
        PromoCode code = buildPromoCode(1L, "SAVE10", 10, true);
        when(promoCodeRepository.findByCode("SAVE10")).thenReturn(Optional.of(code));
        when(promoCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = promoCodeService.validateCode("SAVE10", 29.0);

        assertThat(result.get("valid")).isEqualTo(true);
        assertThat(result.get("discountPercent")).isEqualTo(10);
        assertThat((Double) result.get("discountAmount")).isEqualTo(2.9);
        assertThat((Double) result.get("finalAmount")).isEqualTo(26.1);
    }

    @Test
    @DisplayName("validateCode() — increments usageCount on valid use")
    void validateCode_incrementsUsageCount() {
        PromoCode code = buildPromoCode(1L, "SAVE10", 10, true);
        when(promoCodeRepository.findByCode("SAVE10")).thenReturn(Optional.of(code));
        when(promoCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        promoCodeService.validateCode("SAVE10", 29.0);

        assertThat(code.getUsageCount()).isEqualTo(1);
        verify(promoCodeRepository).save(code);
    }

    @Test
    @DisplayName("validateCode() — returns invalid for inactive code")
    void validateCode_returnsInvalidForInactiveCode() {
        PromoCode code = buildPromoCode(1L, "INACTIVE", 10, false);
        when(promoCodeRepository.findByCode("INACTIVE")).thenReturn(Optional.of(code));

        Map<String, Object> result = promoCodeService.validateCode("INACTIVE", 29.0);

        assertThat(result.get("valid")).isEqualTo(false);
        assertThat(result.get("message").toString()).containsIgnoringCase("active");
    }

    @Test
    @DisplayName("validateCode() — returns invalid for unknown code")
    void validateCode_returnsInvalidForUnknownCode() {
        when(promoCodeRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        Map<String, Object> result = promoCodeService.validateCode("UNKNOWN", 29.0);

        assertThat(result.get("valid")).isEqualTo(false);
    }

    @Test
    @DisplayName("validateCode() — returns invalid for empty code")
    void validateCode_returnsInvalidForEmptyCode() {
        Map<String, Object> result = promoCodeService.validateCode("", 29.0);

        assertThat(result.get("valid")).isEqualTo(false);
        verify(promoCodeRepository, never()).findByCode(any());
    }

    @Test
    @DisplayName("validateCode() — returns invalid for free plan (amount = 0)")
    void validateCode_returnsInvalidForFreePlan() {
        PromoCode code = buildPromoCode(1L, "SAVE10", 10, true);
        when(promoCodeRepository.findByCode("SAVE10")).thenReturn(Optional.of(code));

        Map<String, Object> result = promoCodeService.validateCode("SAVE10", 0.0);

        assertThat(result.get("valid")).isEqualTo(false);
    }

    @Test
    @DisplayName("createCode() — defaults to 10% when invalid discount provided")
    void createCode_defaultsTo10PercentForInvalidDiscount() {
        when(promoCodeRepository.findByCode("CODE")).thenReturn(Optional.empty());
        when(promoCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PromoCode result = promoCodeService.createCode("CODE", 150, null); // > 100 → defaults to 10

        assertThat(result.getDiscountPercent()).isEqualTo(10);
    }
}
