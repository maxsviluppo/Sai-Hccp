import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface ChecklistItem {
   id: string;
   label: string;
   icon: string;
   status: 'pending' | 'ok' | 'issue';
   note?: string;
   temperature?: string;
   hasTemperature?: boolean;
}

@Component({
   selector: 'app-operative-checklist',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <!-- PRINT ONLY HEADER (HACCP Requirement) -->
        <div class="hidden print:block font-sans text-black p-4">
           <div class="border-b-2 border-slate-800 pb-4 mb-6 text-center">
              <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
              <h2 class="text-xl font-light text-slate-600">Registro Fase Operativa</h2>
              <div class="flex justify-between mt-4 text-sm text-slate-500">
                 <span>Data: {{ getFormattedDate() }}</span>
                 <span>Operatore: {{ state.currentUser()?.name }}</span>
              </div>
           </div>

           <div class="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 class="text-sm font-bold uppercase mb-2 border-b border-slate-300 pb-1 text-slate-800">Informativa Libro Ingredienti</h3>
               <div class="space-y-1 text-[9px] font-bold text-slate-700">
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[8px] text-slate-400"></i> LIBRO INGREDIENTI: Denominazione alimento/preparazione</div>
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[8px] text-slate-400"></i> ELENCO INGREDIENTI CON il numero di lotto</div>
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[8px] text-slate-400"></i> Data di preparazione E Scadenza</div>
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[8px] text-slate-400"></i> Modalità di conservazione</div>
               </div>
           </div>

           <div class="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 class="text-sm font-bold uppercase mb-2 border-b border-slate-300 pb-1 text-rose-800">Informativa Sostanze Allergeniche (Reg. UE 1169/2011)</h3>
              <div class="grid grid-cols-2 gap-x-8 gap-y-1 text-[9px]">
                 <div>1. Cereali contenenti glutine</div>
                 <div>2. Crostacei e derivati</div>
                 <div>3. Uova e derivati</div>
                 <div>4. Pesce e derivati</div>
                 <div>5. Arachidi e derivati</div>
                 <div>6. Soia e derivati</div>
                 <div>7. Latte e derivati</div>
                 <div>8. Frutta a guscio</div>
                 <div>9. Sedano e derivati</div>
                 <div>10. Senape e derivati</div>
                 <div>11. Semi di sesamo e derivati</div>
                 <div>12. Anidride solforosa e solfiti</div>
                 <div>13. Lupini e derivati</div>
                 <div>14. Molluschi e derivati</div>
              </div>
           </div>

           <table class="w-full text-left text-sm border-collapse">
              <thead>
                 <tr class="border-b border-slate-400 bg-slate-50">
                    <th class="py-2 px-3 font-bold">Controllo</th>
                    <th class="py-2 px-3 font-bold">Esito</th>
                    <th class="py-2 px-3 font-bold">Note</th>
                 </tr>
              </thead>
              <tbody>
                 @for (item of items(); track item.id) {
                     <tr class="border-b border-slate-100">
                        <td class="py-3 px-3">
                           <div class="font-medium">{{ item.label }}</div>
                           @if (item.temperature) {
                              <div class="text-[10px] text-slate-500 font-bold mt-0.5">Temperatura: {{ item.temperature }}°C</div>
                           }
                        </td>
                        <td class="py-3 px-3 font-bold uppercase">
                           {{ item.status === 'ok' ? 'Conforme' : (item.status === 'issue' ? 'Non Conforme' : 'N.E.') }}
                        </td>
                        <td class="py-3 px-3 italic">{{ item.note || '-' }}</td>
                     </tr>
                 }
              </tbody>
           </table>
        </div>

        <!-- UI CONTENT (Hidden on print) -->
        <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
            <!-- Premium Hero Header -->
            <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
                <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-600/15 blur-3xl"></div>
                <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl"></div>
                
                <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div class="flex items-center gap-5">
                        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                            <i class="fa-solid fa-briefcase text-3xl text-white"></i>
                        </div>
                        <div>
                            <div class="flex flex-wrap items-center gap-3 mb-1">
                                <h2 class="text-4xl font-black tracking-tight text-white font-outfit">Fase <span class="text-indigo-400">Operativa</span></h2>
                                <button (click)="state.setModule('production-log')" 
                                        class="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10">
                                    <i class="fa-solid fa-barcode text-indigo-400"></i> Rintracciabilità
                                </button>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10">
                                    <i class="fa-solid fa-circle text-[9px] animate-pulse text-amber-400"></i>
                                    Monitoraggio Attivo
                                </span>
                                <span class="flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-black text-indigo-400 border border-indigo-500/20">
                                    <i class="fa-solid fa-user-check text-xs"></i> {{ state.currentUser()?.name }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <div class="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                            <div class="text-left">
                                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Completamento</p>
                                <div class="flex items-center gap-3">
                                    <div class="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" [style.width.%]="progressPercentage()"></div>
                                    </div>
                                    <span class="text-xl font-black text-white whitespace-nowrap">{{ completedCount() }} / {{ items().length }}</span>
                                </div>
                            </div>
                            <div class="h-10 w-10 flex items-center justify-center bg-indigo-500/20 rounded-xl text-indigo-400">
                                <i class="fa-solid fa-chart-pie text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <!-- Left Column: Informative Sidebar -->
                <div class="xl:col-span-1 space-y-8">
                    <div class="bg-white rounded-2xl p-5 relative overflow-hidden group border border-slate-100 shadow-sm">
                        <div class="flex items-center gap-4">
                            <div class="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                <i class="fa-solid fa-calendar-day"></i>
                            </div>
                            <div class="flex-1">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Data Competenza</label>
                                <input type="date" [value]="selectedDate()" (change)="selectedDate.set($any($event.target).value)" 
                                       class="w-full font-black text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0 text-lg leading-none">
                            </div>
                        </div>
                    </div>

                    <div class="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-rose-100 bg-rose-50/10 shadow-sm">
                        <h3 class="text-base font-black text-rose-800 uppercase tracking-widest mb-6 flex items-center justify-between">
                            <span>Allergeni (UE 1169)</span>
                            <i class="fa-solid fa-circle-exclamation"></i>
                        </h3>
                        <div class="grid grid-cols-1 gap-y-3">
                            @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14]; track i) {
                                <div class="flex items-start gap-2.5 opacity-80 group hover:opacity-100 transition-opacity">
                                    <span class="text-xs font-black w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                                        {{ i }}
                                    </span>
                                    <span class="text-sm font-bold text-slate-600 leading-tight italic">
                                        {{ i === 1 ? 'Cereali con glutine' : 
                                           i === 2 ? 'Crostacei' : 
                                           i === 3 ? 'Uova' : 
                                           i === 4 ? 'Pesce' : 
                                           i === 5 ? 'Arachidi' :
                                           i === 6 ? 'Soia' : 
                                           i === 7 ? 'Latte' : 
                                           i === 8 ? 'Frutta a guscio' : 
                                           i === 9 ? 'Sedano' : 
                                           i === 10 ? 'Senape' : 
                                           i === 11 ? 'Sesamo' : 
                                           i === 12 ? 'Anidride solforosa' : 
                                           i === 13 ? 'Lupini' : 'Molluschi' }}
                                    </span>
                                </div>
                            }
                        </div>
                    </div>

                    <div class="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 bg-blue-50/10 border border-blue-100 shadow-sm">
                        <h3 class="text-base font-black text-blue-800 uppercase tracking-widest mb-6 flex items-center justify-between">
                            <span>Libro Ingredienti</span>
                            <i class="fa-solid fa-book-open"></i>
                        </h3>
                        <div class="space-y-5">
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-check text-blue-500 text-sm mt-1"></i>
                                <p class="text-sm font-bold text-slate-600 uppercase tracking-[0.05em]">Lotto e Denominazione</p>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-check text-blue-500 text-sm mt-1"></i>
                                <p class="text-sm font-bold text-slate-600 uppercase tracking-[0.05em]">Preparazione e Scadenza</p>
                            </div>
                            <div class="flex items-start gap-3 border-t border-blue-50 pt-4">
                                <p class="text-xs font-medium text-blue-600 italic leading-relaxed">Assicurarsi che ogni preparato sia etichettato correttamente.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content: Checklists -->
                <div class="xl:col-span-3 space-y-12">
                    <div class="space-y-6">
                        <div class="flex flex-wrap items-center justify-between gap-4 px-4">
                            <div class="flex items-center gap-4">
                                <div class="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
                                <h3 class="text-xl font-black text-slate-800 uppercase tracking-widest">Ricezione Merci</h3>
                            </div>
                            <button (click)="setAllOk()" class="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100">
                                IMPOSTA TUTTI OK
                            </button>
                        </div>

                        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div class="divide-y divide-slate-100">
                                @for (item of group1Items(); track item.id; let i = $index) {
                                    <ng-container *ngTemplateOutlet="checklistItemList; context: { $implicit: { ...item, index: i } }"></ng-container>
                                }
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="flex items-center gap-4 px-4">
                            <div class="h-8 w-1.5 bg-purple-600 rounded-full"></div>
                            <h3 class="text-xl font-black text-slate-800 uppercase tracking-widest">Verifica Temperature e Conservazione</h3>
                        </div>

                        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div class="divide-y divide-slate-100">
                                @for (item of group2Items(); track item.id; let i = $index) {
                                    <ng-container *ngTemplateOutlet="checklistItemList; context: { $implicit: { ...item, index: i + group1Items().length } }"></ng-container>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- REUSABLE LIST TEMPLATE -->
            <ng-template #checklistItemList let-item>
                <div class="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50 relative group/row animate-fade-in"
                     [class.bg-emerald-50/40]="item.status === 'ok'"
                     [class.bg-red-50/40]="item.status === 'issue'">
                    
                    <div class="flex items-center gap-4 flex-[2] min-w-0">
                        <span class="text-[9px] font-black w-5 h-5 rounded bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0 leading-none text-slate-400">
                            {{ $any(item).index + 1 }}
                        </span>
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shadow-inner shrink-0"
                             [class.bg-slate-100]="item.status === 'pending'" [class.text-slate-400]="item.status === 'pending'"
                             [class.bg-emerald-100]="item.status === 'ok'" [class.text-emerald-600]="item.status === 'ok'"
                             [class.bg-red-100]="item.status === 'issue'" [class.text-red-600]="item.status === 'issue'">
                            <i [class]="'fa-solid ' + item.icon"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-800 text-sm leading-tight group-hover/row:text-indigo-600 transition-colors truncate">{{ item.label }}</h4>
                            @if (item.status !== 'pending') {
                                <span class="text-[9px] font-black uppercase tracking-widest mt-0.5 block"
                                      [class.text-emerald-600]="item.status === 'ok'"
                                      [class.text-red-600]="item.status === 'issue'">
                                    {{ item.status === 'ok' ? 'CONFORME' : 'NON CONFORME' }}
                                </span>
                            }
                        </div>
                    </div>

                    <div class="flex items-center gap-4 flex-1 justify-end">
                        @if (item.hasTemperature) {
                            <div class="w-24 bg-slate-50 rounded-lg border border-slate-200 px-2 py-1 flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20">
                                <i class="fa-solid fa-temperature-half text-[10px] text-indigo-400"></i>
                                <input type="number" 
                                       [ngModel]="statusMap()[item.id]?.temperature"
                                       (ngModelChange)="updateTemperature(item.id, $event)"
                                       placeholder="°C"
                                       [disabled]="isSubmitted()"
                                       class="w-full font-black text-slate-800 bg-transparent h-5 focus:outline-none text-xs disabled:opacity-50">
                            </div>
                        }

                        <div class="flex items-center gap-1.5">
                            @if (item.status === 'pending') {
                                <button (click)="setStatus(item.id, 'ok')" 
                                        class="w-9 h-9 rounded-full bg-white border border-emerald-200 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                                    <i class="fa-solid fa-check text-xs"></i>
                                </button>
                                <button (click)="openIssueModal(item)" 
                                        class="w-9 h-9 rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                                    <i class="fa-solid fa-triangle-exclamation text-xs"></i>
                                </button>
                            } @else {
                                <button (click)="setStatus(item.id, 'pending')" 
                                        class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all border border-slate-200">
                                    RESET
                                </button>
                            }
                        </div>
                    </div>

                    @if (item.status === 'issue' && item.note) {
                        <div class="w-full mt-2 text-[10px] text-red-600 font-bold italic bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                             Nota: {{ item.note }}
                        </div>
                    }
                </div>
            </ng-template>

            <!-- Fixed Footer Actions -->
            <div class="fixed bottom-6 right-6 z-50">
                @if (!isSubmitted()) {
                    <button (click)="submitChecklist()" [disabled]="!isAllCompleted()"
                            class="h-16 px-10 bg-slate-900 border-b-4 border-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-4 disabled:opacity-40 disabled:grayscale group hover:bg-emerald-600 hover:border-emerald-700">
                        <div class="flex flex-col items-end">
                            <span class="text-[8px] opacity-60 font-bold tracking-widest group-hover:opacity-100 transition-opacity uppercase">Fase Operativa</span>
                            <span class="text-xs">REGISTRA OPERAZIONI</span>
                        </div>
                        <div class="w-px h-6 bg-white/20"></div>
                        <i class="fa-solid fa-cloud-arrow-up text-xl group-hover:scale-110 transition-transform"></i>
                    </button>
                } @else {
                    <div class="bg-white/80 backdrop-blur-xl p-3 rounded-[3.5rem] shadow-2xl flex items-center gap-3 border border-white animate-slide-up">
                        <div class="px-8 py-5 bg-emerald-500 text-white rounded-[2.5rem] flex items-center gap-4">
                            <i class="fa-solid text-xl" [class.fa-check]="!hasIssues()" [class.fa-triangle-exclamation]="hasIssues()"></i>
                            <span class="font-black text-sm uppercase text-white">{{ hasIssues() ? 'NON CONFORME' : 'CONFORME' }}</span>
                        </div>
                        <div class="flex items-center gap-2 px-3">
                            <button (click)="printReport()" class="h-14 w-14 rounded-full bg-slate-50 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all shadow-sm" title="Stampa"><i class="fa-solid fa-print text-lg"></i></button>
                            <button (click)="sendEmail()" class="h-14 w-14 rounded-full bg-slate-50 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all shadow-sm" title="Email"><i class="fa-solid fa-envelope text-lg"></i></button>
                        </div>
                        <div class="w-px h-12 bg-slate-100 mx-2"></div>
                        <button (click)="startNewChecklist()" class="h-16 px-10 rounded-[2.5rem] bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-4 font-black text-sm uppercase tracking-[0.15em] transition-all"><i class="fa-solid fa-rotate-right text-lg"></i> NUOVA</button>
                    </div>
                }
            </div>

            <!-- Issue Modal -->
            @if (isModalOpen()) {
               <div class="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeModal()"></div>
                  <div class="relative w-full max-w-sm bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
                     <div class="p-10 text-center bg-red-50/50">
                        <div class="w-24 h-24 rounded-[2.5rem] bg-white text-red-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100"><i class="fa-solid fa-triangle-exclamation text-4xl"></i></div>
                        <h3 class="text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">Anomalia</h3>
                        <p class="text-base text-red-600 font-black leading-tight italic px-4">{{ currentItem()?.label }}</p>
                     </div>
                     <div class="p-10 space-y-5">
                        <textarea #issueInput class="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-red-500/10 focus:border-red-400 focus:outline-none h-48 transition-all font-bold text-lg" placeholder="Descrivi l'anomalia..."></textarea>
                        <div class="flex gap-4">
                           <button class="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl text-sm" (click)="closeModal()">Annulla</button>
                           <button class="flex-1 py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-200 text-sm" (click)="confirmIssue(issueInput.value)">Salva</button>
                        </div>
                     </div>
                  </div>
               </div>
            }
        </div>
  `,
   styles: [`
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .glass-card { 
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
  `]
})
export class OperativeChecklistComponent {
   state = inject(AppStateService);
   toast = inject(ToastService);

   isModalOpen = signal(false);
   currentItem = signal<ChecklistItem | null>(null);
   selectedDate = signal(new Date().toISOString().split('T')[0]);
   isSubmitted = signal(false);
   currentRecordId = signal<string | undefined>(undefined);

   statusMap = signal<Record<string, { status: ChecklistItem['status'], note?: string, temperature?: string }>>({});

   frigoCount = signal(0);
   congelatoreCount = signal(0);
   pozzettoCount = signal(0);

   constructor() {
      effect(() => {
         const record = this.state.recordToEdit();
         if (record && record.moduleId === 'operative-checklist') {
            this.loadRecord(record);
            setTimeout(() => this.state.completeEditing(), 100);
         }
      }, { allowSignalWrites: true });

      effect(() => {
         this.state.filterDate();
         this.loadByDate();
      }, { allowSignalWrites: true });
   }

   // GROUP 1: Ricezione Merci
   group1Items = computed(() => {
      const s = this.statusMap();
      return [
         { id: 'op-1', label: 'Ricezione merci, verificare aspetto imballi che siano privi di polvere e di ammaccature', icon: 'fa-box', status: s['op-1']?.status || 'pending', note: s['op-1']?.note },
         { id: 'op-2', label: 'Verifica il rispetto della catena del freddo dei prodotti in ricezione: temperatura da +4° a +8°C. Per i prodotti congelati ≤ -18°C. La catena del caldo deve avere la temperatura ≥ 65°C', icon: 'fa-temperature-low', status: s['op-2']?.status || 'pending', note: s['op-2']?.note }
      ];
   });

   // GROUP 2: Dynamic Machines (from Census) + Final Items
   group2Items = computed(() => {
      const s = this.statusMap();
      const list: ChecklistItem[] = [];
      const census = this.state.groupedEquipment();

      // For each equipment in census
      census.forEach(eq => {
         const nameLower = eq.name.toLowerCase();
         const isColdStorage = nameLower.includes('frigo') ||
            nameLower.includes('congelatore') ||
            nameLower.includes('cella') ||
            nameLower.includes('pozzetto');

         let icon = 'fa-microchip';
         if (nameLower.includes('congelatore')) {
            icon = 'fa-icicles';
         } else if (nameLower.includes('pozzetto')) {
            icon = 'fa-box-archive';
         } else if (isColdStorage) {
            icon = 'fa-snowflake';
         } else if (nameLower.includes('piano cottura') || nameLower.includes('forno') || nameLower.includes('griglie')) {
            icon = 'fa-fire';
         } else if (nameLower.includes('lavello')) {
            icon = 'fa-sink';
         }

         list.push({
            id: `eq-${eq.id}`,
            label: `${eq.name}`,
            icon: icon,
            status: s[`eq-${eq.id}`]?.status || 'pending',
            note: s[`eq-${eq.id}`]?.note,
            temperature: s[`eq-${eq.id}`]?.temperature,
            hasTemperature: isColdStorage
         });
      });

      // Final Required Items removed as per request
      return list;
   });

   items = computed(() => [...this.group1Items(), ...this.group2Items()]);

   completedCount = computed(() => this.items().filter(i => i.status !== 'pending').length);
   progressPercentage = computed(() => {
      const total = this.items().length;
      return total > 0 ? (this.completedCount() / total) * 100 : 0;
   });
   isAllCompleted = computed(() => this.items().length > 0 && this.items().every(i => i.status !== 'pending'));


   setStatus(id: string, status: ChecklistItem['status']) {
      this.statusMap.update(map => ({
         ...map,
         [id]: { ...map[id], status, note: status === 'ok' ? undefined : map[id]?.note }
      }));
   }

   updateTemperature(id: string, temperature: string) {
      this.statusMap.update(map => ({
         ...map,
         [id]: { ...map[id], temperature, status: map[id]?.status || 'ok' }
      }));
   }

   setAllOk() {
      const newMap: Record<string, any> = {};
      this.items().forEach(item => {
         newMap[item.id] = { ...this.statusMap()[item.id], status: 'ok' };
      });
      this.statusMap.set(newMap);
      this.toast.info('HACCP OK', 'Tutte le voci impostate come conformi.');
   }

   openIssueModal(item: ChecklistItem) {
      this.currentItem.set(item);
      this.isModalOpen.set(true);
   }

   closeModal() {
      this.isModalOpen.set(false);
      this.currentItem.set(null);
   }

   confirmIssue(note: string) {
      if (this.currentItem()) {
         const id = this.currentItem()!.id;
         this.statusMap.update(map => ({
            ...map,
            [id]: { ...map[id], status: 'issue', note: note || 'Anomalia riscontrata' }
         }));
      }
      this.closeModal();
   }

   submitChecklist() {
      const recordId = this.currentRecordId() || Math.random().toString(36).substring(2, 11);
      this.currentRecordId.set(recordId);

      this.state.saveChecklist({
         id: recordId,
         moduleId: 'operative-checklist',
         date: this.selectedDate(),
         data: {
            items: this.items().map(i => ({
               ...i,
               temperature: this.statusMap()[i.id]?.temperature
            })),
            counts: {
               frigo: this.frigoCount(),
               congelatore: this.congelatoreCount(),
               pozzetto: this.pozzettoCount()
            },
            timestamp: new Date()
         }
      });

      this.toast.success('Registro Inviato', 'I dati sono stati salvati correttamente.');
      this.isSubmitted.set(true);
   }

   startNewChecklist() {
      this.statusMap.set({});
      this.frigoCount.set(0);
      this.congelatoreCount.set(0);
      this.pozzettoCount.set(0);
      this.isSubmitted.set(false);
      this.currentRecordId.set(undefined);
      this.selectedDate.set(new Date().toISOString().split('T')[0]);
   }

   loadByDate() {
      const record = this.state.getRecord('operative-checklist');
      if (record) {
         this.loadRecord({ id: 'saved', date: this.state.filterDate(), data: record });
      } else {
         this.isSubmitted.set(false);
         this.statusMap.set({});
         this.frigoCount.set(0);
         this.congelatoreCount.set(0);
         this.pozzettoCount.set(0);
      }
   }

   loadRecord(record: any) {
      this.currentRecordId.set(record.id);
      this.selectedDate.set(record.date);
      const data = record.data;
      const counts = data.counts || { frigo: 0, congelatore: 0, pozzetto: 0 };
      this.frigoCount.set(counts.frigo);
      this.congelatoreCount.set(counts.congelatore);
      this.pozzettoCount.set(counts.pozzetto);

      const map: Record<string, any> = {};
      data.items?.forEach((item: any) => {
         map[item.id] = { status: item.status, note: item.note, temperature: item.temperature };
      });
      this.statusMap.set(map);
      this.isSubmitted.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }

   getFormattedDate() {
      const parts = this.selectedDate().split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : this.selectedDate();
   }

   hasIssues = computed(() => this.items().some(i => i.status === 'issue'));

   printReport() { window.print(); }
   sendEmail() { this.toast.success('Email Inviata', 'Report inviato alla sede.'); }
   sendInternalMessage() { this.toast.success('Inviato', 'Report inviato in chat.'); }
}
