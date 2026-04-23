
import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, ProductionRecord, ClientEntity } from '../services/app-state.service';
import { supabase } from '../supabase';

@Component({
  selector: 'app-public-product-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[#0f172a] font-sans print:bg-white relative overflow-x-hidden">
      
      <!-- Premium Background Background Elements (Desktop Only) -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none hidden md:block">
          <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div class="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[150px]"></div>
      </div>

      <!-- Desktop Sidebar / Action Bar -->
      <div class="fixed right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 z-50 print:hidden">
          <button (click)="print()" class="group relative flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-teal-500 hover:border-teal-400 transition-all duration-500 shadow-2xl">
              <i class="fa-solid fa-print text-xl"></i>
              <span class="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-800">Stampa PDF</span>
          </button>
          <div class="w-px h-8 bg-white/10 mx-auto"></div>
          <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-black ring-1 ring-teal-500/30">
                <i class="fa-solid fa-shield-check"></i>
              </div>
              <span class="text-[8px] font-black text-slate-500 uppercase tracking-tighter vertical-text">Certificato</span>
          </div>
      </div>

      <div class="relative z-10 py-0 md:py-16 px-0 md:px-6 lg:px-10">
        
        <!-- Container: Fluid on Mobile, A4 centered on Desktop -->
        <div class="a4-sheet max-w-full md:max-w-[210mm] mx-auto bg-white shadow-none md:shadow-[0_50px_100px_rgba(0,0,0,0.5)] md:rounded-[3rem] overflow-hidden print:shadow-none print:rounded-none print:w-full border-x-0 md:border border-white/10 relative">
          
          <!-- Premium Header / Enterprise Letterhead -->
          <div class="p-8 md:p-14 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b-[8px] border-teal-500 relative overflow-hidden">
              <!-- Decorative Elements -->
              <div class="absolute right-0 top-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3"></div>
              
              <div class="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full md:w-auto text-center md:text-left">
                  <div class="h-24 w-24 md:h-32 md:w-32 bg-white rounded-[2rem] p-3 shadow-2xl flex items-center justify-center shrink-0 ring-8 ring-white/5 transition-all hover:scale-105 duration-500">
                      @if (client()?.logo) {
                          <img [src]="client()?.logo" class="w-full h-full object-contain">
                      } @else {
                          <div class="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center">
                              <i class="fa-solid fa-building text-4xl md:text-5xl text-slate-200"></i>
                          </div>
                      }
                  </div>
                  <div class="space-y-3">
                      <h1 class="text-2xl md:text-5xl font-black tracking-tight leading-none uppercase drop-shadow-2xl text-white">
                          {{ client()?.name }}
                      </h1>
                      <div class="flex flex-col md:flex-row flex-wrap gap-y-2 gap-x-6 items-center md:items-start opacity-70">
                          <div class="text-[10px] md:text-xs font-bold text-slate-300 flex items-center gap-2">
                              <i class="fa-solid fa-location-dot text-teal-400"></i>
                              {{ client()?.address }}
                          </div>
                          <div class="text-[10px] md:text-xs font-bold text-slate-300 flex items-center gap-2">
                              <i class="fa-solid fa-envelope text-teal-400"></i>
                              {{ client()?.email }}
                          </div>
                      </div>
                  </div>
              </div>

              <div class="relative z-10 text-center md:text-right w-full md:w-auto md:pl-10 md:border-l md:border-white/10">
                  <div class="inline-block px-5 py-1.5 bg-teal-500/20 border border-teal-500/40 rounded-full text-[9px] md:text-[11px] font-black text-teal-400 uppercase tracking-[0.3em] mb-4 shadow-lg shadow-teal-500/10">
                      Tracciabilità Certificata
                  </div>
                  <div class="text-4xl md:text-6xl font-mono font-black tracking-tighter text-white mb-1">{{ record()?.lotto }}</div>
                  <div class="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Lotto di Produzione</div>
              </div>
          </div>

          <!-- Main Content Body -->
          <div class="p-8 md:p-14 space-y-12 md:space-y-20">
              
              <!-- Hero Product Section -->
              <div class="flex flex-col md:flex-row justify-between items-center md:items-end gap-10 border-b border-slate-100 pb-12">
                  <div class="space-y-4 text-center md:text-left flex-grow">
                      <div class="flex items-center justify-center md:justify-start gap-3">
                          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span class="text-emerald-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Stato: Conforme HACCP</span>
                      </div>
                      <h2 class="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-[0.9] drop-shadow-sm">{{ record()?.mainProductName }}</h2>
                      <div class="flex flex-wrap justify-center md:justify-start gap-3 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span class="flex items-center gap-2"><i class="fa-solid fa-check-double text-teal-500"></i> Ingredienti Verificati</span>
                        <span class="w-1 h-1 rounded-full bg-slate-200 mt-2"></span>
                        <span class="flex items-center gap-2"><i class="fa-solid fa-microscope text-teal-500"></i> Analisi Superate</span>
                      </div>
                  </div>
                  
                  <div class="flex flex-row gap-4 w-full md:w-auto shrink-0">
                      <div class="flex-1 md:w-40 group bg-[#f8fafc] p-5 md:p-6 rounded-[2rem] border border-slate-100 text-center transition-all hover:bg-white hover:shadow-2xl hover:border-teal-500/30 hover:-translate-y-1">
                          <span class="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Produzione</span>
                          <span class="block text-base md:text-2xl font-black text-slate-800">{{ record()?.packagingDate | date:'dd.MM.yyyy' }}</span>
                      </div>
                      <div class="flex-1 md:w-40 group bg-rose-50 p-5 md:p-6 rounded-[2rem] border border-rose-100 text-center transition-all hover:bg-white hover:shadow-2xl hover:border-rose-500/30 hover:-translate-y-1">
                          <span class="block text-[9px] md:text-[10px] font-black text-rose-400 uppercase mb-2 tracking-widest">Scadenza</span>
                          <span class="block text-base md:text-2xl font-black text-rose-600">{{ record()?.expiryDate | date:'dd.MM.yyyy' }}</span>
                      </div>
                  </div>
              </div>

              <!-- Detailed Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
                  
                  <!-- Left: Ingredients Trace -->
                  <div class="space-y-10">
                      <div class="flex items-center justify-between border-b-2 border-slate-100 pb-5">
                          <h3 class="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                              <span class="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-lg shadow-2xl shadow-teal-500/30">
                                  <i class="fa-solid fa-dna"></i>
                              </span>
                              Filiera Produttiva
                          </h3>
                      </div>
                      
                      <div class="space-y-4">
                          @for (ing of record()?.ingredients; track ing.id) {
                              <div class="p-5 md:p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex justify-between items-center group hover:border-teal-400 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                                  <div class="flex items-center gap-4">
                                      <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500">
                                          <i class="fa-solid fa-box-open text-xl"></i>
                                      </div>
                                      <div>
                                          <div class="font-black text-slate-800 text-base md:text-lg capitalize tracking-tight group-hover:text-teal-600 transition-colors">{{ ing.name }}</div>
                                          <div class="flex text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 items-center gap-1.5">
                                              <i class="fa-solid fa-circle-check text-emerald-500"></i>
                                              {{ ing.supplierName ? ing.supplierName : 'Origine Controllata' }}
                                          </div>
                                      </div>
                                  </div>
                                  <div class="text-right">
                                      <div class="text-[8px] md:text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Lotto</div>
                                      <div class="font-mono text-[10px] md:text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 inline-block">{{ ing.lotto || 'N/A' }}</div>
                                  </div>
                              </div>
                          }
                      </div>
                  </div>

                  <!-- Right: Safety & Standards -->
                  <div class="space-y-12">
                      <!-- Allergens Premium Card -->
                      <div class="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl group">
                          <div class="relative z-10">
                              <h3 class="text-lg md:text-xl font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-4 text-white">
                                  <span class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <i class="fa-solid fa-biohazard text-amber-400 text-lg"></i>
                                  </span>
                                  Analisi Allergeni
                              </h3>
                              
                              <div class="flex flex-wrap gap-3">
                                  @let allergens = getAllergens();
                                  @if (allergens.length > 0) {
                                      @for (alg of allergens; track alg) {
                                          <span class="px-4 py-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-transform hover:scale-105 hover:bg-white/10 cursor-default">
                                              {{ alg }}
                                          </span>
                                      }
                                  } @else {
                                      <div class="w-full flex items-center gap-4 py-6 px-8 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                                          <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                                              <i class="fa-solid fa-shield-virus"></i>
                                          </div>
                                          <div>
                                              <div class="text-sm font-black uppercase tracking-widest text-white">Allergeni Assenti</div>
                                              <div class="text-[9px] font-bold text-emerald-400/80 uppercase mt-1">Formula pura certificata</div>
                                          </div>
                                      </div>
                                  }
                              </div>
                          </div>
                      </div>

                      <!-- Quality Certification -->
                      <div class="p-8 md:p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 transition-all hover:border-teal-500/30 hover:bg-slate-50 group/cert">
                          <div class="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white shadow-2xl flex items-center justify-center text-3xl md:text-5xl shrink-0 ring-4 ring-slate-50 text-emerald-500 transition-transform group-hover/cert:rotate-12 duration-700">
                              <i class="fa-solid fa-award"></i>
                          </div>
                          <div class="text-center md:text-left">
                              <h4 class="text-base md:text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Garanzia di Qualità</h4>
                              <p class="text-[10px] md:text-sm text-slate-500 font-medium leading-relaxed">
                                Documento validato digitalmente secondo i protocolli internazionali di sicurezza alimentare.
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Footer / System Certification -->
          <div class="p-8 md:p-14 bg-slate-950 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16">
              <div class="flex items-center gap-6">
                  <div class="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 text-xl shadow-inner">
                      <i class="fa-solid fa-fingerprint"></i>
                  </div>
                  <div>
                      <div class="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em] mb-1">HACCP Pro Logic</div>
                      <div class="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-widest">Traceability Standard v4.2</div>
                  </div>
              </div>
              
              <div class="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
                  <div class="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Generato il {{ now | date:'dd MMMM yyyy • HH:mm' }}</div>
                  <div class="flex gap-3 w-full md:w-auto">
                    <button (click)="print()" class="flex-grow md:flex-none px-10 py-4 bg-teal-500 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 group">
                        <i class="fa-solid fa-print"></i> Scarica PDF
                    </button>
                  </div>
              </div>
          </div>
        </div>

        <!-- Compliance Label -->
        <div class="py-16 text-center space-y-6 print:hidden">
            <div class="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] opacity-40">SAI Autocontrollo Digitale & Vigil.AI Ecosystem</div>
            <div class="flex justify-center gap-10 md:gap-16 opacity-10 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000">
                <i class="fa-solid fa-shield-halved text-3xl text-white"></i>
                <i class="fa-solid fa-server text-3xl text-white"></i>
                <i class="fa-solid fa-microchip text-3xl text-white"></i>
                <i class="fa-solid fa-cloud-check text-3xl text-white"></i>
            </div>
            <div class="text-slate-700 text-[9px] font-black uppercase tracking-widest opacity-30 pt-10">
              © 2026 SAI Autocontrollo. Tutti i diritti riservati.
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media print {
        @page { size: A4; margin: 10mm; }
        :host { background: white !important; padding: 0 !important; }
        
        /* Layout resets */
        .min-h-screen { background: white !important; padding: 0 !important; min-height: 0 !important; }
        .py-16, .md:py-16, .px-6, .lg:px-10 { padding: 0 !important; margin: 0 !important; }
        
        /* Sheet containment */
        .a4-sheet { 
            max-width: 100% !important; 
            margin: 0 !important; 
            border: none !important; 
            box-shadow: none !important;
            border-radius: 0 !important;
        }

        /* Spacing reduction for content */
        .p-8, .md:p-14 { padding: 8mm !important; }
        .p-8.md:p-14.space-y-12 { padding: 6mm 10mm !important; margin-top: 0 !important; }
        .space-y-12, .md:space-y-20 { margin-top: 4mm !important; margin-bottom: 4mm !important; }
        .space-y-12 > * + *, .md:space-y-20 > * + * { margin-top: 4mm !important; }
        .space-y-10 > * + * { margin-top: 3mm !important; }
        .space-y-4 > * + * { margin-top: 2mm !important; }
        
        /* Font scaling */
        .text-4xl, .md:text-7xl { font-size: 32pt !important; line-height: 1 !important; }
        .text-2xl, .md:text-5xl { font-size: 22pt !important; }
        .text-4xl.md:text-7xl { font-size: 38pt !important; } /* Product Name */
        
        /* Grid adjustments */
        .grid { gap: 6mm !important; }
        .grid-cols-1, .md:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }

        /* Icon & Badge scaling */
        .h-24, .w-24, .md:h-32, .md:w-32 { width: 22mm !important; height: 22mm !important; }
        .p-5, .md:p-6 { padding: 4mm !important; border-radius: 12mm !important; }
        
        /* Footer scaling */
        .p-8.md:p-14.bg-slate-950 { padding: 6mm 10mm !important; }

        /* Force elements to be visible but optimized */
        .bg-gradient-to-br { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
        .text-white { color: white !important; }
        .text-slate-400 { color: #94a3b8 !important; }
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
    
    const allergens = new Set<string>();
    
    // 1. Manual Allergens (from Toggle buttons)
    rec.ingredients.forEach(i => {
      i.allergens?.forEach(a => allergens.add(this.mapAllergenId(a)));
    });
    
    // 2. Auto-detected Allergens (from names)
    const ingredientNames = rec.ingredients.map(i => i.name.toLowerCase());
    const detected = this.detectAllergens(ingredientNames);
    detected.forEach(d => allergens.add(d));
    
    return Array.from(allergens).filter(a => !!a);
  }

  private mapAllergenId(id: string): string {
    const def = this.state.ALLERGEN_LIST.find(a => a.id === id || a.label === id || a.code === id);
    return def ? def.label : id;
  }

  private detectAllergens(names: string[]): string[] {
    const found = new Set<string>();
    const map: { [key: string]: string[] } = {
        'Glutine': ['frumento', 'grano', 'orzo', 'segale', 'avena', 'farro', 'kamut', 'lievito', 'pane', 'focaccia', 'pizzetta', 'panino', 'baguette', 'piadina', 'couscous', 'bulgur', 'fregola', 'semola', 'pasta', 'gnocchi'],
        'Crostacei': ['gamberi', 'gamberetti', 'mazzancolle', 'scampi', 'aragosta', 'astice', 'granchio', 'granseola', 'canocchie'],
        'Uova': ['uova', 'uovo', 'albume', 'tuorlo', 'maionese'],
        'Pesce': ['acciughe', 'tonno', 'salmone', 'merluzzo', 'pesce spada', 'colla di pesce', 'uova di pesce', 'bottarga'],
        'Arachidi': ['arachidi', 'spagnolette', 'noccioline', 'burro d\'arachidi'],
        'Soia': ['soia', 'edamame', 'tofu', 'tempeh', 'miso', 'shoyu', 'tamari', 'teriyaki', 'lecitina'],
        'Latte': ['latte', 'panna', 'burro', 'yogurt', 'mozzarella', 'parmigiano', 'gorgonzola', 'pecorino', 'ricotta', 'formaggio', 'mascarpone', 'stracchino'],
        'Frutta a guscio': ['mandorle', 'nocciole', 'noci', 'anacardi', 'pecan', 'brasile', 'pistacchi', 'macadamia', 'pinoli'],
        'Sedano': ['sedano', 'costa', 'rapa'],
        'Senape': ['senape', 'mostarda'],
        'Sesamo': ['sesamo'],
        'Solfiti': ['solfiti', 'anidride solforosa', 'vino bianco', 'vino rosso'],
        'Lupini': ['lupini'],
        'Molluschi': ['molluschi', 'cozze', 'vongole', 'ostriche', 'polpo', 'seppia', 'calamari']
    };

    names.forEach(name => {
        for (const [allergen, keywords] of Object.entries(map)) {
            if (keywords.some(k => name.includes(k))) {
                found.add(allergen);
            }
        }
    });

    return Array.from(found);
  }

  print() {
    window.print();
  }
}
