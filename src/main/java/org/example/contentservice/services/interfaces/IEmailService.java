package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.Certification;

public interface IEmailService {
    void sendCertificationEmail(Certification certification, String userEmail);
    byte[] generateCertificatePdf(Certification certification, String userName, String contentTitle);
}