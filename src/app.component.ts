
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, MenuItem } from './services/app-state.service';
import { DashboardViewComponent } from './components/dashboard-view.component';
import { GenericModuleComponent } from './components/generic-module.component';
import { SettingsViewComponent } from './components/settings-view.component';
import { CollaboratorsViewComponent } from './components/collaborators-view.component';
import { OperationalChecklistComponent } from './components/operational-checklist.component';
import { StaffTrainingChecklistComponent } from './components/staff-training-checklist.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    DashboardViewComponent, 
    GenericModuleComponent, 
    SettingsViewComponent,
    CollaboratorsViewComponent,
    OperationalChecklistComponent,
    StaffTrainingChecklistComponent
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
}
