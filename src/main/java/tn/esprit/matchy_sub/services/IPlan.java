package tn.esprit.matchy_sub.services;

import tn.esprit.matchy_sub.entities.Plan;

import java.util.List;

public interface IPlan {
    Plan createPlan(Plan plan);
    Plan findById(Long id);
    List<Plan> findAll();
    Plan updateplan(Long id, Plan plan);
    void deletePlan(Long id);
}
