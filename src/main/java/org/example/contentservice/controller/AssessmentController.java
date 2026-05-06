package org.example.contentservice.controller;

import org.example.contentservice.entities.Assessment;
import org.example.contentservice.services.interfaces.IAssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/Assessment")
public class AssessmentController {

    @Autowired
    private IAssessmentService assessmentService;

    @PostMapping("/addAssessment")
    public Assessment addAssessment(@RequestBody Assessment assessment) {
        return assessmentService.addAssessment(assessment);
    }

    @PutMapping("/modifierAssessment")
    public Assessment modifierAssessment(@RequestBody Assessment assessment) {
        return assessmentService.updateAssessment(assessment);
    }

    @DeleteMapping("/deleteAssessment/{assessmentId}")
    public void deleteAssessment(@PathVariable Integer assessmentId) {
        assessmentService.deleteAssessment(assessmentId);
    }

    @GetMapping("/getAllAssessments")
    public List<Assessment> getAllAssessments() {
        return assessmentService.retrieveAllAssessments();
    }

    @GetMapping("/{assessmentId}")
    public Assessment getAssessment(@PathVariable Integer assessmentId) {
        return assessmentService.retrieveAssessment(assessmentId);
    }

    @GetMapping("/byContent/{contentId}")
    public Assessment getAssessmentByContent(@PathVariable Integer contentId) {
        return assessmentService.getAssessmentByContentId(contentId);
    }
}