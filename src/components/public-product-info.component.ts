
import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, ProductionRecord, ClientEntity } from '../services/app-state.service';
import { supabase } from '../supabase';

@Component({
  selector: 'app-public-product-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[#f8fafc] p-4 md:p-12 font-sans print:bg-white print:p-0">
      
      <!-- A4 Paper Layout -->
      <div class="max-w-[210mm] mx-auto bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden print:shadow-none print:rounded-none print:w-full border border-slate-100">
        
        <!-- Premium Header / Enterprise Letterhead -->
        <div class="p-10 md:p-16 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b-[6px] border-teal-500 relative overflow-hidden">
            <!-- Decorative Elements -->
            <div class="absolute right-0 top-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
            <div class="absolute left-0 bottom-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
            
            <div class="relative z-10 flex items-center gap-8">
                <div class="h-24 w-24 md:h-32 md:w-32 bg-white rounded-[2rem] p-3 shadow-2xl flex items-center justify-center shrink-0 ring-4 ring-white/10 group transition-transform hover:scale-105 duration-500">
                    @if (client()?.logo) {
                        <img [src]="client()?.logo" class="w-full h-full object-contain">
                    } @else {
                        <div class="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center">
                            <i class="fa-solid fa-building text-5xl text-slate-200"></i>
                        </div>
                    }
                </div>
                <div>
                    <h1 class="text-3xl md:text-5xl font-black tracking-tight leading-none mb-4 uppercase drop-shadow-sm text-white">
                        {{ client()?.name }}
                    </h1>
                    <div class="flex flex-wrap gap-y-2 gap-x-6">
                        <div class="text-xs md:text-sm font-bold text-slate-400 flex items-center gap-2.5">
                            <span class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px]"><i class="fa-solid fa-location-dot text-teal-400"></i></span> 
                            {{ client()?.address }}
                        </div>
                        <div class="text-xs md:text-sm font-bold text-slate-400 flex items-center gap-2.5">
                            <span class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px]"><i class="fa-solid fa-envelope text-teal-400"></i></span> 
                            {{ client()?.email }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative z-10 text-right md:border-l-[1px] md:border-white/10 md:pl-12">
                <div class="inline-block px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-[10px] font-black text-teal-400 uppercase tracking-[0.25em] mb-4">
                    Scheda Tracciabilità Digitale
                </div>
                <div class="text-4xl md:text-6xl font-mono font-black tracking-tighter text-white">{{ record()?.lotto }}</div>
                <div class="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest opacity-80">ID Certificato: {{ record()?.id?.substring(0,8) }}</div>
            </div>
        </div>

        <!-- Main Content Body -->
        <div class="p-10 md:p-16 space-y-16">
            
            <!-- Hero Product Section -->
            <div class="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-slate-100 pb-12">
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">Qualità Verificata</span>
                    </div>
                    <h2 class="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-[0.9]">{{ record()?.mainProductName }}</h2>
                    <p class="text-base font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <i class="fa-solid fa-shield-check text-emerald-500 text-xl"></i> Conforme Standard HACCP Pro
                    </p>
                </div>
                
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="group bg-[#f8fafc] p-6 rounded-[2rem] border border-slate-100 text-center min-w-[150px] transition-all hover:bg-white hover:shadow-xl hover:border-teal-500/30">
                        <span class="block text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Produzione</span>
                        <span class="block text-2xl font-black text-slate-800">{{ record()?.packagingDate | date:'dd.MM.yyyy' }}</span>
                    </div>
                    <div class="group bg-rose-50 p-6 rounded-[2rem] border border-rose-100 text-center min-w-[150px] transition-all hover:bg-white hover:shadow-xl hover:border-rose-500/30">
                        <span class="block text-[11px] font-black text-rose-400 uppercase mb-2 tracking-widest">Consumarsi entro</span>
                        <span class="block text-2xl font-black text-rose-600">{{ record()?.expiryDate | date:'dd.MM.yyyy' }}</span>
                    </div>
                </div>
            </div>

            <!-- Detailed Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
                
                <!-- Left: Ingredients Trace -->
                <div class="space-y-10">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                            <span class="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center text-lg shadow-lg shadow-teal-500/20">
                                <i class="fa-solid fa-list-check"></i>
                            </span>
                            Ingredienti & Filiera
                        </h3>
                    </div>
                    
                    <div class="space-y-4">
                        @for (ing of record()?.ingredients; track ing.id) {
                            <div class="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex justify-between items-center group hover:border-teal-400 hover:shadow-md transition-all duration-300">
                                <div class="flex items-center gap-5">
                                    <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                                        <i class="fa-solid fa-box-open text-xl"></i>
                                    </div>
                                    <div>
                                        <div class="font-black text-slate-800 text-lg capitalize tracking-tight">{{ ing.name }}</div>
                                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1 flex items-center gap-1.5">
                                            <i class="fa-solid fa-circle-check text-emerald-400"></i> Materia Prima Certificata
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">Lotto Originario</div>
                                    <div class="font-mono text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 inline-block">{{ ing.lotto || 'N/A' }}</div>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Right: Safety & Standards -->
                <div class="space-y-12">
                    <!-- Allergens Premium Card -->
                    <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group">
                        <div class="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                            <i class="fa-solid fa-triangle-exclamation text-9xl"></i>
                        </div>
                        
                        <div class="relative z-10">
                            <h3 class="text-xl font-black uppercase tracking-[0.25em] mb-8 flex items-center gap-4 text-indigo-300">
                                <i class="fa-solid fa-circle-exclamation text-indigo-400 text-2xl"></i>
                                Sicurezza Alimentare
                            </h3>
                            
                            <div class="flex flex-wrap gap-3">
                                @let allergens = getAllergens();
                                @if (allergens.length > 0) {
                                    @for (alg of allergens; track alg) {
                                        <span class="px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">
                                            {{ alg }}
                                        </span>
                                    }
                                } @else {
                                    <div class="w-full flex items-center gap-5 py-6 px-8 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                                        <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                                            <i class="fa-solid fa-shield-check"></i>
                                        </div>
                                        <div>
                                            <div class="text-sm font-black uppercase tracking-widest text-white">Allergeni Assenti</div>
                                            <div class="text-[10px] font-bold text-emerald-400/70 uppercase mt-1">Nessun allergene critico rilevato</div>
                                        </div>
                                    </div>
                                }
                            </div>
                            <p class="mt-10 text-[11px] font-bold text-indigo-300/60 leading-relaxed uppercase tracking-[0.2em]">
                                * Nota: I dati sopra riportati sono tratti dai registri ufficiali di autocontrollo digitale.
                            </p>
                        </div>
                    </div>

                    <!-- Quality Certification -->
                    <div class="p-10 border-2 border-dashed border-slate-200 rounded-[3rem] flex items-center gap-10 transition-all hover:border-teal-500/30 hover:bg-slate-50">
                        <div class="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center text-5xl shrink-0 ring-8 ring-emerald-50 text-emerald-500">
                            <i class="fa-solid fa-certificate"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Garanzia Tracciabilità</h4>
                            <p class="text-sm text-slate-500 font-medium leading-relaxed">
                                Questo documento digitale certifica che il prodotto è stato registrato ed elaborato seguendo i protocolli HACCP Pro, garantendo la trasparenza totale dal fornitore al consumatore finale.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer / System Certification -->
        <div class="p-10 md:p-16 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-10">
            <div class="flex items-center gap-6">
                <div class="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white text-xl">
                    <i class="fa-solid fa-fingerprint"></i>
                </div>
                <div>
                    <div class="text-xs font-black text-white uppercase tracking-[0.3em]">HACCP Pro Logic</div>
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Blockchain Ready Security System</div>
                </div>
            </div>
            
            <div class="flex flex-col items-center md:items-end gap-3">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generato il {{ now | date:'dd/MM/yyyy • HH:mm' }}</div>
                <button (click)="print()" class="print:hidden px-10 py-4 bg-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all shadow-[0_10px_30px_rgba(20,184,166,0.3)] active:scale-95 flex items-center gap-3">
                    <i class="fa-solid fa-print"></i> Stampa Scheda
                </button>
            </div>
        </div>
      </div>

      <!-- Compliance Label -->
      <div class="mt-12 text-center space-y-4 print:hidden">
          <div class="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">SAI Autocontrollo Digitale & Vigil.AI Compliance</div>
          <div class="flex justify-center gap-8 opacity-20 grayscale hover:grayscale-0 transition-all duration-700">
              <i class="fa-solid fa-shield-halved text-2xl text-slate-400"></i>
              <i class="fa-solid fa-server text-2xl text-slate-400"></i>
              <i class="fa-solid fa-microchip text-2xl text-slate-400"></i>
          </div>
      </div>

      <!-- System Credits -->
      <div class="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-50 print:hidden">
          Powered by SAI Autocontrollo Digitale & Vigil.AI
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media print {
        @page { size: A4; margin: 0; }
        body { background: white; }
    }
  `]
})
export class PublicProductInfoComponent implements OnInit {
  @Input() productId!: string;
  
  state = inject(AppStateService);
  
  record = signal<ProductionRecord | null>(null);
  client = signal<ClientEntity | null>(null);
  now = new Date();

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    if (!this.productId) return;

    // Fetch record from Supabase directly for public view
    const { data: rec, error: recError } = await supabase
        .from('production_records')
        .select('*')
        .eq('id', this.productId)
        .single();
    
    if (recError || !rec) {
      console.error('Error fetching production record:', recError);
      return;
    }

    // Map DB fields back to interface if needed (snake_case to camelCase)
    const mappedRecord: ProductionRecord = {
        id: rec.id,
        recordedDate: rec.recorded_date,
        mainProductName: rec.main_product_name,
        packagingDate: rec.packaging_date,
        expiryDate: rec.expiry_date,
        lotto: rec.lotto,
        ingredients: rec.ingredients || [],
        userId: rec.user_id,
        clientId: rec.client_id
    };

    this.record.set(mappedRecord);

    // Fetch client info for logo and address
    const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', mappedRecord.clientId)
        .single();
    
    if (clientData) {
        const mappedClient: ClientEntity = {
            id: clientData.id,
            name: clientData.name,
            piva: clientData.piva,
            address: clientData.address,
            phone: clientData.phone,
            email: clientData.email,
            licenseNumber: clientData.license_number,
            suspended: clientData.suspended,
            logo: clientData.logo,
            pec: clientData.pec
        };
        this.client.set(mappedClient);
    }
  }

  getAllergens(): string[] {
    const rec = this.record();
    if (!rec) return [];
    
    const manual = new Set<string>();
    rec.ingredients.forEach(i => i.allergens?.forEach(a => manual.add(a)));
    
    return Array.from(manual);
  }

  print() {
    window.print();
  }
}
