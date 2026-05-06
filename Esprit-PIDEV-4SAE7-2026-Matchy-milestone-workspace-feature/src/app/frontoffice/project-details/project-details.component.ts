import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyProject } from '../models/project.model';
import { ProjectMilestone, MilestoneApplication } from '../models/milestone.model';
import { CompanyProjectsService } from '../services/company-projects.service';
import { MilestonesService } from '../services/milestones.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit {
  project?: CompanyProject;
  milestones: ProjectMilestone[] = [];
  
  showApplicationModal = false;
  selectedMilestone?: ProjectMilestone;
  selectedCvFile: File | null = null;
  isUploading = false;
  
  applicationForm = {
    motivationLetter: '',
    yearsOfExperience: 0,
    cvUrl: '',
    proposedBudget: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: CompanyProjectsService,
    private milestonesService: MilestonesService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.projectsService.getProjectById(projectId).subscribe(project => {
      this.project = project;
      
      if (!this.project) {
        this.router.navigate(['/projects']);
        return;
      }

      // Increment view count
      this.projectsService.incrementClickCount(projectId).subscribe();
      
      // Load only open milestones for front office
      this.milestonesService.getMilestonesByProjectId(projectId).subscribe(allMilestones => {
        this.milestones = allMilestones.filter(m => m.status === 'open');
        
        console.log('Project details loaded:', {
          projectId,
          totalMilestones: allMilestones.length,
          openMilestones: this.milestones.length
        });
      });
    });
  }

  openApplicationModal(milestone: ProjectMilestone): void {
    if (!this.authService.isAuthenticated) {
      alert('Please login to apply for this milestone');
      this.router.navigate(['/backoffice/login']);
      return;
    }

    if (milestone.status !== 'open') {
      alert('This milestone is not available for applications');
      return;
    }

    this.selectedMilestone = milestone;
    this.selectedCvFile = null;
    this.applicationForm = {
      motivationLetter: '',
      yearsOfExperience: 0,
      cvUrl: '',
      proposedBudget: milestone.budget || 0
    };
    this.showApplicationModal = true;
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
    this.selectedMilestone = undefined;
    this.selectedCvFile = null;
  }

  onCvFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOC, and DOCX files are allowed');
        return;
      }

      this.selectedCvFile = file;
      console.log('CV file selected:', file.name, file.size, file.type);
    }
  }

  removeCvFile(): void {
    this.selectedCvFile = null;
    // Reset file input
    const fileInput = document.getElementById('cvFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async uploadCvFile(): Promise<string> {
    if (!this.selectedCvFile) {
      return '';
    }

    // Convert file to base64 for storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Store as data URL (includes file type)
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(this.selectedCvFile!);
    });
  }

  async submitApplication(): Promise<void> {
    if (!this.selectedMilestone || !this.project || !this.authService.currentUser) {
      console.error('Missing required data for application submission');
      return;
    }

    if (!this.applicationForm.motivationLetter || this.applicationForm.yearsOfExperience < 0) {
      alert('Please fill in all required fields');
      return;
    }

    this.isUploading = true;

    try {
      // Upload CV file if selected
      let cvUrl = this.applicationForm.cvUrl;
      if (this.selectedCvFile) {
        cvUrl = await this.uploadCvFile();
      }

      const application: Omit<MilestoneApplication, 'id' | 'appliedAt' | 'status'> = {
        milestoneId: this.selectedMilestone.id,
        projectId: this.project.id,
        freelancerId: this.authService.currentUser.id,
        freelancerName: this.authService.currentUser.name,
        freelancerEmail: this.authService.currentUser.email,
        motivationLetter: this.applicationForm.motivationLetter,
        yearsOfExperience: this.applicationForm.yearsOfExperience,
        cvUrl: cvUrl,
        proposedBudget: this.applicationForm.proposedBudget
      };

      console.log('Submitting application:', application);
      this.milestonesService.submitApplication(application).subscribe(() => {
        // Refresh milestones to show updated count
        this.milestonesService.getMilestonesByProjectId(this.project!.id).subscribe(allMilestones => {
          this.milestones = allMilestones.filter(m => m.status === 'open');
          console.log('Milestones after application:', this.milestones);
        });
        
        alert('Application submitted successfully! The company will review your application.');
        this.closeApplicationModal();
        this.isUploading = false;
      }, error => {
        console.error('Error submitting application:', error);
        alert('Failed to submit application. Please try again.');
        this.isUploading = false;
      });
    } catch (error) {
      console.error('Error uploading CV:', error);
      alert('Failed to upload CV. Please try again.');
      this.isUploading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  getStatusClass(status: string): string {
    return status;
  }
}
