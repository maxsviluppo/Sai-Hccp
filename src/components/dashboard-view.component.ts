
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Welcome Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Bentornato, {{ state.currentUser()?.name }}</h2>
          <p class="text-slate-500">Panoramica delle attività HACCP di oggi.</p>
        </div>
        <div class="hidden md:block">
           <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
             <i class="fa-solid fa-check-circle mr-2"></i> Sistema Operativo
           </span>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card 1 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i class="fa-solid fa-temperature-half text-6xl text-blue-600"></i>
          </div>
          <p class="text-slate-500 text-sm font-medium">Controlli Temp. Oggi</p>
          <p class="text-3xl font-bold text-slate-800 mt-2">12/14</p>
          <p class="text-xs text-orange-500 mt-2 font-medium"><i class="fa-solid fa-clock"></i> 2 in attesa</p>
        </div>

        <!-- Card 2 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i class="fa-solid fa-triangle-exclamation text-6xl text-red-600"></i>
          </div>
          <p class="text-slate-500 text-sm font-medium">Non Conformità</p>
          <p class="text-3xl font-bold text-slate-800 mt-2">0</p>
          <p class="text-xs text-emerald-500 mt-2 font-medium"><i class="fa-solid fa-check"></i> Tutto nella norma</p>
        </div>

        <!-- Card 3 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i class="fa-solid fa-truck-field text-6xl text-purple-600"></i>
          </div>
          <p class="text-slate-500 text-sm font-medium">Fornitori Attivi</p>
          <p class="text-3xl font-bold text-slate-800 mt-2">24</p>
          <p class="text-xs text-slate-400 mt-2 font-medium">Aggiornato ieri</p>
        </div>

        <!-- Card 4 -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i class="fa-solid fa-users text-6xl text-indigo-600"></i>
          </div>
          <p class="text-slate-500 text-sm font-medium">Personale in Turno</p>
          <p class="text-3xl font-bold text-slate-800 mt-2">8</p>
          <p class="text-xs text-blue-500 mt-2 font-medium cursor-pointer hover:underline">Vedi dettagli</p>
        </div>
      </div>

      <!-- Recent Activity / Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Actions -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="font-bold text-lg text-slate-800 mb-4">Azioni Rapide</h3>
          <div class="space-y-3">
             <button class="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center transition-colors group"
                (click)="state.setModule('temp-control')">
               <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                 <i class="fa-solid fa-plus"></i>
               </div>
               <span class="font-medium text-slate-700">Registra Temperatura</span>
             </button>

             <button class="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center transition-colors group"
                (click)="state.setModule('non-compliance')">
               <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                 <i class="fa-solid fa-triangle-exclamation"></i>
               </div>
               <span class="font-medium text-slate-700">Segnala Non Conformità</span>
             </button>

             <button class="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center transition-colors group"
                (click)="state.setModule('goods-receipt')">
               <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                 <i class="fa-solid fa-box"></i>
               </div>
               <span class="font-medium text-slate-700">Nuovo Arrivo Merce</span>
             </button>
          </div>
        </div>

        <!-- Notifications/Alerts -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 class="font-bold text-lg text-slate-800 mb-4">Avvisi & Scadenze</h3>
          <div class="space-y-4">
            <div class="flex items-start p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <i class="fa-solid fa-clock text-yellow-600 mt-1 mr-3"></i>
              <div>
                <p class="text-sm font-bold text-yellow-800">Manutenzione Abbattitore</p>
                <p class="text-sm text-yellow-700">Scadenza prevista tra 3 giorni. Contattare tecnico per revisione periodica.</p>
              </div>
            </div>
             <div class="flex items-start p-3 bg-red-50 rounded-lg border border-red-100">
              <i class="fa-solid fa-fire-extinguisher text-red-600 mt-1 mr-3"></i>
              <div>
                <p class="text-sm font-bold text-red-800">Formazione Antincendio</p>
                <p class="text-sm text-red-700">Il certificato di Mario Rossi scade il 25/05/2024.</p>
              </div>
            </div>
            <div class="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
              <i class="fa-solid fa-file-signature text-blue-600 mt-1 mr-3"></i>
              <div>
                <p class="text-sm font-bold text-blue-800">Rinnovo Contratto Fornitore</p>
                <p class="text-sm text-blue-700">Contratto "Forniture Globali Srl" in scadenza mese prossimo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardViewComponent {
  state = inject(AppStateService);
}
