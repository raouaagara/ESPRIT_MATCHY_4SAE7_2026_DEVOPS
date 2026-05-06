package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.Certification;

import java.util.List;

public interface ICertificationService {
    List<Certification> retrieveAllCertifications();
    Certification addCertification(Certification certification);
    Certification updateCertification(Certification certification);
    Certification retrieveCertification(Integer certificationId);
    void deleteCertification(Integer certificationId);
}