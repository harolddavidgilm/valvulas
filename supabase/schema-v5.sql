-- ============================================================
-- DDL: Módulo de Configuración (Clasificaciones + Unidades/Sistema)
-- Schema v5
-- ============================================================

-- 1. Tabla de Clasificaciones de Activos (global)
CREATE TABLE IF NOT EXISTS clasificaciones (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT    NOT NULL UNIQUE,
  descripcion TEXT,
  color       TEXT    DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Unidades / Sistemas de planta (por empresa)
CREATE TABLE IF NOT EXISTS unidades_sistema (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT    NOT NULL,
  tag         TEXT,
  descripcion TEXT,
  empresa_id  UUID    REFERENCES empresas(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vincular activos con clasificación y unidad
ALTER TABLE valvulas
  ADD COLUMN IF NOT EXISTS clasificacion_id UUID REFERENCES clasificaciones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unidad_sistema_id UUID REFERENCES unidades_sistema(id) ON DELETE SET NULL;

-- 4. Datos semilla: clasificaciones comunes en plantas industriales
INSERT INTO clasificaciones (nombre, descripcion, color) VALUES
  ('Válvulas',         'Válvulas de seguridad, control y alivio de presión', '#6366f1'),
  ('Bombas',           'Bombas centrífugas, reciprocantes y de desplazamiento positivo', '#0ea5e9'),
  ('Tanques',          'Tanques de almacenamiento atmosférico y a presión', '#10b981'),
  ('Compresores',      'Compresores de gas, aire e instrumentos', '#f59e0b'),
  ('Intercambiadores', 'Intercambiadores de calor, condensadores y reboilers', '#ef4444'),
  ('Tuberías',         'Líneas de proceso, cabezales y colectores', '#8b5cf6'),
  ('Instrumentos',     'Transmisores, sensores y elementos primarios de medición', '#06b6d4')
ON CONFLICT (nombre) DO NOTHING;

-- 5. Permisos (RLS desactivado, acceso directo autenticado)
ALTER TABLE clasificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_sistema DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE clasificaciones TO anon, authenticated;
GRANT ALL ON TABLE unidades_sistema TO anon, authenticated;
