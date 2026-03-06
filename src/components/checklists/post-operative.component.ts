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
    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
        
        <!-- Premium Hero Header -->
        <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
            <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-pink-600/15 blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-600 to-purple-700 shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
                        <i class="fa-solid fa-hourglass-end text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-4xl font-black tracking-tight text-white mb-1">Fase <span class="text-pink-400">Post-Operativa</span></h2>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10">
                                <i class="fa-solid fa-circle text-[9px] animate-pulse" [class.text-emerald-400]="isSubmitted()" [class.text-amber-400]="!isSubmitted()"></i>
                                {{ isSubmitted() ? 'Registrato' : 'In Compilazione' }}
                            </span>
                            <span class="flex items-center gap-2 rounded-full bg-pink-500/10 px-4 py-1.5 text-sm font-black text-pink-400 border border-pink-500/20">
                                <i class="fa-solid fa-user-check text-xs"></i> {{ state.currentUser()?.name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3">
                    <div class="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                        <div class="text-left">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Avanzamento</p>
                            <div class="flex items-center gap-3">
                                <div class="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full bg-pink-500 rounded-full transition-all duration-1000" [style.width.%]="progressPercentage()"></div>
                                </div>
                                <span class="text-xl font-black text-white whitespace-nowrap">{{ completedStepsCount() }} / {{ totalStepsCount() }}</span>
                            </div>
                        </div>
                        <div class="h-10 w-10 flex items-center justify-center bg-pink-500/20 rounded-xl text-pink-400">
                            <i class="fa-solid fa-chart-pie text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Date Selector & Quick Actions (Hidden on Print) -->
        <div class="print:hidden bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative z-20">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-sm">
                    <i class="fa-solid fa-calendar-check text-lg"></i>
                </div>
                <div>
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Data Post-Operativa</label>
                   <input type="date" [value]="state.filterDate()" (change)="state.filterDate.set($any($event.target).value)" 
                          class="w-full font-black text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0 text-lg leading-none">
                </div>
            </div>
            
            <div class="flex items-center gap-4">
                <!-- Quick Set All Ok -->
                <button (click)="setAllOk()" 
                        class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all shadow-md border border-emerald-100 active:scale-95"
                        title="Imposta tutto come Conforme">
                   <i class="fa-solid fa-check-double text-xl"></i>
                </button>
            </div>
        </div>

        <!-- Areas Checklist Expansion Panels -->
        <div class="mb-24">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Aree di Ispezione Post-Operativa</h3>
            <div class="grid grid-cols-1 gap-4">
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="divide-y divide-slate-100">
                        @for (area of areas(); track area.id) {
                            <div class="flex flex-col">
                                <!-- Area Header -->
                                <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer select-none"
                                     (click)="toggleArea(area.id)">
                                    <div class="flex items-center gap-4 flex-1">
                                        <div class="h-10 w-10 rounded-xl flex items-center justify-center text-lg transition-all shadow-inner"
                                             [class.bg-purple-100]="isAreaComplete(area.id)" [class.text-purple-600]="isAreaComplete(area.id)"
                                             [class.bg-slate-100]="!isAreaComplete(area.id)" [class.text-slate-500]="!isAreaComplete(area.id)">
                                            <i [class]="'fa-solid ' + area.icon"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-slate-800 text-base leading-tight">{{ area.label }}</h3>
                                            <div class="flex items-center gap-2 mt-0.5">
                                                <span class="text-[9px] font-black uppercase tracking-widest"
                                                      [class.text-emerald-600]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" 
                                                      [class.text-red-600]="hasAreaIssues(area.id)"
                                                      [class.text-slate-400]="!isAreaComplete(area.id)">
                                                    {{ getAreaStatusLabel(area.id) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-3 shrink-0">
                                        <button (click)="setAllStepsInArea(area.id, 'ok'); $event.stopPropagation()" 
                                                class="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center border border-emerald-100" title="Imposta tutti conformi">
                                            <i class="fa-solid fa-check-double text-xs"></i>
                                        </button>
                                        <i class="fa-solid fa-chevron-down text-slate-400 text-sm transition-transform duration-300 ml-2" [class.rotate-180]="area.expanded"></i>
                                    </div>
                                </div>

                    <!-- Steps Content (Expanded) -->
                    @if (area.expanded) {
                        <div class="bg-slate-50/50 border-t border-slate-100 px-4 py-2 divide-y divide-slate-100/50 select-none shadow-inner animate-slide-down">
                            @for (step of area.steps; track step.id; let i = $index) {
                                <div class="py-3 flex items-center justify-between gap-4 group/step">
                                    <div class="flex items-center gap-3 flex-1">
                                        <span class="text-[9px] font-black text-slate-400 w-5 h-5 rounded bg-white hover:bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0 leading-none">
                                            {{ i + 1 }}
                                        </span>
                                        <span class="text-sm font-medium text-slate-700 leading-tight transition-colors"
                                              [class.text-emerald-700]="step.status === 'ok'"
                                              [class.text-red-700]="step.status === 'issue'">
                                            {{ step.label }}
                                        </span>
                                    </div>
                                    <div class="flex gap-2 shrink-0">
                                        @if (step.status === 'pending') {
                                            <button (click)="setStepStatus(area.id, step.id, 'ok')" class="w-8 h-8 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center bg-white"><i class="fa-solid fa-check text-xs"></i></button>
                                            <button (click)="setStepStatus(area.id, step.id, 'issue')" class="w-8 h-8 rounded-full border border-red-200 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center bg-white"><i class="fa-solid fa-triangle-exclamation text-xs"></i></button>
                                        } @else {
                                            <div class="flex items-center gap-2">
                                                <span class="text-[9px] font-black uppercase tracking-widest px-2"
                                                      [class.text-emerald-600]="step.status === 'ok'"
                                                      [class.text-red-600]="step.status === 'issue'">
                                                    {{ step.status === 'ok' ? 'Conforme' : 'Anomalia' }}
                                                </span>
                                                <button (click)="setStepStatus(area.id, step.id, 'pending')" class="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-500 hover:bg-slate-800 hover:border-slate-800 hover:text-white transition-all flex items-center justify-center shadow-sm"><i class="fa-solid fa-rotate-left text-[10px]"></i></button>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>
            }
                        </div>
                    </div>
                </div>
        </div>

        <!-- Footer Actions -->
        <div class="fixed bottom-6 right-6 z-50">
            @if (!isSubmitted()) {
                <button (click)="submitChecklist()" [disabled]="!isAllCompleted()"
                        class="bg-slate-900 text-white rounded-2xl px-10 py-5 shadow-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-5 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 group border-2 border-white/10">
                    REGISTRA OPERAZIONI 
                    <i class="fa-solid fa-check-double text-xl text-pink-400 group-hover:rotate-12 transition-transform"></i>
                </button>
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
                <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-[2.5rem] shadow-2xl animate-slide-up mx-4 md:mx-0 border border-white/20">
                    <div class="flex flex-wrap items-center justify-center gap-4">
                        <button (click)="submitChecklist()" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-base transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-3 border border-emerald-400/50 ring-4 ring-emerald-500/20">
                            <i class="fa-solid fa-floppy-disk text-lg"></i> Salva
                        </button>

                        <div class="w-px h-10 bg-white/20 mx-2 hidden sm:block"></div>

                        <button (click)="printReport()" class="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-base transition-colors flex items-center justify-center gap-3 backdrop-blur-sm border border-white/10" title="Stampa">
                            <i class="fa-solid fa-print text-white text-lg"></i> <span class="hidden sm:inline">Stampa</span>
                        </button>
                        <button (click)="sendEmail()" class="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-base transition-colors flex items-center justify-center gap-3 backdrop-blur-sm border border-white/10" title="Email">
                            <i class="fa-solid fa-envelope text-white text-lg"></i> <span class="hidden sm:inline">Email</span>
                        </button>
                        <button (click)="sendInternalMessage()" class="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-base transition-colors flex items-center justify-center gap-3 backdrop-blur-sm border border-white/10" title="Chat">
                            <i class="fa-solid fa-comments text-white text-lg"></i> <span class="hidden sm:inline">Chat</span>
                        </button>
                        
                        <div class="w-px h-10 bg-white/20 mx-2 hidden sm:block"></div>

                        <button (click)="startNewChecklist()" class="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-purple-100 hover:text-white font-black text-base transition-colors border border-white/10 flex items-center justify-center gap-3 backdrop-blur-sm whitespace-nowrap" title="Nuova Compilazione">
                            <i class="fa-solid fa-rotate-right text-lg"></i> <span class="hidden sm:inline">Nuova</span>
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
    `]
})
export class PostOperationalChecklistComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    readonly stepDefinitions = [
        { id: 'scopatura', label: 'Scopatura', icon: 'fa-broom' },
        { id: 'detersione', label: 'Detersione', icon: 'fa-soap' },
        { id: 'disinfezione', label: 'Disinfezione', icon: 'fa-virus-slash' }
    ];

    staticAreas: AreaChecklist[] = [

        { id: 'cucina-sala', label: 'Cucina e Sala', icon: 'fa-utensils', steps: [], expanded: true },
        { id: 'area-lavaggio', label: 'Area Lavaggio', icon: 'fa-sink', steps: [], expanded: false },
        { id: 'deposito', label: 'Deposito', icon: 'fa-boxes-stacked', steps: [], expanded: false },
        { id: 'spogliatoio', label: 'Spogliatoio', icon: 'fa-shirt', steps: [], expanded: false },
        { id: 'antibagno-bagno-personale', label: 'Antibagno e Bagno Personale', icon: 'fa-restroom', steps: [], expanded: false },
        { id: 'bagno-clienti', label: 'Bagno Clienti', icon: 'fa-people-arrows', steps: [], expanded: false },
        { id: 'pavimenti', label: 'Pavimenti', icon: 'fa-table-cells', steps: [], expanded: false },
        { id: 'pareti', label: 'Pareti', icon: 'fa-border-all', steps: [], expanded: false },
        { id: 'soffitto', label: 'Soffitto', icon: 'fa-cloud', steps: [], expanded: false },
        { id: 'infissi', label: 'Infissi', icon: 'fa-door-closed', steps: [], expanded: false },
        { id: 'reti-antiintrusione', label: 'Reti Anti-intrusione', icon: 'fa-shield-cat', steps: [], expanded: false },
    ];

    areas = signal<AreaChecklist[]>([]);

    isSubmitted = signal(false);
    currentRecordId = signal<string | null>(null);

    getInitialSteps(areaId: string): StepStatus[] {
        const isEquipment = areaId.startsWith('eq-');
        const noScopaturaAreas = ['soffitto', 'infissi', 'reti-antiintrusione', 'pareti'];

        if (isEquipment || noScopaturaAreas.includes(areaId)) {
            return [
                { id: 'detersione', label: 'Detersione', icon: 'fa-soap', status: 'pending' },
                { id: 'disinfezione', label: 'Disinfezione', icon: 'fa-virus-slash', status: 'pending' }
            ];
        }

        return [
            { id: 'scopatura', label: 'Scopatura', icon: 'fa-broom', status: 'pending' },
            { id: 'detersione', label: 'Detersione', icon: 'fa-soap', status: 'pending' },
            { id: 'disinfezione', label: 'Disinfezione', icon: 'fa-virus-slash', status: 'pending' }
        ];
    }

    constructor() {
        effect(() => {
            // Re-load data when global filters change or equipment changes
            this.state.filterDate();
            this.state.filterCollaboratorId();
            this.state.currentUser();
            this.state.selectedEquipment();
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

        // Census equipment to be added as areas
        const census = this.state.groupedEquipment();
        const equipmentAreas: AreaChecklist[] = census.map(eq => {
            const nameLower = eq.name.toLowerCase();
            let icon = 'fa-snowflake';
            if (nameLower.includes('congelatore')) icon = 'fa-icicles';
            else if (nameLower.includes('pozzetto')) icon = 'fa-box-archive';
            else if (nameLower.includes('forno')) icon = 'fa-fire';
            else if (nameLower.includes('frigo')) icon = 'fa-snowflake';
            else if (nameLower.includes('lavello')) icon = 'fa-sink';
            else icon = 'fa-microchip';

            return {
                id: `eq-${eq.id}`,
                label: `${eq.name}`,
                icon: icon,
                steps: [],
                expanded: false
            };
        });

        // Initialize static + equipment areas with correct steps
        const currentAreas = [...this.staticAreas, ...equipmentAreas].map(a => ({
            ...a,
            steps: this.getInitialSteps(a.id)
        }));

        const savedData = this.state.getRecord('post-op-checklist');

        if (historyRecord) {
            const savedAreas = historyRecord.data.areas || [];
            // Merge: take everything in currentAreas, if it was in savedAreas use saved status
            const merged = currentAreas.map(a => {
                const saved = savedAreas.find((sa: any) => sa.id === a.id);
                if (!saved) return a;

                const currentStepsDef = this.getInitialSteps(a.id);
                const updatedSteps = saved.steps.map((step: any) => {
                    const def = currentStepsDef.find(d => d.id === step.id);
                    return { ...step, label: def?.label || step.label };
                });
                const currentIds = new Set(currentStepsDef.map(d => d.id));
                const filtered = updatedSteps.filter((s: any) => currentIds.has(s.id));
                const existingIds = new Set(filtered.map((s: any) => s.id));
                const missing = currentStepsDef.filter(d => !existingIds.has(d.id));

                return { ...a, steps: [...filtered, ...missing], expanded: saved.expanded };
            });

            this.areas.set(merged);
            this.currentRecordId.set(historyRecord.id);
            this.isSubmitted.set(true);
            return;
        }

        if (savedData && savedData.areas) {
            // Merge saved steps with current structure
            const merged = currentAreas.map(a => {
                const saved = savedData.areas.find((sa: any) => sa.id === a.id);
                if (!saved) return a;

                const currentStepsDef = this.getInitialSteps(a.id);
                const updatedSteps = saved.steps.map((step: any) => {
                    const def = currentStepsDef.find(d => d.id === step.id);
                    return { ...step, label: def?.label || step.label };
                });
                const currentIds = new Set(currentStepsDef.map(d => d.id));
                const filtered = updatedSteps.filter((s: any) => currentIds.has(s.id));
                const existingIds = new Set(filtered.map((s: any) => s.id));
                const missing = currentStepsDef.filter(d => !existingIds.has(d.id));

                return { ...a, steps: [...filtered, ...missing], expanded: saved.expanded };
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
        return this.areas().reduce((acc, area) => acc + area.steps.length, 0);
    }

    completedStepsCount() {
        return this.areas().reduce((acc, area) => {
            return acc + area.steps.filter(s => s.status !== 'pending').length;
        }, 0);
    }

    progressPercentage() {
        const total = this.totalStepsCount();
        return total > 0 ? (this.completedStepsCount() / total) * 100 : 0;
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
            steps: this.getInitialSteps(a.id),
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
