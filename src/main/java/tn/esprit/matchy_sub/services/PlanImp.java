package tn.esprit.matchy_sub.services;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.repositories.PlanRepository;

import java.util.List;

@Service
@AllArgsConstructor
public class PlanImp implements IPlan {

    public final PlanRepository planRepository;

    @Override
    public Plan createPlan(Plan plan) {
        return planRepository.save(plan);
    }

    @Override
    public Plan findById(Long id) {
        return planRepository.findById(id).orElseThrow();
    }

    @Override
    public List<Plan> findAll() {
        return planRepository.findAll();
    }

    @Override
    public Plan updateplan(Long id, Plan plan) {
        plan.setId(id);
        return planRepository.save(plan);
    }

    @Override
    public void deletePlan(Long id) {
        planRepository.deleteById(id);
    }
}
