package org.example.contentservice.services.implementing;

import org.example.contentservice.entities.Assessment;
import org.example.contentservice.entities.Certification;
import org.example.contentservice.entities.Content;
import org.example.contentservice.entities.User;
import org.example.contentservice.repositories.AssessmentRepository;
import org.example.contentservice.repositories.CertificationRepository;
import org.example.contentservice.repositories.ContentRepository;
import org.example.contentservice.repositories.UserRepository;
import org.example.contentservice.services.interfaces.ICertificationService;
import org.example.contentservice.services.interfaces.IEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CertificationServiceImpl implements ICertificationService {

    @Autowired
    private CertificationRepository certificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private IEmailService emailService;

    @Override
    public List<Certification> retrieveAllCertifications() {
        List<Certification> certifications = certificationRepository.findAll();

        // Synchroniser les IDs depuis les relations
        for (Certification cert : certifications) {
            if (cert.getUser() != null) {
                cert.setUserId(cert.getUser().getId());
            }
            if (cert.getContent() != null) {
                cert.setContentId(cert.getContent().getContentId());
            }
            if (cert.getAssessment() != null) {
                cert.setAssessmentId(cert.getAssessment().getAssessmentId());
            }
        }

        return certifications;
    }

    @Override
    public Certification addCertification(Certification certification) {
        certification.setIssuedAt(LocalDateTime.now());

        // Charger les entités à partir des IDs
        if (certification.getUserId() != null) {
            Optional<User> userOpt = userRepository.findById(certification.getUserId());
            userOpt.ifPresent(certification::setUser);
        }

        if (certification.getContentId() != null) {
            Optional<Content> contentOpt = contentRepository.findById(certification.getContentId());
            contentOpt.ifPresent(certification::setContent);
        }

        if (certification.getAssessmentId() != null) {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(certification.getAssessmentId());
            assessmentOpt.ifPresent(certification::setAssessment);
        }

        Certification saved = certificationRepository.save(certification);

        // Resynchroniser les IDs après sauvegarde
        if (saved.getUser() != null) {
            saved.setUserId(saved.getUser().getId());

            // ← AJOUTE L'ENVOI D'EMAIL ICI
            String userEmail = saved.getUser().getEmail();
            if (userEmail != null && !userEmail.isEmpty()) {
                emailService.sendCertificationEmail(saved, userEmail);
            }
        }
        if (saved.getContent() != null) {
            saved.setContentId(saved.getContent().getContentId());
        }
        if (saved.getAssessment() != null) {
            saved.setAssessmentId(saved.getAssessment().getAssessmentId());
        }

        return saved;
    }

    @Override
    public Certification updateCertification(Certification certification) {
        // Charger les entités à partir des IDs
        if (certification.getUserId() != null) {
            Optional<User> userOpt = userRepository.findById(certification.getUserId());
            userOpt.ifPresent(certification::setUser);
        }

        if (certification.getContentId() != null) {
            Optional<Content> contentOpt = contentRepository.findById(certification.getContentId());
            contentOpt.ifPresent(certification::setContent);
        }

        if (certification.getAssessmentId() != null) {
            Optional<Assessment> assessmentOpt = assessmentRepository.findById(certification.getAssessmentId());
            assessmentOpt.ifPresent(certification::setAssessment);
        }

        Certification saved = certificationRepository.save(certification);

        // Resynchroniser les IDs après sauvegarde
        if (saved.getUser() != null) {
            saved.setUserId(saved.getUser().getId());
        }
        if (saved.getContent() != null) {
            saved.setContentId(saved.getContent().getContentId());
        }
        if (saved.getAssessment() != null) {
            saved.setAssessmentId(saved.getAssessment().getAssessmentId());
        }

        return saved;
    }

    @Override
    public Certification retrieveCertification(Integer certificationId) {
        Optional<Certification> certOpt = certificationRepository.findById(certificationId);

        if (certOpt.isPresent()) {
            Certification cert = certOpt.get();

            // Synchroniser les IDs
            if (cert.getUser() != null) {
                cert.setUserId(cert.getUser().getId());
            }
            if (cert.getContent() != null) {
                cert.setContentId(cert.getContent().getContentId());
            }
            if (cert.getAssessment() != null) {
                cert.setAssessmentId(cert.getAssessment().getAssessmentId());
            }

            return cert;
        }

        return null;
    }

    @Override
    public void deleteCertification(Integer certificationId) {
        certificationRepository.deleteById(certificationId);
    }
}