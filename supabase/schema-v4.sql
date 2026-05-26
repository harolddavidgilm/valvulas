-- ============================================================
-- DDL: Módulo de Empresas (Esquema v4)
-- ============================================================

-- 1. Tabla de Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT    NOT NULL,
  rif         TEXT,
  direccion   TEXT,
  contacto_nombre TEXT,
  contacto_email  TEXT,
  logo_url    TEXT,
  activa      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insertar empresa por defecto "BUSTILLO"
INSERT INTO empresas (nombre, activa)
VALUES ('BUSTILLO', TRUE)
ON CONFLICT DO NOTHING;

-- 3. Vincular perfiles a empresa (un usuario → una empresa)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL;

-- 4. Vincular válvulas a empresa (Opción B — campo directo)
ALTER TABLE valvulas
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL;

-- 5. Asignar todas las válvulas existentes a la empresa BUSTILLO
UPDATE valvulas
SET empresa_id = (SELECT id FROM empresas WHERE nombre = 'BUSTILLO' LIMIT 1)
WHERE empresa_id IS NULL;

-- 6. Permisos
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE empresas TO anon, authenticated;
