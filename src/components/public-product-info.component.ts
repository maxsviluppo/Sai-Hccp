
import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, ProductionRecord, ClientEntity } from '../services/app-state.service';
import { supabase } from '../supabase';

@Component({
  selector: 'app-public-product-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-100 font-sans print:bg-white">
      
      <!-- Top Minimalist Bar (Header) -->
      <div class="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3 flex items-center justify-between print:static print:border-b-2 print:border-slate-100">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 shrink-0">
            @if (client()?.logo) {
              <img [src]="client()?.logo" class="w-full h-full object-contain">
            } @else {
              <i class="fa-solid fa-building text-slate-300"></i>
            }
          </div>
          <div>
            <h1 class="text-sm md:text-base font-black text-slate-900 uppercase tracking-tighter leading-tight">{{ client()?.name }}</h1>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tracciabilità Certificata</p>
          </div>
        </div>
        
        <button (click)="print()" class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-95 print:hidden">
          <i class="fa-solid fa-print text-sm"></i>
        </button>
      </div>

      <!-- Main A4 Paper Content -->
      <div class="max-w-[210mm] mx-auto my-8 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-lg overflow-hidden border border-slate-200 print:shadow-none print:border-none print:my-0 print:w-full">
        
        <!-- Product Identity Hero -->
        <div class="p-8 md:p-16 border-b border-slate-50 bg-white">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div class="space-y-6 max-w-2xl">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sicurezza Alimentare Garantita
              </div>
              <h2 class="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85] italic break-words">
                {{ record()?.mainProductName }}
              </h2>
              <div class="flex flex-wrap gap-x-8 gap-y-3 pt-2">
                <div class="space-y-1">
                  <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Lotto di Produzione</span>
                  <span class="block text-2xl font-mono font-black text-slate-800">{{ record()?.lotto }}</span>
                </div>
                <div class="space-y-1">
                  <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Confezionamento</span>
                  <span class="block text-2xl font-black text-slate-800">{{ record()?.packagingDate | date:'dd.MM.yyyy' }}</span>
                </div>
                <div class="space-y-1">
                  <span class="block text-[10px] font-black text-rose-400 uppercase tracking-widest">Da Consumarsi entro</span>
                  <span class="block text-2xl font-black text-rose-600">{{ record()?.expiryDate | date:'dd.MM.yyyy' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ingredients Section -->
        <div class="p-8 md:p-16 space-y-12 bg-white">
          <div class="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
            <i class="fa-solid fa-list-ul text-2xl text-slate-900"></i>
            <h3 class="text-2xl font-black text-slate-900 uppercase tracking-tight">Elenco Ingredienti e Origine</h3>
          </div>

          <div class="grid grid-cols-1 gap-6">
            @for (ing of record()?.ingredients; track ing.id) {
              <div class="flex items-start gap-6 group">
                <div class="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 text-xl group-hover:bg-teal-50 group-hover:text-teal-500 group-hover:border-teal-100 transition-all shrink-0">
                  <i class="fa-solid fa-box-archive"></i>
                </div>
                <div class="flex-grow pt-1 border-b border-slate-100 pb-6 group-last:border-0">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h4 class="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-teal-600 transition-colors">{{ ing.name }}</h4>
                    <span class="px-3 py-1 bg-slate-900 text-white rounded font-mono text-xs font-bold whitespace-nowrap">Lotto: {{ ing.lotto || 'N/A' }}</span>
                  </div>
                  
                  <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shadow-sm">
                      <i class="fa-solid fa-truck text-[10px]"></i>
                      <span class="text-[11px] font-black uppercase tracking-tight">Fornitore: {{ ing.supplierName || 'N/D' }}</span>
                    </div>
                    
                    @if (ing.allergens && ing.allergens.length > 0) {
                      <div class="flex items-center gap-2">
                        @for (algId of ing.allergens; track algId) {
                          <span class="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                            <i class="fa-solid fa-triangle-exclamation text-[9px]"></i> {{ algId }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Safety Footer Section -->
        <div class="p-8 md:p-16 bg-slate-50 border-t border-slate-100">
          <div class="max-w-3xl space-y-8">
            <div class="flex items-start gap-6">
              <div class="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-emerald-500 text-2xl shrink-0 border border-emerald-50">
                <i class="fa-solid fa-check-double"></i>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">Protocollo di Qualità HACCP</h4>
                <p class="text-xs text-slate-500 leading-relaxed font-medium">
                  Questo certificato attesta che il prodotto è stato manipolato e confezionato nel pieno rispetto degli standard di sicurezza alimentare. 
                  Ogni ingrediente è stato sottoposto a verifica di rintracciabilità e controllo qualità all'origine.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div class="p-4 bg-white rounded-xl border border-slate-200 text-center">
                 <i class="fa-solid fa-dna text-teal-400 mb-2 block"></i>
                 <span class="text-[9px] font-black text-slate-400 uppercase">Filiera</span>
                 <span class="block text-[10px] font-bold text-slate-800">Tracciata</span>
               </div>
               <div class="p-4 bg-white rounded-xl border border-slate-200 text-center">
                 <i class="fa-solid fa-microscope text-teal-400 mb-2 block"></i>
                 <span class="text-[9px] font-black text-slate-400 uppercase">Analisi</span>
                 <span class="block text-[10px] font-bold text-slate-800">Conforme</span>
               </div>
               <div class="p-4 bg-white rounded-xl border border-slate-200 text-center">
                 <i class="fa-solid fa-leaf text-teal-400 mb-2 block"></i>
                 <span class="text-[9px] font-black text-slate-400 uppercase">Qualità</span>
                 <span class="block text-[10px] font-bold text-slate-800">Certificata</span>
               </div>
               <div class="p-4 bg-white rounded-xl border border-slate-200 text-center">
                 <i class="fa-solid fa-shield-halved text-teal-400 mb-2 block"></i>
                 <span class="text-[9px] font-black text-slate-400 uppercase">Standard</span>
                 <span class="block text-[10px] font-bold text-slate-800">ISO/HACCP</span>
               </div>
            </div>
          </div>

          <div class="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Generated by HACCP PRO &copy; 2026</p>
            <div class="flex gap-6 text-slate-400">
               <i class="fa-solid fa-qrcode text-xl"></i>
               <i class="fa-solid fa-lock text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons Footer Mobile -->
      <div class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden">
        <button (click)="print()" class="px-8 py-4 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
          <i class="fa-solid fa-print"></i> Stampa Rapporto
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media print {
      body { background: white !important; }
      .max-w-\\[210mm\\] { 
        margin: 0 !important; 
        box-shadow: none !important; 
        border: none !important; 
        max-width: none !important;
        width: 100% !important;
      }
      .sticky { position: static !important; }
    }
  `]
})
export class PublicProductInfoComponent implements OnInit {
  @Input() lotto: string | null = null;
  
  record = signal<ProductionRecord | null>(null);
  client = signal<ClientEntity | null>(null);
  state = inject(AppStateService);

  async ngOnInit() {
    if (this.lotto) {
      await this.loadData();
    }
  }

  async loadData() {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .select('*')
        .eq('lotto', this.lotto)
        .single();

      if (data) {
        this.record.set({
          id: data.id,
          lotto: data.lotto,
          mainProductName: data.main_product_name,
          packagingDate: data.packaging_date,
          expiryDate: data.expiry_date,
          ingredients: data.ingredients || [],
          userId: data.user_id,
          clientId: data.client_id,
          recordedDate: data.recorded_date
        });

        // Load client info
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', data.client_id)
          .single();
        
        if (clientData) {
          this.client.set({
            id: clientData.id,
            name: clientData.name,
            piva: clientData.piva,
            address: clientData.address,
            phone: clientData.phone,
            email: clientData.email,
            licenseNumber: clientData.license_number,
            suspended: clientData.suspended,
            logo: clientData.logo
          });
        }
      }
    } catch (e) {
      console.error('Error loading public info:', e);
    }
  }

  print() {
    window.print();
  }
}
