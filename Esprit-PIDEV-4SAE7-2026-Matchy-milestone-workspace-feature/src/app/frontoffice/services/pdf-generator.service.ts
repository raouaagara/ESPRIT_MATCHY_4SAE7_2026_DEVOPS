import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Content } from '../models/content.model';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() {}

  /**
   * Génère et télécharge un PDF du contenu
   */
  downloadContentAsPdf(content: Content, authorName?: string): void {
    // Créer un nouveau document PDF (A4, portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Variables de mise en page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // ============================================
    // EN-TÊTE
    // ============================================
    
    // Logo Matchy (optionnel - si vous avez un logo)
    // doc.addImage('assets/logo.png', 'PNG', margin, yPosition, 30, 10);
    
    // Titre "Matchy Platform"
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Matchy Platform', pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 20;
    
    // Ligne de séparation
    doc.setDrawColor(59, 130, 246); // Bleu
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 15;

    // ============================================
    // BADGE TYPE
    // ============================================
    
    // Badge du type de contenu
    doc.setFillColor(37, 99, 235); // Bleu
    if (content.type === 'COURS') {
      doc.setFillColor(37, 99, 235); // Bleu
    } else if (content.type === 'ARTICLE') {
      doc.setFillColor(16, 185, 129); // Vert
    } else if (content.type === 'VIDEO') {
      doc.setFillColor(239, 68, 68); // Rouge
    }
    
    doc.roundedRect(margin, yPosition, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(content.type, margin + 15, yPosition + 5.5, { align: 'center' });
    
    yPosition += 15;

    // ============================================
    // TITRE
    // ============================================
    
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    // Gérer les titres longs (wrap)
    const titleLines = doc.splitTextToSize(content.title, contentWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 10) + 10;

    // ============================================
    // MÉTADONNÉES
    // ============================================
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    // Auteur
    if (authorName) {
      doc.text(`Auteur : ${authorName}`, margin, yPosition);
      yPosition += 7;
    }
    
    // Date de création
    if (content.createdAt) {
      const date = new Date(content.createdAt);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Publié le : ${formattedDate}`, margin, yPosition);
      yPosition += 7;
    }
    
    yPosition += 10;

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 12;

    // ============================================
    // DESCRIPTION
    // ============================================
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Gérer les descriptions longues avec pagination
    const descriptionLines = doc.splitTextToSize(content.description, contentWidth);
    
    for (let i = 0; i < descriptionLines.length; i++) {
      // Vérifier si on doit passer à une nouvelle page
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(descriptionLines[i], margin, yPosition);
      yPosition += 7;
    }

    // ============================================
    // PIED DE PAGE
    // ============================================
    
    const totalPages = doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Ligne de séparation
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Texte du pied de page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Téléchargé depuis Matchy Platform - matchy.tn',
        margin,
        pageHeight - 12
      );
      
      // Numéro de page
      doc.text(
        `Page ${i} / ${totalPages}`,
        pageWidth - margin,
        pageHeight - 12,
        { align: 'right' }
      );
    }

    // ============================================
    // TÉLÉCHARGEMENT
    // ============================================
    
    // Générer un nom de fichier propre
    const filename = this.sanitizeFilename(content.title) + '.pdf';
    
    // Télécharger le PDF
    doc.save(filename);
  }

  /**
   * Nettoie le nom de fichier (enlève caractères spéciaux)
   */
  private sanitizeFilename(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); // Limiter à 50 caractères
  }
}