import { Component, inject, signal, computed, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface StepStatus {
    id: string; // pulizia, detersione, etc.
    label: string;
    icon: string;
    status: 'pending' | 'ok' | 'issue';
    note?: string;
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
            <div class="flex justify-between mt-4 text-lg text-slate-500">
                <span><span class="font-bold">Data:</span> {{ getFormattedDate() }}</span>
                <span><span class="font-bold">Operatore:</span> {{ state.currentUser()?.name || 'Operatore' }}</span>
            </div>
        </div>

        <table class="w-full text-left text-lg border-collapse">
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
                        <td class="py-2 pr-2 font-bold uppercase text-sm">{{ area.label }}</td>
                        <td class="py-2">
                            @if(getAreaStatusLabel(area.id) === 'Conforme') { 
                                <span class="font-bold text-emerald-800">CONFORME</span> 
                            } @else if(getAreaStatusLabel(area.id) === 'Rilevate Anomalie') { 
                                <span class="font-bold text-red-800">NON CONFORME</span> 
                            } @else { 
                                <span class="text-slate-400">NON ESEGUITO</span> 
                            }
                        </td>
                        <td class="py-2 italic text-slate-400 text-xs">
                            Verifica Area completata
                        </td>
                    </tr>
                    
                    <!-- Extended rows for NON CONFORME steps only -->
                    @for (step of area.steps; track step.id) {
                        @if(step.status === 'issue') {
                            <tr class="border-b border-slate-100 bg-red-50/30">
                                <td class="py-1 pl-6 pr-2 text-red-800 font-medium text-xs">
                                    <i class="fa-solid fa-triangle-exclamation mr-1 text-[10px]"></i>
                                    Dettaglio: {{ step.label }}
                                </td>
                                <td class="py-1 text-xs font-bold text-red-700">NON CONFORME</td>
                                <td class="py-1 italic text-red-600 text-[11px]">
                                    {{ step.note || 'Azione correttiva richiesta' }}
                                </td>
                            </tr>
                        }
                    }
                }
            </tbody>
        </table>

        <div class="mt-8 pt-4 border-t border-slate-300 flex justify-between text-base text-slate-400">
            <span>Documento generato da HACCP Pro</span>
            <span>Firma: ________________________</span>
        </div>
    </div>

    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 max-md:px-3 space-y-4 max-md:space-y-5 post-op-mobile">
        
        <!-- Premium Hero Header -->
        <!-- Sleek Professional Dashboard Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
            
            <div class="flex items-center gap-5 relative z-10">
                <button type="button"
                        (click)="goQuickHome()"
                        class="md:hidden h-14 w-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0 border-2 border-indigo-700 active:scale-95"
                        style="touch-action: manipulation"
                        aria-label="Torna al menu">
                    <i class="fa-solid fa-house-chimney text-2xl"></i>
                </button>
                <div class="hidden md:flex h-14 w-14 bg-slate-900 text-white rounded-xl items-center justify-center shadow-md">
                    <i class="fa-solid fa-moon text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-2xl max-md:text-xl font-bold text-slate-800 tracking-tight">Fase Post-Operativa</h2>
                    <div class="flex items-center gap-3 mt-1 max-md:mt-0.5 flex-wrap">
                        @if (isSubmitted()) {
                            <span class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-widest leading-none border border-emerald-100">
                                <i class="fa-solid fa-circle text-[8px] text-emerald-500"></i>
                                Registrato
                            </span>
                            <span class="text-xs font-medium text-slate-400 max-md:hidden">|</span>
                        }
                        <span class="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <i class="fa-solid fa-user-check text-[10px]"></i> {{ state.currentUser()?.name || 'Operatore' }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-auto relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button type="button"
                        (click)="setAllOk()"
                        [disabled]="isSubmitted() || !state.isContextEditable()"
                        class="hidden md:flex px-5 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-100 items-center justify-center gap-2 disabled:opacity-30 shadow-sm active:scale-95 shrink-0"
                        title="Imposta tutto come Conforme">
                    <i class="fa-solid fa-check-double text-base"></i><span>IMPOSTA TUTTI OK</span>
                </button>

                <div class="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex flex-col gap-2 min-w-[200px] flex-1 sm:flex-initial">
                    <div class="flex items-center justify-between mb-0.5">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Completamento</p>
                        <span class="text-sm font-black text-slate-700 leading-none">{{ completedStepsCount() }}/{{ totalStepsCount() }}</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full bg-slate-900 rounded-full transition-all duration-1000" 
                             [style.width.%]="progressPercentage()"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MOBILE: tutti conformi (come pre-operativa; data dal menu in alto) -->
        <div class="md:hidden">
            <button type="button"
                    (click)="setAllOk()"
                    [disabled]="isSubmitted() || !state.isContextEditable()"
                    class="post-op-touch w-full aspect-[2.2/1] max-h-[5.5rem] rounded-xl border-[3px] border-emerald-700 bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                    style="touch-action: manipulation">
                <i class="fa-solid fa-check-double text-4xl leading-none"></i>
                <span class="text-lg font-black uppercase tracking-wide leading-tight">Tutti conformi</span>
            </button>
            <p class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Un tocco · tutte le aree</p>
        </div>

        <!-- Desktop: data riferimento (barra superiore app ha già la data su mobile) -->
        <div class="hidden md:flex print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200 items-center gap-3 relative z-20">
            <div class="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <i class="fa-solid fa-calendar-check text-base"></i>
            </div>
            <div>
                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Data riferimento</label>
                <input type="date" [value]="state.filterDate()" (change)="state.filterDate.set($any($event.target).value)" 
                       class="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0 text-lg leading-none">
            </div>
        </div>

        <!-- Areas Checklist Expansion Panels -->
        <div class="mb-24">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Aree di Ispezione Post-Operativa</h3>
            <div class="grid grid-cols-1 gap-3">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="divide-y divide-slate-100">
                        @for (area of areas(); track area.id) {
                            <div class="flex flex-col">
                                <!-- Area Header -->
                                <div (click)="hasAreaIssues(area.id) ? openProcedureModal(area) : toggleArea(area.id)"
                                     class="p-5 flex flex-col gap-4 transition-all cursor-pointer select-none border-b border-slate-100 group"
                                     [class.bg-slate-50]="area.expanded" 
                                     [class.bg-red-50/50]="hasAreaIssues(area.id)"
                                     [class.border-red-200]="hasAreaIssues(area.id)">
                                    
                                    <!-- Row 1: Info & Title -->
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div class="h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-all border shadow-sm"
                                                 [class.bg-red-500]="hasAreaIssues(area.id)" [class.text-white]="hasAreaIssues(area.id)" [class.border-red-600]="hasAreaIssues(area.id)"
                                                 [class.bg-purple-600]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" [class.text-white]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" [class.border-purple-700]="isAreaComplete(area.id) && !hasAreaIssues(area.id)"
                                                 [class.bg-white]="!isAreaComplete(area.id)" [class.text-slate-400]="!isAreaComplete(area.id)" [class.border-slate-200]="!isAreaComplete(area.id)">
                                                <i [class]="'fa-solid ' + (hasAreaIssues(area.id) ? 'fa-triangle-exclamation' : area.icon)"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight"
                                                    [class.text-red-800]="hasAreaIssues(area.id)">{{ area.label }}</h3>
                                                <div class="flex items-center gap-2 mt-1">
                                                    <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                                          [class.bg-emerald-100]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" [class.text-emerald-700]="isAreaComplete(area.id) && !hasAreaIssues(area.id)"
                                                          [class.bg-red-100]="hasAreaIssues(area.id)" [class.text-red-700]="hasAreaIssues(area.id)"
                                                          [class.bg-slate-100]="!isAreaComplete(area.id)" [class.text-slate-500]="!isAreaComplete(area.id)">
                                                        {{ getAreaStatusLabel(area.id) }}
                                                    </span>
                                                    @if (!hasAreaIssues(area.id)) {
                                                        <span class="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                                                            {{ area.expanded ? 'Chiudi' : 'Dettagli' }} <i class="fa-solid" [class.fa-chevron-up]="area.expanded" [class.fa-chevron-down]="!area.expanded"></i>
                                                        </span>
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        @if (hasAreaIssues(area.id)) {
                                            <div class="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse border border-red-200">
                                                <i class="fa-solid fa-hand-pointer"></i>
                                            </div>
                                        }
                                    </div>

                                    <!-- Row 2: OK / No — verde/rosso tenue (come pre-op) -->
                                    <div class="grid grid-cols-2 gap-3 w-full max-md:gap-4 md:flex md:items-center md:gap-3">
                                        <button type="button"
                                                (click)="setAllStepsInArea(area.id, 'ok'); $event.stopPropagation()" 
                                                [disabled]="isSubmitted() || !state.isContextEditable()"
                                                class="post-op-btn-ok aspect-square max-md:aspect-square md:aspect-auto md:flex-1 md:h-16 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 md:flex-row md:gap-3 shadow-sm active:scale-95 disabled:opacity-30 text-emerald-900"
                                                [class.post-op-btn-ok-active]="isAreaComplete(area.id) && !hasAreaIssues(area.id)">
                                            <i class="fa-solid fa-check text-3xl md:text-2xl leading-none text-emerald-600/90"></i>
                                            <span class="text-sm max-md:text-base font-black uppercase tracking-wide md:text-xs md:tracking-widest">OK</span>
                                        </button>

                                        <button type="button"
                                                (click)="setAreaIssue(area.id); $event.stopPropagation()" 
                                                [disabled]="isSubmitted() || !state.isContextEditable()"
                                                class="post-op-btn-no aspect-square max-md:aspect-square md:aspect-auto md:flex-1 md:h-16 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 md:flex-row md:gap-3 shadow-sm active:scale-95 disabled:opacity-30 text-rose-900"
                                                [class.post-op-btn-no-active]="hasAreaIssues(area.id)">
                                            <i class="fa-solid fa-xmark text-3xl md:text-2xl leading-none text-rose-600/90"></i>
                                            <span class="text-sm max-md:text-base font-black uppercase tracking-wide md:text-xs md:tracking-widest">No</span>
                                        </button>
                                    </div>

                                    <!-- NON-CONFORMITY SUMMARY (Only if issues) -->
                                    @if (hasAreaIssues(area.id)) {
                                        <div class="p-4 bg-white/60 rounded-xl border border-red-100 space-y-1">
                                            @for (step of getIssueSteps(area.id); track step.id) {
                                                <p class="text-[11px] font-bold text-red-600 flex items-center gap-2">
                                                    <i class="fa-solid fa-circle text-[4px]"></i>
                                                    {{ step.label }}
                                                </p>
                                            }
                                            <p class="text-[10px] font-black text-red-400 mt-2 uppercase tracking-tight italic">
                                                <i class="fa-solid fa-circle-info mr-1"></i> Clicca il banner per i dettagli
                                            </p>
                                        </div>
                                    }
                                </div>
                    <!-- Steps Content (Expanded) -->
                    @if (area.expanded) {
                        <div class="bg-slate-50 border-t border-slate-200/60 px-4 py-2 divide-y divide-slate-200/50 select-none animate-slide-down shadow-inner">
                            @for (step of area.steps; track step.id; let i = $index) {
                                <div class="py-2.5 px-3 flex items-center justify-between gap-3 group/step cursor-pointer hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                                     (click)="step.status === 'issue' ? openProcedureModal(area) : toggleStepStatus(area.id, step.id)">
                                    <div class="flex items-center gap-3 flex-1">
                                        <span class="text-[11px] font-black text-slate-400 w-5 h-5 rounded bg-white flex items-center justify-center border border-slate-200 shrink-0 leading-none group-hover/step:border-purple-200 group-hover/step:text-purple-400 transition-colors">
                                            {{ i + 1 }}
                                        </span>
                                        <span class="text-sm font-bold text-slate-600 leading-tight transition-colors"
                                              [class.text-emerald-600]="step.status === 'ok'"
                                              [class.text-red-600]="step.status === 'issue'">
                                            {{ step.label }}
                                        </span>
                                    </div>
                                    <div class="flex gap-2 shrink-0">
                                        <div class="flex items-center gap-2">
                                            <span class="text-[10px] font-black uppercase tracking-widest px-1"
                                                  [class.text-emerald-500]="step.status === 'ok'"
                                                  [class.text-red-500]="step.status === 'issue'"
                                                  [class.text-slate-300]="step.status === 'pending'">
                                                {{ step.status === 'ok' ? 'Conforme' : (step.status === 'issue' ? 'Anomalia' : 'In attesa') }}
                                            </span>
                                        </div>
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
        <!-- Bottom Utility Actions (Discrete) -->
        <div class="mt-8 mb-20 px-6 flex flex-col items-center gap-6">
            <div class="h-px w-24 bg-slate-200"></div>
            
            <div class="flex items-center justify-center w-full max-w-xs">
                <button (click)="printReport()" 
                        class="w-full h-12 rounded-2xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
                    <i class="fa-solid fa-print text-sm"></i> Stampa
                </button>
            </div>
            
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                <i class="fa-solid fa-cloud-check text-emerald-400 mr-1"></i> Salvataggio Automatico Attivo
            </p>
        </div>
    </div>

    <!-- MODALE SEGNALAZIONE NON CONFORMITÀ (Sovraimpressione oscurante schermo intero, chiusura su OK) -->
    @if (isAnomalyModalOpen()) {
        <div class="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <!-- Sfondo nero oscurante schermo intero -->
            <div class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
                 (click)="closeAnomalyModal()"></div>

            <!-- Pannello Modale -->
            <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 animate-slide-up my-auto flex flex-col">
                <!-- Header Rosso HACCP -->
                <div class="px-6 py-5 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between shrink-0 shadow-sm">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-black uppercase tracking-tight leading-none mb-1">Segnalazione Anomalia</h3>
                            <p class="text-rose-100 text-[10px] font-bold uppercase tracking-widest opacity-90">Documentazione Non Conformità</p>
                        </div>
                    </div>
                    <button type="button"
                            (click)="closeAnomalyModal()"
                            class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95 text-white"
                            aria-label="Chiudi">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <div class="p-6 sm:p-8 space-y-6 bg-slate-50/60">
                    <div class="p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                        <h4 class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                            <i class="fa-solid fa-circle-info"></i> Controllo Selezionato
                        </h4>
                        <p class="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                            {{ currentAnomalyStep()?.label }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Dettaglio Anomalia / Azione Correttiva
                        </label>
                        <textarea #anomalyText
                                  [value]="anomalySubject"
                                  placeholder="Descrivi l'anomalia riscontrata e l'eventuale azione correttiva immediata intrapresa..."
                                  class="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-base font-medium text-slate-700 transition-all shadow-sm bg-white resize-none"></textarea>
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button type="button"
                                (click)="closeAnomalyModal()"
                                class="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                            ANNULLA
                        </button>
                        <button type="button"
                                (click)="confirmAnomaly(anomalyText.value)"
                                class="flex-[1.5] py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/25 active:scale-95 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-check text-sm"></i>
                            <span>OK · REGISTRA NON CONFORMITÀ</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    }

    <!-- MODALE PROCEDIMENTO CORRETTIVO (Sovraimpressione oscurante schermo intero) -->
    @if (isProcedureModalOpen()) {
        <div class="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <!-- Sfondo nero oscurante schermo intero -->
            <div class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
                 (click)="closeProcedureModal()"></div>

            <div class="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 z-10 animate-slide-up my-auto flex flex-col max-h-[90vh]">
                <!-- Header -->
                <div class="p-6 sm:p-8 bg-gradient-to-br from-red-600 to-rose-700 text-white flex-shrink-0">
                    <div class="flex items-center gap-4">
                        <div class="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-lg border border-white/30 shrink-0">
                            <i class="fa-solid fa-hand-holding-medical"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-xl sm:text-2xl font-black tracking-tight leading-tight">Procedimento Correttivo</h3>
                            <p class="text-rose-100 text-[10px] font-black uppercase tracking-widest opacity-80 truncate">Azione richiesta per ripristinare la conformità</p>
                        </div>
                        <button type="button"
                                (click)="closeProcedureModal()"
                                class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95 text-white"
                                aria-label="Chiudi">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                    <div class="p-4 sm:p-5 bg-red-50 rounded-2xl border border-red-100">
                        <h4 class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation"></i> Area Interessata
                        </h4>
                        <p class="text-lg sm:text-xl font-bold text-slate-800 leading-tight">
                            {{ selectedProcedureArea()?.label }}
                        </p>
                        <div class="mt-3 flex flex-wrap gap-2">
                            @for (step of getIssueSteps(selectedProcedureArea()?.id || ''); track step.id) {
                                <span class="px-2 py-1 bg-white border border-red-200 text-red-700 text-[10px] font-bold rounded-lg uppercase shadow-xs">
                                    {{ step.label }}
                                </span>
                            }
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Protocollo di Intervento</h4>
                        <div class="space-y-2.5">
                            @for (step of getAreaProcedures(selectedProcedureArea()?.id || ''); track $index) {
                                <div class="flex gap-3.5 p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                                    <div class="h-7 w-7 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 font-black text-xs">
                                        {{ $index + 1 }}
                                    </div>
                                    <p class="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
                                        {{ step }}
                                    </p>
                                </div>
                            } @empty {
                                <div class="p-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
                                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Procedura standard non definita</p>
                                    <p class="text-[10px] text-slate-400 mt-1 italic">Contattare il responsabile HACCP per indicazioni specifiche.</p>
                                </div>
                            }
                        </div>
                    </div>

                    <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div class="flex gap-3">
                            <i class="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                            <p class="text-xs text-blue-800 leading-relaxed">
                                <b>Nota:</b> Dopo aver eseguito le azioni sopra indicate, è obbligatorio verificare nuovamente l'area e, se conforme, aggiornare lo stato del registro.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="p-6 pt-0 flex gap-3 bg-slate-50/50 shrink-0">
                    <button type="button"
                            (click)="closeProcedureModal()"
                            class="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200 active:scale-95">
                        Chiudi
                    </button>
                    <button type="button"
                            (click)="resolveAreaIssues(selectedProcedureArea()?.id || '')"
                            class="flex-[1.5] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-check text-sm"></i>
                        <span>OK · RISOLTO E CONFORME</span>
                    </button>
                </div>
            </div>
        </div>
    }
    `,
    styles: [`
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { 
            from { transform: translateY(-10px); opacity: 0; max-height: 0; } 
            to { transform: translateY(0); opacity: 1; max-height: 1000px; } 
        }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .post-op-btn-ok {
            border-color: rgb(167 243 208 / 0.55);
            background-color: rgb(236 253 245 / 0.45);
        }
        .post-op-btn-ok-active {
            border-color: rgb(110 231 183 / 0.75);
            background-color: rgb(209 250 229 / 0.65);
        }
        .post-op-btn-no {
            border-color: rgb(254 202 202 / 0.55);
            background-color: rgb(255 241 242 / 0.4);
        }
        .post-op-btn-no-active {
            border-color: rgb(252 165 165 / 0.75);
            background-color: rgb(254 226 226 / 0.6);
        }
        @media (max-width: 767px) {
            .post-op-mobile .post-op-touch {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                min-height: 3rem;
            }
        }
    `]
})
export class PostOperationalChecklistComponent implements OnInit {
    state = inject(AppStateService);
    toast = inject(ToastService);

    ngOnInit() {
        this.state.scrollMainContentToTop();
    }

    goQuickHome() {
        this.state.setModule(this.state.isAdmin() ? 'dashboard' : 'operator-dashboard');
    }

    readonly stepDefinitions = [
        { id: 'scopatura', label: 'Scopatura', icon: 'fa-broom' },
        { id: 'detersione', label: 'Detersione', icon: 'fa-soap' },
        { id: 'disinfezione', label: 'Disinfezione', icon: 'fa-virus-slash' }
    ];

    staticAreas: AreaChecklist[] = [

        { id: 'cucina-sala', label: 'Cucina e Sala', icon: 'fa-utensils', steps: [], expanded: false },
        { id: 'area-lavaggio', label: 'Area Lavaggio', icon: 'fa-sink', steps: [], expanded: false },
        { id: 'deposito', label: 'Deposito', icon: 'fa-boxes-stacked', steps: [], expanded: false },
        { id: 'spogliatoio', label: 'Spogliatoio', icon: 'fa-shirt', steps: [], expanded: false },
        { id: 'antibagno-bagno-personale', label: 'Antibagno e Bagno Personale', icon: 'fa-restroom', steps: [], expanded: false },
        { id: 'bagno-clienti', label: 'Bagno Clienti', icon: 'fa-people-arrows', steps: [], expanded: false },
        { id: 'pavimenti', label: 'Pavimenti', icon: 'fa-table-cells', steps: [], expanded: false },
        { id: 'pareti', label: 'Pareti (All\'occorrenza)', icon: 'fa-border-all', steps: [], expanded: false },
        { id: 'soffitto', label: 'Soffitto (All\'occorrenza)', icon: 'fa-cloud', steps: [], expanded: false },
        { id: 'infissi', label: 'Infissi (All\'occorrenza)', icon: 'fa-door-closed', steps: [], expanded: false },
        { id: 'reti-antiintrusione', label: 'Reti Anti-intrusione (All\'occorrenza)', icon: 'fa-shield-cat', steps: [], expanded: false },
    ];

    areas = signal<AreaChecklist[]>([]);

    isSubmitted = signal(false);
    currentRecordId = signal<string | null>(null);

    // Anomaly Modal State
    isAnomalyModalOpen = signal(false);
    currentAnomalyStep = signal<{areaId: string, id: string, label: string} | null>(null);
    selectedAreaForIssue = signal<string | null>(null);
    anomalySubject = '';

    // Procedure Modal State
    isProcedureModalOpen = signal(false);
    selectedProcedureArea = signal<AreaChecklist | null>(null);

    private readonly AREA_PROCEDURES: Record<string, string[]> = {
        'cucina-sala': [
            'Rimuovere i rifiuti e i residui alimentari.',
            'Procedere con la detersione profonda di tutte le superfici.',
            'Sanificare con prodotto a base di cloro lasciando agire per 5 minuti.',
            'Asciugare con carta a perdere.'
        ],
        'area-lavaggio': [
            'Disincrostare i lavelli e le rubinetterie.',
            'Pulire i filtri delle macchine lavastoviglie.',
            'Sanificare le zone circostanti e i piani di scarico.'
        ],
        'pavimenti': [
            'Eseguire spazzamento ad umido o aspirazione.',
            'Lavare con detergente sgrassante ed igienizzante.',
            'Verificare l\'assenza di ristagni d\'acqua.'
        ],
        'bagno-personale': [
            'Pulire e sanificare i sanitari.',
            'Ripristinare sapone e asciugamani monouso.',
            'Sanificare maniglie e interruttori.'
        ]
    };

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
            const record = this.state.recordToEdit();
            if (record && record.moduleId === 'post-op-checklist') {
                untracked(() => this.loadData());
                setTimeout(() => this.state.completeEditing(), 100);
            }
        }, { allowSignalWrites: true });

        effect(() => {
            this.state.filterDate();
            this.state.filterCollaboratorId();
            this.state.activeTargetClientId();
            this.state.selectedEquipment();
            this.state.initialSyncDone();
            this.state.currentUser()?.id;
            this.state.checklistRecords();
            untracked(() => this.loadData());
        }, { allowSignalWrites: true });
    }

    loadData() {
        const date = this.state.filterDate() || new Date().toISOString().split('T')[0];
        const rawRecord = this.state.getChecklistRecord('post-op-checklist', date);

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
        const currentAreas = [...this.staticAreas, ...equipmentAreas]
            .filter(a => {
                if (a.id.startsWith('eq-')) return true;
                return this.state.isActivityEnabled('post-op-checklist', a.id);
            })
            .map(a => ({
                ...a,
                steps: this.getInitialSteps(a.id)
            }));

        const savedData = rawRecord?.data || this.state.getRecord('post-op-checklist', date);

        if (rawRecord?.data) {
            const historyRecord = rawRecord;
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
            this.isSubmitted.set(!!historyRecord.data.status);
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

                const existingArea = this.areas().find(ea => ea.id === a.id);
                const isExpanded = existingArea ? existingArea.expanded : (saved ? !!saved.expanded : false);

                return { ...a, steps: [ ...filtered, ...missing ], expanded: isExpanded };
            });
            this.areas.set(merged);
            this.isSubmitted.set(false);
            this.currentRecordId.set(rawRecord?.id || null);
        } else {
            this.areas.set(currentAreas.map(a => {
                const existing = this.areas().find(ea => ea.id === a.id);
                return { ...a, expanded: existing ? existing.expanded : a.expanded };
            }));
            this.isSubmitted.set(false);
            this.currentRecordId.set(null);
        }
    }

    toggleArea(id: string) {
        this.areas.update(areas => areas.map(a => a.id === id ? { ...a, expanded: !a.expanded } : a));
    }


    setAreaIssue(areaId: string) {

        const area = this.areas().find(a => a.id === areaId);
        if (!area) return;

        this.selectedAreaForIssue.set(areaId);
        this.anomalySubject = `Anomalia riscontrata in: ${area.label}`;
        this.isAnomalyModalOpen.set(true);
        this.state.scrollMainContentToTop();
        document.body.style.overflow = 'hidden';
    }

    private autoSaveTimeout: any;
    private autoSave() {
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.state.saveRecord('post-op-checklist', {
                areas: this.areas(),
                totalSteps: this.totalStepsCount(),
                completedSteps: this.completedStepsCount(),
                status: this.isSubmitted() ? (this.hasIssues() ? 'Non Conforme' : 'Conforme') : undefined
            });
        }, 2000);
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
            completedSteps: this.completedStepsCount(),
            status: this.isSubmitted() ? (this.hasIssues() ? 'Non Conforme' : 'Conforme') : undefined
        });

        // Show feedback
        const area = this.areas().find(a => a.id === areaId);
        const statusLabel = status === 'ok' ? 'Conforme' : 'Non Conforme';
        this.toast.success('Area Aggiornata', `Tutti i controlli di "${area?.label}" sono stati segnati come ${statusLabel}.`);
    }

    toggleStepStatus(areaId: string, stepId: string) {
        if (this.isSubmitted() || !this.state.isContextEditable()) return;
        
        const area = this.areas().find(a => a.id === areaId);
        const step = area?.steps.find(s => s.id === stepId);
        
        if (!step) return;

        if (step.status === 'ok') {
            this.setStepStatus(areaId, stepId, 'issue');
        } else {
            this.setStepStatus(areaId, stepId, 'ok');
        }
    }

    setStepStatus(areaId: string, stepId: string, status: 'pending' | 'ok' | 'issue') {
        const area = this.areas().find(a => a.id === areaId);
        const step = area?.steps.find(s => s.id === stepId);
        
        if (status === 'issue' && step) {
            this.currentAnomalyStep.set({ areaId, id: stepId, label: step.label });
            this.selectedAreaForIssue.set(null);
            this.anomalySubject = `Anomalia riscontrata in: ${step.label}`;
            this.isAnomalyModalOpen.set(true);
            this.state.scrollMainContentToTop();
            document.body.style.overflow = 'hidden';
            return;
        }

        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return { ...a, steps: a.steps.map(s => s.id === stepId ? { ...s, status } : s) };
            }
            return a;
        }));

        this.state.saveRecord('post-op-checklist', {
            areas: this.areas(),
            totalSteps: this.totalStepsCount(),
            completedSteps: this.completedStepsCount(),
            status: this.isSubmitted() ? (this.hasIssues() ? 'Non Conforme' : 'Conforme') : undefined
        });
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

    getIssueSteps(areaId: string) {
        const area = this.areas().find(a => a.id === areaId);
        return area?.steps.filter(s => s.status === 'issue') || [];
    }

    getAreaProcedures(areaId: string): string[] {
        if (areaId.startsWith('eq-')) {
            return [
                'Pulire le superfici esterne ed interne dell\'attrezzatura.',
                'Sanificare le guarnizioni e le maniglie.',
                'Verificare il corretto svuotamento di eventuali vaschette di condensa.',
                'Segnalare eventuali anomalie meccaniche.'
            ];
        }
        return this.AREA_PROCEDURES[areaId] || [
            'Eseguire una pulizia straordinaria dell\'elemento non conforme.',
            'Applicare il protocollo di sanificazione specifico.',
            'Verificare visivamente il risultato.',
            'Documentare l\'azione nel registro di monitoraggio.'
        ];
    }

    openProcedureModal(area: AreaChecklist) {
        this.selectedProcedureArea.set(area);
        this.isProcedureModalOpen.set(true);
        this.state.scrollMainContentToTop();
        document.body.style.overflow = 'hidden';
    }

    closeProcedureModal() {
        this.isProcedureModalOpen.set(false);
        this.selectedProcedureArea.set(null);
        if (!this.isAnomalyModalOpen()) {
            document.body.style.overflow = '';
        }
    }

    resolveAreaIssues(areaId: string) {
        this.setAllStepsInArea(areaId, 'ok');
        this.closeProcedureModal();
        this.toast.success('Problemi Risolti', 'L\'area è stata ripristinata e segnata come conforme.');
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
        return new Date(this.state.filterDate()).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private hasSavedProgress(data: any): boolean {
        if (!data) return false;
        if (data.status) return true;
        if ((data.completedSteps ?? 0) > 0) return true;
        return (data.areas || []).some((a: any) =>
            (a.steps || []).some((s: any) => s.status && s.status !== 'pending')
        );
    }

    submitChecklist() {
        const date = this.state.filterDate() || new Date().toISOString().split('T')[0];
        const targetUserId = this.state.resolveTargetUserId();
        const targetClientId = this.state.activeTargetClientId();

        // Check if we already have a record for this date to avoid duplicates
        const existingRecord = this.state.checklistRecords().find(r =>
            r.moduleId === 'post-op-checklist' &&
            r.date === date &&
            r.clientId === targetClientId &&
            r.userId === targetUserId
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
            expanded: false
        })));
    }


    setAllOk() {
        this.areas.update(areas => areas.map(area => ({
            ...area,
            steps: area.steps.map(step => ({ ...step, status: 'ok' }))
        })));

        this.state.saveRecord('post-op-checklist', {
            areas: this.areas(),
            totalSteps: this.totalStepsCount(),
            completedSteps: this.completedStepsCount(),
            status: this.isSubmitted() ? (this.hasIssues() ? 'Non Conforme' : 'Conforme') : undefined
        });

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

    closeAnomalyModal() {
        this.isAnomalyModalOpen.set(false);
        this.currentAnomalyStep.set(null);
        this.selectedAreaForIssue.set(null);
        if (!this.isProcedureModalOpen()) {
            document.body.style.overflow = '';
        }
    }

    confirmAnomaly(note: string) {
        const anomaly = this.currentAnomalyStep();
        const areaId = this.selectedAreaForIssue();
        
        if (areaId) {
            // Whole area issue
            this.areas.update(areas => areas.map(a => {
                if (a.id === areaId) {
                    return {
                        ...a,
                        steps: a.steps.map(s => ({ ...s, status: 'issue', note: note || 'Anomalia area' }))
                    };
                }
                return a;
            }));
        } else if (anomaly) {
            // Single step issue
            this.areas.update(areas => areas.map(a => {
                if (a.id === anomaly.areaId) {
                    return {
                        ...a,
                        steps: a.steps.map(s => s.id === anomaly.id ? { ...s, status: 'issue', note } : s)
                    };
                }
                return a;
            }));
        } else return;

        this.state.saveRecord('post-op-checklist', {
            areas: this.areas(),
            totalSteps: this.totalStepsCount(),
            completedSteps: this.completedStepsCount(),
            status: this.isSubmitted() ? (this.hasIssues() ? 'Non Conforme' : 'Conforme') : undefined
        });

        // Persistent record
        const area = this.areas().find(a => a.id === (areaId || anomaly?.areaId));
        const areaName = area ? area.label : 'Generale';
        const itemName = areaId ? areaName : (anomaly?.label || areaName);
        const operatorName = this.state.currentUser()?.name || 'Operatore';
        const currentDate = new Date().toLocaleDateString();

        // Persistent non-conformity record
        this.state.saveNonConformity({
            id: Math.random().toString(36).substring(2, 9),
            moduleId: 'post-op-checklist',
            date: this.state.filterDate(),
            description: `[POST-OP] ${areaName}${anomaly ? ' -> ' + anomaly.label : ''}: ${note || 'Anomalia rilevata'}`,
            itemName: itemName
        });

        // Notifica chat all'amministrazione con dettagli strutturati
        this.state.sendMessage(
            `🚨 ANOMALIA POST-OPERATIVA: ${itemName}`,
            `⚠ SEGNALAZIONE NON CONFORMITÀ ⚠\n\nFASE: Post-operativa (Fine Servizio)\nAREA: ${areaName}\nELEMENTO: ${itemName}\nOPERATORE: ${operatorName}\nDATA: ${currentDate}\n\nNOTE OPERATORE:\n${note || 'Nessuna specifica'}`,
            'SINGLE',
            'ADMIN_OFFICE'
        );

        this.closeAnomalyModal();
    }

    startNewChecklist() {
        this.resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
