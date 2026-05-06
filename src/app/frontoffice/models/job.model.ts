export interface Job {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  tags: string[];
}

export interface JobCategory {
  id: string;
  name: string;
  icon: string;
  jobs: Job[];
}
