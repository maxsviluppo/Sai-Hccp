
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
    <div class="space-y-6 animate-fade-in">
      
      <!-- Enhanced Admin Header -->
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-3xl shadow-xl border border-indigo-500/30 relative overflow-hidden mb-6">
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <i class="fa-solid fa-shield-halved text-9xl text-white"></i>
        </div>
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
              <i class="fa-solid fa-shield-halved text-white text-3xl"></i>
            </div>
            <div>
              <h2 class="text-3xl font-black text-white tracking-tight leading-none mb-1">Centro di Controllo</h2>
              <p class="text-indigo-200 text-sm font-medium">Panoramica globale conformità HACCP.</p>
              @if(state.filterCollaboratorId()) {
                  <div class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300">
                    <i class="fa-solid fa-filter text-indigo-400"></i> 
                    Filtro Attivo: Unità Selezionata
                  </div>
              }
            </div>
          </div>

          <div class="flex gap-3">
             <div class="px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                <div class="text-right hidden sm:block">
                   <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Analisi</div>
                   <div class="text-sm font-bold text-white">{{ getCurrentDate() }}</div>
                </div>
                <i class="fa-solid fa-calendar-day text-indigo-400 text-xl"></i>
             </div>
             
             <div class="px-5 py-3 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <div class="text-right hidden sm:block">
                   <div class="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Stato Sistema</div>
                   <div class="text-sm font-bold text-emerald-400">Operativo</div>
                </div>
                <div class="relative">
                   <span class="absolute -top-1 -right-1 flex h-3 w-3">
                     <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                   </span>
                   <i class="fa-solid fa-server text-emerald-400 text-xl"></i>
                </div>
             </div>
          </div>
        </div>
      </div>

      @if (state.isAdmin()) {
      <!-- Enhanced KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group transition-transform">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <i class="fa-solid fa-clipboard-check text-3xl opacity-80"></i>
              <span class="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">{{ getCurrentDateShort() }}</span>
            </div>
            <p class="text-sm opacity-90 font-medium">Pratica HACCP</p>
            <p class="text-4xl font-black mt-2">{{ kpiData().completed }}/{{ kpiData().total }} Fasi</p>
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

        <div class="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group transition-transform"
             [class.cursor-pointer]="state.isAdmin()"
             [class.hover:scale-105]="state.isAdmin()"
             (click)="state.isAdmin() ? state.setModule('collaborators') : null">
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

      <!-- Critical Modules Status (Hidden for Admin as they don't perform checks) -->
      <!-- Real-time Phase Advancement Status -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-indigo-500"></i> Avanzamento Processo HACCP
            </h3>
            <span class="text-[10px] font-black px-2 py-1 rounded bg-indigo-100 text-indigo-700 uppercase tracking-wider">Dati Reali di Oggi</span>
          </div>
          
          <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Phase 1 Progress -->
            <div class="space-y-3">
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fase 1</p>
                  <h4 class="text-sm font-black text-slate-700">Pre-operativa</h4>
                </div>
                <div class="text-right">
                  <span class="text-xs font-black text-slate-900">{{ phaseRecap().pre.count }}/{{ (filteredUsers() || []).length || 0 }}</span>
                </div>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 transition-all duration-1000" [style.width.%]="phaseRecap().pre.pct"></div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded" 
                      [class.bg-emerald-100]="phaseRecap().pre.issues === 0" [class.text-emerald-700]="phaseRecap().pre.issues === 0"
                      [class.bg-red-100]="phaseRecap().pre.issues > 0" [class.text-red-700]="phaseRecap().pre.issues > 0">
                  {{ phaseRecap().pre.issues === 0 ? 'STATUS: OK' : 'ANOMALIE: ' + phaseRecap().pre.issues }}
                </span>
              </div>
            </div>

            <!-- Phase 2 Progress -->
            <div class="space-y-3 border-l border-slate-100 pl-6">
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fase 2</p>
                  <h4 class="text-sm font-black text-slate-700">Operativa</h4>
                </div>
                <div class="text-right">
                  <span class="text-xs font-black text-slate-900">{{ phaseRecap().op.count }}/{{ (filteredUsers() || []).length || 0 }}</span>
                </div>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 transition-all duration-1000" [style.width.%]="phaseRecap().op.pct"></div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded" 
                      [class.bg-emerald-100]="phaseRecap().op.issues === 0" [class.text-emerald-700]="phaseRecap().op.issues === 0"
                      [class.bg-red-100]="phaseRecap().op.issues > 0" [class.text-red-700]="phaseRecap().op.issues > 0">
                  {{ phaseRecap().op.issues === 0 ? 'STATUS: OK' : 'ANOMALIE: ' + phaseRecap().op.issues }}
                </span>
              </div>
            </div>

            <!-- Phase 3 Progress -->
            <div class="space-y-3 border-l border-slate-100 pl-6">
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fase 3</p>
                  <h4 class="text-sm font-black text-slate-700">Post-operativa</h4>
                </div>
                <div class="text-right">
                  <span class="text-xs font-black text-slate-900">{{ phaseRecap().post.count }}/{{ (filteredUsers() || []).length || 0 }}</span>
                </div>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-purple-500 transition-all duration-1000" [style.width.%]="phaseRecap().post.pct"></div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded" 
                      [class.bg-emerald-100]="phaseRecap().post.issues === 0" [class.text-emerald-700]="phaseRecap().post.issues === 0"
                      [class.bg-red-100]="phaseRecap().post.issues > 0" [class.text-red-700]="phaseRecap().post.issues > 0">
                  {{ phaseRecap().post.issues === 0 ? 'STATUS: OK' : 'ANOMALIE: ' + phaseRecap().post.issues }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500">
            <i class="fa-solid fa-circle-info text-indigo-400"></i>
            I dati si riferiscono alle unità operative selezionate per il {{ getCurrentDate() }}.
          </div>
        </div>

        <!-- Verification Report (Send via Email) -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg border border-slate-700 overflow-hidden relative group">
           <div class="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
            <h3 class="font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-envelope-open-text text-blue-400"></i> Report Verifiche
            </h3>
            <span class="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-tighter">PDF A4</span>
          </div>
          <div class="p-6 relative z-10">
            <p class="text-xs text-slate-400 mb-4 leading-relaxed">
                Invia il report completo delle verifiche per la data <span class="text-blue-400 font-bold">{{ getCurrentDate() }}</span> all'amministrazione.
            </p>
            
            @if (isSendingReport()) {
                <div class="space-y-3 animate-pulse">
                    <div class="flex justify-between items-center text-[10px] text-blue-300 uppercase font-bold">
                        <span>Generazione PDF...</span>
                        <span>75%</span>
                    </div>
                    <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 w-[75%] rounded-full transition-all duration-700"></div>
                    </div>
                </div>
            } @else {
                <div class="flex flex-col gap-4">
                    <button (click)="sendDailyReport()"
                            class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/20">
                        <i class="fa-solid fa-paper-plane text-lg"></i>
                        INVIA REPORT EMAIL
                    </button>
                    <button (click)="printDailyReport()"
                            class="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 border-2 border-slate-200">
                        <i class="fa-solid fa-print text-lg text-blue-600"></i>
                        STAMPA REGISTRO A4
                    </button>
                </div>
                <div class="mt-4 flex items-center gap-2 text-[10px] text-slate-500 justify-center bg-slate-800/20 py-2 rounded-lg">
                    <i class="fa-solid fa-circle-info text-blue-400"></i>
                    Destinatario: <span class="text-slate-300">{{ state.reportRecipientEmail() }}</span>
                </div>
            }
          </div>
        </div>
      </div>
      }

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
          @if (state.isAdmin() && !state.filterCollaboratorId()) {
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
                          <span class="text-slate-600">Fasi HACCP</span>
                          <span class="font-bold text-emerald-600">{{ activity.tasksCompleted }}/3</span>
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
        @if (state.isAdmin()) {
          <!-- Admin Actions -->
          <button (click)="state.setModule('general-checks')" 
                  class="group bg-white hover:bg-emerald-50 p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-list-check text-emerald-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Controlli Generali</h4>
            <p class="text-xs text-slate-500">Visualizza stato completo</p>
          </button>

          <button (click)="state.setModule('accounting')" 
                  class="group bg-white hover:bg-amber-50 p-6 rounded-xl border-2 border-slate-200 hover:border-amber-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-amber-100 group-hover:bg-amber-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-calculator text-amber-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Contabilità</h4>
            <p class="text-xs text-slate-500">Gestisci pagamenti</p>
          </button>

          <button (click)="state.setModule('messages')" 
                  class="group bg-white hover:bg-blue-50 p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-comments text-blue-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Messaggistica</h4>
            <p class="text-xs text-slate-500">Comunicazioni aziende</p>
          </button>

          <button (click)="state.setModule('collaborators')" 
                  class="group bg-white hover:bg-purple-50 p-6 rounded-xl border-2 border-slate-200 hover:border-purple-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-users-gear text-purple-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Gestione Struttura</h4>
            <p class="text-xs text-slate-500">Aziende e Collaboratori</p>
          </button>
        } @else {
          <!-- Operational Actions -->
          <button (click)="state.setModule('pre-op-checklist')" 
                  class="group bg-white hover:bg-blue-50 p-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-clipboard-check text-blue-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Fase Pre-operativa</h4>
            <p class="text-xs text-slate-500">Controlli apertura</p>
          </button>

          <button (click)="state.setModule('operative-checklist')" 
                  class="group bg-white hover:bg-indigo-50 p-6 rounded-xl border-2 border-slate-200 hover:border-indigo-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-indigo-100 group-hover:bg-indigo-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-briefcase text-indigo-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Fase Operativa</h4>
            <p class="text-xs text-slate-500">Controlli operativi</p>
          </button>

          <button (click)="state.setModule('post-op-checklist')" 
                  class="group bg-white hover:bg-purple-50 p-6 rounded-xl border-2 border-slate-200 hover:border-purple-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-hourglass-end text-purple-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Fase Post-operativa</h4>
            <p class="text-xs text-slate-500">Chiusura e pulizia</p>
          </button>

          <button (click)="state.setModule('history')" 
                  class="group bg-white hover:bg-emerald-50 p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-400 transition-all text-left">
            <div class="w-12 h-12 rounded-full bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center mb-3 transition-colors">
              <i class="fa-solid fa-clock-rotate-left text-emerald-600 group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h4 class="font-bold text-slate-800 mb-1">Archivio Checklist</h4>
            <p class="text-xs text-slate-500">Storico registrazioni</p>
          </button>
        }
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
