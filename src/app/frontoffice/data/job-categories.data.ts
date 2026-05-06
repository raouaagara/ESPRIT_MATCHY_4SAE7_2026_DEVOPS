import { JobCategory } from '../models/job.model';

/** Catalogue métiers (prix de base en TND côté abonnement). */
export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'tech',
    name: 'Technologie & Développement',
    icon: '💻',
    jobs: [
      { id: 'frontend-dev', name: 'Développeur Frontend', tags: ['React', 'Vue', 'HTML/CSS'] },
      { id: 'backend-dev', name: 'Développeur Backend', tags: ['Node.js', 'Python', 'Java'] },
      { id: 'fullstack-dev', name: 'Développeur Fullstack', tags: ['MERN', 'LAMP'] },
      { id: 'mobile-dev', name: 'Développeur Mobile', tags: ['React Native', 'Flutter', 'iOS', 'Android'] },
      { id: 'devops', name: 'Ingénieur DevOps', tags: ['Docker', 'Kubernetes', 'CI/CD'] },
      { id: 'data-scientist', name: 'Data Scientist', tags: ['Python', 'ML', 'TensorFlow'] },
      { id: 'data-analyst', name: 'Data Analyst', tags: ['SQL', 'Power BI', 'Tableau'] },
      { id: 'ai-engineer', name: 'Ingénieur IA / LLM', tags: ['GPT', 'RAG', 'LangChain'] },
      { id: 'blockchain-dev', name: 'Développeur Blockchain', tags: ['Solidity', 'Web3'] },
      { id: 'cybersecurity', name: 'Expert Cybersécurité', tags: ['Pentesting', 'SIEM'] },
      { id: 'qa-engineer', name: 'Ingénieur QA / Test', tags: ['Selenium', 'Jest', 'Cypress'] },
      { id: 'cloud-architect', name: 'Architecte Cloud', tags: ['AWS', 'GCP', 'Azure'] },
      { id: 'embedded-dev', name: 'Développeur Embarqué', tags: ['C', 'Arduino', 'RTOS'] },
      { id: 'sysadmin', name: 'Administrateur Système', tags: ['Linux', 'Windows Server'] }
    ]
  },
  {
    id: 'design',
    name: 'Design & Créativité',
    icon: '🎨',
    jobs: [
      { id: 'ui-designer', name: 'Designer UI', tags: ['Figma', 'XD', 'Sketch'] },
      { id: 'ux-designer', name: 'Designer UX', tags: ['Recherche', 'Wireframing', 'Tests utilisateurs'] },
      { id: 'graphic-designer', name: 'Graphiste', tags: ['Illustrator', 'Photoshop'] },
      { id: 'motion-designer', name: 'Motion Designer', tags: ['After Effects', 'Premiere'] },
      { id: 'brand-designer', name: 'Designer de Marque', tags: ['Logo', 'Identité visuelle'] },
      { id: '3d-artist', name: 'Artiste 3D', tags: ['Blender', 'Cinema 4D', '3ds Max'] },
      { id: 'video-editor', name: 'Monteur Vidéo', tags: ['Premiere Pro', 'DaVinci'] },
      { id: 'photographer', name: 'Photographe', tags: ['Studio', 'Produit', 'Portrait'] },
      { id: 'illustrator', name: 'Illustrateur', tags: ['Digital', 'Vectoriel'] },
      { id: 'web-designer', name: 'Web Designer', tags: ['Webflow', 'WordPress'] }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing & Communication',
    icon: '📢',
    jobs: [
      { id: 'digital-marketer', name: 'Marketeur Digital', tags: ['SEO', 'SEM', 'Analytics'] },
      { id: 'seo-specialist', name: 'Expert SEO', tags: ['On-page', 'Backlinks', 'Technical SEO'] },
      { id: 'social-media', name: 'Manager Réseaux Sociaux', tags: ['Instagram', 'LinkedIn', 'TikTok'] },
      { id: 'copywriter', name: 'Copywriter', tags: ['Rédaction web', 'UX writing'] },
      { id: 'content-creator', name: 'Créateur de Contenu', tags: ['Blog', 'YouTube', 'Podcast'] },
      { id: 'email-marketer', name: 'Expert Email Marketing', tags: ['Mailchimp', 'Klaviyo'] },
      { id: 'ads-specialist', name: 'Expert Publicité Payante', tags: ['Google Ads', 'Meta Ads'] },
      { id: 'growth-hacker', name: 'Growth Hacker', tags: ['Acquisition', 'Rétention'] },
      { id: 'pr-specialist', name: 'Spécialiste Relations Presse', tags: ['Médias', 'Communiqués'] },
      { id: 'influencer-manager', name: 'Manager Influenceurs', tags: ['Campagnes', 'KPIs'] }
    ]
  },
  {
    id: 'business',
    name: 'Business & Consulting',
    icon: '📊',
    jobs: [
      { id: 'business-analyst', name: 'Analyste Business', tags: ['SWOT', 'KPI', 'Roadmap'] },
      { id: 'project-manager', name: 'Chef de Projet', tags: ['Agile', 'Scrum', 'PMP'] },
      { id: 'product-manager', name: 'Product Manager', tags: ['Backlog', 'Roadmap', 'OKR'] },
      { id: 'financial-advisor', name: 'Conseiller Financier', tags: ['Budgets', 'Prévisions'] },
      { id: 'accountant', name: 'Comptable', tags: ['Bilan', 'TVA', 'Paie'] },
      { id: 'legal-consultant', name: 'Consultant Juridique', tags: ['Contrats', 'RGPD'] },
      { id: 'hr-consultant', name: 'Consultant RH', tags: ['Recrutement', 'Formation'] },
      { id: 'startup-coach', name: 'Coach Startup', tags: ['Lean', 'MVP', 'Pitch'] },
      { id: 'supply-chain', name: 'Expert Supply Chain', tags: ['Logistique', 'Stock'] },
      { id: 'sales-consultant', name: 'Consultant Commercial', tags: ['CRM', 'Prospection'] }
    ]
  },
  {
    id: 'writing',
    name: 'Rédaction & Traduction',
    icon: '✍️',
    jobs: [
      { id: 'technical-writer', name: 'Rédacteur Technique', tags: ['Documentation', 'API Docs'] },
      { id: 'translator-en-fr', name: 'Traducteur EN/FR', tags: ['Technique', 'Juridique'] },
      { id: 'translator-ar-fr', name: 'Traducteur AR/FR', tags: ['Officiel', 'Marketing'] },
      { id: 'proofreader', name: 'Correcteur / Relecteur', tags: ['Orthographe', 'Style'] },
      { id: 'ghostwriter', name: 'Ghost Writer', tags: ['Livres', 'Articles', 'Speeches'] },
      { id: 'journalist', name: 'Journaliste', tags: ['Presse', 'Enquête', 'Reportage'] },
      { id: 'scriptwriter', name: 'Scénariste', tags: ['Vidéo', 'Podcast', 'Pub'] }
    ]
  },
  {
    id: 'education',
    name: 'Éducation & Formation',
    icon: '🎓',
    jobs: [
      { id: 'online-tutor', name: 'Tuteur en Ligne', tags: ['Maths', 'Sciences', 'Langues'] },
      { id: 'trainer', name: 'Formateur Professionnel', tags: ['Soft skills', 'Management'] },
      { id: 'elearning-creator', name: 'Créateur e-Learning', tags: ['Articulate', 'Moodle'] },
      { id: 'language-teacher', name: 'Professeur de Langue', tags: ['Anglais', 'Français', 'Arabe'] },
      { id: 'life-coach', name: 'Life Coach', tags: ['Développement personnel'] }
    ]
  },
  {
    id: 'engineering',
    name: 'Ingénierie & Sciences',
    icon: '⚙️',
    jobs: [
      { id: 'civil-engineer', name: 'Ingénieur Civil', tags: ['BTP', 'Infrastructure'] },
      { id: 'mechanical-engineer', name: 'Ingénieur Mécanique', tags: ['CAO', 'SolidWorks'] },
      { id: 'electrical-engineer', name: 'Ingénieur Électrique', tags: ['Automatisme', 'PLC'] },
      { id: 'architect', name: 'Architecte', tags: ['AutoCAD', 'BIM', 'Revit'] },
      { id: 'interior-designer', name: 'Designer Intérieur', tags: ['3D', 'Plans', 'Déco'] },
      { id: 'environmental-consultant', name: 'Consultant Environnement', tags: ['RSE', 'Audit'] }
    ]
  }
];
