import { Component, OnInit } from '@angular/core';
import { AuthService } from './frontoffice/services/auth.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; height: 100%; }']
})
export class AppComponent implements OnInit {
  title = 'matchy-angular';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.checkAuth();
  }
}
