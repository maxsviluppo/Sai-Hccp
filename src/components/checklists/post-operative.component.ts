import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface StepStatus {
    id: string; // pulizia, detersione, etc.
    label: string;
    icon: string;
    status: 'pending' | 'ok' | 'issue';
}

interface AreaChecklist {
    id: string;
    label: string;
    icon: string;
    steps: StepStatus[];
    expanded: boolean;
}

@Component({
    selector: 'app-post-operative-checklist',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- PRINT ONLY HEADER & TABLE -->
    <div class="hidden print:block font-sans text-black p-4">
        <div class="border-b-2 border-slate-800 pb-4 mb-6">
            <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
            <h2 class="text-xl font-light text-slate-600">Fase Post-operativa (Pulizia e Disinfezione)</h2>
            <div class="flex justify-between mt-4 text-sm text-slate-500">
                <span><span class="font-bold">Data:</span> {{ getFormattedDate() }}</span>
                <span><span class="font-bold">Operatore:</span> {{ state.currentUser()?.name || 'Operatore' }}</span>
            </div>
        </div>

        <table class="w-full text-left text-sm border-collapse">
            <thead>
                <tr class="border-b border-slate-400">
                    <th class="py-2 font-bold w-1/2">Area / Operazione</th>
                    <th class="py-2 font-bold w-1/4">Esito</th>
                    <th class="py-2 font-bold w-1/4">Note / Verifica</th>
                </tr>
            </thead>
            <tbody>
                @for (area of areas(); track area.id) {
                    <!-- Synthesized Area Row -->
                    <tr class="border-b border-slate-100 bg-slate-50/50">
                        <td class="py-2 pr-2 font-bold uppercase text-[11px]">{{ area.label }}</td>
                        <td class="py-2">
                            @if(getAreaStatusLabel(area.id) === 'Conforme') { 
                                <span class="font-bold text-emerald-800">CONFORME</span> 
                            } @else if(getAreaStatusLabel(area.id) === 'Rilevate Anomalie') { 
                                <span class="font-bold text-red-800">NON CONFORME</span> 
                            } @else { 
                                <span class="text-slate-400">NON ESEGUITO</span> 
                            }
                        </td>
                        <td class="py-2 italic text-slate-400 text-[10px]">
                            Verifica Area completata
                        </td>
                    </tr>
                    
                    <!-- Extended rows for NON CONFORME steps only -->
                    @for (step of area.steps; track step.id) {
                        @if(step.status === 'issue') {
                            <tr class="border-b border-slate-100 bg-red-50/30">
                                <td class="py-1 pl-6 pr-2 text-red-800 font-medium text-[10px]">
                                    <i class="fa-solid fa-triangle-exclamation mr-1 text-[8px]"></i>
                                    Dettaglio: {{ step.label }}
                                </td>
                                <td class="py-1 text-[10px] font-bold text-red-700">NON CONFORME</td>
                                <td class="py-1 italic text-red-600 text-[9px]">Azione correttiva richiesta</td>
                            </tr>
                        }
                    }
                }
            </tbody>
        </table>

        <div class="mt-8 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-400">
            <span>Documento generato da HACCP Pro</span>
            <span>Firma: ________________________</span>
        </div>
    </div>

    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative max-w-3xl mx-auto px-4">
        <!-- Enhanced UI Header (Hidden on print) -->
        <div class="print:hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 p-8 rounded-3xl shadow-xl border border-purple-500/30 relative overflow-hidden mb-8 mt-4">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <i class="fa-solid fa-hourglass-end text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                            <i class="fa-solid fa-hourglass-end text-white text-2xl"></i>
                        </div>
                        <div>
                            <h2 class="text-3xl font-black text-white">Fase Post-Operativa</h2>
                            <p class="text-purple-100 text-sm font-medium mt-1">Pulizia e disinfezione fine turno</p>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <!-- Progress Indicator -->
                        <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex-1 sm:flex-initial">
                            <div class="flex justify-between items-end mb-1.5">
                                <span class="text-[10px] text-purple-100 uppercase font-bold tracking-wider">Avanzamento</span>
                                <span class="text-sm font-black text-white">{{ completedStepsCount() }}/{{ totalStepsCount() }}</span>
                            </div>
                            <div class="w-40 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div class="h-full bg-white rounded-full transition-all duration-700"
                                    [style.width.%]="progressPercentage()"></div>
                            </div>
                        </div>

                        <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
                            <div class="text-left">
                                <div class="text-[10px] text-purple-100 uppercase font-bold tracking-wider">Stato</div>
                                <div class="text-sm font-bold text-white flex items-center">
                                    <i class="fa-solid fa-circle-check mr-2"></i> In Compilazione
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Date Selector & Quick Actions (Hidden on Print) -->
        <div class="print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between mx-auto max-w-3xl relative z-20 -mt-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <i class="fa-solid fa-calendar-check"></i>
                </div>
                <div>
                   <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Post-Operativa</label>
                   <input type="date" [value]="state.filterDate()" (change)="state.filterDate.set($any($event.target).value)" 
                          class="w-full font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0 text-base">
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Quick Set All Ok -->
                <button (click)="setAllOk()" 
                        class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100"
                        title="Imposta tutto come Conforme">
                   <i class="fa-solid fa-check-double"></i>
                </button>
            </div>
        </div>

        <!-- Areas Checklist Expansion Panels -->
        <div class="space-y-4 mb-24">
            @for (area of areas(); track area.id) {
                <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300"
                     [class.ring-2]="area.expanded" [class.ring-purple-500/20]="area.expanded">
                    
                    <!-- Header -->
                    <div class="p-5 flex items-center gap-4">
                        <div (click)="toggleArea(area.id)" class="flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors flex-1 -m-5 p-5 rounded-3xl">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-colors flex-shrink-0"
                                 [class.bg-purple-100]="isAreaComplete(area.id)"
                                 [class.text-purple-600]="isAreaComplete(area.id)"
                                 [class.bg-slate-100]="!isAreaComplete(area.id)"
                                 [class.text-slate-400]="!isAreaComplete(area.id)">
                                <i [class]="'fa-solid ' + area.icon"></i>
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <h3 class="font-black text-slate-800 text-lg">{{ area.label }}</h3>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter"
                                          [class.bg-emerald-100]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" 
                                          [class.text-emerald-700]="isAreaComplete(area.id) && !hasAreaIssues(area.id)"
                                          [class.bg-red-100]="hasAreaIssues(area.id)"
                                          [class.text-red-700]="hasAreaIssues(area.id)"
                                          [class.bg-slate-100]="!isAreaComplete(area.id)" 
                                          [class.text-slate-500]="!isAreaComplete(area.id)">
                                        {{ getAreaStatusLabel(area.id) }}
                                    </span>
                                    <span class="text-[10px] text-slate-400 font-medium">
                                        {{ getCompletedStepsInArea(area.id) }} di 5 completati
                                    </span>
                                </div>
                            </div>

                            <i class="fa-solid transition-transform duration-300 transform" 
                               [class.fa-chevron-down]="!area.expanded" 
                               [class.fa-chevron-up]="area.expanded"
                               [class.rotate-180]="area.expanded"></i>
                        </div>

                        <!-- Quick Action Buttons -->
                        <div class="flex gap-2 ml-2" (click)="$event.stopPropagation()">
                            <button (click)="setAllStepsInArea(area.id, 'ok')"
                                    class="w-10 h-10 rounded-full transition-all flex items-center justify-center border-2 shadow-sm hover:scale-110 active:scale-95"
                                    [class.bg-emerald-600]="hasAreaOk(area.id)" 
                                    [class.text-white]="hasAreaOk(area.id)"
                                    [class.border-emerald-500]="hasAreaOk(area.id)"
                                    [class.bg-white]="!hasAreaOk(area.id)"
                                    [class.text-emerald-600]="!hasAreaOk(area.id)"
                                    [class.border-emerald-300]="!hasAreaOk(area.id)"
                                    [class.hover:border-emerald-400]="!hasAreaOk(area.id)"
                                    title="Segna tutto come conforme">
                                <i class="fa-solid fa-check text-lg"></i>
                            </button>

                            <button (click)="setAllStepsInArea(area.id, 'issue')"
                                    class="w-10 h-10 rounded-full transition-all flex items-center justify-center border-2 shadow-sm hover:scale-110 active:scale-95"
                                    [class.bg-red-600]="hasAreaIssues(area.id)" 
                                    [class.text-white]="hasAreaIssues(area.id)"
                                    [class.border-red-500]="hasAreaIssues(area.id)"
                                    [class.bg-white]="!hasAreaIssues(area.id)"
                                    [class.text-red-600]="!hasAreaIssues(area.id)"
                                    [class.border-red-300]="!hasAreaIssues(area.id)"
                                    [class.hover:border-red-400]="!hasAreaIssues(area.id)"
                                    title="Segna tutto come non conforme">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Steps Content (Expanded) -->
                    @if (area.expanded) {
                        <div class="px-5 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50 animate-slide-down">
                            <div class="grid grid-cols-1 gap-3">
                                @for (step of area.steps; track step.id) {
                                    <div class="bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden relative shadow-sm"
                                         [class.border-slate-100]="step.status === 'pending'"
                                         [class.border-emerald-500]="step.status === 'ok'"
                                         [class.border-red-500]="step.status === 'issue'"
                                         [class.bg-emerald-50]="step.status === 'ok'"
                                         [class.bg-red-50]="step.status === 'issue'">
                                        
                                        <div class="p-4 flex items-center gap-4">
                                            <!-- Step Icon -->
                                            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors flex-shrink-0"
                                                 [class.bg-slate-100]="step.status === 'pending'"
                                                 [class.text-slate-400]="step.status === 'pending'"
                                                 [class.bg-emerald-100]="step.status === 'ok'"
                                                 [class.text-emerald-600]="step.status === 'ok'"
                                                 [class.bg-red-100]="step.status === 'issue'"
                                                 [class.text-red-600]="step.status === 'issue'">
                                                <i [class]="'fa-solid ' + step.icon"></i>
                                            </div>

                                            <!-- Step Label -->
                                            <div class="flex-1 min-w-0">
                                                <h4 class="font-bold text-slate-800 text-sm md:text-base"
                                                    [class.text-emerald-900]="step.status === 'ok'"
                                                    [class.text-red-900]="step.status === 'issue'">
                                                    {{ step.label }}
                                                </h4>
                                                <p class="text-[10px] uppercase tracking-wide font-bold mt-0.5"
                                                   [class.text-slate-400]="step.status === 'pending'"
                                                   [class.text-emerald-600]="step.status === 'ok'"
                                                   [class.text-red-600]="step.status === 'issue'">
                                                    @if(step.status === 'pending') { In Attesa }
                                                    @if(step.status === 'ok') { Conforme }
                                                    @if(step.status === 'issue') { Non Conforme }
                                                </p>
                                            </div>

                                            <!-- Action Buttons -->
                                            @if (step.status === 'pending') {
                                                <div class="flex gap-2">
                                                    <!-- OK Button -->
                                                    <button (click)="setStepStatus(area.id, step.id, 'ok')" 
                                                            class="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all active:scale-95 border border-slate-200">
                                                        <i class="fa-solid fa-check text-lg"></i>
                                                    </button>
                                                    <!-- KO Button -->
                                                    <button (click)="setStepStatus(area.id, step.id, 'issue')"
                                                            class="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all active:scale-95 border border-slate-200">
                                                        <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                                                    </button>
                                                </div>
                                            } @else {
                                                <!-- Undo Button if already set -->
                                                <button (click)="setStepStatus(area.id, step.id, 'pending')" 
                                                        class="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all border border-black/5 shadow-sm">
                                                    <i class="fa-solid fa-rotate-left text-xs"></i>
                                                </button>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </div>
            }
        </div>

        <!-- Footer Actions: Submit OR Post-Actions -->
        <div class="print:hidden fixed bottom-6 right-6 z-30 md:absolute md:bottom-0 md:right-0 md:relative md:mt-8 md:text-right w-full md:w-auto">
            
            @if (!isSubmitted()) {
                @if (isAllCompleted()) {
                    <button (click)="submitChecklist()" 
                            class="ml-auto bg-emerald-600 text-white rounded-2xl px-6 py-4 shadow-2xl shadow-emerald-500/40 font-bold text-lg flex items-center gap-3 hover:bg-emerald-700 hover:scale-105 transition-all animate-bounce-short">
                        <div>
                            <div class="leading-none text-[10px] uppercase opacity-80 text-left">Checklist Completa</div>
                            <div class="flex items-center">REGISTRA ORA <i class="fa-solid fa-check-double ml-2"></i></div>
                        </div>
                    </button>
                } @else {
                    <div class="bg-slate-800 text-white rounded-full px-5 py-3 shadow-lg text-xs font-bold opacity-80 backdrop-blur-md float-right">
                        {{ totalStepsCount() - completedStepsCount() }} Rimanenti
                    </div>
                }
            } @else {
                <!-- Post Submission Status (Moved Out) -->
                <div class="mb-4 flex justify-center animate-slide-up">
                    <div class="bg-white/90 backdrop-blur rounded-full px-6 py-2 shadow-lg border border-slate-200 flex items-center gap-3 select-none"
                         [class.border-emerald-500]="!hasIssues()"
                         [class.border-red-500]="hasIssues()">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-colors duration-300"
                             [class.bg-emerald-500]="!hasIssues()"
                             [class.bg-red-500]="hasIssues()">
                            @if(!hasIssues()) { <i class="fa-solid fa-check text-sm"></i> }
                            @else { <i class="fa-solid fa-triangle-exclamation text-sm"></i> }
                        </div>
                        <div class="font-bold uppercase text-sm"
                             [class.text-emerald-600]="!hasIssues()"
                             [class.text-red-600]="hasIssues()">
                             {{ hasIssues() ? 'Non Conforme' : 'Conforme' }}
                        </div>
                    </div>
                </div>

                <!-- Action Bar (Centered) -->
                <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-2xl shadow-2xl animate-slide-up mx-4 md:mx-0">
                    <div class="flex flex-wrap items-center justify-center gap-2">
                        <button (click)="submitChecklist()" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 border border-emerald-400/50 ring-2 ring-emerald-500/20">
                            <i class="fa-solid fa-floppy-disk"></i> Salva
                        </button>

                        <div class="w-px h-8 bg-white/20 mx-1 hidden sm:block"></div>

                        <button (click)="printReport()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" title="Stampa">
                            <i class="fa-solid fa-print text-white"></i> <span class="hidden sm:inline">Stampa</span>
                        </button>
                        <button (click)="sendEmail()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" title="Email">
                            <i class="fa-solid fa-envelope text-white"></i> <span class="hidden sm:inline">Email</span>
                        </button>
                        <button (click)="sendInternalMessage()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" title="Chat">
                            <i class="fa-solid fa-comments text-white"></i> <span class="hidden sm:inline">Chat</span>
                        </button>
                        
                        <div class="w-px h-8 bg-white/20 mx-1 hidden sm:block"></div>

                        <button (click)="startNewChecklist()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-purple-100 hover:text-white transition-colors border border-white/10 flex items-center justify-center gap-2 backdrop-blur-sm whitespace-nowrap" title="Nuova Compilazione">
                            <i class="fa-solid fa-rotate-right"></i> <span class="hidden sm:inline">Nuova</span>
                        </button>
                    </div>
                </div>
            }
        </div>

    </div>
    `,
    styles: [`
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { 
            from { transform: translateY(-10px); opacity: 0; max-height: 0; } 
            to { transform: translateY(0); opacity: 1; max-height: 1000px; } 
        }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .bg-grid-slate-700\/25 {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
    `]
})
export class PostOperationalChecklistComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    readonly stepDefinitions = [
        { id: 'pulizia', label: 'Pulizia', icon: 'fa-broom' },
        { id: 'detersione', label: 'Detersione', icon: 'fa-pump-soap' },
        { id: 'risciaquo1', label: 'Risciacquo', icon: 'fa-droplet' },
        { id: 'disinfezione', label: 'Disinfezione', icon: 'fa-spray-can' },
        { id: 'risciaquo2', label: 'Risciacquo finale', icon: 'fa-water' }
    ];

    staticAreas: AreaChecklist[] = [
        { id: 'cucina-sala', label: 'Cucina e Sala', icon: 'fa-utensils', steps: this.getInitialSteps(), expanded: true },
        { id: 'area-lavaggio', label: 'Area Lavaggio', icon: 'fa-sink', steps: this.getInitialSteps(), expanded: false },
        { id: 'deposito', label: 'Deposito', icon: 'fa-boxes-stacked', steps: this.getInitialSteps(), expanded: false },
        { id: 'spogliatoio', label: 'Spogliatoio', icon: 'fa-shirt', steps: this.getInitialSteps(), expanded: false },
        { id: 'antibagno-bagno-personale', label: 'Antibagno e Bagno Personale', icon: 'fa-restroom', steps: this.getInitialSteps(), expanded: false },
        { id: 'bagno-clienti', label: 'Bagno Clienti', icon: 'fa-people-arrows', steps: this.getInitialSteps(), expanded: false },
        { id: 'pavimenti', label: 'Pavimenti', icon: 'fa-table-cells', steps: this.getInitialSteps(), expanded: false },
        { id: 'pareti', label: 'Pareti', icon: 'fa-border-all', steps: this.getInitialSteps(), expanded: false },
        { id: 'soffitto', label: 'Soffitto', icon: 'fa-cloud', steps: this.getInitialSteps(), expanded: false },
        { id: 'infissi', label: 'Infissi', icon: 'fa-door-closed', steps: this.getInitialSteps(), expanded: false },
        { id: 'reti-antiintrusione', label: 'Reti Anti-intrusione', icon: 'fa-shield-cat', steps: this.getInitialSteps(), expanded: false },
    ];

    areas = signal<AreaChecklist[]>([]);

    isSubmitted = signal(false);
    currentRecordId = signal<string | null>(null);

    getInitialSteps(): StepStatus[] {
        return this.stepDefinitions.map(def => ({
            id: def.id,
            label: def.label,
            icon: def.icon,
            status: 'pending'
        }));
    }

    constructor() {
        effect(() => {
            // Re-load data when global filters change
            this.state.filterDate();
            this.state.filterCollaboratorId();
            this.state.currentUser();
            this.loadData();
        }, { allowSignalWrites: true });
    }

    loadData() {
        const date = this.state.filterDate() || new Date().toISOString().split('T')[0];

        // 1. First check if we have a submitted record for this date/module in history
        const historyRecord = this.state.checklistRecords().find(r =>
            r.moduleId === 'post-op-checklist' &&
            r.date === date &&
            r.userId === this.state.currentUser()?.id
        );

        if (historyRecord) {
            this.areas.set(JSON.parse(JSON.stringify(historyRecord.data.areas)));
            this.currentRecordId.set(historyRecord.id);
            this.isSubmitted.set(true);
            return;
        }

        // 2. Otherwise check for a draft (autosave)
        const savedData = this.state.getRecord('post-op-checklist');

        // Prepare current area list (Static + Equipment Census)
        const equipment = this.state.selectedEquipment();
        const equipmentAreas: AreaChecklist[] = equipment.map(eq => ({
            id: `eq-${eq.id}`,
            label: `Lavaggio: ${eq.name}`,
            icon: 'fa-soap',
            steps: this.getInitialSteps(),
            expanded: false
        }));

        const currentAreas = [...this.staticAreas, ...equipmentAreas];

        if (savedData && savedData.areas) {
            // Merge saved steps with current structure (in case equipment changed)
            const merged = currentAreas.map(a => {
                const saved = savedData.areas.find((sa: any) => sa.id === a.id);
                return saved ? { ...a, steps: saved.steps, expanded: saved.expanded } : a;
            });
            this.areas.set(merged);
            this.isSubmitted.set(false);
            this.currentRecordId.set(null);
        } else {
            this.areas.set(currentAreas);
            this.isSubmitted.set(false);
            this.currentRecordId.set(null);
        }
    }

    toggleArea(id: string) {
        this.areas.update(areas => areas.map(a => a.id === id ? { ...a, expanded: !a.expanded } : a));
    }

    setStepStatus(areaId: string, stepId: string, status: 'pending' | 'ok' | 'issue') {
        if (!this.state.isContextEditable()) return;

        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return {
                    ...a,
                    steps: a.steps.map(s => s.id === stepId ? { ...s, status } : s)
                };
            }
            return a;
        }));

        // Auto-save the state to the record store
        this.state.saveRecord('post-op-checklist', {
            areas: this.areas(),
            totalSteps: this.totalStepsCount(),
            completedSteps: this.completedStepsCount()
        });
    }

    setAllStepsInArea(areaId: string, status: 'ok' | 'issue') {
        if (!this.state.isContextEditable()) return;

        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return {
                    ...a,
                    steps: a.steps.map(s => ({ ...s, status })),
                    expanded: true // Auto-expand to show the changes
                };
            }
            return a;
        }));

        // Auto-save the state to the record store
        this.state.saveRecord('post-op-checklist', {
            areas: this.areas(),
            totalSteps: this.totalStepsCount(),
            completedSteps: this.completedStepsCount()
        });

        // Show feedback
        const area = this.areas().find(a => a.id === areaId);
        const statusLabel = status === 'ok' ? 'Conforme' : 'Non Conforme';
        this.toast.success('Area Aggiornata', `Tutti i controlli di "${area?.label}" sono stati segnati come ${statusLabel}.`);
    }

    isAreaComplete(areaId: string): boolean {
        const area = this.areas().find(a => a.id === areaId);
        return area ? area.steps.every(s => s.status !== 'pending') : false;
    }

    isAreaAllOk(areaId: string): boolean {
        const area = this.areas().find(a => a.id === areaId);
        return area ? area.steps.every(s => s.status === 'ok') : false;
    }

    isAreaAllIssue(areaId: string): boolean {
        const area = this.areas().find(a => a.id === areaId);
        return area ? area.steps.every(s => s.status === 'issue') : false;
    }

    hasAreaIssues(areaId: string): boolean {
        const area = this.areas().find(a => a.id === areaId);
        return area ? area.steps.some(s => s.status === 'issue') : false;
    }

    hasAreaOk(areaId: string): boolean {
        const area = this.areas().find(a => a.id === areaId);
        return area ? area.steps.some(s => s.status === 'ok') : false;
    }

    getCompletedStepsInArea(areaId: string): number {
        const area = this.areas().find(a => a.id === areaId);
        return area ? area.steps.filter(s => s.status !== 'pending').length : 0;
    }

    getAreaStatusLabel(areaId: string): string {
        const complete = this.isAreaComplete(areaId);
        if (!complete) return 'In corso';

        const area = this.areas().find(a => a.id === areaId);
        const hasIssue = area?.steps.some(s => s.status === 'issue');
        return hasIssue ? 'Rilevate Anomalie' : 'Conforme';
    }

    totalStepsCount() {
        return this.areas().length * this.stepDefinitions.length;
    }

    completedStepsCount() {
        return this.areas().reduce((acc, area) => {
            return acc + area.steps.filter(s => s.status !== 'pending').length;
        }, 0);
    }

    progressPercentage() {
        return (this.completedStepsCount() / this.totalStepsCount()) * 100;
    }

    isAllCompleted() {
        return this.completedStepsCount() === this.totalStepsCount();
    }

    hasIssues() {
        return this.areas().some(area => area.steps.some(s => s.status === 'issue'));
    }

    getFormattedDate() {
        return new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    submitChecklist() {
        const date = this.state.filterDate() || new Date().toISOString().split('T')[0];

        // Check if we already have a record for this date to avoid duplicates
        const existingRecord = this.state.checklistRecords().find(r =>
            r.moduleId === 'post-op-checklist' &&
            r.date === date &&
            r.userId === this.state.currentUser()?.id
        );

        const recordId = this.currentRecordId() || existingRecord?.id || Math.random().toString(36).substr(2, 9);
        this.currentRecordId.set(recordId);

        // Calculate status like phases 1 and 2
        const hasIssues = this.hasIssues();
        const status = hasIssues ? 'Non Conforme' : 'Conforme';

        this.state.saveChecklist({
            id: recordId,
            moduleId: 'post-op-checklist',
            date: date,
            data: {
                areas: this.areas(),
                totalSteps: this.totalStepsCount(),
                completedSteps: this.completedStepsCount(),
                status: status,
                summary: hasIssues ? `Rilevate anomalie in ${this.areas().filter(a => a.steps.some(s => s.status === 'issue')).length} aree` : 'Tutto Conforme'
            }
        });

        if (existingRecord) {
            this.toast.info('Registrazione Aggiornata', 'La registrazione esistente per oggi è stata sovrascritta con le nuove modifiche.');
        } else {
            this.toast.success('Fase Post-Operativa Registrata', 'Le operazioni sono state salvate correttamente nello storico.');
        }

        this.isSubmitted.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    resetForm() {
        this.isSubmitted.set(false);
        this.areas.update(areas => areas.map(a => ({
            ...a,
            steps: this.getInitialSteps(),
            expanded: a.id === 'cucina-sala'
        })));
    }

    setAllOk() {
        this.areas.update(areas => areas.map(area => ({
            ...area,
            steps: area.steps.map(step => ({ ...step, status: 'ok' }))
        })));
        this.toast.info('Tutto Conforme', 'Tutte le operazioni di pulizia sono state impostate come conformi.');
    }

    printReport() {
        window.scrollTo(0, 0); // Scroll to top to ensure print preview starts correctly
        setTimeout(() => {
            window.print();
        }, 100);
    }

    sendEmail() {
        const adminEmail = this.state.adminCompany().email || 'amministrazione@haccp-pro.it';
        this.toast.success('Email Inviata', `Il report PDF è stato inviato a ${adminEmail}`);
    }

    sendInternalMessage() {
        const issuesCount = this.areas().reduce((acc, area) => {
            return acc + area.steps.filter(s => s.status === 'issue').length;
        }, 0);
        const statusText = issuesCount === 0 ? 'Tutto Conforme' : `Rilevate ${issuesCount} Non Conformità`;

        const newMessage = {
            id: Date.now().toString(),
            senderId: this.state.currentUser()?.id || 'unknown',
            senderName: this.state.currentUser()?.name || 'Operatore',
            content: `Report Post-Operativo di oggi completato. Esito: ${statusText}. Vedi allegato.`,
            timestamp: new Date(),
            isRead: false,
            attachments: ['Report_Post_Operativo_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.pdf']
        };

        this.state.addMessage(newMessage);
        this.toast.success('Messaggio Inviato', 'Il report è stato allegato alla messaggistica interna.');
    }

    startNewChecklist() {
        this.resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
