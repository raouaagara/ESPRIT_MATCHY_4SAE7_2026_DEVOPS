package tn.esprit.matchy_sub;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tn.esprit.matchy_sub.entities.Plan;
import tn.esprit.matchy_sub.entities.PlanType;
import tn.esprit.matchy_sub.repositories.PlanRepository;

@Component
@AllArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PlanRepository planRepository;

    @Override
    public void run(String... args) {
        if (planRepository.count() == 0) {
            log.info("[DataInitializer] Seeding default plans...");

            Plan free = new Plan();
            free.setName(PlanType.FREE);
            free.setPrice(0.0);
            free.setCurrency("TND");
            free.setBillingCycle("monthly");
            free.setDescription("Perfect to get started as a freelancer.");
            free.setDurationInDays(30);
            free.setMaxProjects(3);
            free.setMaxBids(3);
            free.setActive(true);
            planRepository.save(free);

            Plan pro = new Plan();
            pro.setName(PlanType.PRO);
            pro.setPrice(29.0);
            pro.setCurrency("TND");
            pro.setBillingCycle("monthly");
            pro.setDescription("For serious freelancers who want to grow.");
            pro.setDurationInDays(30);
            pro.setMaxProjects(null);
            pro.setMaxBids(null);
            pro.setActive(true);
            planRepository.save(pro);

            Plan premium = new Plan();
            premium.setName(PlanType.PREMIUM);
            premium.setPrice(69.0);
            premium.setCurrency("TND");
            premium.setBillingCycle("monthly");
            premium.setDescription("For top freelancers and agencies.");
            premium.setDurationInDays(30);
            premium.setMaxProjects(null);
            premium.setMaxBids(null);
            premium.setActive(true);
            planRepository.save(premium);

            log.info("[DataInitializer] Plans seeded: FREE (id=1), PRO (id=2), PREMIUM (id=3)");
        } else {
            log.info("[DataInitializer] Plans already exist, skipping seed.");
        }
    }
}
