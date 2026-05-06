package com.matchy.repository;

import com.matchy.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByClientId(Long clientId);

    List<Project> findByStatus(Project.ProjectStatus status);

    // ✅ enum (pas String) — corrige l'erreur de compilation
    List<Project> findByClientIdAndStatus(Long clientId, Project.ProjectStatus status);

    long countByStatus(Project.ProjectStatus status);
}