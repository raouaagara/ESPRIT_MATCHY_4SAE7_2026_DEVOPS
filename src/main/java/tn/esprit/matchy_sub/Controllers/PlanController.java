package tn.esprit.matchy_sub.Controllers;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.services.PlanImp;

import java.util.List;

@RestController
@RequestMapping("/api/plan")
@AllArgsConstructor
public class PlanController {
    public final PlanImp planService;

    @PostMapping
    public Plan create(@RequestBody Plan plan) {
        return planService.createPlan(plan);
    }

    @GetMapping("/{id}")
    public Plan getById(@PathVariable Long id) {
        return planService.findById(id);
    }

    @GetMapping
    public List<Plan> getAll() {
        return planService.findAll();
    }

    @PutMapping("/{id}")
    public Plan update(@PathVariable Long id, @RequestBody Plan plan) {
        return planService.updateplan(id, plan);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        planService.deletePlan(id);
    }
}
