
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
  clientId?: string;
  companyName?: string;
  timestamp: string;
  actionable: boolean;
  isNew?: boolean;
  sortTimestamp?: number;
}

interface PaymentAlert {
  id: string;
  clientId: string;
  companyName: string;
  amount: number;
  dueDate: string;
  daysDiff: number;
  severity: 'insolvent' | 'overdue' | 'impending';
  statusLabel: string;
  notes?: string;
}

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in p-4 pb-12 max-w-7xl mx-auto">
      
      <!-- Sleek Professional Header -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        <div class="flex items-center gap-5 relative z-10">
          <div class="h-14 w-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
             <i class="fa-solid fa-shapes text-2xl"></i>
          </div>
          <div>
            <!-- LED STATO API KEY AI (Verde = Attiva / Rossa = Mancante) -->
            @if (hasActiveApiKey()) {
              <div (click)="goToAiSettings()" class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 cursor-pointer hover:bg-emerald-100/70 transition-all mb-1.5 shadow-xs group" title="API Key AI attiva e configurata. Clicca per visualizzare">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span class="text-[10px] font-black uppercase tracking-wider text-emerald-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                  API Key AI Attiva
                  <i class="fa-solid fa-circle-check text-[10px] text-emerald-600"></i>
                </span>
                <i class="fa-solid fa-chevron-right text-[8px] text-emerald-500 group-hover:translate-x-0.5 transition-transform"></i>
              </div>
            } @else {
              <div (click)="goToAiSettings()" class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 cursor-pointer hover:bg-rose-100/70 transition-all mb-1.5 shadow-xs group" title="API Key AI mancante o cancellata! Clicca per inserirla">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                </span>
                <span class="text-[10px] font-black uppercase tracking-wider text-rose-800 group-hover:text-rose-900 flex items-center gap-1.5">
                  API Key AI Mancante
                  <i class="fa-solid fa-triangle-exclamation text-[10px] text-rose-600"></i>
                </span>
                <i class="fa-solid fa-arrow-right text-[8px] text-rose-500 group-hover:translate-x-0.5 transition-transform"></i>
              </div>
            }

            <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Amministrativa</h2>
            <p class="text-sm font-medium text-slate-500 mt-1">Sintesi direzionale e controllo stato conformità</p>
          </div>
        </div>
        <div class="flex items-center gap-4 relative z-10 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
           <div class="text-right flex flex-col justify-center">
             <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Aggiornamento live</p>
             <p class="text-sm font-bold text-slate-700 leading-none">{{ getCurrentDate() }}</p>
           </div>
           <div class="h-10 w-10 flex items-center justify-center bg-white rounded-full border border-slate-200 text-blue-600 shadow-sm shrink-0">
             <i class="fa-regular fa-clock"></i>
           </div>
        </div>
      </div>
      
      <!-- Compact KPI Summary Bar (Elevated Operator Style) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Aziende -->
        <div class="bg-white p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 flex items-center justify-between transition-all hover:shadow-md active:scale-95">
           <div>
             <p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Aziende Associate</p>
             <p class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{{ getFilteredClientsCount() }}</p>
           </div>
           <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-sm shrink-0">
             <i class="fa-solid fa-building text-base sm:text-lg"></i>
           </div>
        </div>
        <!-- Contabilità -->
        <div (click)="state.setModule('accounting')" class="bg-white p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 flex items-center justify-between cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all active:scale-95 group">
           <div>
             <p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status Contabile</p>
             <p class="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">{{ getFinancialStatus() }}</p>
           </div>
           <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
             <i class="fa-solid fa-file-invoice-dollar text-base sm:text-lg"></i>
           </div>
        </div>
        <!-- Documenti -->
        <div (click)="state.setModule('documentation')" class="bg-white p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-95 group">
           <div>
             <p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Documenti Validi</p>
             <p class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{{ state.filteredDocuments().length }}</p>
           </div>
           <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
             <i class="fa-solid fa-folder-open text-base sm:text-lg"></i>
           </div>
        </div>
        <!-- Alert Notifiche -->
        <div (click)="scrollToAlerts()" class="bg-white p-4 sm:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 flex items-center justify-between cursor-pointer hover:border-rose-200 hover:shadow-md transition-all active:scale-95 group">
           <div>
             <p class="text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-0.5"
                [class.text-rose-600]="systemAlerts().length > 0"
                [class.text-slate-400]="systemAlerts().length === 0">
               Notifiche Sistema
             </p>
             <p class="text-xl sm:text-2xl font-black tracking-tight"
                [class.text-rose-600]="systemAlerts().length > 0"
                [class.text-slate-800]="systemAlerts().length === 0">
               {{ systemAlerts().length }}
             </p>
           </div>
           <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-105"
                [class.bg-rose-50]="systemAlerts().length > 0"
                [class.text-rose-600]="systemAlerts().length > 0"
                [class.bg-slate-100]="systemAlerts().length === 0"
                [class.text-slate-500]="systemAlerts().length === 0">
             <i class="fa-solid fa-bell text-base sm:text-lg"></i>
           </div>
        </div>
      </div>      <!-- Core Dashboard Operations (Full Width) -->
      <div class="space-y-6">
        
        <!-- Operations Overview (Timeline-lite) -->
        <div class="bg-white rounded-2xl md:rounded-[2rem] p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-6">
             <h3 class="text-lg font-bold text-slate-800 tracking-tight">Avanzamento Operativo Odierno</h3>
             <div class="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
               <i class="fa-solid fa-chart-line text-blue-500"></i> Riepilogo Globale
             </div>
          </div>
          <div class="space-y-5">
              @for (phase of [
                 {id: 'pre', label: 'Apertura (Pre-Op)', data: phaseRecap().pre, color: 'text-sky-600', bgFill: 'bg-sky-500'},
                 {id: 'op', label: 'Monitoraggio (Op)', data: phaseRecap().op, color: 'text-indigo-600', bgFill: 'bg-indigo-500'},
                 {id: 'post', label: 'Chiusura (Post-Op)', data: phaseRecap().post, color: 'text-purple-600', bgFill: 'bg-purple-500'}
               ]; track phase.id) {
               <div class="flex items-center gap-4">
                 <div class="w-40 flex-shrink-0">
                   <p class="text-sm font-semibold text-slate-700">{{ phase.label }}</p>
                   <p class="text-[10px] text-slate-500 uppercase tracking-wide">
                      {{ phase.data.count }} su {{ phase.data.total }} operazioni
                   </p>
                 </div>
                 <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000" [class]="phase.bgFill" [style.width.%]="phase.data.pct"></div>
                 </div>
                 <div class="w-12 text-right">
                   <span class="text-sm font-bold text-slate-700 tabular-nums">{{ (phase.data.pct | number:'1.0-0') }}%</span>
                 </div>
               </div>
              }
           </div>
        </div>

        <!-- Moduli Gestionali (Stile Dashboard Operatore) -->
        <div class="bg-white rounded-2xl md:rounded-[2rem] p-5 md:p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-base md:text-lg font-black text-slate-800 tracking-tight">Moduli Gestionali</h3>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Accesso rapido alle aree operative</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            @for (action of adminQuickActions; track action.id) {
              <button (click)="state.setModule(action.id)"
                      class="group relative overflow-hidden bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 text-center flex flex-col items-center justify-center gap-3 active:scale-95 h-full">
                <div class="h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md {{ action.bg }} {{ action.color }}">
                  <i class="fa-solid {{ action.icon }} text-xl md:text-2xl"></i>
                </div>
                <div class="w-full">
                  <h4 class="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight leading-tight truncate">{{ action.label }}</h4>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 hidden sm:block truncate">{{ action.sub }}</p>
                </div>
                <!-- Mini status dot -->
                <div class="absolute top-3 right-3 h-2 w-2 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
              </button>
            }
          </div>
        </div>

        <!-- Recent Documents Snippet -->
        @if (state.filterCollaboratorId() && recentDocuments().length > 0) {
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between mb-4">
             <h3 class="text-lg font-bold text-slate-800 tracking-tight">Ultimi Documenti</h3>
             <button (click)="state.setModule('documentation')" class="text-xs font-semibold text-blue-600 hover:text-blue-800">Vedi tutti &rarr;</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
             @for (doc of recentDocuments(); track doc.id) {
               <div (click)="state.setModule('documentation')" class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-white hover:border-slate-300 transition-colors">
                  <i class="fa-regular fa-file-pdf text-red-500 text-lg"></i>
                  <div class="overflow-hidden">
                    <p class="text-xs font-bold text-slate-700 truncate">{{ doc.fileName }}</p>
                    <p class="text-[10px] text-slate-500">{{ doc.uploadDate | date:'dd MMM HH:mm' }}</p>
                  </div>
               </div>
             }
          </div>
        </div>
        }

      </div>

      <!-- IN FONDO ALLA PAGINA: SEZIONI AD ESTENSIONE -->
      <div class="space-y-5 pt-4 border-t border-slate-200" id="alerts-section">

        <!-- ESTENSIONE 1: NOTIFICHE DI SISTEMA (Non Conformità) -->
        <div class="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
          <button type="button"
                  (click)="toggleSystemAlerts()"
                  class="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-xs shrink-0">
                <i class="fa-solid fa-triangle-exclamation text-lg sm:text-xl"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base sm:text-lg font-black text-slate-800 tracking-tight">Notifiche di Sistema</h3>
                  <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider"
                        [class.bg-rose-600]="newAlertsCount() > 0"
                        [class.text-white]="newAlertsCount() > 0"
                        [class.animate-pulse]="newAlertsCount() > 0"
                        [class.bg-slate-100]="newAlertsCount() === 0"
                        [class.text-slate-600]="newAlertsCount() === 0">
                    {{ systemAlerts().length }}
                    @if (newAlertsCount() > 0) {
                      <span class="ml-1 text-[9px] font-bold">({{ newAlertsCount() }} nuove)</span>
                    }
                  </span>
                </div>
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                  @if (selectedCompanyName()) {
                    Filtro azienda: <span class="text-blue-600 font-black">{{ selectedCompanyName() }}</span>
                  } @else {
                    Tutte le non conformità e anomalie aziendali monitorate
                  }
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 shrink-0">
              <span class="text-xs font-bold text-slate-400 hidden sm:inline">
                {{ isSystemAlertsExpanded() ? 'Comprimi' : 'Espandi lista' }}
              </span>
              <div class="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-300"
                   [class.rotate-180]="isSystemAlertsExpanded()">
                <i class="fa-solid fa-chevron-down text-sm"></i>
              </div>
            </div>
          </button>

          @if (isSystemAlertsExpanded()) {
            <div class="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/40 space-y-4 animate-fade-in">
              <!-- Filtro e strumenti interni -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                <p class="text-xs font-bold text-slate-600">
                  @if (selectedCompanyName()) {
                    Mostrando le non conformità di: <span class="font-black text-blue-600">{{ selectedCompanyName() }}</span>
                  } @else {
                    Visualizzazione completa di tutte le aziende
                  }
                </p>
                <div class="flex items-center gap-2 self-start sm:self-auto">
                  @if (state.filterClientId()) {
                    <button (click)="state.setClientIdFilter(null)" 
                            class="text-[10px] font-bold text-slate-500 hover:text-red-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                            title="Mostra tutte le aziende">
                      <i class="fa-solid fa-xmark"></i> Tutte le aziende
                    </button>
                  }
                  <select [value]="state.filterClientId() || ''"
                          (change)="state.setClientIdFilter($any($event.target).value || null)"
                          class="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate cursor-pointer shadow-2xs">
                    <option value="">Tutte le aziende ({{ state.clients().length }})</option>
                    @for (client of state.clients(); track client.id) {
                      <option [value]="client.id">{{ client.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Lista Notifiche -->
              <div class="overflow-y-auto max-h-[460px] space-y-2.5 custom-scrollbar pr-1">
                @if (systemAlerts().length === 0) {
                  <div class="py-8 flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-white rounded-2xl border border-slate-100">
                    <div class="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                      <i class="fa-solid fa-check text-xl"></i>
                    </div>
                    <p class="text-sm font-bold text-slate-700">Nessuna segnalazione</p>
                    <p class="text-xs text-slate-500 mt-0.5">
                      @if (selectedCompanyName()) {
                        Nessuna non conformità pendente per {{ selectedCompanyName() }}.
                      } @else {
                        Tutti i sistemi di tutte le aziende sono nella norma.
                      }
                    </p>
                  </div>
                } @else {
                  @for (alert of systemAlerts(); track alert.id) {
                    <div class="p-3.5 rounded-xl border text-sm transition-all duration-200 bg-white shadow-2xs"
                         [class.bg-rose-50/70]="alert.isNew && alert.type === 'error'"
                         [class.border-rose-300]="alert.isNew && alert.type === 'error'"
                         [class.border-l-4]="alert.isNew"
                         [class.border-l-rose-500]="alert.isNew && alert.type === 'error'"
                         [class.border-l-amber-500]="alert.isNew && alert.type === 'warning'"
                         [class.border-slate-200]="!alert.isNew">
                       <div class="flex items-start gap-3">
                         <i class="fa-solid mt-0.5 shrink-0" 
                            [class.fa-circle-xmark]="alert.type === 'error'" 
                            [class.text-red-500]="alert.type === 'error'"
                            [class.fa-triangle-exclamation]="alert.type === 'warning'" 
                            [class.text-orange-500]="alert.type === 'warning'"
                            [class.fa-info-circle]="alert.type === 'info'" 
                            [class.text-blue-500]="alert.type === 'info'"></i>
                         <div class="flex-1 min-w-0">
                           <div class="flex items-center justify-between gap-2 mb-1">
                             <h4 class="font-bold text-slate-800 text-xs truncate">{{ alert.title }}</h4>
                             @if (alert.isNew) {
                               <span class="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs animate-pulse">
                                 <i class="fa-solid fa-bolt text-[7px]"></i> Nuova
                               </span>
                             }
                           </div>
                           <p class="text-[11px] text-slate-600 leading-snug">{{ alert.message }}</p>
                           <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 gap-2 flex-wrap">
                             <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                               @if (alert.companyName) {
                                 <button type="button"
                                         (click)="state.setClientIdFilter(alert.clientId || null); $event.stopPropagation()"
                                         class="inline-flex items-center gap-1 text-[9px] font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-1.5 py-0.5 rounded transition-colors shadow-2xs"
                                         title="Filtra solo {{ alert.companyName }}">
                                   <i class="fa-solid fa-hotel text-[8px] text-slate-400"></i>
                                   <span class="truncate max-w-[120px]">{{ alert.companyName }}</span>
                                 </button>
                               }
                               <span class="text-[9px] text-slate-500 font-semibold truncate">
                                 {{ alert.userName || 'Sistema' }} • {{ alert.timestamp }}
                               </span>
                             </div>
                             @if (alert.actionable) {
                               <button (click)="handleAlertAction(alert)" class="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0">
                                 Verifica &rarr;
                               </button>
                             }
                           </div>
                         </div>
                       </div>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>

        <!-- ESTENSIONE 2: SCADENZE E RITARDI PAGAMENTI CLIENTI -->
        <div class="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
          <button type="button"
                  (click)="togglePaymentAlerts()"
                  class="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs shrink-0">
                <i class="fa-solid fa-file-invoice-dollar text-lg sm:text-xl"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base sm:text-lg font-black text-slate-800 tracking-tight">Scadenze e Ritardi Pagamenti</h3>
                  <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                        [class.bg-rose-600]="urgentPaymentAlertsCount() > 0"
                        [class.text-white]="urgentPaymentAlertsCount() > 0"
                        [class.animate-pulse]="urgentPaymentAlertsCount() > 0"
                        [class.bg-slate-100]="urgentPaymentAlertsCount() === 0"
                        [class.text-slate-600]="urgentPaymentAlertsCount() === 0">
                    {{ paymentAlerts().length }}
                    @if (urgentPaymentAlertsCount() > 0) {
                      <span class="ml-1 text-[9px] font-bold">({{ urgentPaymentAlertsCount() }} critici)</span>
                    }
                  </span>
                </div>
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                  Monitoraggio canoni, quote e insoluti clienti
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 shrink-0">
              <span class="text-xs font-bold text-slate-400 hidden sm:inline">
                {{ isPaymentAlertsExpanded() ? 'Comprimi' : 'Espandi lista' }}
              </span>
              <div class="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-300"
                   [class.rotate-180]="isPaymentAlertsExpanded()">
                <i class="fa-solid fa-chevron-down text-sm"></i>
              </div>
            </div>
          </button>

          @if (isPaymentAlertsExpanded()) {
            <div class="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/40 space-y-4 animate-fade-in">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                <p class="text-xs font-bold text-slate-600">
                  Elenco delle posizioni contabili scadute o in scadenza imminente
                </p>
                <button (click)="state.setModule('accounting')"
                        class="self-start sm:self-auto text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-2xs">
                  <i class="fa-solid fa-calculator text-xs"></i>
                  Apri Contabilità &rarr;
                </button>
              </div>

              <!-- Lista Pagamenti -->
              <div class="overflow-y-auto max-h-[460px] space-y-3 custom-scrollbar pr-1">
                @if (paymentAlerts().length === 0) {
                  <div class="py-6 px-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div class="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <i class="fa-solid fa-circle-check text-lg"></i>
                    </div>
                    <div>
                      <p class="text-sm font-black text-emerald-900 leading-tight">Nessun ritardo o scadenza pendente</p>
                      <p class="text-xs font-medium text-emerald-700 mt-0.5">Tutti i pagamenti e i canoni delle aziende monitorate risultano regolari.</p>
                    </div>
                  </div>
                } @else {
                  @for (item of paymentAlerts(); track item.id) {
                    <div class="p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shadow-2xs"
                         [class.border-l-4]="true"
                         [class.border-l-rose-600]="item.severity === 'insolvent'"
                         [class.border-rose-200]="item.severity === 'insolvent'"
                         [class.border-l-amber-500]="item.severity === 'overdue'"
                         [class.border-amber-200]="item.severity === 'overdue'"
                         [class.border-l-blue-500]="item.severity === 'impending'"
                         [class.border-slate-200]="item.severity === 'impending'">
                      
                      <div class="flex items-start gap-3 min-w-0">
                        <div class="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-2xs"
                             [class.bg-rose-600]="item.severity === 'insolvent'"
                             [class.text-white]="item.severity === 'insolvent'"
                             [class.bg-amber-500]="item.severity === 'overdue'"
                             [class.text-white]="item.severity === 'overdue'"
                             [class.bg-blue-500]="item.severity === 'impending'"
                             [class.text-white]="item.severity === 'impending'">
                          <i class="fa-solid"
                             [class.fa-triangle-exclamation]="item.severity !== 'impending'"
                             [class.fa-clock]="item.severity === 'impending'"></i>
                        </div>
                        
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 flex-wrap mb-0.5">
                            <h4 class="text-xs font-black text-slate-800 truncate">{{ item.companyName }}</h4>
                            <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                  [class.bg-rose-600]="item.severity === 'insolvent'"
                                  [class.text-white]="item.severity === 'insolvent'"
                                  [class.bg-amber-100]="item.severity === 'overdue'"
                                  [class.text-amber-800]="item.severity === 'overdue'"
                                  [class.bg-blue-100]="item.severity === 'impending'"
                                  [class.text-blue-800]="item.severity === 'impending'">
                              {{ item.statusLabel }}
                            </span>
                          </div>
                          <p class="text-[11px] text-slate-600">
                            Scadenza: <span class="font-bold">{{ item.dueDate | date:'dd/MM/yyyy' }}</span>
                            @if (item.notes) {
                              <span class="text-slate-400"> · {{ item.notes }}</span>
                            }
                          </p>
                        </div>
                      </div>

                      <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        @if (item.amount > 0) {
                          <div class="text-right">
                            <span class="text-slate-400 uppercase tracking-widest block text-[9px] font-bold">Importo</span>
                            <span class="text-sm font-black text-slate-800">€{{ item.amount | number:'1.2-2' }}</span>
                          </div>
                        }
                        <button (click)="openPaymentManagement(item.clientId)"
                                class="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 text-[10px] font-black uppercase tracking-wider shadow-2xs transition-all active:scale-95 flex items-center gap-1.5">
                          <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                          Gestisci
                        </button>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .shadow-glow-blue { box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
  `]
})
export class DashboardViewComponent {
  state = inject(AppStateService);
  private toastService = inject(ToastService);

  readonly adminQuickActions = [
    { id: 'accounting', label: 'Contabilità', sub: 'Conti e pagamenti', icon: 'fa-calculator', color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
    { id: 'collaborators', label: 'Collaboratori', sub: 'Personale e turni', icon: 'fa-users-gear', color: 'text-cyan-600', bg: 'bg-cyan-50 border border-cyan-100' },
    { id: 'documentation', label: 'Archivio', sub: 'Archivio manuali', icon: 'fa-box-archive', color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100' },
    { id: 'settings', label: 'Impostazioni', sub: 'Configurazioni', icon: 'fa-sliders', color: 'text-slate-700', bg: 'bg-slate-100 border border-slate-200' },
    { id: 'general-checks', label: 'Check Generali', sub: 'Ispezioni periodiche', icon: 'fa-list-check', color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-100' },
    { id: 'phases', label: 'Fasi Operative', sub: 'Pre / Op / Post', icon: 'fa-layer-group', color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
    { id: 'microbio-monitor', label: 'Analisi Microbio', sub: 'Tamponi e analisi', icon: 'fa-microscope', color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100' },
    { id: 'ingredients-book', label: 'Libro Ingredienti', sub: 'Ricette e allergeni', icon: 'fa-book-open', color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-100' }
  ];

  isPaymentAlertsExpanded = signal<boolean>(false);
  isSystemAlertsExpanded = signal<boolean>(false);

  togglePaymentAlerts() {
    this.isPaymentAlertsExpanded.update(v => !v);
  }

  toggleSystemAlerts() {
    this.isSystemAlertsExpanded.update(v => !v);
  }

  openPaymentManagement(clientId: string) {
    if (clientId) {
      this.state.setClientIdFilter(clientId);
    }
    this.state.setModule('accounting');
  }

  urgentPaymentAlertsCount = computed(() => {
    return this.paymentAlerts().filter(a => a.severity === 'insolvent' || a.severity === 'overdue').length;
  });

  paymentAlerts = computed((): PaymentAlert[] => {
    const payments = this.state.payments();
    const clients = this.state.clients();
    const selectedFilterClientId = this.state.filterClientId();
    const activeBrandUnits = this.state.activeBrandUnits();
    const allowedClientIds = (activeBrandUnits.length > 1)
      ? activeBrandUnits.map(u => u.id)
      : (selectedFilterClientId && selectedFilterClientId !== 'demo' ? [selectedFilterClientId] : []);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const alerts: PaymentAlert[] = [];

    // 1. Process explicit payments
    payments.forEach(p => {
      if (p.status === 'paid') return;
      if (allowedClientIds.length > 0 && !allowedClientIds.includes(p.clientId)) return;

      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const client = clients.find(c => c.id === p.clientId);
      const companyName = client?.name || 'Azienda';

      if (diffDays < -5) {
        alerts.push({
          id: `pay-${p.id}`,
          clientId: p.clientId,
          companyName,
          amount: p.amount,
          dueDate: p.dueDate,
          daysDiff: diffDays,
          severity: 'insolvent',
          statusLabel: `Insoluto da ${Math.abs(diffDays)} gg`,
          notes: p.notes
        });
      } else if (diffDays <= 0) {
        alerts.push({
          id: `pay-${p.id}`,
          clientId: p.clientId,
          companyName,
          amount: p.amount,
          dueDate: p.dueDate,
          daysDiff: diffDays,
          severity: 'overdue',
          statusLabel: diffDays === 0 ? 'Scade Oggi' : `Scaduto da ${Math.abs(diffDays)} gg`,
          notes: p.notes
        });
      } else if (diffDays <= 15) {
        alerts.push({
          id: `pay-${p.id}`,
          clientId: p.clientId,
          companyName,
          amount: p.amount,
          dueDate: p.dueDate,
          daysDiff: diffDays,
          severity: 'impending',
          statusLabel: `Scade tra ${diffDays} gg`,
          notes: p.notes
        });
      }
    });

    // 2. Also check clients flagged with paymentBalanceDue or suspended
    clients.forEach(c => {
      if (allowedClientIds.length > 0 && !allowedClientIds.includes(c.id)) return;
      if (c.paymentBalanceDue && !alerts.some(a => a.clientId === c.id)) {
        alerts.push({
          id: `client-bal-${c.id}`,
          clientId: c.id,
          companyName: c.name,
          amount: 0,
          dueDate: new Date().toISOString().split('T')[0],
          daysDiff: -1,
          severity: 'overdue',
          statusLabel: 'Saldo in Sospeso',
          notes: 'Quota o canone arretrato'
        });
      }
    });

    // Sort: insolvent first, then overdue, then impending
    const priority: Record<string, number> = { 'insolvent': 0, 'overdue': 1, 'impending': 2 };
    return alerts.sort((a, b) => (priority[a.severity] ?? 9) - (priority[b.severity] ?? 9));
  });

  // --- KPI Methods ---
  getFilteredClientsCount() {
    if (this.state.filterCollaboratorId()) {
      const user = this.state.systemUsers().find(u => u.id === this.state.filterCollaboratorId());
      return user?.clientId ? 1 : 0;
    }
    return this.state.clients().length;
  }

  getFinancialStatus() {
    if (this.state.filterCollaboratorId()) {
      const user = this.state.systemUsers().find(u => u.id === this.state.filterCollaboratorId());
      return user ? 'Regolare' : 'Pending';
    }
    return 'Pending';
  }

  getCurrentDate(): string {
    const d = this.state.filterDate();
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

  // --- Report Methods ---


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
          checksTotal: 3,
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

  // --- Signals & Computeds ---
  filteredUsers = computed(() => {
    const allUsers = this.state.systemUsers();
    const currentFilterId = this.state.filterCollaboratorId();
    const currentCompanyId = this.state.companyConfig()?.id;

    if (!this.state.isAdmin()) {
      const currentUser = this.state.currentUser();
      return currentUser ? [currentUser] : [];
    }

    let users = allUsers;

    if (currentFilterId) {
      users = allUsers.filter(u => u.id === currentFilterId);
    } else if (currentCompanyId && currentCompanyId !== 'demo') {
      const brandUnits = this.state.activeBrandUnits();
      const allowedClientIds = brandUnits.length > 0 ? brandUnits.map(bu => bu.id) : [currentCompanyId];
      users = allUsers.filter(u => allowedClientIds.includes(u.clientId || '') && u.role !== 'ADMIN');
    } else {
      // In Global Admin view (no filter or demo company), show all non-admin users
      users = allUsers.filter(u => u.role !== 'ADMIN');
    }

    return users;
  });

  collaboratorActivities = computed((): CollaboratorActivity[] => {
    const allRecords = this.state.checklistRecords();
    const currentDate = this.state.filterDate();

    return this.filteredUsers().map(user => {
      const phaseIds = ['pre-op-checklist', 'operative-checklist', 'post-op-checklist'];
      const userPhaseRecords = allRecords.filter(r =>
        r.userId === user.id &&
        r.date === currentDate &&
        phaseIds.includes(r.moduleId)
      );

      const completedPhases = new Set(userPhaseRecords.map(r => r.moduleId)).size;
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
        tasksPending: 3 - completedPhases,
        status: userPhaseRecords.length > 0 ? (hasIssues ? 'warning' : 'active') : 'inactive',
        department: user.department || 'Generale'
      };
    });
  });

  kpiData = computed(() => {
    const recap = this.phaseRecap();
    const totalPossible = recap.pre.total + recap.op.total + recap.post.total;
    const totalCompleted = recap.pre.count + recap.op.count + recap.post.count;

    return {
      completed: totalCompleted,
      total: totalPossible || 3,
      activeUsers: this.collaboratorActivities().filter(a => a.status !== 'inactive').length
    };
  });

  selectedCompanyName = computed(() => {
    const filterId = this.state.filterClientId();
    if (!filterId || filterId === 'demo') return null;
    const client = this.state.clients().find(c => c.id === filterId);
    return client?.name || null;
  });

  newAlertsCount = computed(() => {
    return this.systemAlerts().filter(a => a.isNew).length;
  });

  systemAlerts = computed((): SystemAlert[] => {
    const alerts: SystemAlert[] = [];
    const currentDate = this.state.filterDate();
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const allClients = this.state.clients();
    const allUsers = this.state.systemUsers();

    // Determine active company filter
    const selectedFilterClientId = this.state.filterClientId();
    const isCompanySelected = this.state.isAdmin()
      ? !!(selectedFilterClientId && selectedFilterClientId !== 'demo')
      : !!this.state.currentUser()?.clientId;

    const targetClientId = this.state.isAdmin()
      ? selectedFilterClientId
      : this.state.currentUser()?.clientId;

    const activeBrandUnits = this.state.activeBrandUnits();
    const allowedClientIds = (activeBrandUnits.length > 1)
      ? activeBrandUnits.map(u => u.id)
      : (targetClientId ? [targetClientId] : []);

    const getCompanyInfo = (clientId?: string, userId?: string) => {
      let cId = clientId;
      if (!cId && userId) {
        const u = allUsers.find(user => user.id === userId);
        cId = u?.clientId;
      }
      const client = allClients.find(c => c.id === cId);
      return {
        clientId: cId,
        companyName: client?.name || (cId ? 'Azienda' : '')
      };
    };

    const matchesCompanyFilter = (clientId?: string, userId?: string): boolean => {
      if (!isCompanySelected) return true; // Show ALL companies when no company selected!
      let cId = clientId;
      if (!cId && userId) {
        const u = allUsers.find(user => user.id === userId);
        cId = u?.clientId;
      }
      if (allowedClientIds.length > 0) {
        return allowedClientIds.includes(cId || '');
      }
      return cId === targetClientId;
    };

    // 1. Dedicated Non-Conformities (All companies if not filtered, filtered if company selected)
    const allNCs = this.state.nonConformities();
    const relevantNCs = allNCs.filter(nc => {
      if (nc.status === 'CLOSED') return false;
      return matchesCompanyFilter(nc.clientId, nc.responsibleId);
    });

    relevantNCs.forEach(nc => {
      const compInfo = getCompanyInfo(nc.clientId, nc.responsibleId);
      const user = allUsers.find(u => u.id === nc.responsibleId);

      // Determine if it is newly arrived
      let isNew = false;
      let sortTime = 0;

      if (nc.createdAt) {
        const createdMs = new Date(nc.createdAt).getTime();
        sortTime = createdMs;
        if (!isNaN(createdMs) && (nowTime - createdMs <= oneDayMs)) {
          isNew = true;
        }
      }

      if (nc.date === currentDate || nc.date === todayStr) {
        isNew = true;
        if (!sortTime && nc.date) {
          sortTime = new Date(nc.date).getTime();
        }
      }

      if (!sortTime && nc.date) {
        sortTime = new Date(nc.date).getTime();
      }

      const isToday = nc.date === currentDate || nc.date === todayStr;
      const timeDisplay = isToday
        ? (nc.createdAt ? new Date(nc.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'Oggi')
        : (nc.date ? new Date(nc.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'Recente');

      alerts.push({
        id: `nc-table-${nc.id}`,
        type: 'error',
        title: `Non Conformità: ${nc.itemName || 'Anomalia'}`,
        message: nc.description.length > 75 ? nc.description.substring(0, 72) + '...' : nc.description,
        userId: nc.responsibleId,
        userName: user?.name || 'Operatore',
        clientId: compInfo.clientId,
        companyName: compInfo.companyName,
        timestamp: timeDisplay,
        actionable: true,
        isNew: isNew,
        sortTimestamp: sortTime || 0
      });
    });

    // 2. Anomalies from daily checklists
    const allRecords = this.state.checklistRecords();
    const relevantRecords = allRecords.filter(r =>
      (r.date === currentDate || r.date === todayStr) &&
      matchesCompanyFilter(r.clientId, r.userId)
    );

    relevantRecords.forEach(record => {
      if (record.data?.status === 'Non Conforme') {
        const compInfo = getCompanyInfo(record.clientId, record.userId);
        const user = allUsers.find(u => u.id === record.userId);

        // Check if there is already a CLOSED non-conformity
        const isResolved = allNCs.some(nc =>
          nc.moduleId === record.moduleId &&
          nc.date === record.date &&
          (nc.clientId === compInfo.clientId || !nc.clientId) &&
          nc.status === 'CLOSED'
        );
        if (isResolved) return;

        // Skip if already in dedicated NC list
        const alreadyInNCs = relevantNCs.some(nc =>
          nc.moduleId === record.moduleId &&
          nc.date === record.date &&
          nc.clientId === compInfo.clientId
        );
        if (alreadyInNCs) return;

        const recordMs = record.timestamp ? new Date(record.timestamp).getTime() : nowTime;

        alerts.push({
          id: `nc-rec-${record.id}`,
          type: 'error',
          title: `Anomalia in ${this.getModuleName(record.moduleId)}`,
          message: record.data.summary || 'Rilevata non conformità durante l\'ispezione odierna.',
          userId: record.userId,
          userName: user?.name || 'Operatore',
          clientId: compInfo.clientId,
          companyName: compInfo.companyName,
          timestamp: record.timestamp ? new Date(record.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'Oggi',
          actionable: true,
          isNew: true, // Daily checklist anomaly from today is newly arrived
          sortTimestamp: recordMs
        });
      }
    });

    // 3. Missing phases for active users
    const usersToCheck = this.filteredUsers();
    usersToCheck.forEach(user => {
      if (!matchesCompanyFilter(user.clientId, user.id)) return;
      const userRecords = relevantRecords.filter(r => r.userId === user.id);
      const phasesMissing: string[] = [];

      if (!userRecords.some(r => r.moduleId === 'pre-op-checklist')) phasesMissing.push('Pre-operativa');
      if (!userRecords.some(r => r.moduleId === 'operative-checklist')) phasesMissing.push('Operativa');
      if (!userRecords.some(r => r.moduleId === 'post-op-checklist')) phasesMissing.push('Post-operativa');

      if (userRecords.length > 0 && phasesMissing.length > 0 && phasesMissing.length < 3) {
        const compInfo = getCompanyInfo(user.clientId, user.id);
        alerts.push({
          id: `missing-${user.id}`,
          type: 'warning',
          title: 'Fasi Mancanti',
          message: `${user.name} deve completare: ${phasesMissing.join(', ')}`,
          userId: user.id,
          userName: user.name,
          clientId: compInfo.clientId,
          companyName: compInfo.companyName,
          timestamp: 'Oggi',
          actionable: true,
          isNew: false,
          sortTimestamp: 0
        });
      }
    });

    // Sort: 1) isNew first, 2) errors (critical), 3) most recent timestamp
    return alerts.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;

      const priority: Record<string, number> = { 'error': 0, 'warning': 1, 'info': 2, 'success': 3 };
      const pDiff = (priority[a.type] ?? 9) - (priority[b.type] ?? 9);
      if (pDiff !== 0) return pDiff;

      return (b.sortTimestamp || 0) - (a.sortTimestamp || 0);
    });
  });

  criticalAlerts = computed(() =>
    this.systemAlerts().filter(a => a.type === 'error')
  );

  phaseRecap = computed(() => {
    const allRecords = this.state.checklistRecords();
    const currentDate = this.state.filterDate();
    
    const currentCompanyId = this.state.companyConfig()?.id;
    let targetClients = this.state.clients();
    
    if (currentCompanyId) {
      const brandUnits = this.state.activeBrandUnits();
      targetClients = brandUnits.length > 0 ? brandUnits : targetClients.filter(c => c.id === currentCompanyId);
    }
    
    const allEquipment = this.state.selectedEquipment();

    const getModulePossibleChecks = (clientId: string, moduleId: string) => {
      const clientEquipmentCount = allEquipment.filter(e => {
        const cid = (e as any).client_id || (e as any).clientId;
        return String(cid) === String(clientId);
      }).length;

      if (moduleId === 'pre-op-checklist') {
        let count = 0;

        const areaSteps: Record<string, number> = {
          'staff-hygiene': 2,
          'cucina-sala': 4,
          'area-lavaggio': 3,
          'deposito': 3,
          'spogliatoio': 3,
          'antibagno-bagno-personale': 4,
          'bagno-clienti': 4,
          'pavimenti': 2,
          'pareti': 1,
          'soffitto': 2,
          'infissi': 2
        };

        Object.keys(areaSteps).forEach(areaId => {
          if (this.state.isActivityEnabled('pre-op-checklist', areaId, clientId)) {
            count += areaSteps[areaId];
          }
        });

        count += (clientEquipmentCount * 2);
        return count;
      }

      if (moduleId === 'operative-checklist') {
        let count = 0;
        if (this.state.isActivityEnabled('operative-checklist', 'temperature', clientId)) {
          count += clientEquipmentCount;
        }
        return count;
      }

      if (moduleId === 'post-op-checklist') {
        let count = 0;
        const areaSteps: Record<string, number> = {
          'cucina-sala': 3,
          'area-lavaggio': 3,
          'deposito': 3,
          'spogliatoio': 3,
          'antibagno-bagno-personale': 3,
          'bagno-clienti': 3,
          'pavimenti': 3,
          'pareti': 2,
          'soffitto': 2,
          'infissi': 2,
          'reti-antiintrusione': 2
        };

        Object.keys(areaSteps).forEach(areaId => {
          if (this.state.isActivityEnabled('post-op-checklist', areaId, clientId)) {
            count += areaSteps[areaId];
          }
        });

        count += (clientEquipmentCount * 2);
        return count;
      }
      return 1;
    };

    const countCompletedItemsInRecord = (record: any) => {
      const data = record.data;
      if (!data) return 0;
      if (record.moduleId === 'pre-op-checklist') {
        const areaDone = (data.areas || []).reduce((acc: number, a: any) => acc + (a.steps || []).filter((s: any) => s.status !== 'pending').length, 0);
        return areaDone;
      }
      if (record.moduleId === 'operative-checklist') {
        return (data.items || []).filter((i: any) => i.status !== 'pending').length;
      }
      if (record.moduleId === 'post-op-checklist') {
        return (data.areas || []).reduce((acc: number, a: any) => acc + (a.steps || []).filter((s: any) => s.status !== 'pending').length, 0);
      }
      return 0;
    };

    const getPhaseStats = (moduleId: string) => {
      const moduleRecords = allRecords.filter(r => r.moduleId === moduleId && r.date === currentDate);
      let totalPossible = 0;
      let totalDone = 0;
      let issueCount = 0;

      targetClients.forEach(client => {
        const clientRecs = moduleRecords.filter(r => r.clientId === client.id);
        const clientRec = clientRecs.length
          ? clientRecs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).at(-1)
          : undefined;

        let possibleForClient = 0;
        if (clientRec) {
          if (moduleId === 'pre-op-checklist') {
            possibleForClient = (clientRec.data?.areas || []).reduce((acc: number, a: any) => acc + (a.steps || []).length, 0);
          } else if (moduleId === 'operative-checklist') {
            possibleForClient = (clientRec.data?.items || []).length;
          } else if (moduleId === 'post-op-checklist') {
            possibleForClient = (clientRec.data?.areas || []).reduce((acc: number, a: any) => acc + (a.steps || []).length, 0);
          }
        }

        if (!clientRec || possibleForClient === 0) {
          possibleForClient = getModulePossibleChecks(client.id, moduleId);
        }

        totalPossible += possibleForClient;

        if (clientRec) {
          totalDone += countCompletedItemsInRecord(clientRec);
          const hasIssue = (clientRec.data?.status === 'Non Conforme' || clientRec.data?.areas?.some((a: any) => a.steps?.some((s: any) => s.status === 'issue')) || clientRec.data?.items?.some((i: any) => i.status === 'issue'));
          
          const isResolved = this.state.nonConformities().some(nc => 
            nc.moduleId === moduleId && 
            nc.date === currentDate && 
            nc.clientId === client.id &&
            nc.status === 'CLOSED'
          );

          if (hasIssue && !isResolved) issueCount++;
        }
      });

      return {
        pct: totalPossible > 0 ? (totalDone / totalPossible) * 100 : 0,
        count: totalDone,
        total: totalPossible,
        issues: issueCount
      };
    };

    return {
      pre: getPhaseStats('pre-op-checklist'),
      op: getPhaseStats('operative-checklist'),
      post: getPhaseStats('post-op-checklist')
    };
  });

  recentDocuments = computed(() => {
    return this.state.filteredDocuments()
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5);
  });

  // --- Utility Methods ---
  getModuleName(id: string) {
    switch (id) {
      case 'pre-op-checklist': return 'Fase Pre-operativa';
      case 'operative-checklist': return 'Fase Operativa';
      case 'post-op-checklist': return 'Fase Post-operativa';
      default: return id;
    }
  }

  handleAlertAction(alert: SystemAlert) {
    if (alert.clientId) {
      this.state.setClientIdFilter(alert.clientId);
    }
    if (alert.type === 'error' || alert.title.toLowerCase().includes('anomalia') || alert.title.toLowerCase().includes('non conformit')) {
      this.state.setModule('general-checks');
    } else {
      this.state.setModule('collaborators');
    }
  }

  hasActiveApiKey = computed(() => {
    const config = this.state.aiConfig();
    const key = config?.apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('haccp_gemini_api_key') : '') || '';
    return typeof key === 'string' && key.trim().length > 8;
  });

  goToAiSettings() {
    this.state.setModule('settings');
  }

  scrollToAlerts() {
    document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  private generatePrintHTML(report: any): string {
    const dateStr = new Date(this.state.filterDate()).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    const logo = this.state.currentLogo();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report - ${report.client.name}</title>
        <style>
          body { font-family: sans-serif; padding: 2cm; color: #334155; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Report HACCP</h1>
          <div>${dateStr}</div>
        </div>
        <h2>${report.client.name}</h2>
        <p>Documento generato per l'unità operativa selezionata.</p>
        <table>
          <thead><tr><th>Utente</th><th>Modulo</th><th>Stato</th></tr></thead>
          <tbody>
            ${report.detailedChecks.map((c: any) => `
              <tr><td>${c.userName}</td><td>${c.moduleName}</td><td>Completato</td></tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}
