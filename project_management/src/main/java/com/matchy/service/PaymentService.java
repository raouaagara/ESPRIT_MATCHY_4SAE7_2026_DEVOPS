package com.matchy.service;

import com.matchy.entity.Project;
import com.matchy.entity.Transaction;
import com.matchy.entity.User;
import com.matchy.repository.ProjectRepository;
import com.matchy.repository.ProposalRepository;
import com.matchy.repository.TransactionRepository;
import com.matchy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PaymentService {

    // Commission Matchy : 10%
    private static final double COMMISSION_RATE = 0.10;

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private UserRepository        userRepository;
    @Autowired private ProjectRepository     projectRepository;
    @Autowired private ProposalRepository    proposalRepository;

    /**
     * Simule le paiement du freelancer par le client à la confirmation de livraison.
     * Crée une transaction PAIEMENT avec commission 10%.
     */
    public Transaction processPayment(Long projectId, Long clientId, Long freelancerId) {

        Project project  = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Projet non trouvé: " + projectId));

        User client     = userRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientId));

        User freelancer = userRepository.findById(freelancerId)
            .orElseThrow(() -> new RuntimeException("Freelancer non trouvé: " + freelancerId));

        double montant    = project.getBudget() != null ? project.getBudget() : 0.0;
        double commission = Math.round(montant * COMMISSION_RATE * 100.0) / 100.0;
        double montantNet = Math.round((montant - commission) * 100.0) / 100.0;

        Transaction tx = new Transaction(
            client,
            freelancer,
            project,
            montant,
            commission,
            montantNet,
            Transaction.TransactionType.PAIEMENT,
            Transaction.TransactionStatut.COMPLETED,
            "Paiement pour le projet: " + project.getTitle()
        );

        return transactionRepository.save(tx);
    }
}