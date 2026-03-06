import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface AreaChecklist {
    id: string;
    label: string;
    icon: string;
    steps: { id: string; label: string; icon: string; status: 'pending' | 'ok' | 'issue' }[];
    expanded: boolean;
}

@Component({
    selector: 'app-pre-operative-checklist',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- PRINT ONLY HEADER & TABLE -->
    <div class="hidden print:block font-sans text-black p-4">
        <div class="border-b-2 border-slate-800 pb-4 mb-6">
            <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
            <h2 class="text-xl font-light text-slate-600">Fase Pre-operativa (Ispezione e Avvio)</h2>
            <div class="flex justify-between mt-4 text-sm text-slate-500">
                <span><span class="font-bold">Data:</span> {{ getFormattedDate() }}</span>
                <span><span class="font-bold">Operatore:</span> {{ state.currentUser()?.name || 'Operatore' }}</span>
            </div>
        </div>

        <div class="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 class="text-sm font-bold uppercase mb-2 border-b border-slate-300 pb-1">Igiene del personale (Promemoria)</h3>
            <ul class="text-[10px] grid grid-cols-2 gap-x-8 gap-y-1 list-none">
                <li>• Abbigliamento sempre perfettamente pulito</li>
                <li>• Scarpe diverse da quelle che si usano all'esterno</li>
                <li>• Lavare frequentemente le mani con sapone germicida</li>
                <li>• Indossare idoneo copricapo (Addetti lavorazione)</li>
                <li>• Proteggere eventuali ferite in maniera appropriata</li>
                <li>• Evitare di fumare e manipolare correttamente gli alimenti</li>
            </ul>
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
                <!-- Global Checks -->
                @for (item of globalItems(); track item.id) {
                    <tr class="border-b border-slate-100 italic bg-blue-50/20">
                        <td class="py-2 font-bold">{{ item.label }}</td>
                        <td class="py-2 font-bold">{{ item.status === 'ok' ? 'CONFORME' : (item.status === 'issue' ? 'NON CONFORME' : 'NON ESEGUITO') }}</td>
                        <td class="py-2">{{ item.note || '-' }}</td>
                    </tr>
                }

                @for (area of areas(); track area.id) {
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
                        <td class="py-2 italic text-slate-400 text-[10px]">Verifica Area completata</td>
                    </tr>
                    @for (step of area.steps; track step.id) {
                        @if(step.status === 'issue') {
                            <tr class="border-b border-slate-100 bg-red-50/30">
                                <td class="py-1 pl-6 pr-2 text-red-800 font-medium text-[10px]">Anomalia: {{ step.label }}</td>
                                <td class="py-1 text-[10px] font-bold text-red-700">NON CONFORME</td>
                                <td class="py-1 italic text-red-600 text-[9px]">Azione correttiva richiesta</td>
                            </tr>
                        }
                    }
                }
            </tbody>
        </table>
    </div>

    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
        
        <!-- Premium Hero Header -->
        <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
            <!-- Decor Elements -->
            <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                        <i class="fa-solid fa-eye text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-4xl font-black tracking-tight text-white mb-1">Fase <span class="text-blue-400">Pre-Operativa</span></h2>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10">
                                <i class="fa-solid fa-circle text-[9px] animate-pulse" [class.text-emerald-400]="isSubmitted()" [class.text-amber-400]="!isSubmitted()"></i>
                                {{ isSubmitted() ? 'Registrato' : 'In Compilazione' }}
                            </span>
                            <span class="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-black text-blue-400 border border-blue-500/20">
                                <i class="fa-solid fa-user-check text-xs"></i> {{ state.currentUser()?.name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3">
                    <!-- Progress Card -->
                    <div class="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                        <div class="text-left">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Avanzamento</p>
                            <div class="flex items-center gap-3">
                                <div class="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-500 rounded-full transition-all duration-1000" [style.width.%]="progressPercentage()"></div>
                                </div>
                                <span class="text-xl font-black text-white whitespace-nowrap">{{ completedStepsCount() }} / {{ totalStepsCount() }}</span>
                            </div>
                        </div>
                        <div class="h-10 w-10 flex items-center justify-center bg-blue-500/20 rounded-xl text-blue-400">
                            <i class="fa-solid fa-chart-pie text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <!-- Left Col: Protocol & Global Items -->
            <div class="xl:col-span-1 space-y-8">
                <!-- Protocol Box - Refined -->
                <div class="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group border border-slate-100 shadow-sm">
                    <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    
                    <h3 class="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                        <span>Protocollo HACCP</span>
                        <i class="fa-solid fa-shield-halved text-indigo-500"></i>
                    </h3>

                    <div class="space-y-6">
                        <div class="flex gap-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                            <div class="h-12 w-12 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                                <i class="fa-solid fa-broom text-xl"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-black text-indigo-700 uppercase tracking-widest mb-1">Sanificazione</h4>
                                <p class="text-base text-slate-600 leading-relaxed italic">Pulizia meccanica/chimica e disinfezione profonda delle aree.</p>
                            </div>
                        </div>
                        <div class="flex gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                            <div class="h-12 w-12 shrink-0 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                                <i class="fa-solid fa-soap text-xl"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-black text-blue-700 uppercase tracking-widest mb-1">Detergenza</h4>
                                <p class="text-base text-slate-600 leading-relaxed italic">Uso coordinato di tensioattivi anionici e cationici.</p>
                            </div>
                        </div>
                    </div>
                </div>

                    <!-- Global Checks List Style -->
                    <div class="space-y-3">
                        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Controlli Generali Avvio</h3>
                        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div class="divide-y divide-slate-100">
                                @for (item of globalItems(); track item.id) {
                                    <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50"
                                         [class.bg-emerald-50/40]="item.status === 'ok'"
                                         [class.bg-red-50/40]="item.status === 'issue'">
                                        
                                        <div class="flex items-center gap-4 flex-1">
                                            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-inner"
                                                 [class.bg-slate-100]="item.status === 'pending'" [class.text-slate-500]="item.status === 'pending'"
                                                 [class.bg-emerald-100]="item.status === 'ok'" [class.text-emerald-600]="item.status === 'ok'"
                                                 [class.bg-red-100]="item.status === 'issue'" [class.text-red-600]="item.status === 'issue'">
                                                <i [class]="'fa-solid ' + item.icon"></i>
                                            </div>
                                            <div class="flex-1">
                                                <h4 class="font-bold text-slate-800 text-sm leading-tight max-w-sm">{{ item.label }}</h4>
                                                @if (item.status !== 'pending') {
                                                    <span class="text-[9px] font-black uppercase tracking-widest mt-1 block"
                                                          [class.text-emerald-600]="item.status === 'ok'"
                                                          [class.text-red-600]="item.status === 'issue'">
                                                        {{ item.status === 'ok' ? 'CONFORME' : 'NON CONFORME' }}
                                                    </span>
                                                }
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-3 shrink-0">
                                            <button (click)="item.id === 'g_cleaning_sanit' ? showCleaningInfo.set(true) : showPestInfo.set(true)" 
                                                    class="px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 text-[10px] font-black uppercase tracking-widest transition-all">
                                                INFO
                                            </button>

                                            <div class="w-px h-6 bg-slate-200 mx-1"></div>

                                            <div class="flex gap-2">
                                                <button (click)="setGlobalStatus(item.id, 'ok')" 
                                                        class="w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-sm shrink-0"
                                                        [class.bg-emerald-500]="item.status === 'ok'" [class.text-white]="item.status === 'ok'" [class.border-emerald-600]="item.status === 'ok'"
                                                        [class.bg-white]="item.status !== 'ok'" [class.text-emerald-500]="item.status !== 'ok'" [class.border-emerald-100]="item.status !== 'ok'"
                                                        [class.hover:bg-emerald-50]="item.status !== 'ok'">
                                                    <i class="fa-solid fa-check text-sm"></i>
                                                </button>
                                                <button (click)="setGlobalStatus(item.id, 'issue')" 
                                                        class="w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-sm shrink-0"
                                                        [class.bg-red-500]="item.status === 'issue'" [class.text-white]="item.status === 'issue'" [class.border-red-600]="item.status === 'issue'"
                                                        [class.bg-white]="item.status !== 'issue'" [class.text-red-500]="item.status !== 'issue'" [class.border-red-100]="item.status !== 'issue'"
                                                        [class.hover:bg-red-50]="item.status !== 'issue'">
                                                    <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
            </div>

            <!-- Right Col: Checklists Grid -->
            <div class="xl:col-span-2 space-y-4">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Aree di Ispezione</h3>
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
                                                 [class.bg-blue-100]="isAreaComplete(area.id)" [class.text-blue-600]="isAreaComplete(area.id)"
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

                                    <!-- Area Steps (Expanded) -->
                                    @if (area.expanded) {
                                        <div class="bg-slate-50/50 border-t border-slate-100 px-4 py-2 divide-y divide-slate-100/50 select-none shadow-inner">
                                            @for (step of area.steps; track step.id; let i = $index) {
                                                <div class="py-3 flex items-center justify-between gap-4 group/step">
                                                    <div class="flex items-center gap-3 flex-1">
                                                        <span class="text-[9px] font-black text-slate-400 w-5 h-5 rounded hover:bg-white bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0 leading-none">
                                                            {{ i + 1 }}
                                                        </span>
                                                        <span class="text-sm font-medium text-slate-700 leading-tight"
                                                              [class.text-emerald-700]="step.status === 'ok'"
                                                              [class.text-red-700]="step.status === 'issue'">
                                                            {{ step.label }}
                                                        </span>
                                                    </div>
                                                    <div class="flex gap-2 shrink-0">
                                                        @if (step.status === 'pending') {
                                                            <button (click)="setStepStatus(areaId(area), step.id, 'ok')" class="w-8 h-8 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center bg-white"><i class="fa-solid fa-check text-xs"></i></button>
                                                            <button (click)="setStepStatus(areaId(area), step.id, 'issue')" class="w-8 h-8 rounded-full border border-red-200 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center bg-white"><i class="fa-solid fa-triangle-exclamation text-xs"></i></button>
                                                        } @else {
                                                            <div class="flex items-center gap-2">
                                                                <span class="text-[9px] font-black uppercase tracking-widest px-2"
                                                                      [class.text-emerald-600]="step.status === 'ok'"
                                                                      [class.text-red-600]="step.status === 'issue'">
                                                                    {{ step.status === 'ok' ? 'Conforme' : 'Anomalia' }}
                                                                </span>
                                                                <button (click)="setStepStatus(areaId(area), step.id, 'pending')" class="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-500 hover:bg-slate-800 hover:border-slate-800 hover:text-white transition-all flex items-center justify-center shadow-sm"><i class="fa-solid fa-rotate-left text-[10px]"></i></button>
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
        </div>
        @if (isDocModalOpen()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeDocModal()"></div>
                <div class="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
                    <!-- Modal Header -->
                    <div class="bg-indigo-600 p-8 text-white flex justify-between items-center">
                        <div class="flex items-center gap-6">
                            <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                                <i class="fa-solid fa-folder-tree text-3xl"></i>
                            </div>
                            <div>
                                <h3 class="text-3xl font-black">{{ selectedDocCategory() === 'g_docs' ? 'Archivio Regolarità Documentale' : 'Censimento Attrezzature Cucina' }}</h3>
                                <p class="text-base text-indigo-100 font-medium opacity-80 uppercase tracking-widest mt-1">{{ selectedDocCategory() === 'g_docs' ? 'Consultazione Documenti' : 'Selezione macchinari e area operativa' }}</p>
                            </div>
                        </div>
                        <button (click)="closeDocModal()" class="w-12 h-12 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-8 overflow-y-auto bg-slate-50 flex-1">
                        @if (selectedDocCategory() === 'g_cleaning_sanit') {
                            <!-- EQUIPMENT SELECTION SYSTEM -->
                            <div class="space-y-8">
                                <div class="bg-indigo-50 border border-indigo-100 p-8 rounded-[32px]">
                                    <h4 class="text-base font-black text-indigo-700 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <i class="fa-solid fa-plus-circle text-xl"></i> Aggiungi Attrezzatura Area Cucina
                                    </h4>
                                    
                                    <div class="grid grid-cols-1 gap-4">
                                        <select #equipSelector 
                                                (change)="addEquipment(equipSelector.value); equipSelector.value = ''"
                                                class="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 text-lg font-bold text-slate-700 focus:border-indigo-500 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer">
                                            <option value="" disabled selected>Fai una scelta dal selettore...</option>
                                            @for (group of masterEquipmentList; track group.area) {
                                                <optgroup [label]="group.area">
                                                    @for (item of group.items; track item) {
                                                        <option [value]="group.area + '|' + item">{{ item }}</option>
                                                    }
                                                </optgroup>
                                            }
                                        </select>
                                        <p class="text-xs text-indigo-400 font-bold px-2 uppercase tracking-tight mt-2">L'attrezzatura selezionata verrà aggiunta automaticamente alla lista sottostante.</p>
                                    </div>
                                </div>

                                <div class="space-y-4">
                                    <h4 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Elenco Attrezzature Censite</h4>
                                    @for (eq of state.groupedEquipment(); track eq.id) {
                                        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group animate-slide-up">
                                            <div class="flex items-center gap-5">
                                                <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <i class="fa-solid fa-microchip text-xl"></i>
                                                </div>
                                                <div>
                                                    <span class="block font-black text-slate-800 text-lg leading-tight">{{ eq.name }}</span>
                                                    <span class="text-sm font-bold text-indigo-500 uppercase tracking-tighter">{{ eq.area }}</span>
                                                </div>
                                            </div>
                                            <button (click)="state.removeEquipment(eq.id)"
                                                    class="w-12 h-12 rounded-xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                                <i class="fa-solid fa-trash-can text-lg"></i>
                                            </button>
                                        </div>
                                    } @empty {
                                        <div class="flex flex-col items-center justify-center py-16 bg-slate-100/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                            <div class="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                                                <i class="fa-solid fa-list-check text-4xl text-slate-200"></i>
                                            </div>
                                            <p class="text-base font-bold text-slate-400 uppercase tracking-widest">Nessuna attrezzatura selezionata</p>
                                            <p class="text-sm text-slate-400 mt-2 italic">Usa il selettore sopra per censire i macchinari</p>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    <!-- Modal Footer -->
                    <div class="p-8 bg-white border-t border-slate-100 text-right">
                        <button (click)="closeDocModal()" class="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all">
                            CHIUDI ARCHIVIO
                        </button>
                    </div>
                </div>
            </div>
        }

        @if (showCleaningInfo()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" (click)="showCleaningInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-md max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 flex flex-col">
                    <!-- Header -->
                    <div class="p-10 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white relative flex-shrink-0">
                        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none -rotate-12 translate-x-2">
                            <i class="fa-solid fa-flask-vial text-9xl"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-3xl font-black mb-2">Sanificazione</h3>
                            <p class="text-indigo-200 text-base font-bold leading-tight italic max-w-[320px]">"La sanificazione è un intervento globale che comprende sia la pulizia meccanica/chimica che la successiva disinfezione."</p>
                        </div>
                    </div>
                    
                    <div class="p-10 pt-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                        <!-- Sezione Pulizia -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-broom text-base"></i> 01. Azione Scopatura
                            </h4>
                            <div class="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                <p class="text-lg font-bold text-slate-700 leading-relaxed italic">
                                    "Per una corretta scopatura utilizzare movimenti brevi, partendo dai bordi e angoli verso il centro, usare una scopa a setole morbide e un panno umido per evitare di sollevare il pulviscolo. Pulire periodicamente la scopa."
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Detergenti -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-soap text-base"></i> 02. Azione Detergenti
                            </h4>
                            <div class="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                <p class="text-base text-slate-700 leading-relaxed font-medium">
                                    Sostanze e miscele atte a rimuovere sporco e grasso da tutte le superfici, attrezzature e utensili.
                                </p>
                                <div class="mt-5 p-4 bg-white rounded-xl border border-indigo-100 flex gap-4 items-start shadow-sm">
                                    <i class="fa-solid fa-vial text-indigo-500 text-lg mt-1"></i>
                                    <p class="text-sm text-slate-500 font-bold leading-relaxed italic">
                                        Basati su tensioattivi che emulsionano lo sporco facilitandone la rimozione mediante risciacquo. 
                                        Per rimuovere lo sporco dalle superfici utilizzare prodotti anionici (leggere la composizione chimica) che hanno un elevato potere lavante e schiumogeno. 
                                        Per ottenere un effetto disinfettante, utilizzare prodotti cationici. Per ottenere un effetto sgrassante utilizzare prodotti non ionici.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Sezione Disinfettante (NEW) -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-virus-slash text-base"></i> 03. Azione Disinfettante
                            </h4>
                            <div class="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                <p class="text-base text-slate-700 leading-relaxed font-medium mb-4">
                                    I disinfettanti mirano alla eliminazione dei microorganismi patogeni ed alla riduzione della carica microbica totale (batteri, muffe, lieviti, virus).
                                </p>
                                <div class="p-4 bg-white rounded-xl border border-indigo-100 space-y-3 shadow-sm">
                                    <div class="flex gap-4 items-center">
                                        <i class="fa-solid fa-shield-virus text-indigo-500 text-sm"></i>
                                        <p class="text-xs text-slate-500 font-bold uppercase tracking-tight">Meccanismi d'azione:</p>
                                    </div>
                                    <ul class="text-sm text-slate-600 font-medium space-y-2 ml-8 list-disc">
                                        <li>Denaturazione delle proteine (es. Alcool)</li>
                                        <li>Azione ossidante (es. Cloro / Ipoclorito)</li>
                                        <li>Disattivazione enzimatica e strutturale</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-8 bg-slate-50 border-t border-slate-100 flex-shrink-0">
                        <button (click)="showCleaningInfo.set(false)"
                                class="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95">
                            HO PRESO VISIONE
                        </button>
                    </div>
                </div>
            </div>
        }

        @if (showPestInfo()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" (click)="showPestInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-md max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 flex flex-col">
                    <!-- Header -->
                    <div class="p-10 bg-gradient-to-br from-amber-600 to-amber-800 text-white relative flex-shrink-0">
                        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none -rotate-12 translate-x-2">
                            <i class="fa-solid fa-bug-slash text-9xl"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-3xl font-black mb-2">Piano Infestanti</h3>
                            <p class="text-amber-100 text-base font-bold leading-tight italic max-w-[320px]">"Il controllo degli infestanti previene la contaminazione biologica degli alimenti mediante monitoraggio costante."</p>
                        </div>
                    </div>
                    
                    <div class="p-10 pt-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                        <!-- Sezione Monitoraggio -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-magnifying-glass text-base"></i> 01. Monitoraggio
                            </h4>
                            <div class="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                                <p class="text-lg font-bold text-slate-700 leading-relaxed italic">
                                    "Ispezionare visivamente le trappole (collanti, esche) e le aree critiche. Verificare l'assenza di tracce (escrementi, rosicchiature)."
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Prevenzione -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-shield-halved text-base"></i> 02. Prevenzione
                            </h4>
                            <div class="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                                <p class="text-base text-slate-700 leading-relaxed font-medium">
                                    Mantenere le soglie sigillate, le finestre dotate di zanzariere integre e i pozzetti di scarico protetti. Non lasciare residui di cibo.
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Intervento -->
                        <div class="space-y-4">
                            <h4 class="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-phone-flip text-base"></i> 03. Segnalazione
                            </h4>
                            <div class="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 text-sm font-bold text-slate-500 italic">
                                In caso di avvistamento o infestazione sospetta, contattare immediatamente la ditta specializzata e annotare nel registro.
                            </div>
                        </div>
                    </div>

                    <div class="p-8 bg-slate-50 border-t border-slate-100 flex-shrink-0">
                        <button (click)="showPestInfo.set(false)"
                                class="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95">
                            HO PRESO VISIONE
                        </button>
                    </div>
                </div>
            </div>
        }

        <!-- CUSTOM DELETE CONFIRMATION MODAL (APP STYLE) -->
        @if (isDeleteModalOpen()) {
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-md" (click)="isDeleteModalOpen.set(false)"></div>
                <div class="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-10 animate-slide-up text-center">
                    <div class="w-24 h-24 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-100/50">
                        <i class="fa-solid fa-trash-can-arrow-up text-4xl"></i>
                    </div>

                    <h3 class="text-3xl font-black text-slate-800 mb-3">Elimina Documento?</h3>
                    <p class="text-lg text-slate-500 font-medium leading-relaxed mb-10">
                        Sei sicuro di voler rimuovere <span class="text-slate-800 font-bold">"{{ docToDelete()?.fileName }}"</span>? <br>L'azione è definitiva e non può essere annullata.
                    </p>

                    <div class="space-y-4">
                        <button (click)="confirmDelete()"
                                class="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                            SÌ, ELIMINA DEFINITIVAMENTE
                        </button>
                        <button (click)="isDeleteModalOpen.set(false)"
                                class="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                            ANNULLA OPERAZIONE
                        </button>
                    </div>
                </div>
            </div>
        }

        <!-- Footer Actions -->
        <div class="fixed bottom-6 right-6 z-30">
            @if (!isSubmitted()) {
                <button (click)="submitChecklist()" [disabled]="!isAllCompleted()"
                        class="bg-slate-900 text-white rounded-2xl px-10 py-5 shadow-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-5 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 group border-2 border-white/10">
                    REGISTRA OPERAZIONI 
                    <i class="fa-solid fa-check-double text-xl text-blue-400 group-hover:rotate-12 transition-transform"></i>
                </button>
            } @else {
                <div class="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-100 animate-slide-up">
                    <div class="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg shadow-emerald-200/50">REGISTRATO</div>
                    <button (click)="printReport()" class="h-12 px-5 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white flex items-center gap-3 font-bold text-xs transition-all border border-slate-100">
                        <i class="fa-solid fa-print text-sm"></i> STAMPA
                    </button>
                    <button (click)="startNewChecklist()" class="h-12 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-3 font-bold text-xs transition-all shadow-lg shadow-blue-200">
                        <i class="fa-solid fa-rotate-right text-sm"></i> NUOVA
                    </button>
                </div>
            }
        </div>

    </div>
    `,
    styles: [`
    .animate-bounce-short { animation: bounceShort 2s infinite; }
    @keyframes bounceShort { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } 60% { transform: translateY(-3px); } }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `]
})
export class PreOperationalChecklistComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    isSubmitted = signal(false);
    currentRecordId = signal<string | null>(null);

    // Info modal state
    showCleaningInfo = signal(false);
    showPestInfo = signal(false);

    // Document Management state
    isDocModalOpen = signal(false);
    selectedDocType = signal<string | null>(null);
    expiryDateInput = signal<string>('');
    // disabledDocs removed as it's now global in AppStateService

    // Delete confirmation state
    isDeleteModalOpen = signal(false);
    docToDelete = signal<any>(null);

    masterEquipmentList = [
        { area: 'Area Lavaggio', items: ['Mobile pensile', 'Lavello', 'Tavolo da lavoro'] },
        { area: 'Cucina', items: ['Frigo', 'Congelatore', 'Piano cottura', 'Forno', 'Griglie', 'Banchi lavori', 'Forno a legna', 'Lavello', 'Lavabicchieri', 'Affettatrice', 'Taglia verdure', 'Campana sottovuoto', 'Banco frigo', 'Cappa aspirante'] },
        { area: 'Deposito', items: ['Frigo', 'Cella frigorifero'] },
        { area: 'Spogliatoi', items: ['Armadietto', 'Microonde'] }
    ];

    docDefinitions = [
        { id: 'scia', label: 'Scia e planimetria', icon: 'fa-map-location-dot' },
        { id: 'camerale', label: 'Camerale', icon: 'fa-building-columns' },
        { id: 'haccp_plan', label: 'Piano autocontrollo sistema HACCP', icon: 'fa-file-shield' },
        { id: 'osa', label: 'Attestato OSA', icon: 'fa-user-graduate' },
        { id: 'pec', label: 'PEC (Posta Elettronica Certificata)', icon: 'fa-envelope-circle-check', hasExpiry: true },
        { id: 'firma_digitale', label: 'Firma digitale', icon: 'fa-signature' },
        { id: 'registro_personale', label: 'Registro del personale', icon: 'fa-users-rectangle' },
        { id: 'inps_inail', label: 'Iscrizione INPS / INAIL', icon: 'fa-stamp' },
        { id: 'messa_terra', label: 'DM 37/08 messa a terra DPR 462/01', icon: 'fa-bolt' },
        { id: 'dvr', label: 'DVR (Documento Valutazione Rischi)', icon: 'fa-triangle-exclamation' },
        { id: 'locazione', label: 'Contratto locazione o titolo proprietà', icon: 'fa-house-chimney' }
    ];

    globalItems = signal<{ id: string; label: string; icon: string; status: 'pending' | 'ok' | 'issue'; note?: string }[]>([
        { id: 'g_cleaning_sanit', label: 'Prodotti pulizia e sanificazione', icon: 'fa-spray-can-sparkles', status: 'pending' },
        { id: 'g_pest_control', label: 'Controllo Infestanti (Monitoraggio)', icon: 'fa-bug-slash', status: 'pending' }
    ]);

    stepDefinitions = [
        { id: 'ispezione', label: 'Ispezione visiva', icon: 'fa-eye' },
        { id: 'integrita', label: 'Integrità attrezzature', icon: 'fa-screwdriver-wrench' },
        { id: 'pulizia', label: 'Assenza di sporco', icon: 'fa-broom' },
        { id: 'materiali', label: 'Disponibilità prodotti (alimenti e non)', icon: 'fa-box' }
    ];

    areas = signal<AreaChecklist[]>([

        { id: 'cucina-sala', label: 'Cucina e Sala', icon: 'fa-utensils', steps: this.getInitialSteps('cucina-sala'), expanded: false },
        { id: 'area-lavaggio', label: 'Area Lavaggio', icon: 'fa-sink', steps: this.getInitialSteps('area-lavaggio'), expanded: false },
        { id: 'deposito', label: 'Deposito', icon: 'fa-boxes-stacked', steps: this.getInitialSteps('deposito'), expanded: false },
        { id: 'spogliatoio', label: 'Spogliatoio', icon: 'fa-shirt', steps: this.getInitialSteps('spogliatoio'), expanded: false },
        { id: 'antibagno-bagno-personale', label: 'Antibagno e Bagno Personale', icon: 'fa-restroom', steps: this.getInitialSteps('antibagno-bagno-personale'), expanded: false },
        { id: 'bagno-clienti', label: 'Bagno Clienti', icon: 'fa-people-arrows', steps: this.getInitialSteps('bagno-clienti'), expanded: false },
        { id: 'pavimenti', label: 'Pavimenti', icon: 'fa-table-cells', steps: this.getInitialSteps('pavimenti'), expanded: false },
        { id: 'pareti', label: 'Pareti', icon: 'fa-border-all', steps: this.getInitialSteps('pareti'), expanded: false },
        { id: 'soffitto', label: 'Soffitto', icon: 'fa-cloud', steps: this.getInitialSteps('soffitto'), expanded: false },
        { id: 'infissi', label: 'Infissi', icon: 'fa-door-closed', steps: this.getInitialSteps('infissi'), expanded: false }
    ]);

    getInitialSteps(areaId: string) {
        return this.stepDefinitions
            .filter(def => {
                // Area Lavaggio: elimina Integrità attrezzature
                if (areaId === 'area-lavaggio' && def.id === 'integrita') return false;
                // Deposito, Spogliatoio e Pavimenti: elimina Disponibilità prodotti
                if ((areaId === 'deposito' || areaId === 'spogliatoio' || areaId === 'pavimenti') && def.id === 'materiali') return false;
                // Pareti: elimina integrità, pulizia e materiali
                if (areaId === 'pareti' && (def.id === 'integrita' || def.id === 'pulizia' || def.id === 'materiali')) return false;
                // Soffitto and Infissi: elimina integrità e materiali
                if ((areaId === 'soffitto' || areaId === 'infissi') && (def.id === 'integrita' || def.id === 'materiali')) return false;
                // Reti Anti-intrusione: elimina tutto tranne ispezione
                if (areaId === 'reti-antiintrusione' && def.id !== 'ispezione') return false;
                return true;
            })
            .map(def => {
                let label = def.label;
                // Area Lavaggio: sostituisci Disponibilità prodotti
                if (areaId === 'area-lavaggio' && def.id === 'materiali') {
                    label = 'Disponibilità prodotti di pulizia e sanificazione';
                }
                // Deposito e Spogliatoio: integrità attrezzature con integrità materiali
                if ((areaId === 'deposito' || areaId === 'spogliatoio') && def.id === 'integrita') {
                    label = 'Integrità materiali';
                }
                // Antibagno/Bagno Personale e Bagno Clienti: ispezione e disponibilità prodotti
                if (areaId === 'antibagno-bagno-personale' || areaId === 'bagno-clienti') {
                    if (def.id === 'ispezione') label = 'Ispezione lavabo, tazza, rubinetteria';
                    if (def.id === 'materiali') label = 'Disponibilità prodotti di pulizia e sanificazione e presenza di acqua calda';
                }
                // Pavimenti: ispezione e pulizia
                if (areaId === 'pavimenti') {
                    if (def.id === 'ispezione') label = 'ispezione integrità della pavimentazione';
                    if (def.id === 'pulizia') label = 'assenza di trasporto';
                }
                // Pareti: ispezione
                if (areaId === 'pareti' && def.id === 'ispezione') {
                    label = 'Ispezione integrità delle pareti';
                }
                // Soffitto: ispezione e pulizia
                if (areaId === 'soffitto') {
                    if (def.id === 'ispezione') label = 'ispezione integrità soffitto';
                    if (def.id === 'pulizia') label = 'assenza di ragnatele';
                }
                // Infissi: ispezione
                if (areaId === 'infissi' && def.id === 'ispezione') {
                    label = 'ispezione pulizia';
                }
                // Reti Anti-intrusione: ispezione
                if (areaId === 'reti-antiintrusione' && def.id === 'ispezione') {
                    label = 'verifica assenza di polvere e sporco';
                }
                return { ...def, label, status: 'pending' as const };
            });
    }

    constructor() {
        effect(() => {
            this.state.filterDate();
            this.loadData();
        }, { allowSignalWrites: true });

        // Multi-doc status checking removed here as g_docs is gone from this phase

    }

    loadData() {
        const historyRecord = this.state.getRecord('pre-op-checklist');

        if (historyRecord && historyRecord.areas) {
            // Re-apply updated labels to the saved data
            const relabeledAreas = historyRecord.areas.map((area: any) => {
                const updatedSteps = area.steps.map((step: any) => {
                    // Find the current definition label for this area
                    const currentDefinition = this.getInitialSteps(area.id).find(d => d.id === step.id);
                    return { ...step, label: currentDefinition?.label || step.label };
                });

                // Also handle cases where steps might have been removed or added (filter by current definition)
                const currentStepIds = new Set(this.getInitialSteps(area.id).map(d => d.id));
                const filteredSteps = updatedSteps.filter((s: any) => currentStepIds.has(s.id));

                // Add missing steps if any (though unlikely if definitions are stable)
                const existingIds = new Set(filteredSteps.map((s: any) => s.id));
                const missingSteps = this.getInitialSteps(area.id).filter(d => !existingIds.has(d.id));

                return { ...area, steps: [...filteredSteps, ...missingSteps] };
            });

            this.areas.set(relabeledAreas);
            this.globalItems.set(JSON.parse(JSON.stringify(historyRecord.globalItems || [])));
            this.isSubmitted.set(true);
        } else {
            this.isSubmitted.set(false);
            this.resetForm();
        }
    }

    areaId(area: AreaChecklist) { return area.id; }

    toggleArea(id: string) {
        this.areas.update(areas => areas.map(a => a.id === id ? { ...a, expanded: !a.expanded } : a));
    }

    setStepStatus(areaId: string, stepId: string, status: 'pending' | 'ok' | 'issue') {
        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return { ...a, steps: a.steps.map(s => s.id === stepId ? { ...s, status } : s) };
            }
            return a;
        }));
    }

    setGlobalStatus(id: string, status: 'pending' | 'ok' | 'issue') {
        this.globalItems.update(items => items.map(item => {
            if (item.id === id) {
                const newStatus = item.status === status ? 'pending' : status;
                return { ...item, status: newStatus };
            }
            return item;
        }));
    }

    setAllStepsInArea(areaId: string, status: 'ok' | 'issue') {
        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return { ...a, steps: a.steps.map(s => ({ ...s, status })), expanded: true };
            }
            return a;
        }));
    }

    isAreaComplete(id: string) {
        const area = this.areas().find(a => a.id === id);
        return area?.steps.every(s => s.status !== 'pending') || false;
    }

    hasAreaIssues(id: string) {
        const area = this.areas().find(a => a.id === id);
        return area?.steps.some(s => s.status === 'issue') || false;
    }

    getCompletedStepsInArea(id: string) {
        const area = this.areas().find(a => a.id === id);
        return area?.steps.filter(s => s.status === 'ok').length || 0;
    }

    getAreaStatusLabel(id: string) {
        if (!this.isAreaComplete(id)) return 'In corso';
        return this.hasAreaIssues(id) ? 'Rilevate Anomalie' : 'Conforme';
    }

    totalStepsCount() { return (this.areas().length * this.stepDefinitions.length) + this.globalItems().length; }

    completedStepsCount() {
        const areaDone = this.areas().reduce((acc, a) => acc + a.steps.filter(s => s.status !== 'pending').length, 0);
        const globalDone = this.globalItems().filter(i => i.status !== 'pending').length;
        return areaDone + globalDone;
    }

    progressPercentage() {
        const total = this.totalStepsCount();
        return total > 0 ? (this.completedStepsCount() / total) * 100 : 0;
    }

    isAllCompleted() { return this.completedStepsCount() === this.totalStepsCount(); }

    submitChecklist() {
        this.state.saveChecklist({
            moduleId: 'pre-op-checklist',
            date: this.state.filterDate(),
            data: {
                areas: this.areas(),
                globalItems: this.globalItems(),
                status: (this.areas().some(a => a.steps.some(s => s.status === 'issue')) || this.globalItems().some(i => i.status === 'issue')) ? 'Non Conforme' : 'Conforme'
            }
        });
        this.isSubmitted.set(true);
        this.toast.success('Registrato', 'Fase Pre-Operativa salvata.');
    }

    resetForm() {
        this.areas.update(areas => areas.map(a => ({
            ...a,
            steps: this.getInitialSteps(a.id),
            expanded: a.id === 'cucina-sala'
        })));
        this.globalItems.update(items => items.map(i => ({ ...i, status: 'pending' })));
    }

    startNewChecklist() {
        this.isSubmitted.set(false);
        this.resetForm();
    }

    printReport() { window.print(); }
    getFormattedDate() { return new Date(this.state.filterDate()).toLocaleDateString('it-IT'); }

    // --- Document Management Methods ---
    selectedDocCategory = signal<string | null>(null);

    openDocModal(categoryId: string) {
        this.selectedDocCategory.set(categoryId);
        this.isDocModalOpen.set(true);
    }

    closeDocModal() {
        this.isDocModalOpen.set(false);
        this.selectedDocCategory.set(null);
    }

    getDocsByType(type: string) {
        const clientId = this.state.currentUser()?.clientId || 'demo';
        return this.state.documents().filter(d => d.clientId === clientId && d.type === type);
    }

    getItemBadgeCount(categoryId: string) {
        if (categoryId === 'g_docs') {
            const clientId = this.state.currentUser()?.clientId || 'demo';
            return this.state.documents().filter(d => d.clientId === clientId && d.category === 'regolarita-documentazione').length;
        }
        if (categoryId === 'g_cleaning_sanit') {
            return this.state.groupedEquipment().length;
        }
        return 0;
    }

    addEquipment(val: string) {
        if (!val) return;
        const [area, name] = val.split('|');
        this.state.addEquipment(area, name);
        this.toast.success('Attrezzatura aggiunta', name);
    }

    handleFileSelect(event: any, type: string) {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;

        const clientId = this.state.currentUser()?.clientId || 'demo';
        const category = this.selectedDocCategory() === 'g_docs' ? 'regolarita-documentazione' : 'prodotti-pulizia';

        Array.from(files).forEach(file => {
            this.state.saveDocument({
                clientId,
                category,
                type,
                fileName: file.name,
                fileType: file.type,
                fileData: 'BASE64_PLACE_HOLDER'
            });
        });
    }

    getExpiryDate(type: string) {
        const docs = this.getDocsByType(type);
        return docs.length > 0 ? docs[0].expiryDate : '';
    }

    updateExpiryDate(type: string, event: any) {
        const expiryDate = event.target.value;
        const docs = this.getDocsByType(type);
        if (docs.length > 0) {
            // Update existing doc metadata
            this.state.documents.update(allDocs => allDocs.map(d => {
                if (d.id === docs[0].id) return { ...d, expiryDate };
                return d;
            }));
            this.toast.success('Scadenza salvata', 'Data di scadenza aggiornata correttamente.');
        } else {
            this.toast.info('Attenzione', 'Carica prima il documento per poter impostare la data di scadenza.');
        }
    }

    toggleDocExclusion(docId: string) {
        this.state.disabledDocs.update(prev => ({
            ...prev,
            [docId]: !prev[docId]
        }));

        const isExcluding = this.state.disabledDocs()[docId];
        this.toast.info(isExcluding ? 'Documento Escluso' : 'Documento Riabilitato',
            isExcluding ? 'L\'elemento non sarà conteggiato nella verifica.' : 'L\'elemento è ora obbligatorio per la conformità.');
    }

    downloadDoc(doc: any) {
        this.toast.info('Download in corso', `Il file ${doc.fileName} sta per essere scaricato.`);

        // Real download simulation using Blob
        const mockContent = 'Dati del documento ' + doc.fileName;
        const blob = new Blob([mockContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.toast.success('Completato', 'Download terminato con successo.');
    }

    shareDoc(doc: any) {
        this.toast.info('Condivisione Documento', `Scegli come condividere ${doc.fileName}`);

        // Mocking a share menu with a toast sequence for now
        setTimeout(() => {
            this.toast.success('Inviato', 'Il documento è stato correttamente condiviso via Email e WhatsApp.');
        }, 800);
    }

    askDeleteDoc(doc: any) {
        // Open app-style custom confirmation modal
        this.docToDelete.set(doc);
        this.isDeleteModalOpen.set(true);
    }

    confirmDelete() {
        const doc = this.docToDelete();
        if (doc) {
            this.state.deleteDocument(doc.id);
            this.isDeleteModalOpen.set(false);
            this.docToDelete.set(null);
            // Success toast is already called by state.deleteDocument
        }
    }

    deleteDoc(id: string) {
        this.state.deleteDocument(id);
    }
}
