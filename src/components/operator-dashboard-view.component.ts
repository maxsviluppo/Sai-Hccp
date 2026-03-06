import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-operator-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in p-2">
      
      <!-- Premium Operator Hero -->
      <div class="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-8 shadow-2xl border border-emerald-500/20">
        <!-- Decor Elements -->
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-emerald-400/20 blur-2xl"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div class="flex items-center gap-6">
            <div class="relative">
              <div class="absolute -inset-2 rounded-[2rem] bg-white/20 blur-md animate-pulse"></div>
              <img [src]="state.currentUser()?.avatar" class="relative h-20 w-20 rounded-[1.5rem] border-2 border-white/40 shadow-2xl object-cover">
              <div class="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-teal-700 bg-emerald-400"></div>
            </div>
            
            <div>
              <h2 class="text-4xl font-black tracking-tight text-white mb-1">
                Ciao, <span class="text-emerald-200">{{ state.currentUser()?.name?.split(' ')[0] }}</span>
              </h2>
              <div class="flex items-center gap-3">
                <span class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-emerald-50 border border-white/20 uppercase tracking-widest">
                  <i class="fa-solid fa-user-tag text-xs mr-2"></i> {{ state.currentUser()?.department || 'Staff Operativo' }}
                </span>
                <span class="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <span class="h-2 w-2 rounded-full bg-emerald-400"></span> Online
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-4">
             <!-- Time/Date Pill -->
             <div class="flex items-center gap-4 rounded-3xl bg-black/20 p-4 border border-white/10 backdrop-blur-md">
                <div class="text-right">
                   <p class="text-[10px] font-black uppercase tracking-widest text-emerald-200/60 text-left">Turno Odierno</p>
                   <p class="text-lg font-bold text-white leading-none whitespace-nowrap">{{ getCurrentDay() }}, {{ getCurrentDayNumber() }} {{ getCurrentMonth() }}</p>
                </div>
                <div class="h-10 w-10 flex items-center justify-center bg-white/10 rounded-2xl text-emerald-300">
                   <i class="fa-solid fa-clock text-xl"></i>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Main Operational Phases -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        @for (phase of [
          {id: 'pre-op-checklist', label: 'Start Check', sub: 'Pre-Operativa', icon: 'fa-sun', color: 'blue', desc: 'Controlli apertura'},
          {id: 'operative-checklist', label: 'Monitor Check', sub: 'Operativa', icon: 'fa-briefcase', color: 'indigo', desc: 'Gestione flussi'},
          {id: 'post-op-checklist', label: 'End Check', sub: 'Post-Operativa', icon: 'fa-hourglass-end', color: 'purple', desc: 'Chiusura e pulizia'}
        ]; track phase.id) {
          <button (click)="state.setModule(phase.id)" 
               class="group relative overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left">
             
             <div class="mb-6 flex items-center justify-between">
                <div [class]="'h-14 w-14 rounded-2xl flex items-center justify-center transition-all bg-' + phase.color + '-50 text-' + phase.color + '-600 group-hover:bg-' + phase.color + '-600 group-hover:text-white group-hover:rotate-6 shadow-sm'">
                  <i class="fa-solid {{ phase.icon }} text-2xl transition-transform"></i>
                </div>
                <div class="text-right">
                   <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{{ phase.sub }}</span>
                   <span class="text-xs font-black" [class]="'text-' + phase.color + '-600'">{{ isPhaseComplete(phase.id) ? 'COMPLETATO' : 'DA COMPILARE' }}</span>
                </div>
             </div>

             <h3 class="text-xl font-black text-slate-900 leading-tight mb-2">{{ phase.label }}</h3>
             <p class="text-xs font-medium text-slate-500 mb-6">{{ phase.desc }}</p>

             <div class="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full transition-all duration-1000 shadow-sm" 
                     [class]="'bg-' + phase.color + '-600'"
                     [style.width.%]="isPhaseComplete(phase.id) ? 100 : 0"></div>
             </div>
          </button>
        }

        <!-- Critical Action: Anomaly -->
        <button (click)="state.setModule('non-compliance')" 
             class="group relative overflow-hidden rounded-[2.5rem] bg-red-600 p-6 shadow-2xl hover:shadow-red-500/30 hover:-translate-y-2 transition-all duration-300 text-left">
           <div class="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors"></div>
           
           <div class="relative z-10 flex flex-col h-full justify-between">
              <div class="mb-6">
                <div class="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-4 border border-white/20 shadow-lg">
                    <i class="fa-solid fa-triangle-exclamation text-2xl animate-pulse"></i>
                </div>
                <h3 class="text-2xl font-black text-white leading-tight mb-1 uppercase tracking-tighter">Segnala<br>Anomalia</h3>
              </div>
              
              <div class="flex items-center gap-2 text-xs font-black text-red-100 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                 Apri Modulo Rapido <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </div>
           </div>
        </button>
      </div>

      <!-- Secondary Data Hub -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Messaging Center -->
        <div class="lg:col-span-2 rounded-[2.5rem] bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div class="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center justify-between">
                <h3 class="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span class="h-6 w-1.5 bg-blue-600 rounded-full"></span>
                    Comunicazioni Interne
                </h3>
                <button (click)="state.setModule('messages')" class="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-600 hover:text-white transition-all">
                    ARCHIVIO
                </button>
            </div>
            
            <div class="p-4 flex-1">
                @if (state.getMessagesForCurrentUser().length === 0) {
                    <div class="flex flex-col items-center justify-center h-48 text-slate-400">
                        <i class="fa-regular fa-envelope-open text-4xl mb-4 opacity-10"></i>
                        <p class="text-sm font-bold uppercase tracking-widest text-slate-300">Nessuna notifica</p>
                    </div>
                } @else {
                    <div class="space-y-3">
                        @for (msg of state.getMessagesForCurrentUser().slice(0, 3); track msg.id) {
                            <div (click)="state.setModule('messages')" 
                                 class="p-5 rounded-[1.5rem] bg-slate-50 hover:bg-white border-2 border-transparent hover:border-blue-100 hover:shadow-xl transition-all cursor-pointer group flex gap-5 items-start">
                                <div class="h-3 w-3 mt-1.5 rounded-full flex-shrink-0" [class.bg-blue-600]="!msg.read" [class.bg-slate-300]="msg.read"></div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-baseline mb-2">
                                        <h4 class="text-base font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{{ msg.subject }}</h4>
                                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ msg.timestamp | date:'HH:mm' }}</span>
                                    </div>
                                    <p class="text-sm text-slate-500 line-clamp-2 leading-relaxed">{{ msg.content }}</p>
                                </div>
                            </div>
                        }
                    </div>
                }
            </div>
            @if (state.unreadMessagesCount() > 0) {
               <div class="bg-blue-600 p-4 text-center text-xs font-black text-white uppercase tracking-widest animate-pulse-subtle">
                  Hai {{ state.unreadMessagesCount() }} nuovi messaggi da leggere
               </div>
            }
        </div>

        <!-- Personal Insights -->
        <div class="rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl relative overflow-hidden flex flex-col">
             <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
             
             <div class="mb-auto">
                <h3 class="text-xl font-black text-white mb-8 border-b border-white/5 pb-4 flex items-center justify-between">
                    <span>Performance</span>
                    <i class="fa-solid fa-bolt text-indigo-400"></i>
                </h3>
                
                <div class="grid grid-cols-1 gap-4">
                   <div class="rounded-3xl bg-white/5 p-6 border border-white/10 group hover:bg-white/10 transition-colors">
                       <div class="flex items-center justify-between mb-2">
                           <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Completamento</span>
                           <span class="text-2xl font-black text-emerald-400">{{ completedPhasesCount() }} <span class="text-sm text-slate-500">/ 3</span></span>
                       </div>
                       <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                           <div class="h-full bg-emerald-500 transition-all duration-1000" [style.width.%]="(completedPhasesCount() / 3) * 100"></div>
                       </div>
                   </div>

                   <div class="rounded-3xl bg-white/5 p-6 border border-white/10 group hover:bg-white/10 transition-colors">
                       <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Ultimo Accesso Registro</p>
                       <p class="text-2xl font-black text-blue-400">{{ lastRecordTime() }}</p>
                   </div>
                </div>
             </div>

             <button (click)="state.setModule('history')" class="group w-full mt-10 py-5 bg-white hover:bg-indigo-50 text-indigo-950 rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                VEDI STORICO PERSONALE
                <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
             </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
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
