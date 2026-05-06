package tn.esprit.matchy_sub.Controllers;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.matchy_sub.entities.PromoCode;
import tn.esprit.matchy_sub.services.PromoCodeService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promocode")
@AllArgsConstructor
public class PromoCodeController {
    private final PromoCodeService promoCodeService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateCode(@RequestParam(required = false) String notes) {
        try {
            return ResponseEntity.ok(promoCodeService.generateCode(notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCode(@RequestBody Map<String, Object> body) {
        try {
            String code = body.get("code") != null ? body.get("code").toString().trim().toUpperCase() : null;
            Integer discountPercent = body.get("discountPercent") != null
                    ? Integer.parseInt(body.get("discountPercent").toString()) : 10;
            String notes = body.get("notes") != null ? body.get("notes").toString() : null;
            if (code == null || code.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Code cannot be empty"));
            }
            return ResponseEntity.ok(promoCodeService.createCode(code, discountPercent, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<PromoCode>> getAllCodes() {
        return ResponseEntity.ok(promoCodeService.getAllCodes());
    }

    @GetMapping("/active")
    public ResponseEntity<List<PromoCode>> getActiveCodes() {
        return ResponseEntity.ok(promoCodeService.getActiveCodes());
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCode(
            @RequestParam String code,
            @RequestParam Double amountTnd) {
        try {
            return ResponseEntity.ok(promoCodeService.validateCode(code, amountTnd));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateCode(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(promoCodeService.deactivateCode(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateCode(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(promoCodeService.reactivateCode(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCode(@PathVariable Long id) {
        try {
            promoCodeService.deleteCode(id);
            return ResponseEntity.ok(Map.of("message", "Promo code deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
