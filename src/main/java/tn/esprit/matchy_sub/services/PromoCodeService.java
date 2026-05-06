package tn.esprit.matchy_sub.services;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.matchy_sub.entities.PromoCode;
import tn.esprit.matchy_sub.repositories.PromoCodeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class PromoCodeService {
    private final PromoCodeRepository promoCodeRepository;

    public PromoCode generateCode(String notes) {
        String code = generateRandomCode();
        PromoCode promo = PromoCode.builder()
                .code(code)
                .discountPercent(10)
                .active(true)
                .createdAt(LocalDateTime.now())
                .usageCount(0)
                .notes(notes)
                .build();
        return promoCodeRepository.save(promo);
    }

    public PromoCode createCode(String code, Integer discountPercent, String notes) {
        Optional<PromoCode> existing = promoCodeRepository.findByCode(code.trim().toUpperCase());
        if (existing.isPresent()) {
            throw new RuntimeException("Promo code '" + code + "' already exists");
        }
        if (discountPercent == null || discountPercent < 0 || discountPercent > 100) {
            discountPercent = 10;
        }
        PromoCode promo = PromoCode.builder()
                .code(code.trim().toUpperCase())
                .discountPercent(discountPercent)
                .active(true)
                .createdAt(LocalDateTime.now())
                .usageCount(0)
                .notes(notes)
                .build();
        return promoCodeRepository.save(promo);
    }

    public List<PromoCode> getAllCodes() {
        return promoCodeRepository.findAll();
    }

    public List<PromoCode> getActiveCodes() {
        return promoCodeRepository.findByActive(true);
    }

    public PromoCode deactivateCode(Long id) {
        PromoCode promo = promoCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promo code not found: " + id));
        promo.setActive(false);
        promo.setDeactivatedAt(LocalDateTime.now());
        return promoCodeRepository.save(promo);
    }

    public PromoCode reactivateCode(Long id) {
        PromoCode promo = promoCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promo code not found: " + id));
        promo.setActive(true);
        promo.setDeactivatedAt(null);
        return promoCodeRepository.save(promo);
    }

    public Map<String, Object> validateCode(String code, Double amountTnd) {
        if (code == null || code.trim().isEmpty()) {
            return Map.of("valid", false, "message", "Enter a promo code");
        }
        Optional<PromoCode> found = promoCodeRepository.findByCode(code.trim().toUpperCase());
        if (found.isEmpty()) {
            return Map.of("valid", false, "message", "Invalid or expired promo code");
        }
        PromoCode promo = found.get();
        if (!promo.getActive()) {
            return Map.of("valid", false, "message", "This promo code is no longer active");
        }
        if (amountTnd == null || amountTnd <= 0) {
            return Map.of("valid", false, "message", "Promo code cannot be applied to free plans");
        }

        Double discountAmount = Math.round(amountTnd * (promo.getDiscountPercent() / 100.0) * 100) / 100.0;
        Double finalAmount = Math.max(0, Math.round((amountTnd - discountAmount) * 100) / 100.0);

        promo.setUsageCount(promo.getUsageCount() + 1);
        promoCodeRepository.save(promo);

        return Map.of(
                "valid", true,
                "discountPercent", promo.getDiscountPercent(),
                "discountAmount", discountAmount,
                "finalAmount", finalAmount,
                "message", "Promo code applied — " + promo.getDiscountPercent() + "% discount"
        );
    }

    public void deleteCode(Long id) {
        if (!promoCodeRepository.existsById(id)) {
            throw new RuntimeException("Promo code not found: " + id);
        }
        promoCodeRepository.deleteById(id);
    }

    private String generateRandomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder("MATCHY-");
        for (int i = 0; i < 8; i++) {
            code.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return code.toString();
    }
}
