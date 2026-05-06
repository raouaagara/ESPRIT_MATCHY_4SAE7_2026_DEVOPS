package org.example.contentservice.services.implementing;

import org.example.contentservice.entities.Assessment;
import org.example.contentservice.entities.Content;
import org.example.contentservice.repositories.AssessmentRepository;
import org.example.contentservice.repositories.ContentRepository;
import org.example.contentservice.services.interfaces.IAssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssessmentServiceImpl implements IAssessmentService {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ContentRepository contentRepository;

    @Override
    public List<Assessment> retrieveAllAssessments() {
        List<Assessment> assessments = assessmentRepository.findAll();

        // Synchroniser contentId depuis la relation
        for (Assessment a : assessments) {
            if (a.getContent() != null) {
                a.setContentId(a.getContent().getContentId());
            }
        }

        return assessments;
    }

    @Override
    public Assessment addAssessment(Assessment assessment) {
        // Lier avec Content si contentId est fourni
        if (assessment.getContentId() != null) {
            Optional<Content> contentOpt = contentRepository.findById(assessment.getContentId());
            contentOpt.ifPresent(assessment::setContent);
        }

        Assessment saved = assessmentRepository.save(assessment);

        // Synchroniser contentId après sauvegarde
        if (saved.getContent() != null) {
            saved.setContentId(saved.getContent().getContentId());
        }

        return saved;
    }

    @Override
    public Assessment updateAssessment(Assessment assessment) {
        // Lier avec Content si contentId est fourni
        if (assessment.getContentId() != null) {
            Optional<Content> contentOpt = contentRepository.findById(assessment.getContentId());
            contentOpt.ifPresent(assessment::setContent);
        }

        Assessment saved = assessmentRepository.save(assessment);

        // Synchroniser contentId après sauvegarde
        if (saved.getContent() != null) {
            saved.setContentId(saved.getContent().getContentId());
        }

        return saved;
    }

    @Override
    public Assessment retrieveAssessment(Integer assessmentId) {
        Optional<Assessment> assessmentOpt = assessmentRepository.findById(assessmentId);

        if (assessmentOpt.isPresent()) {
            Assessment assessment = assessmentOpt.get();
            if (assessment.getContent() != null) {
                assessment.setContentId(assessment.getContent().getContentId());
            }
            return assessment;
        }

        return null;
    }

    @Override
    public void deleteAssessment(Integer assessmentId) {
        assessmentRepository.deleteById(assessmentId);
    }

    @Override
    public Assessment getAssessmentByContentId(Integer contentId) {
        Optional<Assessment> assessmentOpt = assessmentRepository.findByContent_ContentId(contentId);

        if (assessmentOpt.isPresent()) {
            Assessment assessment = assessmentOpt.get();
            assessment.setContentId(contentId);
            return assessment;
        }

        return null;
    }
}