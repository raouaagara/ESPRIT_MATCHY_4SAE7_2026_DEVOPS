package org.example.contentservice.controller;

import org.example.contentservice.entities.Certification;
import org.example.contentservice.services.interfaces.ICertificationService;
import org.example.contentservice.services.interfaces.IEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/Certification")
public class CertificationController {

    @Autowired
    private ICertificationService certificationService;
    @Autowired
    private IEmailService emailService;

    // ← AJOUTE CET ENDPOINT DE TEST
    @GetMapping("/test-email/{certificationId}")
    public String testEmail(@PathVariable Integer certificationId) {
        try {
            Certification cert = certificationService.retrieveCertification(certificationId);
            if (cert == null) {
                return "❌ Certification not found";
            }

            if (cert.getUser() == null || cert.getUser().getEmail() == null) {
                return "❌ User or email not found. User ID: " + cert.getUserId();
            }

            emailService.sendCertificationEmail(cert, cert.getUser().getEmail());
            return "✅ Email sent to: " + cert.getUser().getEmail();

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    /* @PostMapping("/addCertification")
    public Certification addCertification(@RequestBody Certification certification) {
        return certificationService.addCertification(certification);
    } */

    @PostMapping("/addCertification")
    public Certification addCertification(@RequestBody Certification certification) {
        try {
            // 1️⃣ Sauvegarder la certification
            Certification savedCert = certificationService.addCertification(certification);

            // 2️⃣ Charger l'utilisateur pour obtenir son email
            if (savedCert.getUser() == null) {
                savedCert = certificationService.retrieveCertification(savedCert.getCertificationId());
            }

            // 3️⃣ Envoyer l'email avec le PDF
            if (savedCert.getUser() != null && savedCert.getUser().getEmail() != null) {
                System.out.println("📧 Sending certification email to: " + savedCert.getUser().getEmail());
                emailService.sendCertificationEmail(savedCert, savedCert.getUser().getEmail());
            } else {
                System.err.println("⚠️ Warning: Could not send email - User or email not found");
            }

            return savedCert;
        } catch (Exception e) {
            System.err.println("❌ Error in addCertification: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error creating certification: " + e.getMessage());
        }
    }



    @PutMapping("/modifierCertification")
    public Certification modifierCertification(@RequestBody Certification certification) {
        return certificationService.updateCertification(certification);
    }

    @DeleteMapping("/deleteCertification/{certificationId}")
    public void deleteCertification(@PathVariable Integer certificationId) {
        certificationService.deleteCertification(certificationId);
    }

    @GetMapping("/getAllCertifications")
    public List<Certification> getAllCertifications() {
        return certificationService.retrieveAllCertifications();
    }

    @GetMapping("/{certificationId}")
    public Certification getCertification(@PathVariable Integer certificationId) {
        return certificationService.retrieveCertification(certificationId);
    }
}