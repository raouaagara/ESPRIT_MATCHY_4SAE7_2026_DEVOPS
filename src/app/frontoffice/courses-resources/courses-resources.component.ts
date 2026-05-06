import { Component, OnInit } from '@angular/core';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  icon: string;
  color: string;
  lessons: number;
  students: number;
  isFree: boolean;
}

@Component({
  selector: 'app-courses-resources',
  templateUrl: './courses-resources.component.html',
  styleUrls: ['./courses-resources.component.scss']
})
export class CoursesResourcesComponent implements OnInit {
  activeCategory = 'all';
  searchTerm = '';

  categories = ['all', 'design', 'development', 'marketing', 'business'];

  courses: Course[] = [
    { id: 1, title: 'UI/UX Design Fundamentals', description: 'Master the principles of user interface and experience design.', category: 'design', level: 'beginner', duration: '6h 30m', icon: '🎨', color: '#a855f7', lessons: 24, students: 1240, isFree: true },
    { id: 2, title: 'React & Angular Development', description: 'Build modern web applications with popular JavaScript frameworks.', category: 'development', level: 'intermediate', duration: '12h 00m', icon: '⚛️', color: '#4f6ef7', lessons: 48, students: 2310, isFree: false },
    { id: 3, title: 'Freelance Business Mastery', description: 'Grow your freelance career with proven strategies and tools.', category: 'business', level: 'beginner', duration: '4h 00m', icon: '💼', color: '#22c55e', lessons: 16, students: 870, isFree: true },
    { id: 4, title: 'Digital Marketing Essentials', description: 'Learn SEO, social media and content marketing from scratch.', category: 'marketing', level: 'beginner', duration: '5h 15m', icon: '📣', color: '#f59e0b', lessons: 20, students: 1050, isFree: false },
    { id: 5, title: 'Advanced Node.js & APIs', description: 'Create scalable backend services and RESTful APIs with Node.', category: 'development', level: 'advanced', duration: '9h 45m', icon: '🟢', color: '#06b6d4', lessons: 36, students: 680, isFree: false },
    { id: 6, title: 'Brand Identity Design', description: 'Create memorable brand identities for clients and companies.', category: 'design', level: 'intermediate', duration: '7h 00m', icon: '✨', color: '#ec4899', lessons: 28, students: 940, isFree: true },
  ];

  get filteredCourses(): Course[] {
    return this.courses.filter(c => {
      const matchCat = this.activeCategory === 'all' || c.category === this.activeCategory;
      const matchSearch = !this.searchTerm || c.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  ngOnInit(): void {}

  getLevelClass(level: string): string {
    return { beginner: 'success', intermediate: 'primary', advanced: 'danger' }[level] || 'primary';
  }
}
