-- ==============================================================================
-- OTTICA PRESTAZIONALE SUPABASE: CARICO MERCI & DISPENSA HACCP
-- Progetto: https://xrbjvisgcrsdbdalpmlw.supabase.co
-- ==============================================================================

-- 1. DISATTIVAZIONE BROADCAST REALTIME SU TABELLE DATI AD ALTO VOLUME (JSON PESANTI)
-- Evita che ogni salvataggio del ddt_pantry o di grossi registri JSON generi traffico
-- di replica WAL e broadcast WebSocket verso tutti i client collegati.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'checklist_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE checklist_records;
    RAISE NOTICE 'checklist_records rimossa da supabase_realtime con successo.';
  ELSE
    RAISE NOTICE 'checklist_records non era presente in supabase_realtime.';
  END IF;
END $$;

-- 2. CREAZIONE INDICI COMPOSITI AD ALTE PRESTAZIONI PER QUERY DISPENSA E REGISTRI
-- Velocizza drasticamente le query filtrate per cliente, modulo (es. 'ddt_pantry') e data o timestamp.

-- Indice composito per record globali o per data (client_id, module_id, date)
CREATE INDEX IF NOT EXISTS idx_checklist_records_composite 
ON checklist_records (client_id, module_id, date);

-- Indice composito per ordinamenti temporali (client_id, module_id, timestamp DESC)
CREATE INDEX IF NOT EXISTS idx_checklist_records_lookup 
ON checklist_records (client_id, module_id, timestamp DESC);

-- Indice GIN opzionale su colonne JSONB per velocizzare ricerche interne (se necessario)
CREATE INDEX IF NOT EXISTS idx_checklist_records_data_gin 
ON checklist_records USING gin (data);

-- 3. VACUUM ANALYZE PER AGGIORNARE LE STATISTICHE DELL'OTTIMIZZATORE POSTGRES
ANALYZE checklist_records;
ANALYZE system_config;
