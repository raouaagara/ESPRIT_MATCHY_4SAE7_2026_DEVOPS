import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyProject } from '../../frontoffice/models/project.model';
import { ProjectMilestone, MilestoneApplication, InterviewSchedule } from '../../frontoffice/models/milestone.model';
import { CompanyProjectsService } from '../../frontoffice/services/company-projects.service';
import { MilestonesService } from '../../frontoffice/services/milestones.service';

@Component({
  selector: 'app-review-applications',
  templateUrl: './review-applications.component.html',
  styleUrls: ['./review-applications.component.scss']
})
export class ReviewApplicationsComponent implements OnInit {
  project?: CompanyProject;
  milestones: ProjectMilestone[] = [];
  applications: MilestoneApplication[] = [];
  filteredApplications: MilestoneApplication[] = [];
  selectedStatus = 'all';
  
  showInterviewModal = false;
  selectedApplication?: MilestoneApplication;
  
  interviewForm = {
    meetLink: '',
    date: '',
    time: '',
    notes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: CompanyProjectsService,
    private milestonesService: MilestonesService
  ) {}

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    
    this.projectsService.getProjectById(projectId).subscribe(project => {
      this.project = project;
      
      if (!this.project) {
        this.router.navigate(['/backoffice/company-projects']);
        return;
      }

      this.loadData();
    });
  }

  loadData(): void {
    if (this.project) {
      this.milestonesService.getMilestonesByProjectId(this.project.id).subscribe(milestones => {
        this.milestones = milestones;
      });
      
      this.milestonesService.getApplicationsByProject(this.project.id).subscribe(applications => {
        this.applications = applications;
        this.applyFilters();
      });
    }
  }

  applyFilters(): void {
    this.filteredApplications = this.applications.filter(app => {
      const matchStatus = this.selectedStatus === 'all' || app.status === this.selectedStatus;
      return matchStatus;
    });
  }

  getMilestone(milestoneId: number): ProjectMilestone | undefined {
    return this.milestones.find(m => m.id === milestoneId);
  }

  openInterviewModal(application: MilestoneApplication): void {
    this.selectedApplication = application;
    if (application.interview) {
      const interviewDate = new Date(application.interview.date);
      this.interviewForm = {
        meetLink: application.interview.meetLink,
        date: interviewDate.toISOString().split('T')[0],
        time: application.interview.time,
        notes: application.interview.notes || ''
      };
    } else {
      this.interviewForm = {
        meetLink: '',
        date: '',
        time: '',
        notes: ''
      };
    }
    this.showInterviewModal = true;
  }

  closeInterviewModal(): void {
    this.showInterviewModal = false;
    this.selectedApplication = undefined;
  }

  scheduleInterview(): void {
    if (!this.selectedApplication || !this.interviewForm.meetLink || !this.interviewForm.date || !this.interviewForm.time) {
      alert('Please fill in all required fields');
      return;
    }

    const interview = {
      meetLink: this.interviewForm.meetLink,
      date: new Date(this.interviewForm.date),
      time: this.interviewForm.time,
      notes: this.interviewForm.notes
    };

    this.milestonesService.scheduleInterview(this.selectedApplication.id, interview).subscribe(() => {
      this.loadData();
      alert('Interview scheduled successfully! The freelancer will be notified.');
      this.closeInterviewModal();
    });
  }

  updateApplicationStatus(applicationId: number, status: 'pending' | 'accepted' | 'rejected'): void {
    this.milestonesService.updateApplicationStatus(applicationId, status).subscribe(() => {
      this.loadData();
    });
  }

  goBack(): void {
    this.router.navigate(['/backoffice/company-projects']);
  }

  getStatusClass(status: string): string {
    return status;
  }

  getPendingCount(): number {
    return this.applications.filter(a => a.status === 'pending').length;
  }

  getInterviewCount(): number {
    return this.applications.filter(a => a.status === 'interview_scheduled' || a.status === 'interview_confirmed').length;
  }

  getAcceptedCount(): number {
    return this.applications.filter(a => a.status === 'accepted').length;
  }

  getRejectedCount(): number {
    return this.applications.filter(a => a.status === 'rejected').length;
  }

  viewCV(cvUrl: string): void {
    console.log('Opening CV, URL length:', cvUrl.length);
    console.log('URL starts with:', cvUrl.substring(0, 50));
    
    if (cvUrl.startsWith('data:')) {
      // Base64 data - convert to blob and download
      try {
        // Extract mime type and base64 data
        const matches = cvUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          console.error('Invalid data URL format');
          alert('Invalid CV format. Please contact support.');
          return;
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        console.log('MIME type:', mimeType);
        console.log('Base64 data length:', base64Data.length);
        
        // Convert base64 to binary
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        console.log('Byte array length:', byteArray.length);
        
        // Create blob
        const blob = new Blob([byteArray], { type: mimeType });
        console.log('Blob created, size:', blob.size, 'type:', blob.type);
        
        // Create download link
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Determine file extension
        let extension = 'pdf';
        if (mimeType.includes('pdf')) {
          extension = 'pdf';
        } else if (mimeType.includes('msword') || mimeType.includes('doc')) {
          extension = 'doc';
        } else if (mimeType.includes('wordprocessingml')) {
          extension = 'docx';
        }
        
        link.download = `CV_${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        console.log('Download initiated');
      } catch (error) {
        console.error('Error downloading CV:', error);
        alert('Unable to download CV. Error: ' + (error as Error).message);
      }
    } else {
      // Regular URL - open directly
      window.open(cvUrl, '_blank');
    }
  }
}
