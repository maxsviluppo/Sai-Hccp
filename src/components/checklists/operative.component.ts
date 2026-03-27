import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
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
              <div class="flex justify-between mt-4 text-lg text-slate-500">
                 <span>Data: {{ getFormattedDate() }}</span>
                 <span>Operatore: {{ state.currentUser()?.name }}</span>
              </div>
           </div>

           <div class="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 class="text-lg font-bold uppercase mb-2 border-b border-slate-300 pb-1 text-slate-800">Informativa Libro Ingredienti</h3>
               <div class="space-y-1 text-[11px] font-bold text-slate-700">
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[10px] text-slate-400"></i> LIBRO INGREDIENTI: Denominazione alimento/preparazione</div>
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[10px] text-slate-400"></i> ELENCO INGREDIENTI CON il numero di lotto</div>
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[10px] text-slate-400"></i> Data di preparazione E Scadenza</div>
                 <div class="flex items-center gap-2"><i class="fa-solid fa-check text-[10px] text-slate-400"></i> Modalità di conservazione</div>
               </div>
           </div>

           <div class="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 class="text-lg font-bold uppercase mb-2 border-b border-slate-300 pb-1 text-rose-800">Informativa Sostanze Allergeniche (Reg. UE 1169/2011)</h3>
              <div class="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
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

           <table class="w-full text-left text-lg border-collapse">
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
                              <div class="text-xs text-slate-500 font-bold mt-0.5">Temperatura: {{ item.temperature }}°C</div>
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
        <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">        <!-- Sleek Professional Dashboard Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
            
            <div class="flex items-center gap-5 relative z-10">
                <div class="h-14 w-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
                    <i class="fa-solid fa-briefcase text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Fase Operativa</h2>
                    <div class="flex items-center gap-3 mt-1">
                        <span class="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            <i class="fa-solid fa-circle text-[8px] text-amber-500 animate-pulse"></i>
                            Monitoraggio Attivo
                        </span>
                        <span class="text-xs font-medium text-slate-400">|</span>
                        <span class="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <i class="fa-solid fa-user-check text-[10px]"></i> {{ state.currentUser()?.name }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-auto relative z-10">
                <div class="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex flex-col gap-2 min-w-[200px]">
                    <div class="flex items-center justify-between mb-0.5">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Completamento</p>
                        <span class="text-sm font-black text-slate-700 leading-none">{{ completedCount() }}/{{ items().length }}</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                             [style.width.%]="progressPercentage()"></div>
                    </div>
                </div>
            </div>
        </div>

            <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <!-- Left Column: Informative Sidebar -->
                <div class="xl:col-span-1 space-y-4">
                    <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                                <i class="fa-solid fa-calendar-day text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Data Competenza</label>
                                <input type="date" [value]="selectedDate()" (change)="selectedDate.set($any($event.target).value)" 
                                       class="w-full font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0 text-lg leading-none">
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl p-5 border border-rose-100 shadow-sm relative overflow-hidden">
                        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 to-rose-200"></div>
                        <h3 class="text-xs font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Allergeni (UE 1169)</span>
                            <i class="fa-solid fa-circle-exclamation opacity-70"></i>
                        </h3>
                        <div class="grid grid-cols-1 gap-y-1.5">
                            @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14]; track i) {
                                <div class="flex items-start gap-2 group hover:opacity-100 transition-opacity">
                                    <span class="text-[11px] font-bold w-4 h-4 rounded bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                                        {{ i }}
                                    </span>
                                    <span class="text-sm font-medium text-slate-600 leading-tight">
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

                    <div class="bg-white rounded-xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
                        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-200"></div>
                        <h3 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Libro Ingredienti</span>
                            <i class="fa-solid fa-book-open opacity-70"></i>
                        </h3>
                        <div class="space-y-3">
                            <div class="flex items-start gap-2">
                                <i class="fa-solid fa-check text-blue-400 text-xs mt-0.5"></i>
                                <p class="text-sm font-bold text-slate-600 uppercase tracking-widest">Lotto e Denominazione</p>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fa-solid fa-check text-blue-400 text-xs mt-0.5"></i>
                                <p class="text-sm font-bold text-slate-600 uppercase tracking-widest">Preparazione e Scadenza</p>
                            </div>
                            <div class="flex items-start gap-2 border-t border-blue-50 pt-2 mt-1">
                                <p class="text-xs font-medium text-slate-500 italic leading-relaxed">Assicurarsi che ogni preparato sia etichettato correttamente.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content: Checklists -->
                <div class="xl:col-span-3 space-y-8">
                    <div class="space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-4 px-2">
                            <h3 class="text-lg font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-boxes-packing text-indigo-500"></i>
                                Ricezione Merci
                            </h3>
                            <button (click)="setAllOk()" class="shrink-0 px-4 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-600 font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-50 transition-colors shadow-sm">
                                <i class="fa-solid fa-check-double mr-1.5"></i> IMPOSTA TUTTI OK
                            </button>
                        </div>

                        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div class="divide-y divide-slate-100">
                                @for (item of group1Items(); track item.id; let i = $index) {
                                    <ng-container *ngTemplateOutlet="checklistItemList; context: { $implicit: { ...item, index: i } }"></ng-container>
                                }
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex items-center gap-2 px-2">
                            <h3 class="text-lg font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-temperature-arrow-up text-indigo-500"></i>
                                Verifica Temperature e Conservazione
                            </h3>
                        </div>

                        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                <div class="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors hover:bg-slate-50 relative group/row animate-fade-in"
                     [class.bg-emerald-50/40]="item.status === 'ok'"
                     [class.bg-red-50/40]="item.status === 'issue'">
                    
                    <div class="flex items-center gap-3 flex-[2] min-w-0">
                        <span class="text-[11px] font-black w-5 h-5 rounded bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0 text-slate-400">
                            {{ $any(item).index + 1 }}
                        </span>
                        
                        <div class="w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors border"
                             [class.bg-slate-50]="item.status === 'pending'" [class.border-slate-200]="item.status === 'pending'" [class.text-slate-400]="item.status === 'pending'"
                             [class.bg-emerald-50]="item.status === 'ok'" [class.border-emerald-200]="item.status === 'ok'" [class.text-emerald-500]="item.status === 'ok'"
                             [class.bg-red-50]="item.status === 'issue'" [class.border-red-200]="item.status === 'issue'" [class.text-red-500]="item.status === 'issue'">
                            <i [class]="'fa-solid text-base ' + item.icon"></i>
                        </div>

                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-700 text-sm leading-tight group-hover/row:text-indigo-600 transition-colors">{{ item.label }}</h4>
                            @if (item.status !== 'pending') {
                                <span class="text-[10px] font-black uppercase tracking-widest mt-0.5 block"
                                      [class.text-emerald-500]="item.status === 'ok'"
                                      [class.text-red-500]="item.status === 'issue'">
                                    {{ item.status === 'ok' ? 'CONFORME' : 'NON CONFORME' }}
                                </span>
                            }
                        </div>
                    </div>

                    <div class="flex items-center gap-3 flex-1 justify-end shrink-0">
                        @if (item.hasTemperature) {
                            <div class="w-20 bg-white rounded border border-slate-200 px-2 flex items-center gap-1.5 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-shadow h-7 shadow-sm">
                                <i class="fa-solid fa-temperature-half text-[11px] text-slate-400"></i>
                                <input type="number" 
                                       [ngModel]="statusMap()[item.id]?.temperature"
                                       (ngModelChange)="updateTemperature(item.id, $event)"
                                       placeholder="°C"
                                       [disabled]="isSubmitted()"
                                       class="w-full font-bold text-slate-700 bg-transparent h-full focus:outline-none text-sm disabled:opacity-50">
                            </div>
                        }

                        <div class="flex items-center gap-1.5">
                            @if (item.status === 'pending') {
                                <button (click)="setStatus(item.id, 'ok')" 
                                        class="h-7 px-2.5 rounded bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-400 hover:text-emerald-500 transition-colors shadow-sm flex items-center justify-center">
                                    <i class="fa-solid fa-check text-xs"></i>
                                </button>
                                <button (click)="openIssueModal(item)" 
                                        class="h-7 px-2.5 rounded bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 transition-colors shadow-sm flex items-center justify-center">
                                    <i class="fa-solid fa-triangle-exclamation text-xs"></i>
                                </button>
                            } @else {
                                <button (click)="setStatus(item.id, 'pending')" 
                                        class="h-7 px-2.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-widest transition-colors border border-slate-200">
                                    <i class="fa-solid fa-rotate-left"></i>
                                </button>
                            }
                        </div>
                    </div>

                    @if (item.status === 'issue' && item.note) {
                        <div class="w-full md:w-auto mt-2 md:mt-0 text-xs text-red-600 font-medium italic bg-red-50 px-3 py-1.5 rounded border border-red-100 md:col-span-2">
                             Nota: {{ item.note }}
                        </div>
                    }
                </div>
            </ng-template>

            <!-- Fixed Footer Actions -->
            <div class="fixed bottom-6 right-6 z-50">
                @if (!isSubmitted()) {
                    <button (click)="submitChecklist()" [disabled]="!isAllCompleted()"
                            class="h-12 px-6 bg-slate-900 border border-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-3 disabled:opacity-50 hover:bg-slate-800 hover:shadow-xl group">
                        <span>REGISTRA OPERAZIONI</span>
                        <div class="w-px h-4 bg-white/20"></div>
                        <i class="fa-solid fa-cloud-arrow-up group-hover:-translate-y-0.5 transition-transform"></i>
                    </button>
                } @else {
                    <div class="bg-white p-2 rounded-xl shadow-xl flex items-center gap-2 border border-slate-200 animate-slide-up">
                        <div class="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center gap-2">
                            <i class="fa-solid" [class.fa-check]="!hasIssues()" [class.fa-triangle-exclamation]="hasIssues()"></i>
                            <span class="font-bold text-xs uppercase tracking-widest">{{ hasIssues() ? 'NON CONFORME' : 'REGISTRATO' }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 px-2">
                            <button (click)="printReport()" class="h-8 w-8 rounded text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:text-indigo-600 flex items-center justify-center transition-colors" title="Stampa"><i class="fa-solid fa-print text-base"></i></button>
                        </div>
                        <div class="w-px h-6 bg-slate-200"></div>
                        <button (click)="startNewChecklist()" class="h-8 px-4 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors">
                            <i class="fa-solid fa-plus text-base"></i> NUOVA
                        </button>
                    </div>
                }
            </div>

            <!-- Issue Modal -->
            @if (isModalOpen()) {
               <div class="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeModal()"></div>
                  <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up border border-slate-200 flex flex-col">
                     <!-- Header -->
                     <div class="p-6 bg-red-50 border-b border-red-100 text-center">
                        <div class="w-12 h-12 rounded border border-red-200 bg-white text-red-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
                           <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 tracking-tight mb-1">Anomalia Riscontrata</h3>
                        <p class="text-base text-red-600 font-medium italic leading-snug">{{ currentItem()?.label }}</p>
                     </div>
                     <!-- Body -->
                     <div class="p-6 space-y-4">
                        <textarea #issueInput class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:outline-none h-32 transition-colors text-lg resize-none custom-scrollbar" placeholder="Descrivi brevemente l'anomalia..."></textarea>
                        
                        <div class="flex gap-3">
                           <button class="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold uppercase tracking-widest rounded-lg text-xs hover:bg-slate-100 transition-colors" (click)="closeModal()">Annulla</button>
                           <button class="flex-1 py-2 bg-red-600 border border-red-700 text-white font-bold uppercase tracking-widest rounded-lg text-xs shadow-sm hover:bg-red-700 transition-colors" (click)="confirmIssue(issueInput.value)">Salva Anomalia</button>
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
   selectedDate = signal(this.state.filterDate());
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
         untracked(() => this.loadByDate());
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
         const type = (eq as any).type || 'Altro';
         const nameLower = eq.name.toLowerCase();
         const isCold = type === 'Freddo' || 
                        nameLower.includes('frigo') || 
                        nameLower.includes('congelatore') || 
                        nameLower.includes('cella');
         const isHot = type === 'Caldo' || 
                       nameLower.includes('forno') || 
                       nameLower.includes('cottura');

         let icon = 'fa-microchip';
         if (isCold) icon = 'fa-snowflake';
         if (isHot) icon = 'fa-fire';
         if (nameLower.includes('congelatore')) icon = 'fa-icicles';
         if (nameLower.includes('lavello')) icon = 'fa-sink';

         list.push({
            id: `eq-${eq.id}`,
            label: `${eq.name}`,
            icon: icon,
            status: s[`eq-${eq.id}`]?.status || 'pending',
            note: s[`eq-${eq.id}`]?.note,
            temperature: s[`eq-${eq.id}`]?.temperature,
            hasTemperature: isCold || isHot
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
      this.autoSave();
   }

   updateTemperature(id: string, temperature: string) {
      this.statusMap.update(map => ({
         ...map,
         [id]: { ...map[id], temperature, status: map[id]?.status || 'ok' }
      }));
      this.autoSave();
   }

   setAllOk() {
      const newMap: Record<string, any> = {};
      this.items().forEach(i => {
         const current = this.statusMap()[i.id];
         newMap[i.id] = { 
            status: 'ok', 
            temperature: current?.temperature,
            note: undefined
         };
      });
      this.statusMap.set(newMap);
      this.autoSave();
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
         this.autoSave();

         // Segnalazione amministratore
         this.state.saveNonConformity({
            id: Math.random().toString(36).substring(2, 9),
            moduleId: 'operative-checklist',
            date: this.selectedDate(),
            description: note || 'Anomalia riscontrata durante il controllo operativo',
            itemName: this.currentItem()?.label
         });
         
         this.toast.info('Anomalia Salvata', 'La non conformità è stata registrata e segnalata.');
      }
      this.closeModal();
   }

    private autoSave() {
        this.state.saveRecord('operative-checklist', {
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
        });
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
      this.selectedDate.set(this.state.filterDate());
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
         this.selectedDate.set(this.state.filterDate());
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
