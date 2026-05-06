import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Job, JobCategory } from '../../models/job.model';
import { JOB_CATEGORIES } from '../../data/job-categories.data';

@Component({
  selector: 'app-job-selector',
  templateUrl: './job-selector.component.html',
  styleUrls: ['./job-selector.component.scss']
})
export class JobSelectorComponent implements OnInit {
  @Input() multiple = true;
  @Input() maxSelected = 5;
  @Input() selectedIds: string[] = [];
  @Output() selectedIdsChange = new EventEmitter<string[]>();

  categories = JOB_CATEGORIES;
  search = '';
  filterCategoryId: string | 'all' = 'all';

  ngOnInit(): void {
    if (!this.selectedIds) {
      this.selectedIds = [];
    }
  }

  get filteredCategories(): JobCategory[] {
    const q = this.search.trim().toLowerCase();
    const catFilter = this.filterCategoryId;
    return this.categories
      .filter(c => catFilter === 'all' || c.id === catFilter)
      .map(c => ({
        ...c,
        jobs: c.jobs.filter(j => this.jobMatches(j, q))
      }))
      .filter(c => c.jobs.length > 0);
  }

  private jobMatches(job: Job, q: string): boolean {
    if (!q) {
      return true;
    }
    const pool = [job.name, job.nameFr, job.nameAr, ...job.tags].filter(Boolean).join(' ').toLowerCase();
    return pool.includes(q) || pool.split(/\s+/).some(w => w.startsWith(q));
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  toggle(job: Job): void {
    if (this.isSelected(job.id)) {
      this.selectedIds = this.selectedIds.filter(x => x !== job.id);
    } else {
      if (!this.multiple) {
        this.selectedIds = [job.id];
      } else if (this.selectedIds.length < this.maxSelected) {
        this.selectedIds = [...this.selectedIds, job.id];
      }
    }
    this.selectedIdsChange.emit(this.selectedIds);
  }

  jobById(id: string): Job | undefined {
    for (const c of this.categories) {
      const j = c.jobs.find(x => x.id === id);
      if (j) {
        return j;
      }
    }
    return undefined;
  }
}
