export interface Certification {
  certificationId?: number;
  score: number;
  issuedAt?: string;
  validity: string;
  verifiedBy: string;
  userId?: number;
  contentId?: number;
  assessmentId?: number;
  // server may return nested objects instead of just ids
  user?: { id?: number; userId?: number; name?: string; email?: string };
  content?: { contentId?: number; title?: string };
  userName?: string;
  contentTitle?: string;
}
