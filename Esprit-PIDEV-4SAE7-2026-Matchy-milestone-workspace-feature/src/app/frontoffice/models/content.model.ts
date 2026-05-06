export interface Assessment {
  assessmentId?: number;
  questions: string;
  passingScore: number;
  duration: number;
  contentId?: number;
  // some endpoints return the content object nested
  content?: { contentId?: number; title?: string };
  // helper used by backoffice to display title after create/edit
  contentTitle?: string;
}

export interface Content {
  contentId?: number;
  title: string;
  description: string;
  type: "COURS" | "ARTICLE" | "VIDEO";
  level: "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE";
  createdAt?: string;
  updatedAt?: string;
  authorId?: number;
  // server may include related assessment or certifications which we ignore
  assessment?: Assessment;
}
