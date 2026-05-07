package com.matchy.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ProjectStatusConverter implements AttributeConverter<Project.ProjectStatus, String> {
    @Override
    public String convertToDatabaseColumn(Project.ProjectStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public Project.ProjectStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Project.ProjectStatus.OPEN;
        }
        return Project.ProjectStatus.valueOf(dbData.trim().toUpperCase());
    }
}
