
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService, AppDocument } from '../services/app-state.service';
import {
  daysUntilIsoDate,
  expiryAlertSeverity,
  isExpiryAlertActive
} from '../utils/document-expiry-alerts';

@Component({
  selector: 'app-operator-dashboard-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in p-4 pb-12 max-w-7xl mx-auto">
      
      <!-- SLEEK HEADER -->
      <div class="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        
        <div class="flex items-start gap-5 relative z-10 w-full">
          <div class="relative shrink-0 hidden md:block">
             <img [src]="state.currentUser()?.avatar" class="h-20 w-20 rounded-3xl shadow-xl object-cover ring-4 ring-slate-50">
             <div class="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-sm"></div>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Ciao, {{ state.currentUser()?.name?.split(' ')[0] }}!
            </h2>
            <p class="text-xs font-bold text-slate-500 mt-1 truncate">{{ state.companyConfig().name }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span class="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">
                {{ state.currentUser()?.department || 'Staff Operativo' }}
              </span>
              <span class="inline-flex items-center gap-1.5 text-[11px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                <i class="fa-regular fa-calendar-check text-slate-500 text-xs"></i>
                Turno odierno · {{ getCurrentDay() }} {{ getCurrentDayNumber() }} {{ getCurrentMonth() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- STATO ABBONAMENTO (barra compatta) -->
      @if (true) {
        @let isPaid = state.recentPaidPayment();
        @let activePay = state.latestActivePayment();
        @let urgency = activePay ? state.getDaysRemaining(activePay.dueDate) : 100;
        @let theme = (activePay && urgency <= 7) ? 'URGENT' : (isPaid ? 'SUCCESS' : 'NOTICE');

        @if (theme === 'URGENT') {
          <button type="button" (click)="showPaymentModal.set(true)"
                  class="w-full rounded-xl border-2 border-red-600 bg-red-600 text-white px-4 py-3.5 flex items-center justify-between gap-3 shadow-md active:scale-[0.99] transition-transform text-left">
            <div class="flex items-center gap-3 min-w-0">
              <i class="fa-solid fa-triangle-exclamation text-xl shrink-0"></i>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-90">Piano · Scadenza imminente</p>
                <p class="text-sm font-black truncate">Rata entro {{ urgency }} gg · Tocca per pagare</p>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-sm opacity-80 shrink-0"></i>
          </button>
        } @else {
          <div [class]="'w-full rounded-xl border-2 px-4 py-3.5 flex items-center gap-3 ' +
              (theme === 'SUCCESS' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-emerald-200 bg-white text-slate-800')">
            <i [class]="'fa-solid text-lg shrink-0 ' + (theme === 'SUCCESS' ? 'fa-circle-check text-emerald-600' : 'fa-shield-check text-emerald-600')"></i>
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {{ theme === 'SUCCESS' ? 'Pagamento registrato' : 'Piano attivo' }}
              </p>
              <p class="text-sm font-black leading-tight truncate">
                {{ theme === 'SUCCESS' ? 'In regola · transazione confermata' : 'Servizio regolare · in regola' }}
              </p>
            </div>
          </div>
        }
      }

      @if (archiveDocExpiryAlerts().length > 0) {
        <div class="w-full flex flex-col gap-2">
          <button type="button" (click)="toggleDocAlertsExpanded()"
                  class="w-full rounded-xl border-2 px-4 py-3.5 flex items-center justify-between gap-3 shadow-sm active:scale-[0.99] transition-all text-left"
                  [class.border-rose-500]="expiredArchiveDocCount() > 0"
                  [class.bg-rose-50]="expiredArchiveDocCount() > 0"
                  [class.text-rose-900]="expiredArchiveDocCount() > 0"
                  [class.border-violet-400]="expiredArchiveDocCount() === 0"
                  [class.bg-violet-50]="expiredArchiveDocCount() === 0"
                  [class.text-violet-900]="expiredArchiveDocCount() === 0"
                  [attr.aria-expanded]="docAlertsExpanded()">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border"
                   [class]="expiredArchiveDocCount() > 0 ? 'bg-rose-600 text-white border-rose-700' : 'bg-violet-600 text-white border-violet-700'">
                <i class="fa-solid fa-file-circle-exclamation text-lg"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-80">Archivio documentale</p>
                <p class="text-sm font-black leading-tight truncate">
                  @if (expiredArchiveDocCount() > 0) {
                    {{ expiredArchiveDocCount() }} documenti scaduti · {{ archiveDocExpiryAlerts().length }} in avviso
                  } @else {
                    {{ archiveDocExpiryAlerts().length }} documenti in scadenza (entro 7 giorni)
                  }
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="min-w-[1.5rem] h-6 px-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                {{ archiveDocExpiryAlerts().length }}
              </span>
              <i class="fa-solid fa-chevron-down text-sm transition-transform"
                 [class.rotate-180]="docAlertsExpanded()"></i>
            </div>
          </button>

          @if (docAlertsExpanded()) {
            <div class="w-full rounded-2xl border-2 border-violet-200 bg-white shadow-lg overflow-hidden animate-slide-up">
              <div class="px-4 py-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-widest text-violet-700">Archivio documentale</p>
                  <p class="text-sm font-black text-slate-800 truncate">
                    @if (expiredArchiveDocCount() > 0) {
                      {{ expiredArchiveDocCount() }} scaduti · {{ archiveDocExpiryAlerts().length }} in avviso
                    } @else {
                      {{ archiveDocExpiryAlerts().length }} documenti in scadenza (7 gg)
                    }
                  </p>
                </div>
                <button type="button" (click)="docAlertsExpanded.set(false)" class="text-slate-400 hover:text-slate-600 p-2">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              <ul class="divide-y divide-slate-100 max-h-[min(50vh,20rem)] overflow-y-auto custom-scrollbar">
                @for (doc of archiveDocExpiryAlerts(); track doc.id) {
                  @let days = expiryDaysForDoc(doc);
                  @let sev = expirySeverityForDoc(doc);
                  <li class="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 truncate">{{ getArchiveDocTitle(doc) }}</p>
                      <p class="text-[10px] font-bold text-slate-500">
                        {{ getArchiveDocCategory(doc) }} · Scadenza {{ doc.expiryDate | date:'dd/MM/yyyy' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span [class]="'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ' +
                          (sev === 'expired' ? 'bg-rose-100 text-rose-700' :
                           sev === 'urgent' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800')">
                        @if (days < 0) { Scaduto } @else if (days === 0) { Oggi } @else { Tra {{ days }} gg }
                      </span>
                      <button type="button" (click)="openArchiveDocument(doc)"
                              class="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-widest">
                        Apri
                      </button>
                    </div>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }

      <!-- OPERATIONAL GRID - EXTREMELY RESPONSIVE -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        @for (action of visibleQuickActions(); track action.id + action.label) {
            <button (click)="action.id === 'abbattimento-log' && !state.hasAbbattitore() ? null : state.setModule(action.id)"
                    [disabled]="action.id === 'abbattimento-log' && !state.hasAbbattitore()"
                    [class]="'group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 text-center flex flex-col items-center justify-center gap-4 active:scale-95 h-full ' + (action.id === 'abbattimento-log' && !state.hasAbbattitore() ? 'opacity-40 cursor-not-allowed filter grayscale' : '')">
                <div [class]="'h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg ' + action.bg + ' ' + action.color">
                    <i class="fa-solid {{ action.icon }} text-2xl"></i>
                </div>
                <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">{{ action.label }}</h4>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{{ action.sub }}</p>
                </div>
                <!-- Mini status dot -->
                <div class="absolute top-4 right-4 h-2 w-2 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
            </button>
        }
      </div>

      <!-- MIDDLE ROW: ANOMALIES & MESSAGES -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- ANOMALIES SECTION (5 cols on large) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
            <!-- ANOMALY CARD -->
            <div class="bg-white rounded-[2rem] p-8 border border-red-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 h-24 w-24 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100/50 transition-all"></div>
                
                <div class="flex items-center justify-between mb-8 relative z-10">
                    <div class="flex items-center gap-4">
                        <div class="h-14 w-14 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200 animate-pulse">
                            <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-slate-800 tracking-tight">Segnala Anomalia</h3>
                            <p class="text-xs font-bold text-red-500 uppercase tracking-widest">Gestione Non Conformità</p>
                        </div>
                    </div>
                    <button (click)="state.setModule('non-compliance')" class="h-10 w-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-100">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

                <!-- PREVIEW OF OPEN ANOMALIES -->
                <div class="flex-1 space-y-3 relative z-10">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Ultime Segnalazioni</h4>
                    @for (nc of openAnomalies().slice(0, 2); track nc.id) {
                        <div (click)="state.setModule('non-compliance')" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-red-200 transition-all cursor-pointer group/item">
                            <div class="flex justify-between items-start gap-3">
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs font-black text-slate-800 truncate mb-1">{{ nc.itemName || 'Anomalia Generica' }}</p>
                                    <p class="text-[10px] text-slate-500 line-clamp-1 italic">"{{ nc.description }}"</p>
                                </div>
                                <span class="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">Aperta</span>
                            </div>
                        </div>
                    } @empty {
                        <div class="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <i class="fa-solid fa-circle-check text-slate-200 text-3xl mb-2"></i>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nessuna anomalia aperta</p>
                        </div>
                    }
                </div>

                <button (click)="state.setModule('non-compliance')" class="w-full mt-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl text-[11px] shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
                    + Nuova Segnalazione
                </button>
            </div>
        </div>

        <!-- MESSAGES -->
        <div class="lg:col-span-7 space-y-6">
            <div class="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-4">
                        <div class="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <i class="fa-solid fa-comments text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-slate-800 tracking-tight">Comunicazioni</h3>
                            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Messaggi dalla Direzione</p>
                        </div>
                    </div>
                    @if (state.unreadMessagesCount() > 0) {
                        <span class="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-blue-200">{{ state.unreadMessagesCount() }} NUOVI</span>
                    }
                </div>

                <div class="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    @for (msg of state.getMessagesForCurrentUser().slice(0, 4); track msg.id) {
                        <div (click)="state.setModule('messages')" class="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group/msg">
                            <div class="flex items-start gap-4">
                                <div class="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover/msg:border-blue-300">
                                    <i class="fa-solid fa-user-tie text-slate-400 group-hover/msg:text-blue-500"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex justify-between items-center mb-1">
                                        <h5 class="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{{ msg.subject }}</h5>
                                        <span class="text-[9px] font-bold text-slate-400">{{ msg.timestamp | date:'HH:mm' }}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-500 line-clamp-1 italic leading-relaxed">"{{ msg.content }}"</p>
                                </div>
                            </div>
                        </div>
                    } @empty {
                        <div class="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                            <i class="fa-regular fa-envelope-open text-5xl mb-4 opacity-20"></i>
                            <p class="text-xs font-black uppercase tracking-[0.2em]">Nessuna comunicazione</p>
                        </div>
                    }
                </div>
            </div>
        </div>
      </div>

      <!-- ===== PREMIUM PAYMENT MODAL ===== -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="showPaymentModal.set(false)"></div>
            
            <!-- Modal Card -->
            <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                <div class="p-6 bg-slate-900 text-white flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <i class="fa-solid fa-credit-card text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-black tracking-tight">Abbonamento e Pagamenti</h3>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scegli il metodo che preferisci</p>
                        </div>
                    </div>
                    <button (click)="showPaymentModal.set(false)" class="text-slate-400 hover:text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    <!-- IBAN Bank Transfer option (always available if configured) -->
                    @if (state.adminCompany().iban) {
                        <div class="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <i class="fa-solid fa-building-columns"></i> Bonifico Bancario
                                </span>
                                <span class="bg-indigo-100 text-indigo-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Nessuna commissione</span>
                            </div>
                            <div class="space-y-1.5 text-xs text-slate-700">
                                <p class="font-medium"><b>Beneficiario:</b> {{ state.adminCompany().name }}</p>
                                <p class="font-medium"><b>IBAN:</b> <span class="font-mono font-bold select-all bg-white border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-800">{{ state.adminCompany().iban }}</span></p>
                                <p class="font-medium"><b>Causale:</b> <span class="font-mono bg-white border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-800">Abbonamento HACCP PRO - {{ state.companyConfig().name }}</span></p>
                            </div>
                        </div>
                    } @else {
                        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-500">
                            <i class="fa-solid fa-circle-info text-slate-400 text-lg"></i>
                            <span class="text-xs font-medium">Nessuna coordinata bancaria configurata dall'amministrazione. Puoi utilizzare i canali digitali sottostanti.</span>
                        </div>
                    }

                    <!-- Digital payment links -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        @if (state.adminCompany().paypalUrl) {
                            <a [href]="state.adminCompany().paypalUrl" target="_blank"
                               class="flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-2xl transition-all group shadow-sm">
                                <div class="flex items-center gap-3">
                                    <div class="h-10 w-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                        <i class="fa-brands fa-paypal text-lg"></i>
                                    </div>
                                    <div class="text-left">
                                        <span class="block text-xs font-black text-slate-800 leading-tight">PayPal</span>
                                        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rapido e sicuro</span>
                                    </div>
                                </div>
                                <i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400 group-hover:text-blue-600 transition-colors mr-1"></i>
                            </a>
                        }

                        @if (state.adminCompany().stripeUrl) {
                            <a [href]="state.adminCompany().stripeUrl" target="_blank"
                               class="flex items-center justify-between p-4 bg-violet-50/50 hover:bg-violet-50 border border-violet-100 hover:border-violet-300 rounded-2xl transition-all group shadow-sm">
                                <div class="flex items-center gap-3">
                                    <div class="h-10 w-10 rounded-xl bg-white border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm shrink-0">
                                        <i class="fa-brands fa-stripe-s text-lg"></i>
                                    </div>
                                    <div class="text-left">
                                        <span class="block text-xs font-black text-slate-800 leading-tight">Stripe (Carta)</span>
                                        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attivazione immediata</span>
                                    </div>
                                </div>
                                <i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400 group-hover:text-violet-600 transition-colors mr-1"></i>
                            </a>
                        }
                    </div>

                    <!-- Notifica di conferma all'amministratore -->
                    <div class="border-t border-slate-100 pt-5 space-y-4">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-circle-info text-indigo-500 text-sm"></i>
                            <h4 class="text-xs font-black text-slate-700 uppercase tracking-widest">Invia Conferma Pagamento</h4>
                        </div>
                        <p class="text-[10px] text-slate-400 font-bold leading-normal uppercase">Compila questo modulo dopo aver effettuato il pagamento per notificare l'amministrazione ed accelerare l'elaborazione.</p>
                        
                        <div class="space-y-3">
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Metodo Utilizzato</label>
                                <select [(ngModel)]="paymentMethod" 
                                        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer">
                                    <option value="Bonifico Bancario">Bonifico Bancario</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Stripe">Stripe (Carta di Credito)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Note / Riferimento Transazione (Opzionale)</label>
                                <textarea [(ngModel)]="paymentNotes" 
                                          placeholder="Es. CRO bonifico, ID transazione o email utilizzata..." 
                                          rows="2"
                                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:font-normal"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button (click)="showPaymentModal.set(false)" 
                            class="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-sm">
                        Annulla
                    </button>
                    <button (click)="submitPaymentConfirmation()" 
                            class="flex-[1.5] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-md active:scale-95">
                        Invia Notifica
                    </button>
                </div>
            </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class OperatorDashboardViewComponent {
  state = inject(AppStateService);

  docAlertsExpanded = signal(false);

  archiveDocExpiryAlerts = computed(() =>
    this.state.filteredDocuments()
      .filter(d => isExpiryAlertActive(d))
      .sort((a, b) => daysUntilIsoDate(a.expiryDate!) - daysUntilIsoDate(b.expiryDate!))
  );

  expiredArchiveDocCount = computed(() =>
    this.archiveDocExpiryAlerts().filter(d => daysUntilIsoDate(d.expiryDate || '') < 0).length
  );

  toggleDocAlertsExpanded() {
    this.docAlertsExpanded.update(v => !v);
  }

  expiryDaysForDoc(doc: AppDocument): number {
    return daysUntilIsoDate(doc.expiryDate || '');
  }

  expirySeverityForDoc(doc: AppDocument) {
    return expiryAlertSeverity(doc);
  }

  getArchiveDocTitle(doc: AppDocument): string {
    const name = doc.fileName?.split('|')[0] || 'Documento';
    return name;
  }

  getArchiveDocCategory(doc: AppDocument): string {
    const labels: Record<string, string> = {
      scia: 'Scia e planimetria',
      camerale: 'Camerale',
      haccp_plan: 'Manuale HACCP',
      osa: 'Attestato OSA',
      generale: 'Generico'
    };
    return labels[doc.type] || doc.type?.replace(/_/g, ' ') || 'Archivio';
  }

  openArchiveDocument(doc: AppDocument) {
    this.state.openDocumentationArchive({ id: doc.id, type: doc.type });
  }

  showPaymentModal = signal(false);
  paymentMethod = 'Bonifico Bancario';
  paymentNotes = '';

  submitPaymentConfirmation() {
    this.state.sendPaymentNotification(this.paymentMethod, this.paymentNotes);
    this.showPaymentModal.set(false);
    this.paymentNotes = '';
  }

  private readonly phaseQuickActions = [
    { id: 'pre-op-checklist', label: 'Pre-Operativa', sub: 'Apertura', icon: 'fa-sun', color: 'text-sky-600', bg: 'bg-sky-50' },
    { id: 'operative-checklist', label: 'Operativa', sub: 'Monitoraggio', icon: 'fa-briefcase', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'post-op-checklist', label: 'Post-Operativa', sub: 'Chiusura', icon: 'fa-moon', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  private readonly otherQuickActions = [
    { id: 'ddt-carico', label: 'Carico Merci', sub: 'DDT / Ricezione', icon: 'fa-truck-ramp-box', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'suppliers', label: 'Anagrafica Fornitori', sub: 'Collegamenti & DDT', icon: 'fa-link', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'preparations', label: 'Preparazioni', sub: 'Scheda Preparazione', icon: 'fa-mortar-pestle', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'production-log', label: 'Rintracciabilità', sub: 'Lotti / Produzione', icon: 'fa-barcode', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'ingredients-book', label: 'Libro Ingredienti', sub: 'Ricettario / Allergeni', icon: 'fa-book-open', color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'abbattimento-log', label: 'Abbattitore', sub: 'Registro Freddo', icon: 'fa-icicles', color: 'text-sky-600', bg: 'bg-sky-50' },
    { id: 'micro-bio', label: 'Monitoraggio Ambiente', sub: 'Analisi Biologiche', icon: 'fa-vial-virus', color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'cleaning-maintenance', label: 'Sanificazione', sub: 'Registro Pulizie', icon: 'fa-broom', color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'messages', label: 'Messaggistica', sub: 'Comunicazioni interne', icon: 'fa-comments', color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  visibleQuickActions = computed(() => {
    const config = this.state.operationalPhasesConfig();
    const phases = this.phaseQuickActions.filter(p => config?.[p.id]?.enabled !== false);
    return [...phases, ...this.otherQuickActions];
  });

  openAnomalies = computed(() => {
    return this.state.filteredNonConformities().filter(nc => nc.status !== 'CLOSED');
  });

  getCurrentDay(): string {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[new Date().getDay()];
  }

  getCurrentDayNumber(): number {
    return new Date().getDate();
  }

  getCurrentMonth(): string {
    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return months[new Date().getMonth()];
  }
}
