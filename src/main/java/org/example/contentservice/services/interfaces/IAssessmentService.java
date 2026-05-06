package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.Assessment;

import java.util.List;

public interface IAssessmentService {
    List<Assessment> retrieveAllAssessments();
    Assessment addAssessment(Assessment assessment);
    Assessment updateAssessment(Assessment assessment);
    Assessment retrieveAssessment(Integer assessmentId);
    void deleteAssessment(Integer assessmentId);
    Assessment getAssessmentByContentId(Integer contentId);
}