-- DDL: Actualizaciones de Modelo de Datos (Esquema v2)

-- 1. Ampliación de la tabla Válvulas
ALTER TABLE valvulas
ADD COLUMN IF NOT EXISTS ubicacion TEXT,
ADD COLUMN IF NOT EXISTS serial TEXT,
ADD COLUMN IF NOT EXISTS ano_fabricacion INTEGER,
ADD COLUMN IF NOT EXISTS presion_operacion NUMERIC;

-- 2. Planes de Mantenimiento
CREATE TABLE IF NOT EXISTS planes_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valvula_id UUID REFERENCES valvulas(id) ON DELETE CASCADE,
  tipo_intervencion TEXT NOT NULL, -- Inspección, Prueba, Reparación
  frecuencia_meses INTEGER NOT NULL,
  proxima_fecha DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vincular Órdenes de Trabajo al plan (opcional)
ALTER TABLE ordenes_trabajo
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES planes_mantenimiento(id) ON DELETE SET NULL;

-- 3. Repuestos
CREATE TABLE IF NOT EXISTS repuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- Ej: Resorte, Asiento, Disco
  stock INTEGER DEFAULT 0,
  compatibilidad_modelos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reparaciones
CREATE TABLE IF NOT EXISTS reparaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valvula_id UUID REFERENCES valvulas(id) ON DELETE CASCADE,
  ot_id UUID REFERENCES ordenes_trabajo(id) ON DELETE SET NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  costo_total NUMERIC DEFAULT 0,
  tiempo_horas NUMERIC,
  tecnico TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Relacion Reparaciones - Repuestos (N:N)
CREATE TABLE IF NOT EXISTS reparaciones_repuestos (
  reparacion_id UUID REFERENCES reparaciones(id) ON DELETE CASCADE,
  repuesto_id UUID REFERENCES repuestos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (reparacion_id, repuesto_id)
);

-- 6. Gestión Documental
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo TEXT NOT NULL, -- 'VALVULA', 'OT', 'REPARACION', 'PRUEBA'
  entidad_id UUID NOT NULL,
  tipo_documento TEXT NOT NULL, -- 'Certificado', 'Plano', 'Datasheet'
  nombre_archivo TEXT NOT NULL,
  url_archivo TEXT NOT NULL,
  fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

-- Desactivar RLS temporalmente para pruebas
ALTER TABLE planes_mantenimiento DISABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE reparaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE reparaciones_repuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;

-- Asegurar permisos anon
GRANT ALL ON TABLE planes_mantenimiento TO anon, authenticated;
GRANT ALL ON TABLE repuestos TO anon, authenticated;
GRANT ALL ON TABLE reparaciones TO anon, authenticated;
GRANT ALL ON TABLE reparaciones_repuestos TO anon, authenticated;
GRANT ALL ON TABLE documentos TO anon, authenticated;
