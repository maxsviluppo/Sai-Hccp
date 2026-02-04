
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, SystemUser } from '../services/app-state.service';

interface CollaboratorActivity {
  userId: string;
  userName: string;
  avatar: string;
  lastActivity: string;
  tasksCompleted: number;
  tasksPending: number;
  status: 'active' | 'inactive' | 'warning';
  department: string;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  actionable: boolean;
}

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Enhanced Admin Header -->
      <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
        <div class="absolute inset-0 bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div class="relative z-10">
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <i class="fa-solid fa-shield-halved text-white text-xl"></i>
                </div>
                <div>
                  <h2 class="text-3xl font-black text-white">Centro di Controllo HACCP</h2>
                  <p class="text-slate-300 text-sm">Amministrazione {{ state.currentUser()?.name }}</p>
                  @if(state.filterCollaboratorId()) {
                      <div class="mt-1 inline-flex items-center bg-indigo-500/30 px-2 py-0.5 rounded text-xs text-indigo-200 border border-indigo-500/50">
                        <i class="fa-solid fa-filter mr-1"></i> Filtrato su Unità Selezionata
                      </div>
                  }
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <div class="text-xs text-slate-300 uppercase font-bold">Data Selezionata</div>
                <div class="text-lg font-bold text-white">{{ getCurrentDate() }}</div>
              </div>
              <div class="bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-400/30">
                <div class="text-xs text-emerald-300 uppercase font-bold">Sistema</div>
                <div class="text-lg font-bold text-emerald-400 flex items-center">
                  <i class="fa-solid fa-circle-check mr-2"></i> Operativo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <i class="fa-solid fa-clipboard-check text-3xl opacity-80"></i>
              <span class="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">{{ getCurrentDateShort() }}</span>
            </div>
            <p class="text-sm opacity-90 font-medium">Controlli Completati</p>
            <p class="text-4xl font-black mt-2">{{ kpiData().completed }}/{{ kpiData().total }}</p>
            <div class="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all" [style.width.%]="(kpiData().completed / kpiData().total) * 100"></div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
             (click)="scrollToAlerts()">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <i class="fa-solid fa-bell text-3xl opacity-80 animate-pulse"></i>
              @if (criticalAlerts().length > 0) {
                <span class="bg-red-500 px-2 py-1 rounded-full text-xs font-bold animate-bounce">{{ criticalAlerts().length }}</span>
              }
            </div>
            <p class="text-sm opacity-90 font-medium">Avvisi Attivi</p>
            <p class="text-4xl font-black mt-2">{{ systemAlerts().length }}</p>
            <p class="text-xs mt-2 opacity-80">{{ criticalAlerts().length }} critici per la data odierna</p>
          </div>
        </div>

        <div class="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
             (click)="state.setModule('collaborators')">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <i class="fa-solid fa-users text-3xl opacity-80"></i>
              <span class="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">{{ kpiData().activeUsers }} attivi</span>
            </div>
            <p class="text-sm opacity-90 font-medium">Unità Operative</p>
            <p class="text-4xl font-black mt-2">{{ collaboratorActivities().length }}</p>
            <p class="text-xs mt-2 opacity-80">Visualizzati in elenco</p>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <i class="fa-solid fa-chart-line text-3xl opacity-80"></i>
              <span class="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">+12%</span>
            </div>
            <p class="text-sm opacity-90 font-medium">Conformità Media</p>
            <p class="text-4xl font-black mt-2">98.5%</p>
            <p class="text-xs mt-2 opacity-80">vs 86.5% mese scorso</p>
          </div>
        </div>
      </div>

      <!-- Critical Modules Status -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Temperature Module Status -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden group cursor-pointer"
             (click)="state.setModule('temperatures')">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 group-hover:bg-blue-50 transition-colors">
            <h3 class="font-bold text-slate-700 flex items-center gap-2">
              <i class="fa-solid fa-temperature-half text-blue-500"></i> Temperature
            </h3>
            <span class="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700">OK</span>
          </div>
          <div class="p-6">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-slate-500">Misurazioni Oggi</span>
              <span class="font-bold text-slate-800">12 / 16</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
               <div class="h-full bg-blue-500 w-[75%] rounded-full"></div>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <i class="fa-solid fa-clock text-blue-400"></i>
              Ultima rilevazione: 45 min fa (Cella 1)
            </div>
          </div>
        </div>

        <!-- Cleaning Module Status -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden group cursor-pointer"
             (click)="state.setModule('cleaning-maintenance')">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 group-hover:bg-purple-50 transition-colors">
            <h3 class="font-bold text-slate-700 flex items-center gap-2">
              <i class="fa-solid fa-broom text-purple-500"></i> Pulizie e Sanificazione
            </h3>
            <span class="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700">In Corso</span>
          </div>
          <div class="p-6">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-slate-500">Aree Sanificate</span>
              <span class="font-bold text-slate-800">3 / 8</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
               <div class="h-full bg-purple-500 w-[40%] rounded-full"></div>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <i class="fa-solid fa-check-double text-purple-400"></i>
               Cucina: Da Completare
            </div>
          </div>
        </div>

        <!-- Goods Receipt Status -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden group cursor-pointer"
             (click)="state.setModule('goods-receipt')">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 group-hover:bg-emerald-50 transition-colors">
            <h3 class="font-bold text-slate-700 flex items-center gap-2">
              <i class="fa-solid fa-truck-ramp-box text-emerald-500"></i> Ricezione Merce
            </h3>
            <span class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">Nessun Arrivo</span>
          </div>
          <div class="p-6">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-slate-500">Consegne Registrate</span>
              <span class="font-bold text-slate-800">0</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
               <div class="h-full bg-slate-300 w-0 rounded-full"></div>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <i class="fa-solid fa-info-circle text-emerald-400"></i>
               Nessuna consegna prevista per oggi
            </div>
          </div>
        </div>
      </div>

      <!-- Collaborator Monitoring Section -->
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <i class="fa-solid fa-user-clock text-indigo-600"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">Monitoraggio Unità Operative</h3>
              <p class="text-xs text-slate-500">Stato attività per il giorno {{ getCurrentDate() }}</p>
            </div>
          </div>
          @if (!state.filterCollaboratorId()) {
            <button (click)="state.setModule('collaborators')" 
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold">
              <i class="fa-solid fa-users-gear mr-2"></i> Gestisci Struttura
            </button>
          }
        </div>

        <div class="p-6">
          @if (collaboratorActivities().length === 0) {
            <div class="text-center py-12">
              <i class="fa-solid fa-filter-circle-xmark text-slate-300 text-5xl mb-4"></i>
              <p class="text-slate-400 font-medium">Nessuna unità operativa trovata per i filtri selezionati.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              @for (activity of collaboratorActivities(); track activity.userId) {
                <div class="group relative bg-slate-50 hover:bg-white border-2 rounded-xl p-4 transition-all cursor-pointer"
                     [class.border-emerald-200]="activity.status === 'active'"
                     [class.border-orange-200]="activity.status === 'warning'"
                     [class.border-slate-200]="activity.status === 'inactive'"
                     (click)="openUserProfile(activity.userId)">
                  
                  <!-- Status Indicator -->
                  <div class="absolute top-3 right-3">
                    @if (activity.status === 'active') {
                      <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    } @else if (activity.status === 'warning') {
                      <div class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    } @else {
                      <div class="w-3 h-3 bg-slate-300 rounded-full"></div>
                    }
                  </div>

                  <div class="flex items-start gap-3">
                    <img [src]="activity.avatar" class="w-12 h-12 rounded-full border-2 border-white shadow-md">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-slate-800 truncate">{{ activity.userName }}</h4>
                      <p class="text-xs text-slate-500">{{ activity.department }}</p>
                      
                      <div class="mt-3 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-600">Completati</span>
                          <span class="font-bold text-emerald-600">{{ activity.tasksCompleted }}</span>
                        </div>
                        @if (activity.tasksPending > 0) {
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-600">In Attesa</span>
                            <span class="font-bold text-orange-600">{{ activity.tasksPending }}</span>
                          </div>
                        }
                      </div>

                      <div class="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span class="text-[10px] text-slate-400">Ultimo accesso</span>
                        <span class="text-[10px] font-medium text-slate-600">{{ activity.lastActivity }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Hover Action -->
                  <div class="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 rounded-xl transition-colors pointer-events-none"></div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- System Alerts & Anomalies -->
      <div id="alerts-section" class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div class="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <i class="fa-solid fa-triangle-exclamation text-red-600"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">Avvisi di Sistema & Anomalie</h3>
              <p class="text-xs text-slate-500">Notifiche per l'unità selezionata in data {{ getCurrentDate() }}</p>
            </div>
          </div>
          @if (systemAlerts().length > 0) {
            <span class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              {{ systemAlerts().length }} attivi
            </span>
          }
        </div>

        <div class="p-6">
          @if (systemAlerts().length === 0) {
            <div class="text-center py-12">
              <i class="fa-solid fa-check-circle text-emerald-300 text-5xl mb-4"></i>
              <p class="text-slate-400 font-medium">Nessun avviso attivo per questa selezione. Tutto in regola!</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (alert of systemAlerts(); track alert.id) {
                <div class="flex items-start gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md"
                     [class.bg-red-50]="alert.type === 'error'"
                     [class.border-red-200]="alert.type === 'error'"
                     [class.bg-orange-50]="alert.type === 'warning'"
                     [class.border-orange-200]="alert.type === 'warning'"
                     [class.bg-blue-50]="alert.type === 'info'"
                     [class.border-blue-200]="alert.type === 'info'">
                  
                  <div class="flex-shrink-0 mt-1">
                    @if (alert.type === 'error') {
                      <i class="fa-solid fa-circle-xmark text-red-600 text-xl"></i>
                    } @else if (alert.type === 'warning') {
                      <i class="fa-solid fa-triangle-exclamation text-orange-600 text-xl"></i>
                    } @else {
                      <i class="fa-solid fa-info-circle text-blue-600 text-xl"></i>
                    }
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex-1">
                        <h4 class="font-bold text-slate-800 mb-1">{{ alert.title }}</h4>
                        <p class="text-sm text-slate-600 mb-2">{{ alert.message }}</p>
                        
                        @if (alert.userName) {
                          <div class="flex items-center gap-2 text-xs text-slate-500">
                            <i class="fa-solid fa-user"></i>
                            <span>{{ alert.userName }}</span>
                            <span class="text-slate-300">•</span>
                            <span>{{ alert.timestamp }}</span>
                          </div>
                        }
                      </div>

                      @if (alert.actionable && alert.userId) {
                        <button (click)="openUserProfile(alert.userId)" 
                                class="flex-shrink-0 px-3 py-1.5 bg-white border-2 border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-xs font-bold text-slate-700 hover:text-indigo-700">
                          <i class="fa-solid fa-arrow-right mr-1"></i> Visualizza
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button (click)="state.setModule('temperatures')" 
                class="group bg-white hover:bg-blue-50 p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all text-left">
          <div class="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center mb-3 transition-colors">
            <i class="fa-solid fa-temperature-half text-blue-600 group-hover:text-white text-xl transition-colors"></i>
          </div>
          <h4 class="font-bold text-slate-800 mb-1">Controllo Temperature</h4>
          <p class="text-xs text-slate-500">Registra nuova misurazione</p>
        </button>

        <button (click)="state.setModule('traceability')" 
                class="group bg-white hover:bg-emerald-50 p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-400 transition-all text-left">
          <div class="w-12 h-12 rounded-full bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center mb-3 transition-colors">
            <i class="fa-solid fa-barcode text-emerald-600 group-hover:text-white text-xl transition-colors"></i>
          </div>
          <h4 class="font-bold text-slate-800 mb-1">Rintracciabilità</h4>
          <p class="text-xs text-slate-500">Gestisci prodotti</p>
        </button>

        <button (click)="state.setModule('non-compliance')" 
                class="group bg-white hover:bg-red-50 p-6 rounded-xl border-2 border-slate-200 hover:border-red-400 transition-all text-left">
          <div class="w-12 h-12 rounded-full bg-red-100 group-hover:bg-red-500 flex items-center justify-center mb-3 transition-colors">
            <i class="fa-solid fa-triangle-exclamation text-red-600 group-hover:text-white text-xl transition-colors"></i>
          </div>
          <h4 class="font-bold text-slate-800 mb-1">Non Conformità</h4>
          <p class="text-xs text-slate-500">Segnala anomalia</p>
        </button>

        <button (click)="state.setModule('collaborators')" 
                class="group bg-white hover:bg-purple-50 p-6 rounded-xl border-2 border-slate-200 hover:border-purple-400 transition-all text-left">
          <div class="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-500 flex items-center justify-center mb-3 transition-colors">
            <i class="fa-solid fa-users-gear text-purple-600 group-hover:text-white text-xl transition-colors"></i>
          </div>
          <h4 class="font-bold text-slate-800 mb-1">Gestione Struttura</h4>
          <p class="text-xs text-slate-500">Aziende e Collaboratori</p>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .bg-grid-slate-700\/25 {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `]
})
export class DashboardViewComponent {
  state = inject(AppStateService);

  // Filtered Users Logic
  filteredUsers = computed(() => {
    const allUsers = this.state.systemUsers();
    const currentFilterId = this.state.filterCollaboratorId();
    const currentCompanyId = this.state.companyConfig()?.id;

    let users = allUsers;

    // 1. If global unit filter is active, show ONLY that unit
    if (currentFilterId) {
      users = allUsers.filter(u => u.id === currentFilterId);
    }
    // 2. If no filter but Viewing a Company (Admin or Collab), show users of that company
    else if (currentCompanyId) {
      // Exclude generic admins from the monitoring list if filtering by company
      users = allUsers.filter(u => u.clientId === currentCompanyId && u.role !== 'ADMIN');
    }

    return users;
  });

  collaboratorActivities = computed((): CollaboratorActivity[] => {
    return this.filteredUsers().map(user => ({
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      lastActivity: this.getRandomTime(),
      tasksCompleted: Math.floor(Math.random() * 10),
      tasksPending: Math.floor(Math.random() * 5),
      status: user.active ? (Math.random() > 0.7 ? 'warning' : 'active') : 'inactive',
      department: user.department || 'Generale'
    }));
  });

  // KPI Computeds based on Filtered Data
  kpiData = computed(() => {
    const activities = this.collaboratorActivities();
    return {
      completed: activities.reduce((acc, curr) => acc + curr.tasksCompleted, 0),
      total: activities.reduce((acc, curr) => acc + curr.tasksCompleted + curr.tasksPending, 0) || 1, // Avoid /0
      activeUsers: activities.filter(a => a.status !== 'inactive').length
    };
  });

  systemAlerts = computed((): SystemAlert[] => {
    const alerts: SystemAlert[] = [];

    // Alerts only for currently visible users/units
    this.collaboratorActivities().forEach(activity => {
      if (activity.tasksPending > 3) {
        alerts.push({
          id: `alert-${activity.userId}`,
          type: 'warning',
          title: 'Controlli Giornalieri Non Completati',
          message: `${activity.userName} ha ${activity.tasksPending} controlli in attesa.`,
          userId: activity.userId,
          userName: activity.userName,
          timestamp: '2 ore fa',
          actionable: true
        });
      }

      if (activity.status === 'inactive') {
        alerts.push({
          id: `inactive-${activity.userId}`,
          type: 'error',
          title: 'Unità Inattiva',
          message: `${activity.userName} non ha effettuato l'accesso per la data selezionata.`,
          userId: activity.userId,
          userName: activity.userName,
          timestamp: activity.lastActivity,
          actionable: true
        });
      }
    });

    // Add generic system alerts only if viewing multiple units or specific company
    // For simplicity, always show generic anomaly example
    alerts.push({
      id: 'temp-anomaly',
      type: 'warning',
      title: 'Temperatura Fuori Range',
      message: 'Cella frigorifera #2 ha registrato 8°C. Limite: 4°C',
      timestamp: '30 min fa',
      actionable: false
    });

    return alerts;
  });

  criticalAlerts = computed(() =>
    this.systemAlerts().filter(a => a.type === 'error')
  );

  getCurrentDate(): string {
    const d = this.state.filterDate(); // Use Global Date
    return new Date(d).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getCurrentDateShort(): string {
    return new Date(this.state.filterDate()).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  getRandomTime(): string {
    const hours = Math.floor(Math.random() * 12) + 1;
    return `${hours}h fa`;
  }

  openUserProfile(userId: string) {
    this.state.setModule('collaborators');
    // In future: navigate to user detail
  }

  scrollToAlerts() {
    document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}
