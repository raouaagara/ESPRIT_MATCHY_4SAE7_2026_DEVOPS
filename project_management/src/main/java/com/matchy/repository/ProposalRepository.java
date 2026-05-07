package com.matchy.repository;

import com.matchy.entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByProjectId(Long projectId);
    List<Proposal> findByFreelancerId(Long freelancerId);
    boolean existsByProjectIdAndFreelancerId(Long projectId, Long freelancerId);
    long countByFreelancerId(Long freelancerId);
    long countByStatus(Proposal.ProposalStatus status);
    long countByFreelancerIdAndStatus(Long freelancerId, Proposal.ProposalStatus status);
    long countByFreelancerIdAndCreatedAtAfter(Long freelancerId, LocalDateTime date);
}