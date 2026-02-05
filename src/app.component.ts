
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, MenuItem } from './services/app-state.service';
import { DashboardViewComponent } from './components/dashboard-view.component';
import { ReportsViewComponent } from './components/reports-view.component';
import { GeneralChecksViewComponent } from './components/general-checks-view.component';
import { GenericModuleComponent } from './components/generic-module.component';
import { SettingsViewComponent } from './components/settings-view.component';
import { CollaboratorsViewComponent } from './components/collaborators-view.component';
import { AccountingViewComponent } from './components/accounting-view.component';
import { OperationalChecklistComponent } from './components/operational-checklist.component';
import { StaffTrainingChecklistComponent } from './components/staff-training-checklist.component';
import { SuppliersViewComponent } from './components/suppliers-view.component';
import { CleaningProductsViewComponent } from './components/cleaning-products-view.component';
import { EquipmentViewComponent } from './components/equipment-view.component';
import { GoodsReceiptViewComponent } from './components/goods-receipt-view.component';
import { FoodConservationViewComponent } from './components/food-conservation-view.component';
import { TemperaturesViewComponent } from './components/temperatures-view.component';
import { TraceabilityViewComponent } from './components/traceability-view.component';
import { PestControlViewComponent } from './components/pest-control-view.component';
import { NonComplianceViewComponent } from './components/non-compliance-view.component';
import { AllergensConfigViewComponent } from './components/allergens-config-view.component';
import { CleaningMaintenanceViewComponent } from './components/cleaning-maintenance-view.component';
import { MicrobioMonitorViewComponent } from './components/microbio-monitor-view.component';
import { StaffHygieneViewComponent } from './components/staff-hygiene-view.component';
import { MessagesViewComponent } from './components/messages-view.component';
import { ToastContainerComponent } from './components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardViewComponent,
    ReportsViewComponent,
    GeneralChecksViewComponent,
    GenericModuleComponent,
    SettingsViewComponent,
    CollaboratorsViewComponent,
    AccountingViewComponent,
    OperationalChecklistComponent,
    StaffTrainingChecklistComponent,
    SuppliersViewComponent,
    CleaningProductsViewComponent,
    EquipmentViewComponent,
    GoodsReceiptViewComponent,
    FoodConservationViewComponent,
    TemperaturesViewComponent,
    TraceabilityViewComponent,
    PestControlViewComponent,
    NonComplianceViewComponent,
    AllergensConfigViewComponent,
    CleaningMaintenanceViewComponent,
    MicrobioMonitorViewComponent,
    StaffHygieneViewComponent,
    MessagesViewComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  state = inject(AppStateService);

  getItemsByCategory(category: string): MenuItem[] {
    return this.state.menuItems.filter(item => item.category === category);
  }

  hasAccessToCategory(category: string): boolean {
    if (this.state.isAdmin()) return true;
    // Collaborator restrictions:
    // Can see Anagrafiche (Read Only mostly), Operativo, Normativa.
    // Cannot see Config.
    if (category === 'config') return false;
    return true;
  }
  loginMode = signal<'SELECT' | 'ADMIN' | 'OPERATOR'>('SELECT');
  loginUsername = signal('');
  loginPassword = signal('');
  loginError = signal(false);
  isMobileMenuOpen = signal(false);

  visibleMenuItems = computed(() => {
    return this.state.menuItems.filter(item =>
      this.shouldShowMenuItem(item.category, item.adminOnly)
    );
  });

  // Users List formatted for Context Selector
  readonly contextUsers = computed(() => {
    return this.state.systemUsers().map(u => {
      const client = this.state.clients().find(c => c.id === u.clientId);
      return {
        ...u,
        displayName: client ? `${client.name} - ${u.name}` : u.name
      };
    }).sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  getClientName(id?: string) {
    if (!id) return '';
    const c = this.state.clients().find(c => c.id === id);
    return c ? c.name : '';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  setLoginMode(mode: 'SELECT' | 'ADMIN' | 'OPERATOR') {
    this.loginMode.set(mode);

    // Auto-fill for Development Convenience ("Accessi aperti")
    if (mode === 'ADMIN') {
      this.loginUsername.set('dev');
      this.loginPassword.set('dev');
    } else if (mode === 'OPERATOR') {
      this.loginUsername.set('mario');
      this.loginPassword.set('password');
    } else {
      this.loginUsername.set('');
      this.loginPassword.set('');
    }

    this.loginError.set(false);
  }

  doLogin() {
    const success = this.state.loginWithCredentials(this.loginUsername(), this.loginPassword());
    if (!success) {
      this.loginError.set(true);
    } else {
      this.setLoginMode('SELECT');
    }
  }

  // --- Template Helpers ---

  shouldShowMenuItem(category: string, adminOnly?: boolean): boolean {
    if (adminOnly && !this.state.isAdmin()) return false;
    return this.hasAccessToCategory(category);
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'daily-checks': 'Controlli Giornalieri',
      'anagrafiche': 'Anagrafiche',
      'operativo': 'Operativo',
      'normativa': 'Normativa & Controllo',
      'config': 'Configurazione',
      'communication': 'Comunicazioni'
    };
    return labels[category] || category;
  }

  getDataboardTitle(): string {
    const modId = this.state.currentModuleId();
    const item = this.state.menuItems.find(i => i.id === modId);
    return item ? item.label : (modId === 'dashboard' ? 'Dashboard' : modId);
  }
}
