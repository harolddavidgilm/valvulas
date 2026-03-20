-- Script de Migración Inicial para el Módulo de Técnicos
CREATE TABLE IF NOT EXISTS tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  especialidad TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desahabilitar RLS temporalmente para facilitar el desarrollo inicial
ALTER TABLE tecnicos DISABLE ROW LEVEL SECURITY;

-- Conceder permisos
GRANT ALL ON TABLE tecnicos TO anon, authenticated;
