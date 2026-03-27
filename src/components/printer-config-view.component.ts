
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-printer-config-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in space-y-8 pb-20">
      <!-- HEADER CATEGORIA -->
      <div class="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-12 text-white shadow-2xl">
        <div class="absolute inset-0 opacity-20 pointer-events-none">
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div class="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div class="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center p-6 shadow-inner ring-1 ring-white/30 animate-pulse-slow">
             <i class="fa-solid fa-print text-4xl text-blue-400 drop-shadow-lg"></i>
          </div>
          <div class="text-center md:text-left">
            <h1 class="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white uppercase italic">Dotazioni Hardware</h1>
            <p class="text-blue-200/80 text-lg font-bold max-w-2xl leading-relaxed uppercase tracking-widest text-[11px]">
               Configurazione centralizzata per stampanti termiche e periferiche di rintracciabilità. Ottimizza il tuo workflow di etichettatura.
            </p>
          </div>
        </div>
      </div>

      <!-- MAIN CONFIG CONTENT -->
      <div class="max-w-5xl mx-auto px-4">
        <div class="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          
          <!-- SUB-HEADER -->
          <div class="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-5">
              <div class="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xl ring-1 ring-slate-100">
                 <i class="fa-solid fa-barcode text-2xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Stampante Brother QL-700</h3>
                <p class="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">Stato: <span class="text-emerald-500">Configurazione attiva</span></p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-200 shadow-sm">
                 Driver Verificato &bull; Ready
              </span>
            </div>
          </div>

          <div class="p-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            <!-- LEFT: DOWNLOADS -->
            <div class="space-y-8">
              <div class="flex items-center gap-3">
                 <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                 <h4 class="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Supporto Tecnico</h4>
              </div>

              <div class="bg-slate-50 rounded-3xl p-8 border border-slate-200 relative group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100 overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <i class="fa-solid fa-download text-6xl text-blue-900"></i>
                </div>

                <h5 class="text-lg font-black text-slate-800 mb-4 uppercase italic">Driver Ufficiali Windows</h5>
                <p class="text-sm font-bold text-slate-600 leading-relaxed mb-8">
                   Per garantire la massima velocità e fedeltà di stampa sulle etichette delle tue materie prime, installa i driver ottimizzati.
                </p>

                <div class="grid grid-cols-1 gap-4">
                   <a href="/qd700w650cita.exe" download 
                      class="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg hover:scale-[1.02] active:scale-95 group">
                      <i class="fa-solid fa-download text-base group-hover:bounce transition-transform"></i>
                      DOWNLOAD PER WINDOWS (11/10/8.1)
                   </a>
                   <a href="https://www.brother.it/support/ql700/downloads" target="_blank"
                      class="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-600 rounded-2xl text-xs font-black transition-all group">
                      <i class="fa-solid fa-globe text-base group-hover:rotate-12 transition-transform"></i>
                      PORTALE SUPPORTO BROTHER
                   </a>
                </div>
              </div>

              <div class="p-6 bg-yellow-50/50 rounded-2xl border border-yellow-200/50 flex items-start gap-4">
                 <i class="fa-solid fa-triangle-exclamation text-yellow-500 mt-1"></i>
                 <div>
                    <h6 class="text-[10px] font-black text-yellow-800 uppercase tracking-widest mb-1">Nota importante</h6>
                    <p class="text-[11px] font-bold text-yellow-700/80 leading-relaxed">
                       Senza l'installazione dei driver corretti, l'anteprima di stampa potrebbe non corrispondere al supporto termico inserito nel rotolo.
                    </p>
                 </div>
              </div>
            </div>

            <!-- RIGHT: LABEL FORMAT -->
            <div class="space-y-8 text-white">
               <div class="flex items-center gap-3">
                 <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                 <h4 class="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Formato Consumabile</h4>
               </div>

               <div class="space-y-4">
                  <!-- FORMAT 1 -->
                  <div class="relative group cursor-pointer" (click)="setFormat('62mm')">
                     <div [class]="'absolute inset-0 rounded-[28px] blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500 ' + 
                                (format() === '62mm' ? 'bg-blue-500 opacity-20' : 'bg-slate-400')"></div>
                     <div [class]="'relative flex items-center gap-6 p-6 rounded-[28px] border-3 transition-all duration-300 ' + 
                                (format() === '62mm' ? 'bg-white border-blue-600 shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300')">
                        <div [class]="'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all ' + 
                                   (format() === '62mm' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400')">
                           <i class="fa-solid fa-note-sticky"></i>
                        </div>
                        <div class="flex-1">
                           <span [class]="'block text-sm font-black uppercase tracking-tight ' + (format() === '62mm' ? 'text-slate-800' : 'text-slate-500')">Standard 62mm</span>
                           <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 block group-hover:text-slate-500 transition-colors">Ideale per schede tecniche complete</span>
                        </div>
                        <div [class]="'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ' + 
                                   (format() === '62mm' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white')">
                           @if (format() === '62mm') {
                              <i class="fa-solid fa-check text-xs"></i>
                           }
                        </div>
                     </div>
                  </div>

                  <!-- FORMAT 2 -->
                  <div class="relative group cursor-pointer" (click)="setFormat('30mm')">
                     <div [class]="'absolute inset-0 rounded-[28px] blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500 ' + 
                                (format() === '30mm' ? 'bg-indigo-500 opacity-20' : 'bg-slate-400')"></div>
                     <div [class]="'relative flex items-center gap-6 p-6 rounded-[28px] border-3 transition-all duration-300 ' + 
                                (format() === '30mm' ? 'bg-white border-indigo-600 shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300')">
                        <div [class]="'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all ' + 
                                   (format() === '30mm' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400')">
                           <i class="fa-solid fa-tag"></i>
                        </div>
                        <div class="flex-1">
                           <span [class]="'block text-sm font-black uppercase tracking-tight ' + (format() === '30mm' ? 'text-slate-800' : 'text-slate-500')">Ridotto 30mm</span>
                           <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 block group-hover:text-slate-500 transition-colors">Perfetto per lotto e scadenza rapidi</span>
                        </div>
                        <div [class]="'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ' + 
                                   (format() === '30mm' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white')">
                           @if (format() === '30mm') {
                              <i class="fa-solid fa-check text-xs"></i>
                           }
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <!-- FOOTER ACTIONS -->
          <div class="px-10 py-8 bg-slate-900 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
             <!-- animated background line -->
             <div class="absolute inset-0 bg-blue-500/5 -skew-y-3 translate-y-12"></div>
             
             <div class="relative z-10 flex items-center gap-4">
                <div class="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                <div>
                   <p class="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1">Persistenza Configurazione</p>
                   <p class="text-[10px] font-bold text-slate-400 italic">I parametri verranno sincronizzati su tutti gli uffici operativi.</p>
                </div>
             </div>

             <button (click)="save()" 
                     class="relative z-10 w-full md:w-auto px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl text-sm font-black transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group">
                 <i class="fa-solid fa-cloud-arrow-up text-lg group-hover:animate-bounce"></i>
                 SALVA E SINCRONIZZA HARDWARE
             </button>
          </div>

        </div>

        <!-- INFO CARD -->
        <div class="mt-8 p-10 bg-white rounded-[32px] border border-slate-200 shadow-xl flex items-start gap-8 relative overflow-hidden">
           <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-10 -mt-10"></div>
           <div class="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 relative z-10">
              <i class="fa-solid fa-lightbulb text-2xl"></i>
           </div>
           <div class="relative z-10">
              <h4 class="text-xl font-black text-slate-800 uppercase tracking-tight mb-3 italic">Ottimizzazione Stampa</h4>
              <p class="text-sm font-medium text-slate-500 leading-relaxed">
                 Per le procedure <strong>HACCP Enterprise</strong>, il formato ridotto da 30mm è consigliato per la stampa di etichette interne di batch, mentre il formato 62mm è lo standard per le schede prodotto destinate ai clienti finali o per il censimento magazzino.
              </p>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 4s infinite ease-in-out;
    }
    .bounce {
       animation: bounce 1s infinite;
    }
    @keyframes bounce {
       0%, 100% { transform: translateY(0); }
       50% { transform: translateY(-5px); }
    }
  `]
})
export class PrinterConfigViewComponent {
  state = inject(AppStateService);
  
  format = signal<'62mm' | '30mm'>('62mm');

  constructor() {
    const current = this.state.isAdmin() ? 
                    this.state.adminCompany().labelFormat : 
                    this.state.companyConfig().labelFormat;
    this.format.set(current || '62mm');
  }

  setFormat(f: '62mm' | '30mm') {
    this.format.set(f);
  }

  async save() {
    const updates = {
      labelFormat: this.format()!,
      printerModel: 'Brother QL-700',
      printerDriverUrl: '/qd700w650cita.exe'
    };

    if (this.state.isAdmin()) {
      await this.state.updateAdminCompany({
        ...this.state.adminCompany(),
        ...updates
      });
    } else {
      await this.state.updateCurrentCompany(updates);
    }
  }
}
