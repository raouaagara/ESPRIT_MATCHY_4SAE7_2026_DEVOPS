import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bo-courses-resources',
  templateUrl: './courses-resources.component.html',
  styleUrls: ['./courses-resources.component.scss']
})
export class BoCoursesResourcesComponent implements OnInit {
  searchTerm = '';
  selectedCategory = 'all';
  categories = ['all', 'design', 'development', 'marketing', 'business'];

  courses = [
    { id: 1, title: 'UI/UX Design Fundamentals', category: 'design', level: 'beginner', students: 1240, lessons: 24, status: 'published', author: 'Sara B.', createdAt: '2025-01-10', isFree: true },
    { id: 2, title: 'React & Angular Development', category: 'development', level: 'intermediate', students: 2310, lessons: 48, status: 'published', author: 'Karim M.', createdAt: '2025-01-15', isFree: false },
    { id: 3, title: 'Freelance Business Mastery', category: 'business', level: 'beginner', students: 870, lessons: 16, status: 'draft', author: 'Admin', createdAt: '2025-02-01', isFree: true },
    { id: 4, title: 'Digital Marketing Essentials', category: 'marketing', level: 'beginner', students: 1050, lessons: 20, status: 'published', author: 'Yasmine K.', createdAt: '2025-02-10', isFree: false },
  ];

  get filteredCourses() {
    return this.courses.filter(c => {
      const matchCat = this.selectedCategory === 'all' || c.category === this.selectedCategory;
      const matchSearch = !this.searchTerm || c.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  ngOnInit(): void {}

  getTotalStudents(): number {
    return this.courses.reduce((sum, c) => sum + c.students, 0);
  }

  toggleStatus(course: any): void {
    course.status = course.status === 'published' ? 'draft' : 'published';
  }
}
