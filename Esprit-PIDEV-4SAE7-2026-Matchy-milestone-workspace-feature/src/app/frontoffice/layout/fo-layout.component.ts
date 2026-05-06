import { Component } from '@angular/core';

@Component({
  selector: 'app-fo-layout',
  template: `
    <div class="fo-layout">
      <app-fo-navbar></app-fo-navbar>
      <main class="fo-main">
        <router-outlet></router-outlet>
      </main>
      <app-fo-footer></app-fo-footer>
    </div>
  `,
  styles: [`
    .fo-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--fo-bg-primary);
    }
    .fo-main {
      flex: 1;
    }
  `]
})
export class FoLayoutComponent {}
