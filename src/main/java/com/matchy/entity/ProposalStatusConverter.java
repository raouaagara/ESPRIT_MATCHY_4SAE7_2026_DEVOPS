package com.matchy.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ProposalStatusConverter implements AttributeConverter<Proposal.ProposalStatus, String> {
    @Override
    public String convertToDatabaseColumn(Proposal.ProposalStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public Proposal.ProposalStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Proposal.ProposalStatus.PENDING;
        }
        return Proposal.ProposalStatus.valueOf(dbData.trim().toUpperCase());
    }
}
