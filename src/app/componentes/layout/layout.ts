import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, NavigationStart, Router, RouterModule } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { Subscription } from 'rxjs';
import { StateService } from '../../servicios/state.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideDynamicIcon],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, OnDestroy {
  mobileNavOpen = false;
  showProfileMenu = false;
  showNotifications = false;
  mobileSearchOpen = false;

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    public stateService: StateService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    // Set initial state based on current URL
    this.updateSearchState(this.router.url);

    // Reset search query and update search state on page transitions
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.mobileNavOpen = false;
        this.closeMenus();
        this.mobileSearchOpen = false;
        this.stateService.searchQuery = '';
      } else if (event instanceof NavigationEnd) {
        this.updateSearchState(event.urlAfterRedirects || event.url);
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

  @HostListener('document:click')
  closeMenus() {
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.mobileNavOpen = false;
    this.closeMenus();
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  toggleMobileSearch() {
    this.mobileSearchOpen = !this.mobileSearchOpen;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  get userEmail(): string {
    return this.stateService.usuario.email;
  }

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  get userName(): string {
    return this.stateService.usuario.nombre;
  }

  get userProfile(): string {
    return this.stateService.usuario.plan;
  }

  get notificationsList() {
    return this.stateService.notificationsList;
  }

  get unreadNotificationsCount(): number {
    return this.stateService.notificationsList.filter((n) => !n.leido).length;
  }

  markAllNotificationsAsRead() {
    this.stateService.notificationsList.forEach((n) => (n.leido = true));
    this.stateService.saveStateToStorage();
  }

  navigateToAlertas() {
    this.showNotifications = false;
    this.router.navigate(['/alertas']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  updateSearchState(url: string) {
    if (url.includes('/dashboard')) {
      this.stateService.showSearch = true;
      this.stateService.searchPlaceholder = 'Buscar dispositivos...';
    } else if (url.includes('/dispositivos')) {
      this.stateService.showSearch = true;
      this.stateService.searchPlaceholder = 'Buscar dispositivos...';
    } else if (url.includes('/alertas')) {
      this.stateService.showSearch = true;
      this.stateService.searchPlaceholder = 'Buscar alertas...';
    } else if (url.includes('/consumo')) {
      this.stateService.showSearch = true;
      this.stateService.searchPlaceholder = 'Buscar ambientes o reportes...';
    } else if (url.includes('/casa')) {
      this.stateService.showSearch = true;
      this.stateService.searchPlaceholder = 'Buscar casas...';
    } else if (url.includes('/habitacion')) {
      this.stateService.showSearch = true;
      this.stateService.searchPlaceholder = 'Buscar habitaciones...';
    } else {
      this.stateService.showSearch = false;
    }
  }
}
