import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyProject } from '../../frontoffice/models/project.model';
import { ProjectMilestone, MilestoneApplication, InterviewSchedule } from '../../frontoffice/models/milestone.model';
import { CompanyProjectsService } from '../../frontoffice/services/company-projects.service';
import { MilestonesService } from '../../frontoffice/services/milestones.service';

interface ProjectWithMilestones {
  project: CompanyProject;
  milestones: ProjectMilestone[];
  totalApplications: number;
  acceptedCount: number;
}

@Component({
  selector: 'app-bo-projects-milestones',
  templateUrl: './projects-milestones.component.html',
  styleUrls: ['./projects-milestones.component.scss']
})
export class BoProjectsMilestonesComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'all';
  
  projectsWithMilestones: ProjectWithMilestones[] = [];
  filteredProjects: ProjectWithMilestones[] = [];
  
  showMilestoneModal = false;
  showApplicationsModal = false;
  showInterviewModal = false;
  
  selectedProject?: CompanyProject;
  selectedMilestone?: ProjectMilestone;
  selectedMilestoneApplications: MilestoneApplication[] = [];
  selectedApplication?: MilestoneApplication;
  
  interviewForm = {
    meetLink: '',
    date: '',
    time: '',
    notes: ''
  };

  constructor(
    private projectsService: CompanyProjectsService,
    private milestonesService: MilestonesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.projectsService.getProjects().subscribe(projects => {
      // Load all milestones and applications for each project
      const projectPromises = projects.map(project => {
        return new Promise<ProjectWithMilestones>((resolve) => {
          this.milestonesService.getMilestonesByProjectId(project.id).subscribe(milestones => {
            this.milestonesService.getApplicationsByProject(project.id).subscribe(applications => {
              const acceptedCount = applications.filter(a => a.status === 'accepted').length;
              
              console.log(`Project ${project.id} - ${project.projectTitle}:`, {
                milestonesCount: milestones.length,
                applicationsCount: applications.length,
                acceptedCount
              });
              
              resolve({
                project,
                milestones,
                totalApplications: applications.length,
                acceptedCount
              });
            });
          });
        });
      });

      Promise.all(projectPromises).then(results => {
        this.projectsWithMilestones = results;
        this.applyFilters();
      });
    });
  }

  applyFilters(): void {
    this.filteredProjects = this.projectsWithMilestones.filter(pw => {
      const matchStatus = this.selectedStatus === 'all' || pw.project.status === this.selectedStatus;
      const matchSearch = !this.searchTerm || 
        pw.project.projectTitle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pw.project.companyName.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  viewMilestones(project: CompanyProject): void {
    this.router.navigate(['/backoffice/company-projects', project.id, 'milestones']);
  }

  viewApplications(milestone: ProjectMilestone): void {
    this.selectedMilestone = milestone;
    this.milestonesService.getApplicationsByMilestone(milestone.id).subscribe(applications => {
      this.selectedMilestoneApplications = applications;
      console.log(`Viewing applications for milestone ${milestone.id}:`, this.selectedMilestoneApplications);
      this.showApplicationsModal = true;
    });
  }

  closeApplicationsModal(): void {
    this.showApplicationsModal = false;
    this.selectedMilestone = undefined;
    this.selectedMilestoneApplications = [];
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
      // Refresh applications
      if (this.selectedMilestone) {
        this.milestonesService.getApplicationsByMilestone(this.selectedMilestone.id).subscribe(applications => {
          this.selectedMilestoneApplications = applications;
        });
      }
      
      alert('Interview scheduled successfully!');
      this.closeInterviewModal();
    });
  }

  updateApplicationStatus(applicationId: number, status: 'pending' | 'accepted' | 'rejected'): void {
    this.milestonesService.updateApplicationStatus(applicationId, status).subscribe(() => {
      // Refresh applications
      if (this.selectedMilestone) {
        this.milestonesService.getApplicationsByMilestone(this.selectedMilestone.id).subscribe(applications => {
          this.selectedMilestoneApplications = applications;
        });
      }
      
      this.loadData();
    });
  }

  closeMilestone(milestone: ProjectMilestone): void {
    this.milestonesService.getApplicationsByMilestone(milestone.id).subscribe(applications => {
      const acceptedApps = applications.filter(a => a.status === 'accepted');
      
      if (acceptedApps.length === 0) {
        alert('Please accept at least one freelancer before closing this milestone.');
        return;
      }

      if (confirm(`Are you sure you want to close this milestone? It will no longer be visible to freelancers.\n\nAccepted freelancers: ${acceptedApps.length}`)) {
        this.milestonesService.updateMilestone(milestone.id, { status: 'assigned' }).subscribe(() => {
          this.loadData();
          alert('Milestone closed successfully! It has been removed from the front office.');
        });
      }
    });
  }

  getStatusClass(status: string): string {
    return status;
  }

  getProgress(pw: ProjectWithMilestones): number {
    if (pw.milestones.length === 0) return 0;
    const completed = pw.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / pw.milestones.length) * 100);
  }

  getCompletedMilestones(pw: ProjectWithMilestones): number {
    return pw.milestones.filter(m => m.status === 'completed').length;
  }

  getTotalBudget(): number {
    return this.projectsWithMilestones.reduce((sum, pw) => sum + (pw.project.budget || 0), 0);
  }

  getActiveCount(): number {
    return this.projectsWithMilestones.filter(pw => pw.project.status === 'open').length;
  }

  getCompletedCount(): number {
    return this.projectsWithMilestones.filter(pw => pw.project.status === 'closed').length;
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
