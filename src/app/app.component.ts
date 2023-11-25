import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  showHeader: boolean = false;
  currentPageName: string = 'home';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showHeader = !event.url.includes('/graph') && !event.url.includes('/test');
      };
    });
  }

  navigateToHome() {
    this.router.navigate(['']);
    this.currentPageName = 'home';
  }

  navigateToList() {
    this.router.navigate(['/list']);
    this.currentPageName = 'list';
  }
}
