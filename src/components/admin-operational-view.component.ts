import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { PreOperationalChecklistComponent } from './checklists/pre-operative.component';
import { OperativeChecklistComponent } from './checklists/operative.component';
import { PostOperationalChecklistComponent } from './checklists/post-operative.component';

@Component({
  selector: 'app-admin-operational-view',
  standalone: true,
  imports: [
    CommonModule,
    PreOperationalChecklistComponent,
    OperativeChecklistComponent,
    PostOperationalChecklistComponent
  ],
  template: `
    <div class="space-y-10 pb-16 max-w-7xl mx-auto p-4">
      
      <!-- Top Banner for Admin -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-center gap-5 relative z-10">
          <div class="h-14 w-14 bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-inner">
             <i class="fa-solid fa-layer-group text-2xl"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider">Vista Amministratore</span>
              <span class="text-slate-400 text-xs font-medium">• Consultazione & Modifica</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">Monitoraggio Fasi Operative</h1>
            <p class="text-slate-400 text-xs mt-0.5">Gestione unificata di tutte le 3 fasi di controllo con capacità di intervento diretto sui dati.</p>
          </div>
        </div>

        <div class="relative z-10 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-md">
          <i class="fa-solid fa-circle-info text-indigo-400 text-base"></i>
          <span class="text-xs text-slate-300 font-medium max-w-xs">
            Le modifiche effettuate dall'Amministratore in queste sezioni vengono salvate in tempo reale nel registro HACCP.
          </span>
        </div>
      </div>

      <!-- SEZIONE 1: FASE PRE-OPERATIVA -->
      <section class="bg-white rounded-3xl shadow-lg border border-purple-100 overflow-hidden relative">
        <div class="bg-gradient-to-r from-purple-900 to-indigo-900 px-8 py-5 text-white flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <i class="fa-solid fa-clipboard-check text-xl"></i>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-widest text-purple-300">FASE 1</div>
              <h2 class="text-xl font-black tracking-tight">Fase Pre-Operativa (Ispezione & Avvio)</h2>
            </div>
          </div>
          <span class="text-xs font-semibold px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-200">
            Controlli di Avvio
          </span>
        </div>

        <div class="p-4 md:p-6 bg-slate-50/50">
          <app-pre-operative-checklist />
        </div>
      </section>

      <!-- SEZIONE 2: FASE OPERATIVA -->
      <section class="bg-white rounded-3xl shadow-lg border border-amber-100 overflow-hidden relative">
        <div class="bg-gradient-to-r from-amber-900 to-orange-950 px-8 py-5 text-white flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <i class="fa-solid fa-briefcase text-xl"></i>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-widest text-amber-300">FASE 2</div>
              <h2 class="text-xl font-black tracking-tight">Fase Operativa (Monitoraggio Lavorazione)</h2>
            </div>
          </div>
          <span class="text-xs font-semibold px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-200">
            Monitoraggio Processo
          </span>
        </div>

        <div class="p-4 md:p-6 bg-slate-50/50">
          <app-operative-checklist />
        </div>
      </section>

      <!-- SEZIONE 3: FASE POST-OPERATIVA -->
      <section class="bg-white rounded-3xl shadow-lg border border-emerald-100 overflow-hidden relative">
        <div class="bg-gradient-to-r from-emerald-900 to-teal-950 px-8 py-5 text-white flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <i class="fa-solid fa-hourglass-end text-xl"></i>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300">FASE 3</div>
              <h2 class="text-xl font-black tracking-tight">Fase Post-Operativa (Chiusura & Sanificazione)</h2>
            </div>
          </div>
          <span class="text-xs font-semibold px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-200">
            Sanificazione Finale
          </span>
        </div>

        <div class="p-4 md:p-6 bg-slate-50/50">
          <app-post-operative-checklist />
        </div>
      </section>

    </div>
  `
})
export class AdminOperationalViewComponent {
  state = inject(AppStateService);
}
