/**
 * Unit Tests for AI Recommendations Service
 * Tests HTTP calls and data handling for AI-powered recommendations
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiRecommendationsService, FreelancerRecommendation, ProjectRecommendation } from './ai-recommendations.service';
import { environment } from '../../../environments/environment';

describe('AiRecommendationsService', () => {
  let service: AiRecommendationsService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.paymentsAdminBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiRecommendationsService]
    });
    service = TestBed.inject(AiRecommendationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRecommendedFreelancers', () => {
    it('should fetch recommended freelancers for a project', () => {
      const projectId = 1;
      const mockFreelancers: FreelancerRecommendation[] = [
        {
          freelancer_id: 1,
          freelancer_name: 'Ahmed Ben Ali',
          freelancer_email: 'ahmed@example.com',
          skills: ['Angular', 'TypeScript', 'Node.js'],
          experience_years: 5,
          hourly_rate: 50,
          location: 'Tunis',
          average_rating: 4.5,
          success_rate: 90,
          completed_projects: 25,
          availability: 'available',
          match_score: 85.5,
          matching_skills: ['Angular', 'TypeScript'],
          score_breakdown: {
            skills: 35,
            experience: 15,
            rating: 18,
            successRate: 12.5,
            availability: 5
          }
        }
      ];

      service.getRecommendedFreelancers(projectId).subscribe(freelancers => {
        expect(freelancers).toEqual(mockFreelancers);
        expect(freelancers.length).toBe(1);
        expect(freelancers[0].freelancer_name).toBe('Ahmed Ben Ali');
        expect(freelancers[0].match_score).toBe(85.5);
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/recommended-freelancers?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFreelancers);
    });

    it('should use custom limit parameter', () => {
      const projectId = 1;
      const limit = 5;

      service.getRecommendedFreelancers(projectId, limit).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/recommended-freelancers?limit=${limit}`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should use default limit of 10 when not specified', () => {
      const projectId = 1;

      service.getRecommendedFreelancers(projectId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/recommended-freelancers?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle empty freelancer list', () => {
      const projectId = 1;

      service.getRecommendedFreelancers(projectId).subscribe(freelancers => {
        expect(freelancers).toEqual([]);
        expect(freelancers.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/recommended-freelancers?limit=10`);
      req.flush([]);
    });

    it('should handle HTTP error', () => {
      const projectId = 1;
      const errorMessage = 'Project not found';

      service.getRecommendedFreelancers(projectId).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/recommended-freelancers?limit=10`);
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('should return freelancers sorted by match score', () => {
      const projectId = 1;
      const mockFreelancers: FreelancerRecommendation[] = [
        {
          freelancer_id: 1,
          freelancer_name: 'High Match',
          freelancer_email: 'high@example.com',
          skills: ['Angular'],
          experience_years: 5,
          hourly_rate: 50,
          location: 'Tunis',
          average_rating: 4.5,
          success_rate: 90,
          completed_projects: 25,
          availability: 'available',
          match_score: 95.0,
          matching_skills: ['Angular'],
          score_breakdown: { skills: 40, experience: 20, rating: 20, successRate: 15, availability: 0 }
        },
        {
          freelancer_id: 2,
          freelancer_name: 'Low Match',
          freelancer_email: 'low@example.com',
          skills: ['React'],
          experience_years: 2,
          hourly_rate: 30,
          location: 'Sfax',
          average_rating: 3.5,
          success_rate: 70,
          completed_projects: 10,
          availability: 'busy',
          match_score: 45.0,
          matching_skills: [],
          score_breakdown: { skills: 0, experience: 10, rating: 14, successRate: 10.5, availability: 0 }
        }
      ];

      service.getRecommendedFreelancers(projectId).subscribe(freelancers => {
        expect(freelancers[0].match_score).toBeGreaterThan(freelancers[1].match_score);
      });

      const req = httpMock.expectOne(`${apiUrl}/projects/${projectId}/recommended-freelancers?limit=10`);
      req.flush(mockFreelancers);
    });
  });

  describe('getRecommendedProjects', () => {
    it('should fetch recommended projects for a freelancer', () => {
      const freelancerId = 1;
      const mockProjects: ProjectRecommendation[] = [
        {
          id: 1,
          company_name: 'Tech Corp',
          project_title: 'E-commerce Platform',
          description: 'Build a modern e-commerce platform',
          budget: 5000,
          currency: 'TND',
          category: 'Web Development',
          skills: ['Angular', 'TypeScript', 'Node.js'],
          location: 'Tunis',
          deadline: '2026-12-31',
          match_score: 88.0,
          matching_skills: ['Angular', 'TypeScript'],
          score_breakdown: {
            skills: 35,
            experience: 18,
            rating: 20,
            successRate: 15,
            availability: 0
          }
        }
      ];

      service.getRecommendedProjects(freelancerId).subscribe(projects => {
        expect(projects).toEqual(mockProjects);
        expect(projects.length).toBe(1);
        expect(projects[0].project_title).toBe('E-commerce Platform');
        expect(projects[0].match_score).toBe(88.0);
      });

      const req = httpMock.expectOne(`${apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });

    it('should use custom limit parameter', () => {
      const freelancerId = 1;
      const limit = 15;

      service.getRecommendedProjects(freelancerId, limit).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=${limit}`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should use default limit of 10 when not specified', () => {
      const freelancerId = 1;

      service.getRecommendedProjects(freelancerId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle empty project list', () => {
      const freelancerId = 1;

      service.getRecommendedProjects(freelancerId).subscribe(projects => {
        expect(projects).toEqual([]);
        expect(projects.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=10`);
      req.flush([]);
    });

    it('should handle HTTP error', () => {
      const freelancerId = 999;
      const errorMessage = 'Freelancer not found';

      service.getRecommendedProjects(freelancerId).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=10`);
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('should return projects with all required fields', () => {
      const freelancerId = 1;
      const mockProjects: ProjectRecommendation[] = [
        {
          id: 1,
          company_name: 'Tech Corp',
          project_title: 'E-commerce Platform',
          description: 'Build a modern e-commerce platform',
          budget: 5000,
          currency: 'TND',
          category: 'Web Development',
          skills: ['Angular', 'TypeScript'],
          location: 'Tunis',
          deadline: '2026-12-31',
          match_score: 88.0,
          matching_skills: ['Angular'],
          score_breakdown: {
            skills: 35,
            experience: 18,
            rating: 20,
            successRate: 15,
            availability: 0
          }
        }
      ];

      service.getRecommendedProjects(freelancerId).subscribe(projects => {
        const project = projects[0];
        expect(project.id).toBeDefined();
        expect(project.company_name).toBeDefined();
        expect(project.project_title).toBeDefined();
        expect(project.budget).toBeDefined();
        expect(project.match_score).toBeDefined();
        expect(project.matching_skills).toBeDefined();
        expect(project.score_breakdown).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/freelancers/${freelancerId}/recommended-projects?limit=10`);
      req.flush(mockProjects);
    });
  });
});
