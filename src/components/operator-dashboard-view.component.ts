import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-operator-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Enhanced Operator Header (Matching Admin Style) -->
      <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 rounded-3xl shadow-xl border border-emerald-500/30 relative overflow-hidden mb-6">
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <i class="fa-solid fa-user-check text-9xl text-white"></i>
        </div>
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-6">
            <div class="relative group">
              <div class="absolute -inset-1 bg-white/30 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <img [src]="state.currentUser()?.avatar" class="relative w-16 h-16 rounded-2xl border-2 border-white/30 shadow-2xl object-cover">
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            
            <div>
              <h2 class="text-3xl font-black text-white tracking-tight leading-none mb-1">
                Ciao, <span class="text-emerald-400">{{ state.currentUser()?.name?.split(' ')[0] }}</span>
              </h2>
              <div class="flex items-center gap-2 text-sm text-slate-400 font-medium">
                <span class="bg-white/10 px-2 py-0.5 rounded text-xs text-slate-300 border border-white/10 flex items-center gap-1">
                   <i class="fa-solid fa-user-tag text-xs"></i> {{ state.currentUser()?.department || 'Operativo' }}
                </span>
                <span class="text-emerald-500 flex items-center gap-1">
                   <i class="fa-solid fa-circle text-[8px]"></i> Online
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3">
             <!-- Date Pill -->
             <div class="px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                <div class="text-right hidden sm:block">
                   <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oggi è</div>
                   <div class="text-sm font-bold text-white capitalize">{{ getCurrentDay() }}</div>
                </div>
                <div class="h-8 w-px bg-white/10 mx-1"></div>
                <div class="text-right hidden sm:block">
                   <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ getCurrentMonth() }}</div>
                   <div class="text-sm font-bold text-white">{{ getCurrentDayNumber() }}</div>
                </div>
                <i class="fa-solid fa-calendar-day text-blue-400 text-xl ml-2"></i>
             </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid (Compact Buttons) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Pre-Op -->
        <button (click)="state.setModule('pre-op-checklist')" 
             class="group relative bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden">
           <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="fa-solid fa-sun text-6xl text-blue-600"></i>
           </div>
           <div class="relative z-10">
              <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-500 transition-colors">
                <i class="fa-solid fa-sun text-blue-600 group-hover:text-white transition-colors"></i>
              </div>
              <h3 class="font-bold text-slate-800 leading-tight mb-1">Fase<br>Pre-Operativa</h3>
              <div class="flex items-center gap-2 mt-2">
                 <div class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 transition-all" [style.width.%]="isPhaseComplete('pre-op-checklist') ? 100 : 0"></div>
                 </div>
                 <span class="text-[10px] font-bold" [class.text-blue-600]="isPhaseComplete('pre-op-checklist')" [class.text-slate-400]="!isPhaseComplete('pre-op-checklist')">
                    {{ isPhaseComplete('pre-op-checklist') ? '100%' : '0%' }}
                 </span>
              </div>
           </div>
        </button>

        <!-- Operative -->
        <button (click)="state.setModule('operative-checklist')" 
             class="group relative bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden">
           <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="fa-solid fa-briefcase text-6xl text-indigo-600"></i>
           </div>
           <div class="relative z-10">
              <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-500 transition-colors">
                <i class="fa-solid fa-briefcase text-indigo-600 group-hover:text-white transition-colors"></i>
              </div>
              <h3 class="font-bold text-slate-800 leading-tight mb-1">Fase<br>Operativa</h3>
              <div class="flex items-center gap-2 mt-2">
                 <div class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 transition-all" [style.width.%]="isPhaseComplete('operative-checklist') ? 100 : 0"></div>
                 </div>
                 <span class="text-[10px] font-bold" [class.text-indigo-600]="isPhaseComplete('operative-checklist')" [class.text-slate-400]="!isPhaseComplete('operative-checklist')">
                    {{ isPhaseComplete('operative-checklist') ? '100%' : '0%' }}
                 </span>
              </div>
           </div>
        </button>

        <!-- Post-Op -->
        <button (click)="state.setModule('post-op-checklist')" 
             class="group relative bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden">
           <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="fa-solid fa-hourglass-end text-6xl text-purple-600"></i>
           </div>
           <div class="relative z-10">
              <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3 group-hover:bg-purple-500 transition-colors">
                <i class="fa-solid fa-hourglass-end text-purple-600 group-hover:text-white transition-colors"></i>
              </div>
              <h3 class="font-bold text-slate-800 leading-tight mb-1">Fase<br>Post-Operativa</h3>
              <div class="flex items-center gap-2 mt-2">
                 <div class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-purple-500 transition-all" [style.width.%]="isPhaseComplete('post-op-checklist') ? 100 : 0"></div>
                 </div>
                 <span class="text-[10px] font-bold" [class.text-purple-600]="isPhaseComplete('post-op-checklist')" [class.text-slate-400]="!isPhaseComplete('post-op-checklist')">
                    {{ isPhaseComplete('post-op-checklist') ? '100%' : '0%' }}
                 </span>
              </div>
           </div>
        </button>

        <!-- Report Anomaly -->
        <button (click)="state.setModule('non-compliance')" 
             class="group relative bg-red-50 p-6 rounded-2xl shadow-lg border-2 border-red-100 hover:border-red-300 hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden">
           <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-200/20 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
           <div class="relative z-10 w-full h-full flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3 group-hover:bg-red-500 transition-colors shadow-sm">
                    <i class="fa-solid fa-triangle-exclamation text-red-600 group-hover:text-white transition-colors"></i>
                </div>
                <h3 class="font-black text-red-900 leading-tight mb-1">Segnala<br>Anomalia</h3>
              </div>
              <div class="mt-2 flex items-center text-xs font-bold text-red-600 group-hover:underline">
                 Apri Modulo <i class="fa-solid fa-arrow-right ml-2 opacity-50 group-hover:translate-x-1 transition-transform"></i>
              </div>
           </div>
        </button>
      </div>

      <!-- Secondary Section: Messages & Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Recent Messages Container -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <i class="fa-solid fa-inbox text-blue-600 text-sm"></i>
                    </div>
                    <h3 class="font-bold text-slate-800">Messaggi Ricevuti</h3>
                </div>
                <button (click)="state.setModule('messages')" class="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    Vedi Tutti
                </button>
            </div>
            
            <div class="p-0 flex-1">
                @if (state.getMessagesForCurrentUser().length === 0) {
                    <div class="flex flex-col items-center justify-center h-48 text-slate-400">
                        <i class="fa-regular fa-envelope-open text-4xl mb-3 opacity-50"></i>
                        <p class="text-sm font-medium">Nessun messaggio recente</p>
                    </div>
                } @else {
                    <div class="divide-y divide-slate-100">
                        @for (msg of state.getMessagesForCurrentUser().slice(0, 3); track msg.id) {
                            <div (click)="state.setModule('messages')" 
                                 class="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-4 items-start">
                                <div class="w-2 h-2 mt-2 rounded-full flex-shrink-0" [class.bg-blue-500]="!msg.read" [class.bg-slate-200]="msg.read"></div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-baseline mb-1">
                                        <h4 class="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{{ msg.subject }}</h4>
                                        <span class="text-[10px] text-slate-400 font-mono">{{ msg.timestamp | date:'dd/MM HH:mm' }}</span>
                                    </div>
                                    <p class="text-xs text-slate-500 line-clamp-2">{{ msg.content }}</p>
                                </div>
                                <i class="fa-solid fa-chevron-right text-slate-300 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </div>
                        }
                    </div>
                }
            </div>
            @if (state.unreadMessagesCount() > 0) {
               <div class="bg-blue-50 p-3 text-center text-xs font-bold text-blue-700 border-t border-blue-100">
                  Hai {{ state.unreadMessagesCount() }} messaggi non letti
               </div>
            }
        </div>

        <!-- Metric Card -->
        <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden flex flex-col justify-between">
             <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
             
             <div>
                <h3 class="text-lg font-black mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
                    <span>Performance</span>
                    <i class="fa-solid fa-chart-pie text-indigo-400"></i>
                </h3>
                
                <div class="grid grid-cols-2 gap-4">
                   <div class="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                       <div class="text-3xl font-black text-emerald-400 mb-1">{{ completedPhasesCount() }}/3</div>
                       <div class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Fasi Oggi</div>
                   </div>
                   <div class="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                       <div class="text-xl font-black text-blue-400 mb-2 truncate">{{ lastRecordTime() }}</div>
                       <div class="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Ultimo Check</div>
                   </div>
                </div>
             </div>

             <button (click)="state.setModule('history')" class="group w-full mt-6 py-4 bg-white hover:bg-indigo-50 text-indigo-950 rounded-xl font-black text-xs tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95">
                <span>VAI ALLO STORICO</span>
                <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
             </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .bg-grid-slate-700\/25 {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class OperatorDashboardViewComponent {
  state = inject(AppStateService);

  isPhaseComplete = (moduleId: string): boolean => {
    const records = this.state.checklistRecords();
    const today = this.state.filterDate();
    const userId = this.state.currentUser()?.id;
    return records.some(r => r.moduleId === moduleId && r.date === today && r.userId === userId);
  };

  completedPhasesCount = computed(() => {
    const phases = ['pre-op-checklist', 'operative-checklist', 'post-op-checklist'];
    return phases.filter(p => this.isPhaseComplete(p)).length;
  });

  lastRecordTime = computed(() => {
    const records = this.state.checklistRecords();
    const today = this.state.filterDate();
    const userId = this.state.currentUser()?.id;
    const userTodayRecords = records.filter(r => r.date === today && r.userId === userId);

    if (userTodayRecords.length === 0) return '--:--';

    const latest = userTodayRecords.reduce((prev, curr) =>
      new Date(curr.timestamp) > new Date(prev.timestamp) ? curr : prev
    );

    return new Date(latest.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  });

  getCurrentDay(): string {
    return new Date().toLocaleDateString('it-IT', { weekday: 'long' });
  }

  getCurrentMonth(): string {
    return new Date().toLocaleDateString('it-IT', { month: 'short' });
  }

  getCurrentDayNumber(): string {
    return new Date().toLocaleDateString('it-IT', { day: 'numeric' });
  }

  getCurrentDateFormatted(): string {
    return new Date().toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
