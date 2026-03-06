
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, SystemUser } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

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
    <div class="space-y-8 animate-fade-in p-2">
      
      <!-- Premium Hero Header -->
      <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
        <!-- Decor Elements -->
        <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl"></div>
        <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <i class="fa-solid fa-shield-halved text-3xl text-white"></i>
            </div>
            <div>
              <h2 class="text-4xl font-black tracking-tight text-white mb-1">Control <span class="text-blue-400">Hub</span></h2>
              <div class="flex flex-wrap items-center gap-2">
                <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10 uppercase tracking-widest">
                  <i class="fa-solid fa-circle text-[9px] animate-pulse text-emerald-400"></i>
                  Sistema Online
                </span>
                @if(state.filterCollaboratorId()) {
                  <span class="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-black text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                    <i class="fa-solid fa-filter text-xs"></i> {{ state.filterCollaboratorId() }}
                  </span>
                }
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <!-- Date Card - Matched with Phases Style -->
            <div class="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
              <div class="text-left">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Periodo Attività</p>
                <div class="flex items-center gap-3">
                    <div class="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 rounded-full w-full"></div>
                    </div>
                    <span class="text-xl font-black text-white whitespace-nowrap">{{ getCurrentDate() }}</span>
                </div>
              </div>
              <div class="h-10 w-10 flex items-center justify-center bg-blue-500/20 rounded-xl text-blue-400">
                <i class="fa-solid fa-calendar-day text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live KPI Matrix -->
      @if (state.isAdmin()) {
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <!-- Card: HACCP Progress -->
        <div class="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
          <div class="mb-6 flex items-center justify-between">
            <div class="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
              <i class="fa-solid fa-clipboard-list text-2xl"></i>
            </div>
            <span class="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-black text-blue-700 uppercase tracking-widest">{{ getCurrentDateShort() }}</span>
          </div>
          <p class="text-sm font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Pratica HACCP</p>
          <h3 class="text-4xl font-black text-slate-900">{{ kpiData().completed }} <span class="text-slate-300">/</span> {{ kpiData().total }}</h3>
          <div class="mt-6 h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div class="h-full bg-blue-600 transition-all duration-1000" [style.width.%]="(kpiData().completed / kpiData().total) * 100"></div>
          </div>
        </div>

        <!-- Card: Active Alerts -->
        <div (click)="scrollToAlerts()" class="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div class="mb-6 flex items-center justify-between">
            <div class="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-sm">
              <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            @if (criticalAlerts().length > 0) {
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-sm font-black text-white animate-bounce shadow-lg shadow-red-200">{{ criticalAlerts().length }}</span>
            }
          </div>
          <p class="text-sm font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Avvisi Attivi</p>
          <h3 class="text-4xl font-black text-slate-900">{{ systemAlerts().length }}</h3>
          <p class="mt-3 text-sm font-bold text-red-500 uppercase tracking-tight">{{ criticalAlerts().length }} criticità rilevate</p>
        </div>

        <!-- Card: Active Units -->
        <div (click)="state.setModule('collaborators')" class="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div class="mb-6 flex items-center justify-between">
            <div class="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
              <i class="fa-solid fa-building-user text-2xl"></i>
            </div>
            <span class="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-700 uppercase tracking-widest">{{ kpiData().activeUsers }} Online</span>
          </div>
          <p class="text-sm font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Unità Operative</p>
          <h3 class="text-4xl font-black text-slate-900">{{ collaboratorActivities().length }}</h3>
          <p class="mt-3 text-sm font-bold text-slate-400 uppercase tracking-tight">Infrastruttura Attiva</p>
        </div>

        <!-- Card: Average Compliance -->
        <div class="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl border border-slate-800 transition-all duration-300">
          <div class="mb-6 flex items-center justify-between">
            <div class="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
              <i class="fa-solid fa-chart-line text-2xl"></i>
            </div>
            <span class="rounded-full bg-blue-500/20 px-4 py-1.5 text-xs font-black text-blue-400 border border-blue-500/30 uppercase tracking-widest">+12%</span>
          </div>
          <p class="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 text-left">Conformità Media</p>
          <h3 class="text-4xl font-black text-white">98.5%</h3>
          <p class="mt-3 text-sm font-bold text-indigo-400 uppercase tracking-tight">Target Mensile Raggiunto</p>
        </div>
      </div>

      <!-- Advanced Operations Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Process Flow Monitor -->
        <div class="lg:col-span-2 rounded-[3rem] bg-white p-10 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-10">
            <h3 class="text-2xl font-black text-slate-900 flex items-center gap-4">
              <span class="h-10 w-2.5 bg-indigo-600 rounded-full"></span>
              Timeline Avanzamento HACCP
            </h3>
            <div class="flex items-center gap-3 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
               <span class="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
               <span class="text-xs font-black text-slate-500 uppercase tracking-[0.1em]">Live Update</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Phase Blocks -->
            @for (phase of [
              {id: 'pre', label: 'Pre-Operativa', data: phaseRecap().pre, color: 'blue'},
              {id: 'op', label: 'Operativa', data: phaseRecap().op, color: 'indigo'},
              {id: 'post', label: 'Post-Operativa', data: phaseRecap().post, color: 'purple'}
            ]; track phase.id) {
              <div class="relative">
                <div class="mb-5">
                  <p class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{{ phase.label }}</p>
                  <div class="flex items-end justify-between">
                    <h4 class="text-3xl font-black text-slate-900 leading-tight">{{ phase.data.count }} <span class="text-base text-slate-400 font-bold">/ {{ (filteredUsers() || []).length }}</span></h4>
                    <span class="text-sm font-black" [class]="'text-' + phase.color + '-600'">{{ (phase.data.pct | number:'1.0-0') }}%</span>
                  </div>
                </div>
                <div class="h-4 rounded-full bg-slate-100 overflow-hidden mb-4 shadow-inner">
                  <div class="h-full transition-all duration-1000 shadow-sm" [style.width.%]="phase.data.pct" [class]="'bg-' + phase.color + '-600'"></div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm"
                        [class.bg-emerald-100]="phase.data.issues === 0" [class.text-emerald-700]="phase.data.issues === 0"
                        [class.bg-red-100]="phase.data.issues > 0" [class.text-red-700]="phase.data.issues > 0">
                    {{ phase.data.issues === 0 ? 'STATUS: OK' : 'ANOMALIE: ' + phase.data.issues }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Premium Report Card -->
        <div class="rounded-[3rem] bg-indigo-700 p-10 shadow-2xl relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-800 opacity-90 transition-opacity group-hover:opacity-100"></div>
          <div class="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
          
          <div class="relative z-10 h-full flex flex-col">
            <div class="mb-8 flex items-center justify-between">
              <i class="fa-solid fa-file-invoice text-5xl text-white/50"></i>
              <span class="rounded-xl bg-white/20 px-4 py-2 text-xs font-black text-white border border-white/20 uppercase tracking-[0.15em] shadow-lg">Esportazione A4</span>
            </div>
            
            <h3 class="text-3xl font-black text-white mb-5 leading-tight">Genera Report<br>Certificato</h3>
            <p class="text-indigo-100 text-base mb-10 font-medium opacity-90 leading-relaxed">Raccogli tutti i dati validati del {{ getCurrentDateShort() }} in un unico documento PDF ufficiale.</p>

            <div class="mt-auto space-y-4">
              @if (isSendingReport()) {
                <div class="space-y-3 animate-pulse">
                  <div class="h-2.5 rounded-full bg-white/20 overflow-hidden">
                    <div class="h-full bg-white w-2/3 transition-all duration-500"></div>
                  </div>
                  <p class="text-xs text-center font-black text-white/70 uppercase tracking-widest">Elaborazione file...</p>
                </div>
              } @else {
                <button (click)="sendDailyReport()" class="w-full rounded-[1.5rem] bg-white py-5 text-base font-black text-indigo-900 shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                  <i class="fa-solid fa-paper-plane text-lg"></i> INVIA VIA PEC
                </button>
                <button (click)="printDailyReport()" class="w-full rounded-[1.5rem] bg-indigo-600/50 py-5 text-base font-black text-white border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-4">
                  <i class="fa-solid fa-print text-lg"></i> ANTEPRIMA STAMPA
                </button>
              }
            </div>
          </div>
        </div>
      </div>
      }

      <!-- Collaborator Radar -->
      <div class="rounded-[3rem] bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div class="border-b border-slate-100 bg-slate-50/50 p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div class="flex items-center gap-6">
            <div class="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700">
              <i class="fa-solid fa-user-clock text-2xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900">Radar Collaboratori</h3>
              <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">{{ getCurrentDate() }}</p>
            </div>
          </div>
          <button (click)="state.setModule('collaborators')" class="rounded-2xl bg-slate-900 px-8 py-4 text-base font-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95">
             Gestisci Struttura <i class="fa-solid fa-arrow-right ml-3 text-sm opacity-50"></i>
          </button>
        </div>

        <div class="p-10">
          @if (collaboratorActivities().length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-slate-400">
              <i class="fa-solid fa-user-slash text-6xl mb-6 opacity-20"></i>
              <p class="text-lg font-bold uppercase tracking-widest">Nessun operatore attivo al momento</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              @for (activity of collaboratorActivities(); track activity.userId) {
                <div (click)="openUserProfile(activity.userId)" class="group relative rounded-[2.5rem] bg-slate-50 p-8 border-2 border-transparent hover:border-blue-200 hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer">
                  
                  <div class="mb-6 flex items-start justify-between">
                    <div class="relative">
                      <img [src]="activity.avatar" class="h-20 w-20 rounded-2xl object-cover ring-2 ring-white shadow-md">
                      <div class="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-2 border-white shadow-sm"
                           [class.bg-emerald-500]="activity.status === 'active'"
                           [class.bg-orange-500]="activity.status === 'warning'"
                           [class.bg-slate-300]="activity.status === 'inactive'">
                        @if (activity.status !== 'inactive') {
                          <span class="absolute inset-0 rounded-full bg-current animate-ping opacity-75"></span>
                        }
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">{{ activity.department }}</span>
                      <span class="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">{{ activity.lastActivity }}</span>
                    </div>
                  </div>

                  <h4 class="text-xl font-black text-slate-800 truncate mb-6">{{ activity.userName }}</h4>
                  
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Fasi HACCP Completate</span>
                      <span class="text-sm font-black text-emerald-600">{{ activity.tasksCompleted }} / 3</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div class="h-full bg-emerald-500 transition-all duration-1000 shadow-sm" [style.width.%]="(activity.tasksCompleted / 3) * 100"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Alerts System -->
      <div id="alerts-section" class="rounded-[3rem] bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div class="bg-red-50 p-10 border-b border-red-100 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <div class="h-14 w-14 rounded-2xl bg-white shadow-sm border border-red-200 flex items-center justify-center text-red-600">
              <i class="fa-solid fa-bell text-2xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-black text-slate-900">Centro Notifiche Anomalie</h3>
              <p class="text-sm font-bold text-red-500 uppercase tracking-widest">{{ systemAlerts().length }} segnalazioni attive</p>
            </div>
          </div>
        </div>

        <div class="p-10">
           @if (systemAlerts().length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-slate-400">
              <div class="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100 shadow-sm">
                <i class="fa-solid fa-check text-4xl"></i>
              </div>
              <p class="text-lg font-bold text-emerald-700">Tutti i parametri sono conformi</p>
              <p class="text-sm text-slate-400 uppercase font-bold tracking-[0.2em] mt-2">Nessuna anomalia oggi</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @for (alert of systemAlerts(); track alert.id) {
                <div class="flex items-start gap-6 p-6 rounded-[2.5rem] border-2 transition-all hover:bg-slate-50"
                     [class.bg-red-50/30]="alert.type === 'error'"
                     [class.border-red-100]="alert.type === 'error'"
                     [class.bg-orange-50/30]="alert.type === 'warning'"
                     [class.border-orange-100]="alert.type === 'warning'"
                     [class.bg-blue-50/30]="alert.type === 'info'"
                     [class.border-blue-100]="alert.type === 'info'">
                   
                  <div class="flex-shrink-0">
                    <div class="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-md ring-1 ring-black/5"
                         [class.text-red-600]="alert.type === 'error'"
                         [class.text-orange-600]="alert.type === 'warning'"
                         [class.text-blue-600]="alert.type === 'info'">
                      <i class="fa-solid text-xl" [class.fa-circle-xmark]="alert.type === 'error'" [class.fa-triangle-exclamation]="alert.type === 'warning'" [class.fa-info-circle]="alert.type === 'info'"></i>
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-6 mb-3">
                      <h4 class="text-lg font-black text-slate-800 leading-tight">{{ alert.title }}</h4>
                      <span class="text-xs font-black text-slate-400 uppercase whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">{{ alert.timestamp }}</span>
                    </div>
                    <p class="text-base text-slate-600 mb-6 italic leading-relaxed">{{ alert.message }}</p>
                    
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <i class="fa-solid fa-user-tag text-sm text-slate-400"></i>
                        <span class="text-sm font-bold text-slate-500">{{ alert.userName }}</span>
                      </div>
                      @if (alert.actionable) {
                        <button (click)="openUserProfile(alert.userId || '')" class="text-sm font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-transform">
                          Vedi Dettagli <i class="fa-solid fa-arrow-right text-xs"></i>
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

      <!-- Footer Actions Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (action of [
          {id: 'general-checks', label: 'Checklist Generali', icon: 'fa-tasks', color: 'emerald', sub: 'Audit globale'},
          {id: 'accounting', label: 'Gestione Fatture', icon: 'fa-piggy-bank', color: 'amber', sub: 'Documenti contabili'},
          {id: 'messages', label: 'Centro Messagi', icon: 'fa-at', color: 'blue', sub: 'Inbox aziendale'},
          {id: 'collaborators', label: 'Staff & Team', icon: 'fa-users', color: 'purple', sub: 'Ruoli ed accessi'}
        ]; track action.id) {
          <button (click)="state.setModule(action.id)" 
                  class="group relative overflow-hidden rounded-[2rem] bg-white p-8 border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left shadow-sm hover:shadow-lg">
            <div class="flex items-center gap-6">
              <div class="h-14 w-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm bg-slate-50"
                   [class]="'text-' + action.color + '-600 group-hover:bg-' + action.color + '-500 group-hover:text-white'">
                <i class="fa-solid {{ action.icon }} text-2xl"></i>
              </div>
              <div>
                <h4 class="text-lg font-black text-slate-800 leading-tight mb-1 group-hover:text-blue-900">{{ action.label }}</h4>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">{{ action.sub }}</p>
              </div>
            </div>
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
  `]
})
export class DashboardViewComponent {
  state = inject(AppStateService);
  private toastService = inject(ToastService);

  isSendingReport = signal(false);

  sendDailyReport() {
    this.isSendingReport.set(true);

    // Simulating PDF generation and email sending
    setTimeout(() => {
      this.isSendingReport.set(false);
      this.toastService.success('Report Inviato', `Il report delle verifiche per il ${this.getCurrentDate()} è stato inviato via email all'amministrazione.`);
    }, 2000);
  }

  // Filtered Users Logic
  filteredUsers = computed(() => {
    const allUsers = this.state.systemUsers();
    const currentFilterId = this.state.filterCollaboratorId();
    const currentCompanyId = this.state.companyConfig()?.id;

    // 1. If NOT Admin, user only sees their own data
    if (!this.state.isAdmin()) {
      const currentUser = this.state.currentUser();
      return currentUser ? [currentUser] : [];
    }

    let users = allUsers;

    // 2. If Admin and global unit filter is active, show ONLY that unit
    if (currentFilterId) {
      users = allUsers.filter(u => u.id === currentFilterId);
    }
    // 3. If Admin and no filter but Viewing a Company, show users of that company
    else if (currentCompanyId) {
      users = allUsers.filter(u => u.clientId === currentCompanyId && u.role !== 'ADMIN');
    }

    return users;
  });

  collaboratorActivities = computed((): CollaboratorActivity[] => {
    const allRecords = this.state.checklistRecords();
    const currentDate = this.state.filterDate();

    return this.filteredUsers().map(user => {
      const phaseIds = ['pre-op-checklist', 'operative-checklist', 'post-op-checklist'];

      // Filter records for this user and date that are phases
      const userPhaseRecords = allRecords.filter(r =>
        r.userId === user.id &&
        r.date === currentDate &&
        phaseIds.includes(r.moduleId)
      );

      // Count unique phases completed
      const completedPhases = new Set(userPhaseRecords.map(r => r.moduleId)).size;
      const totalPhases = 3;

      // Status logic: if there are issues in any record, it's 'warning'
      const hasIssues = userPhaseRecords.some(r => r.data.status === 'Non Conforme');
      const latestRecord = userPhaseRecords.length > 0 ? userPhaseRecords[userPhaseRecords.length - 1] : null;

      return {
        userId: user.id,
        userName: user.name,
        avatar: user.avatar,
        lastActivity: latestRecord ?
          new Date(latestRecord.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) :
          'Inattivo',
        tasksCompleted: completedPhases,
        tasksPending: totalPhases - completedPhases,
        status: userPhaseRecords.length > 0 ? (hasIssues ? 'warning' : 'active') : 'inactive',
        department: user.department || 'Generale'
      };
    });
  });

  // KPI Computeds based on Filtered Data
  kpiData = computed(() => {
    const activities = this.collaboratorActivities();
    const currentDate = this.state.filterDate();
    const currentUsers = this.filteredUsers();
    const userIds = currentUsers.map(u => u.id);

    // Count how many unique (User + Phase) combinations exist for today
    const phaseIds = ['pre-op-checklist', 'operative-checklist', 'post-op-checklist'];

    let completedCount = 0;

    currentUsers.forEach(user => {
      // Find phases completed by this user today
      const userPhases = this.state.checklistRecords()
        .filter(r => r.userId === user.id && r.date === currentDate && phaseIds.includes(r.moduleId))
        .map(r => r.moduleId);

      // Add unique phases count
      completedCount += new Set(userPhases).size;
    });

    const totalExpectedPhases = currentUsers.length * 3; // 3 phases per user

    return {
      completed: completedCount,
      total: totalExpectedPhases || 3, // Default to 3 if no users (context of 1 theoretical user)
      activeUsers: activities.filter(a => a.status !== 'inactive').length
    };
  });

  systemAlerts = computed((): SystemAlert[] => {
    const alerts: SystemAlert[] = [];
    const allRecords = this.state.checklistRecords();
    const currentDate = this.state.filterDate();
    const users = this.filteredUsers();
    const userIds = users.map(u => u.id);

    // Filtered records for selected date and units
    const relevantRecords = allRecords.filter(r =>
      userIds.includes(r.userId) &&
      r.date === currentDate
    );

    // 1. Alert for "Non Conforme" statuses
    relevantRecords.forEach(record => {
      if (record.data.status === 'Non Conforme') {
        const user = users.find(u => u.id === record.userId);
        const moduleName = this.getModuleName(record.moduleId);

        alerts.push({
          id: `nc-${record.id}`,
          type: 'error',
          title: `Anomalia in ${moduleName}`,
          message: record.data.summary || 'Rilevata non conformità durante l\'ispezione.',
          userId: record.userId,
          userName: user?.name,
          timestamp: new Date(record.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          actionable: true
        });
      }
    });

    // 2. Alert for missing phases
    users.forEach(user => {
      const userRecords = relevantRecords.filter(r => r.userId === user.id);
      const phasesMissing = [];

      const hasPre = userRecords.some(r => r.moduleId === 'pre-op-checklist');
      const hasOp = userRecords.some(r => r.moduleId === 'operative-checklist');
      const hasPost = userRecords.some(r => r.moduleId === 'post-op-checklist');

      if (!hasPre) phasesMissing.push('Pre-operativa');
      if (!hasOp) phasesMissing.push('Operativa');
      if (!hasPost) phasesMissing.push('Post-operativa');

      if (phasesMissing.length > 0 && phasesMissing.length < 3) {
        alerts.push({
          id: `missing-${user.id}`,
          type: 'warning',
          title: 'Fasi Mancanti',
          message: `${user.name} deve completare: ${phasesMissing.join(', ')}`,
          userId: user.id,
          userName: user.name,
          timestamp: 'Oggi',
          actionable: true
        });
      }
    });

    return alerts;
  });

  criticalAlerts = computed(() =>
    this.systemAlerts().filter(a => a.type === 'error')
  );

  phaseRecap = computed(() => {
    const allRecords = this.state.checklistRecords();
    const currentDate = this.state.filterDate();
    const users = this.filteredUsers();
    const userCount = users.length || 1;

    const getPhaseStats = (moduleId: string) => {
      const records = allRecords.filter(r =>
        r.moduleId === moduleId &&
        r.date === currentDate &&
        users.some(u => u.id === r.userId)
      );

      const uniqueCompletedUsers = new Set(records.map(r => r.userId)).size;
      const issues = records.filter(r => r.data.status === 'Non Conforme').length;

      return {
        pct: userCount > 0 ? Math.min(100, (uniqueCompletedUsers / userCount) * 100) : 0,
        count: uniqueCompletedUsers,
        issues
      };
    };

    return {
      pre: getPhaseStats('pre-op-checklist'),
      op: getPhaseStats('operative-checklist'),
      post: getPhaseStats('post-op-checklist')
    };
  });

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

  getModuleName(id: string) {
    switch (id) {
      case 'pre-op-checklist':
      case 'pre-operative': return 'Fase Pre-operativa';
      case 'operative-checklist':
      case 'operative': return 'Fase Operativa';
      case 'post-op-checklist':
      case 'post-operative': return 'Fase Post-operativa';
      default: return id;
    }
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

  printDailyReport() {
    const currentCompanyId = this.state.companyConfig()?.id;
    if (!currentCompanyId) return;

    const client = this.state.clients().find(c => c.id === currentCompanyId);
    if (!client) return;

    const allClientUsers = this.state.systemUsers().filter(u => u.clientId === client.id);
    const userIds = allClientUsers.map(u => u.id);

    const clientRecords = this.state.checklistRecords().filter(r =>
      userIds.includes(r.userId) && r.date === this.state.filterDate()
    );

    const users = allClientUsers
      .filter(u => u.role !== 'ADMIN')
      .map(u => {
        const userRecords = clientRecords.filter(r => r.userId === u.id);
        return {
          id: u.id,
          name: u.name,
          department: u.department || 'Generale',
          checksCompleted: userRecords.length,
          checksTotal: 14,
          lastActivity: userRecords.length > 0 ?
            new Date(userRecords[userRecords.length - 1].timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) :
            'Nessuna'
        };
      });

    const detailedChecks = clientRecords.map(r => {
      const user = allClientUsers.find(u => u.id === r.userId);
      const module = this.state.menuItems.find(m => m.id === r.moduleId);
      return {
        userName: user?.name || 'Utente',
        moduleName: module?.label || r.moduleId,
        timestamp: r.timestamp,
        data: r.data
      };
    });

    const report = {
      client,
      users,
      totalChecks: users.reduce((acc, u) => acc + u.checksTotal, 0),
      completedChecks: users.reduce((acc, u) => acc + u.checksCompleted, 0),
      detailedChecks
    };

    const printContent = this.generatePrintHTML(report);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  generatePrintHTML(report: any): string {
    const date = new Date(this.state.filterDate()).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const logo = report.client.logo || this.state.currentLogo();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Registro Autocontrollo - ${report.client.name}</title>
        <style>
          @page { size: A4; margin: 1.5cm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; }
          .a4-container { width: 100%; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: start; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .logo-img { width: 60px; height: 60px; border-radius: 12px; object-fit: contain; }
          .brand-title { font-size: 24px; font-weight: 800; color: #0f172a; }
          .header-meta { text-align: right; font-size: 12px; color: #64748b; }
          
          .report-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; }
          .info-block h3 { font-size: 18px; margin: 0 0 5px; color: #0f172a; }
          .info-block p { margin: 2px 0; font-size: 13px; color: #475569; }
          
          .section-title { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 10px; margin: 30px 0 15px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
          th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; border-bottom: 1px solid #cbd5e1; color: #475569; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          
          .check-detail { margin-bottom: 15px; padding: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
          .check-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 11px; margin-bottom: 8px; color: #334155; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px; }
          .check-body { font-size: 11px; color: #1e293b; }
          .data-item { display: inline-block; margin-right: 20px; }
          .data-label { color: #64748b; font-weight: normal; }
          .data-value { font-weight: 600; }
          
          .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-box { border-top: 1px solid #94a3b8; padding-top: 10px; text-align: center; font-size: 11px; color: #64748b; }
          
          .footer { position: fixed; bottom: 1.5cm; left: 1.5cm; right: 1.5cm; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
          
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="a4-container">
          <div class="header">
            <div class="logo-container">
              <img src="${logo}" class="logo-img">
              <div>
                <div class="brand-title">HACCP PRO</div>
                <div style="font-size: 10px; color: #64748b;">Software di Gestione Sicurezza Alimentare</div>
              </div>
            </div>
            <div class="header-meta">
              <div>Documento: Registro Autocontrollo</div>
              <div>Versione: 2.0.1</div>
              <div>Data emissione: ${new Date().toLocaleDateString('it-IT')}</div>
            </div>
          </div>

          <div class="report-info">
            <div class="info-block">
              <h3>${report.client.name}</h3>
              <p>P.IVA: ${report.client.piva}</p>
              <p>Indirizzo: ${report.client.address}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>DATA REGISTRAZIONE:</strong></p>
              <p style="font-size: 20px; font-weight: 800; color: #3b82f6;">${date}</p>
            </div>
          </div>

          <div class="section-title">Registro Attività Dettagliato</div>
          ${report.detailedChecks.length === 0 ? `
            <p style="text-align: center; color: #94a3b8; padding: 20px;">Nessuna attività registrata per la data odierna.</p>
          ` : `
            ${report.detailedChecks.map((check: any) => `
              <div class="check-detail">
                <div class="check-header">
                  <span>MODULO: ${check.moduleName}</span>
                  <span>ESECUTO DA: ${check.userName} • ORE: ${new Date(check.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="check-body">
                  ${this.formatCheckData(check.data)}
                </div>
              </div>
            `).join('')}
          `}

          <div class="signature-section">
            <div class="sig-box">
              <p><strong>Firma Operatore Responsabile</strong></p>
              <div style="height: 60px;"></div>
            </div>
            <div class="sig-box">
              <p><strong>Visto del Responsabile HACCP</strong></p>
              <div style="height: 60px;"></div>
            </div>
          </div>

          <div class="footer">
             HACCP Pro - Documento generato elettronicamente conforme ai requisiti del Reg. CE 852/04.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private formatCheckData(data: any): string {
    if (!data) return 'Nessun dato';

    // Handle array of check items (id, label, checked) - Used by most check modules
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0].hasOwnProperty('label')) {
      return data
        .map((item: any) => {
          const status = item.checked ? '✅ CONFORME' : '❌ NON CONFORME';
          return `<span class="data-item"><span class="data-label">${item.label}:</span> <span class="data-value">${status}</span></span>`;
        })
        .join(' ');
    }

    // Default object handling (key: value) - Used by Traceability and others
    return Object.entries(data)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        let formattedValue = value;
        if (value === true) formattedValue = '✅ CONFORME';
        if (value === false) formattedValue = '❌ NON CONFORME';
        if (Array.isArray(value)) formattedValue = value.join(', ');
        return `<span class="data-item"><span class="data-label">${label}:</span> <span class="data-value">${formattedValue}</span></span>`;
      })
      .join(' ');
  }
}
