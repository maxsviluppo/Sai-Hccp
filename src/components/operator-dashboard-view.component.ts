import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-operator-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in p-4 pb-12 max-w-7xl mx-auto">
      
      <!-- Sleek Professional Header for Operator -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        <div class="flex items-center gap-5 relative z-10">
          <div class="relative flex-shrink-0">
             <img [src]="state.currentUser()?.avatar" class="h-14 w-14 rounded-xl shadow-md object-cover ring-1 ring-slate-200">
             <div class="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></div>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Ciao, {{ state.currentUser()?.name?.split(' ')[0] }}</h2>
            <div class="flex items-center gap-2 mt-1">
               <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{{ state.currentUser()?.department || 'Staff Operativo' }}</span>
               <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 relative z-10 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 shrink-0">
           <div class="text-right flex flex-col justify-center">
             <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Turno attuale</p>
             <p class="text-sm font-bold text-slate-700 leading-none">{{ getCurrentDay() }}, {{ getCurrentDayNumber() }} {{ getCurrentMonth() }}</p>
           </div>
           <div class="h-10 w-10 flex items-center justify-center bg-white rounded-full border border-slate-200 text-slate-500 shadow-sm shrink-0">
             <i class="fa-regular fa-calendar-check text-lg"></i>
           </div>
        </div>
      </div>
      <!-- Highly Visible Payment Banner (Premium App Style) -->
      @if (state.recentPaidPayment() || state.companyConfig().paymentBalanceDue || state.latestActivePayment()) {
        <!-- Logic to determine theme -->
        @let isPaid = state.recentPaidPayment();
        @let activePay = state.latestActivePayment();
        @let urgency = activePay ? state.getDaysRemaining(activePay.dueDate) : 100;
        
        <!-- Theme determination: 'SUCCESS' (Emerald) | 'URGENT' (Red/Dark) | 'NOTICE' (Amber) -->
        @let theme = isPaid ? 'SUCCESS' : (activePay && urgency <= 5 ? 'URGENT' : 'NOTICE');

        <div [class]="'rounded-[2.5rem] p-8 shadow-2xl animate-fade-in mb-8 relative overflow-hidden group border transition-all duration-700 ' + 
            (theme === 'SUCCESS' ? 'bg-white border-emerald-200 text-slate-900' : 
             theme === 'URGENT' ? 'bg-slate-900 border-red-500/50 text-white shadow-red-500/10' : 
             'bg-white border-amber-200 text-slate-900')">
          
          <!-- Animated Background Elements based on Theme -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div [class]="'absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-40 transition-colors duration-700 ' + 
                (theme === 'SUCCESS' ? 'bg-emerald-400' : theme === 'URGENT' ? 'bg-red-600' : 'bg-amber-400')"></div>
            <div [class]="'absolute -left-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] opacity-20 transition-colors duration-700 ' + 
                (theme === 'SUCCESS' ? 'bg-teal-300' : theme === 'URGENT' ? 'bg-rose-500' : 'bg-orange-300')"></div>
          </div>
          
          <div class="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div class="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
              <!-- Iconic Status Symbol -->
              <div [class]="'h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ' + 
                  (theme === 'SUCCESS' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/40' : 
                   theme === 'URGENT' ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/40' : 
                   'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/40')">
                <i [class]="'fa-solid text-3xl ' + (theme === 'SUCCESS' ? 'fa-circle-check' : (theme === 'URGENT' ? 'fa-triangle-exclamation' : 'fa-credit-card'))"></i>
              </div>

              <div class="space-y-4">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <!-- Dynamic Badge -->
                    <span [class]="'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ' + 
                        (theme === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 
                         theme === 'URGENT' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700')">
                      @if (theme === 'SUCCESS') {
                        CONFERMATO: {{ isPaid?.amount | currency:'EUR' }}
                      } @else if (activePay) {
                         ATTESA: {{ activePay.amount | currency:'EUR' }}
                      } @else {
                        PAGAMENTO SOSPESO
                      }
                    </span>
                    @if (theme === 'URGENT') {
                      <span class="px-3 py-1 rounded-full bg-white/10 text-red-100 border border-red-500/30 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                        Urgente
                      </span>
                    }
                  </div>
                  
                  <h4 class="text-3xl font-black tracking-tight leading-tight mt-2">
                    @if (theme === 'SUCCESS') {
                      Pagamento <span class="text-emerald-500">Effettuato</span> con Successo
                    } @else if (theme === 'URGENT') {
                      Pagamento <span class="text-red-500">Oltre Scadenza</span>
                    } @else {
                      Abbonamento in <span class="text-amber-500">Scadenza</span>
                    }
                  </h4>
                  
                  <p [class]="'text-sm font-medium leading-relaxed max-w-xl ' + (theme === 'URGENT' ? 'text-slate-400' : 'text-slate-600')">
                    @if (theme === 'SUCCESS') {
                      Il tuo pagamento è stato registrato correttamente dalla sede centrale. Il servizio è attivo e non sono richieste ulteriori azioni.
                    } @else if (theme === 'URGENT') {
                      I termini di pagamento sono scaduti. Ti preghiamo di regolarizzare immediatamente per evitare la sospensione dei servizi e delle attività di controllo.
                    } @else {
                      Il tuo servizio scadrà a breve. Rinnova ora per garantire la continuità dei tuoi registri HACCP.
                    }
                  </p>
                </div>

                <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <!-- Info Chips -->
                  <div [class]="'flex items-center gap-2 text-[11px] font-black px-4 py-2 rounded-2xl border backdrop-blur-md ' + 
                      (theme === 'URGENT' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600')">
                    <i [class]="'fa-solid opacity-70 ' + (theme === 'SUCCESS' ? 'fa-calendar-check' : 'fa-calendar-day')"></i>
                    @if (theme === 'SUCCESS') {
                      PAGATO IN DATA: {{ isPaid?.paidDate | date:'dd/MM/yyyy' }}
                    } @else {
                      SCADE IL: {{ activePay?.dueDate || state.companyConfig().licenseExpiryDate || '---' }}
                    }
                  </div>
                  
                  @if (activePay && theme !== 'SUCCESS') {
                    <div [class]="'flex items-center gap-2 text-[11px] font-black px-4 py-2 rounded-2xl ' + 
                        (theme === 'URGENT' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100')">
                      <i class="fa-solid fa-hourglass-half"></i>
                      {{ urgency }} GIORNI RIMANENTI
                    </div>
                  }
                </div>
              </div>
            </div>
            
            <div class="flex flex-col items-center gap-3 shrink-0">
              @if (theme === 'SUCCESS') {
                <div class="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce shadow-inner">
                  <i class="fa-solid fa-thumbs-up text-2xl"></i>
                </div>
                <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">OK! Servizio Attivo</p>
              } @else {
                <button [class]="'px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4 group/btn hover:scale-105 active:scale-95 ' + 
                    (theme === 'URGENT' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/30' : 'bg-slate-900 text-white hover:bg-black')">
                  Procedi al Rinnovo
                  <div class="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                  </div>
                </button>
                <p class="text-[10px] font-bold opacity-40 uppercase tracking-tighter">HACCP PRO - Transazione sicura</p>
              }
            </div>
          </div>
        </div>
      }

      <!-- Main Operational Phases -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
         <h3 class="text-lg font-bold text-slate-800 tracking-tight mb-6">Controlli Obbligatori Giornalieri</h3>
         <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            @for (phase of [
              {id: 'pre-op-checklist', label: 'Apertura', sub: 'Pre-Operativa', icon: 'fa-sun', iconColor: 'text-sky-500', bg: 'bg-sky-50', bgFill: 'bg-sky-500'},
              {id: 'operative-checklist', label: 'Monitoraggio', sub: 'Operativa', icon: 'fa-briefcase', iconColor: 'text-indigo-500', bg: 'bg-indigo-50', bgFill: 'bg-indigo-500'},
              {id: 'post-op-checklist', label: 'Chiusura', sub: 'Post-Operativa', icon: 'fa-moon', iconColor: 'text-purple-500', bg: 'bg-purple-50', bgFill: 'bg-purple-500'}
            ]; track phase.id) {
              <button (click)="state.setModule(phase.id)" 
                   class="group relative overflow-hidden rounded-xl p-5 border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col h-full">
                 
                 <div class="mb-4 flex items-center justify-between">
                    <div [class]="'h-10 w-10 rounded-full flex items-center justify-center transition-all bg-white shadow-sm border border-slate-100 group-hover:scale-110 shrink-0 ' + phase.iconColor">
                      <i class="fa-solid {{ phase.icon }} text-lg"></i>
                    </div>
                    <div class="text-right">
                       <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{{ phase.sub }}</span>
                       <span class="text-xs font-bold" [class]="isPhaseComplete(phase.id) ? 'text-emerald-600' : 'text-slate-500'">{{ isPhaseComplete(phase.id) ? 'Lavoro Concluso' : 'Da Rilasciare' }}</span>
                    </div>
                 </div>

                 <h4 class="text-base font-bold text-slate-800 leading-tight mb-4 flex-1">{{ phase.label }}</h4>

                 <div class="relative h-1.5 rounded-full bg-slate-200 overflow-hidden w-full">
                    <div class="h-full transition-all duration-1000" 
                         [class]="phase.bgFill"
                         [style.width.%]="isPhaseComplete(phase.id) ? 100 : 0"></div>
                 </div>
              </button>
            }
         </div>
      </div>

      <!-- Lower Grid: Actions, Insights & Messages -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Action: Anomaly & History -->
        <div class="space-y-6 flex flex-col">
          <!-- Anomaly Button -->
          <button (click)="state.setModule('non-compliance')" 
               class="w-full bg-white rounded-2xl p-6 shadow-sm border border-red-100 hover:border-red-300 hover:shadow-md transition-all text-left flex items-center gap-5 group">
             <div class="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100 group-hover:bg-red-500 group-hover:text-white text-red-500 transition-colors">
                 <i class="fa-solid fa-triangle-exclamation text-xl"></i>
             </div>
             <div>
                <h3 class="text-base font-bold text-red-600 mb-0.5">Segnala Anomalia</h3>
                <p class="text-xs text-slate-500">Apri un ticket di non conformità</p>
             </div>
          </button>

          <!-- Personal Insights snippet -->
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex-1 flex flex-col">
             <h3 class="text-sm font-bold text-slate-800 tracking-tight mb-4 border-b border-slate-100 pb-2">Riepilogo Turno</h3>
             
             <div class="flex flex-col gap-4 mb-auto">
                 <div>
                     <div class="flex items-center justify-between mb-1.5">
                         <span class="text-xs font-bold text-slate-500">Avanzamento Globale</span>
                         <span class="text-sm font-bold text-slate-800 tabular-nums border border-slate-100 bg-slate-50 rounded-md px-1.5">{{ completedPhasesCount() }}/3</span>
                     </div>
                     <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                         <div class="h-full bg-emerald-500 transition-all duration-1000" [style.width.%]="(completedPhasesCount() / 3) * 100"></div>
                     </div>
                 </div>

                 <div class="flex items-center justify-between mt-2">
                     <span class="text-xs font-bold text-slate-500">Ultimo Accesso Registro</span>
                     <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{{ lastRecordTime() }}</span>
                 </div>
             </div>

             <button (click)="state.setModule('history')" class="group w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2">
                VEDI STORICO LISTE
             </button>
          </div>
        </div>

        <!-- Messaging Center -->
        <div class="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[350px]">
             <div class="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div class="flex items-center gap-3">
                     <h3 class="text-base font-bold text-slate-800 tracking-tight">Messaggistica Aziendale</h3>
                     @if (state.unreadMessagesCount() > 0) {
                        <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{{ state.unreadMessagesCount() }} nuovi</span>
                     }
                 </div>
                 <button (click)="state.setModule('messages')" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">Vedi Archivio</button>
             </div>
             
             <div class="flex-1 p-4 overflow-y-auto custom-scrollbar">
                 @if (state.getMessagesForCurrentUser().length === 0) {
                     <div class="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                         <div class="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <i class="fa-regular fa-envelope-open text-2xl text-slate-300"></i>
                         </div>
                         <p class="text-sm font-bold text-slate-600">Nessun nuovo messaggio</p>
                         <p class="text-xs">Le comunicazioni ricevute appariranno qui.</p>
                     </div>
                 } @else {
                     <div class="space-y-3">
                         @for (msg of state.getMessagesForCurrentUser().slice(0, 4); track msg.id) {
                             <div (click)="state.setModule('messages')" 
                                  class="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer flex gap-4 items-start">
                                 <div class="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border mt-0.5" [class.bg-blue-50]="!msg.read" [class.border-blue-200]="!msg.read" [class.bg-slate-100]="msg.read" [class.border-slate-200]="msg.read">
                                     <i class="fa-solid fa-envelope text-xs" [class.text-blue-500]="!msg.read" [class.text-slate-400]="msg.read"></i>
                                 </div>
                                 <div class="flex-1 min-w-0">
                                     <div class="flex justify-between items-baseline mb-1">
                                         <h4 class="text-sm font-bold text-slate-800 truncate" [class.text-blue-700]="!msg.read">{{ msg.subject }}</h4>
                                     </div>
                                     <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-1.5">{{ msg.content }}</p>
                                     <p class="text-[9px] font-bold text-slate-400 uppercase">{{ msg.timestamp | date:'dd MMM HH:mm' }}</p>
                                 </div>
                             </div>
                         }
                     </div>
                 }
             </div>
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
