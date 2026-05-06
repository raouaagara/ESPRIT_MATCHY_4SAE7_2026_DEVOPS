import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyProject } from '../../frontoffice/models/project.model';
import { ProjectMilestone, MilestoneApplication } from '../../frontoffice/models/milestone.model';
import { CompanyProjectsService } from '../../frontoffice/services/company-projects.service';
import { MilestonesService } from '../../frontoffice/services/milestones.service';
import { InterviewSchedule } from '../../frontoffice/models/milestone.model';

@Component({
  selector: 'app-project-milestones-manager',
  templateUrl: './project-milestones-manager.component.html',
  styleUrls: ['./project-milestones-manager.component.scss']
})
export class ProjectMilestonesManagerComponent implements OnInit {
  project?: CompanyProject;
  milestones: ProjectMilestone[] = [];
  applications: MilestoneApplication[] = [];
  
  showMilestoneModal = false;
  showApplicationsModal = false;
  showInterviewModal = false;
  isEditMode = false;
  
  currentMilestone: Partial<ProjectMilestone> = {};
  selectedMilestoneApplications: MilestoneApplication[] = [];
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

      this.loadMilestones();
      this.loadApplications();
    });
  }

  loadMilestones(): void {
    if (this.project) {
      this.milestonesService.getMilestonesByProjectId(this.project.id).subscribe(milestones => {
        this.milestones = milestones;
      });
    }
  }

  loadApplications(): void {
    if (this.project) {
      this.milestonesService.getApplicationsByProject(this.project.id).subscribe(applications => {
        this.applications = applications;
      });
    }
  }

  openAddMilestoneModal(): void {
    this.isEditMode = false;
    this.currentMilestone = {
      projectId: this.project?.id,
      title: '',
      description: '',
      skills: [],
      budget: 0,
      currency: 'TND',
      duration: '',
      status: 'open'
    };
    this.showMilestoneModal = true;
  }

  openEditMilestoneModal(milestone: ProjectMilestone): void {
    this.isEditMode = true;
    this.currentMilestone = { ...milestone };
    this.showMilestoneModal = true;
  }

  closeMilestoneModal(): void {
    this.showMilestoneModal = false;
    this.currentMilestone = {};
  }

  saveMilestone(): void {
    if (this.isEditMode && this.currentMilestone.id) {
      this.milestonesService.updateMilestone(this.currentMilestone.id, this.currentMilestone).subscribe(() => {
        this.loadMilestones();
        this.closeMilestoneModal();
      });
    } else {
      this.milestonesService.addMilestone(this.currentMilestone as ProjectMilestone).subscribe(() => {
        this.loadMilestones();
        this.closeMilestoneModal();
      });
    }
  }

  deleteMilestone(id: number): void {
    if (confirm('Are you sure you want to delete this milestone?')) {
      this.milestonesService.deleteMilestone(id).subscribe(() => {
        this.loadMilestones();
      });
    }
  }

  viewApplications(milestone: ProjectMilestone): void {
    this.milestonesService.getApplicationsByMilestone(milestone.id).subscribe(applications => {
      this.selectedMilestoneApplications = applications;
      this.showApplicationsModal = true;
    });
  }

  closeApplicationsModal(): void {
    this.showApplicationsModal = false;
    this.selectedMilestoneApplications = [];
  }

  updateApplicationStatus(applicationId: number, status: 'pending' | 'accepted' | 'rejected'): void {
    this.milestonesService.updateApplicationStatus(applicationId, status).subscribe(() => {
      this.loadApplications();
      // Refresh the applications list in the modal
      const milestoneId = this.selectedMilestoneApplications[0]?.milestoneId;
      if (milestoneId) {
        this.milestonesService.getApplicationsByMilestone(milestoneId).subscribe(applications => {
          this.selectedMilestoneApplications = applications;
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/backoffice/company-projects']);
  }

  parseSkills(skillsString: string): string[] {
    return skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  getSkillsString(skills?: string[]): string {
    return skills ? skills.join(', ') : '';
  }

  getStatusClass(status: string): string {
    return status;
  }

  getApplicationStatusClass(status: string): string {
    return status;
  }

  getPendingApplicationsCount(): number {
    return this.applications.filter(a => a.status === 'pending').length;
  }

  getAcceptedApplicationsCount(): number {
    return this.applications.filter(a => a.status === 'accepted').length;
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
      this.loadApplications();
      
      // Refresh the applications list in the modal
      const milestoneId = this.selectedMilestoneApplications[0]?.milestoneId;
      if (milestoneId) {
        this.milestonesService.getApplicationsByMilestone(milestoneId).subscribe(applications => {
          this.selectedMilestoneApplications = applications;
        });
      }

      alert('Interview scheduled successfully! The freelancer will be notified.');
      this.closeInterviewModal();
    });
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
