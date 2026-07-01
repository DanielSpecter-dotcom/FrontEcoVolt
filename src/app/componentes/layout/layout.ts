import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { Subscription } from 'rxjs';
import { StateService } from '../../servicios/state.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideDynamicIcon],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, OnDestroy {
  mobileNavOpen = false;

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    public stateService: StateService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    // Close the mobile drawer automatically whenever a navigation starts,
    // so it never stays open on top of the next page.
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.mobileNavOpen = false;
      }
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav() {
    this.mobileNavOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.mobileNavOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
