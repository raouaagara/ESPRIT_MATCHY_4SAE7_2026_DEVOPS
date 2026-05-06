package org.example.contentservice.services.implementing;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.example.contentservice.entities.Certification;
import org.example.contentservice.services.interfaces.IEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class EmailServiceImpl implements IEmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendCertificationEmail(Certification certification, String userEmail) {
        try {
            // Récupérer les informations
            String userName = certification.getUser() != null ? certification.getUser().getName() : "Student";
            String contentTitle = certification.getContent() != null ? certification.getContent().getTitle() : "Course";

            // Générer le PDF
            byte[] pdfBytes = generateCertificatePdf(certification, userName, contentTitle);

            // Créer l'email
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(userEmail);
            helper.setSubject("🎉 Congratulations! Your Certification is Ready");

            String htmlContent = buildEmailContent(userName, contentTitle, certification.getScore());
            helper.setText(htmlContent, true);

            // Attacher le PDF
            String fileName = "Certificate_" + userName.replace(" ", "_") + "_" +
                    certification.getCertificationId() + ".pdf";
            helper.addAttachment(fileName, new ByteArrayResource(pdfBytes));

            // Envoyer
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + userEmail);

        } catch (MessagingException e) {
            System.err.println("❌ Error sending email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public byte[] generateCertificatePdf(Certification certification, String userName, String contentTitle) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Couleurs
            DeviceRgb purple = new DeviceRgb(102, 126, 234);
            DeviceRgb gold = new DeviceRgb(255, 215, 0);

            // Titre principal
            Paragraph title = new Paragraph("CERTIFICATE OF COMPLETION")
                    .setFontSize(32)
                    .setBold()
                    .setFontColor(purple)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(100);
            document.add(title);

            // Ligne décorative
            Paragraph line = new Paragraph("═══════════════════════════════════════")
                    .setFontSize(14)
                    .setFontColor(gold)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20);
            document.add(line);

            // Texte "This certifies that"
            Paragraph certifies = new Paragraph("This certifies that")
                    .setFontSize(16)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(40);
            document.add(certifies);

            // Nom de l'étudiant
            Paragraph studentName = new Paragraph(userName)
                    .setFontSize(28)
                    .setBold()
                    .setFontColor(purple)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20);
            document.add(studentName);

            // Texte "has successfully completed"
            Paragraph completed = new Paragraph("has successfully completed")
                    .setFontSize(16)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30);
            document.add(completed);

            // Titre du cours
            Paragraph courseName = new Paragraph(contentTitle)
                    .setFontSize(22)
                    .setBold()
                    .setItalic()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20);
            document.add(courseName);

            // Score
            Paragraph score = new Paragraph("Final Score: " + certification.getScore().intValue() + "%")
                    .setFontSize(18)
                    .setBold()
                    .setFontColor(gold)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30);
            document.add(score);

            // Date
            String formattedDate = certification.getIssuedAt()
                    .format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            Paragraph date = new Paragraph("Issued on: " + formattedDate)
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(40);
            document.add(date);

            // Signature
            Paragraph signature = new Paragraph("Verified by: " + certification.getVerifiedBy())
                    .setFontSize(14)
                    .setItalic()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20);
            document.add(signature);

            // ID de certification
            Paragraph certId = new Paragraph("Certificate ID: CERT-" + certification.getCertificationId())
                    .setFontSize(10)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(50);
            document.add(certId);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            System.err.println("❌ Error generating PDF: " + e.getMessage());
            e.printStackTrace();
            return new byte[0];
        }
    }

    private String buildEmailContent(String userName, String contentTitle, Float score) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                                  color: white; padding: 30px; text-align: center; border-radius: 10px; }
                        .content { background: #f8fafc; padding: 30px; margin-top: 20px; border-radius: 10px; }
                        .score { font-size: 48px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
                        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; 
                                  border-radius: 8px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Congratulations, %s!</h1>
                            <p>You have successfully completed the assessment</p>
                        </div>
                        
                        <div class="content">
                            <h2>Course: %s</h2>
                            <p>You have demonstrated excellent knowledge and skills!</p>
                            
                            <div class="score">%d%%</div>
                            
                            <p style="text-align: center;">
                                <strong>✅ Assessment Passed</strong><br>
                                🏆 Your official certificate is attached to this email
                            </p>
                            
                            <p>This certificate validates your completion of the course and can be shared with employers 
                            or added to your professional portfolio.</p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2026 Matchy Learning Platform | All rights reserved</p>
                            <p>This is an automated email. Please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(userName, contentTitle, score.intValue());
    }
}