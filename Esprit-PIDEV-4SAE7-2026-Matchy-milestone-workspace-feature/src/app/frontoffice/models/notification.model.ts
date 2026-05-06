export interface Notification {
  id: number;
  user_id: number;
  user_type: 'company' | 'freelancer';
  type: 'application_received' | 'application_accepted' | 'application_rejected' | 'interview_scheduled';
  title: string;
  message: string;
  link?: string;
  application_id?: number;
  is_read: boolean;
  created_at: Date;
}
