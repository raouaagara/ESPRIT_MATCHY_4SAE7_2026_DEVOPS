import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export type PdfDocType = 'invoice' | 'bank_transfer_instructions' | 'contract' | 'subscription_summary';

export interface InvoicePdfData {
  invoiceId: string;
  clientName: string;
  clientEmail: string;
  planName: string;
  amountTnd: number;
  amountOriginal: number;
  currency: string;
  durationMonths: number;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  transactionRef: string;
  paid: boolean;
}

export interface BankInstructionsPdfData {
  reference: string;
  bankName: string;
  accountHolder: string;
  rib: string;
  iban: string;
  amountTnd: number;
  planName: string;
  validDays: number;
  contactEmail: string;
}

export interface ContractPdfData {
  clientName: string;
  planName: string;
  amountTnd: number;
  durationMonths: number;
  signedAt: string;
  ipHint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly brand = 'MATCHY';

  downloadInvoice(data: InvoicePdfData): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    doc.setFontSize(18);
    doc.text(this.brand, 14, y);
    doc.setFontSize(11);
    y += 8;
    doc.text(`FACTURE ${data.invoiceId}`, 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 14, y);
    doc.text(`Réf. transaction : ${data.transactionRef}`, 120, y);
    y += 8;
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(10);
    doc.text('Facturé à :', 14, y);
    doc.text(data.clientName, 14, y + 5);
    doc.text(data.clientEmail, 14, y + 10);
    y += 18;
    doc.text('Désignation', 14, y);
    doc.text('Montant', 150, y);
    y += 7;
    doc.line(14, y, 196, y);
    y += 6;
    doc.text(`Abonnement ${data.planName}`, 14, y);
    doc.text(`${data.amountTnd.toFixed(2)} TND`, 150, y);
    y += 6;
    doc.setFontSize(9);
    doc.text(`Durée : ${data.durationMonths} mois`, 14, y);
    y += 5;
    doc.text(`Période : ${data.periodStart} → ${data.periodEnd}`, 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`TOTAL TTC`, 14, y);
    doc.text(`${data.amountTnd.toFixed(2)} TND`, 150, y);
    y += 7;
    doc.setFontSize(9);
    doc.text(`Devise affichée / originale : ${data.currency} — équivalent catalogue.`, 14, y);
    y += 8;
    doc.text(`Méthode : ${data.paymentMethod}`, 14, y);
    y += 5;
    doc.text(`Statut : ${data.paid ? 'PAYÉ' : 'EN ATTENTE'}`, 14, y);
    doc.save(`facture-${data.invoiceId}.pdf`);
  }

  downloadBankInstructions(data: BankInstructionsPdfData): void {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.text('Instructions de virement bancaire', 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Référence obligatoire : ${data.reference}`, 14, y);
    y += 6;
    doc.text('(À mentionner dans le libellé du virement)', 14, y);
    y += 10;
    doc.text(`Banque : ${data.bankName}`, 14, y);
    y += 6;
    doc.text(`Titulaire : ${data.accountHolder}`, 14, y);
    y += 6;
    doc.text(`RIB : ${data.rib}`, 14, y);
    y += 6;
    doc.text(`IBAN : ${data.iban}`, 14, y);
    y += 10;
    doc.text(`Montant à virer : ${data.amountTnd.toFixed(2)} TND`, 14, y);
    y += 6;
    doc.text(`Plan souscrit : ${data.planName}`, 14, y);
    y += 10;
    doc.text(`Validité de la demande : ${data.validDays} jours`, 14, y);
    y += 8;
    doc.text(`Après virement, envoyez votre reçu à : ${data.contactEmail}`, 14, y);
    doc.save(`instructions-virement-${data.reference}.pdf`);
  }

  downloadContract(data: ContractPdfData): void {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.text("Contrat d'abonnement", 14, y);
    y += 10;
    doc.setFontSize(10);
    const lines = [
      `Entre ${this.brand} et ${data.clientName},`,
      `Plan : ${data.planName} — ${data.amountTnd.toFixed(2)} TND pour ${data.durationMonths} mois.`,
      'Conditions : utilisation conforme aux CGU, renouvellement selon option choisie.',
      'Politique de remboursement : selon conditions générales publiées sur le site.',
      '',
      `Acceptation électronique : ${data.signedAt}${data.ipHint ? ` — ${data.ipHint}` : ''}.`,
      'Cachet numérique : MATCHY PLATFORM'
    ];
    lines.forEach(line => {
      doc.text(line, 14, y);
      y += 6;
    });
    doc.save(`contrat-${data.planName}-${Date.now()}.pdf`);
  }
}
