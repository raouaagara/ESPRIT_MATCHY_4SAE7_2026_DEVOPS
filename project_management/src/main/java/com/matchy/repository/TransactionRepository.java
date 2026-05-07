package com.matchy.repository;

import com.matchy.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findBySenderIdOrderByCreatedAtDesc(Long senderId);
    List<Transaction> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
    List<Transaction> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT SUM(t.commission) FROM Transaction t WHERE t.statut = 'COMPLETED'")
    Double getTotalCommissions();

    @Query("SELECT SUM(t.montantNet) FROM Transaction t WHERE t.receiver.id = :freelancerId AND t.statut = 'COMPLETED'")
    Double getTotalRevenusFreelancer(@Param("freelancerId") Long freelancerId);
}