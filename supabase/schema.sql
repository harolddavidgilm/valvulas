-- Schema for PSV/PRV Valve Management CMMS

-- Enums
CREATE TYPE valvula_tipo AS ENUM ('PSV', 'PRV');
CREATE TYPE normativa_tipo AS ENUM ('ASME I', 'ASME VIII');
CREATE TYPE estado_valvula AS ENUM ('OPERATIVA', 'FUERA_DE_SERVICIO', 'MANTENIMIENTO', 'BAJA');
CREATE TYPE estado_ot AS ENUM ('BORRADOR', 'PROGRAMADA', 'EN_PROGRESO', 'VALIDADA', 'CERRADA');

-- Main Assets Table
CREATE TABLE valvulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    fabricante TEXT,
    modelo TEXT,
    tipo valvula_tipo NOT NULL,
    fluido_servicio TEXT,
    tamano_entrada TEXT,
    tamano_salida TEXT,
    rating_ansi TEXT,
    presion_set NUMERIC NOT NULL,
    cdtp NUMERIC, -- Cold Differential Test Pressure
    mawp NUMERIC, -- Maximum Allowable Working Pressure
    normativa normativa_tipo NOT NULL,
    estado estado_valvula DEFAULT 'OPERATIVA',
    fecha_instalacion DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valvula_id UUID REFERENCES valvulas(id) ON DELETE CASCADE,
    num_ot TEXT UNIQUE NOT NULL,
    tipo_mantenimiento TEXT, -- Preventivo, Correctivo, Calibración
    estado estado_ot DEFAULT 'BORRADOR',
    fecha_programada DATE,
    fecha_ejecucion TIMESTAMPTZ,
    tecnico_asignado TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calibration and Testing
CREATE TABLE pruebas_calibracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ot_id UUID REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    valvula_id UUID REFERENCES valvulas(id),
    fecha_prueba TIMESTAMPTZ DEFAULT NOW(),
    tipo_prueba TEXT, -- Pop Test, Leak Test
    presion_disparo_1 NUMERIC,
    presion_disparo_2 NUMERIC,
    presion_disparo_3 NUMERIC,
    presion_disparo_promedio NUMERIC,
    error_porcentaje NUMERIC,
    tasa_fugas TEXT, -- e.g., "5 bubbles/min"
    conforme BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk-Based Inspection (RBI)
CREATE TABLE rbi_analisis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valvula_id UUID REFERENCES valvulas(id) ON DELETE CASCADE,
    score_pof INTEGER CHECK (score_pof BETWEEN 1 AND 5),
    score_cof INTEGER CHECK (score_cof BETWEEN 1 AND 5),
    nivel_riesgo TEXT, -- Critico, Alto, Medio, Bajo
    intervalo_meses INTEGER,
    proxima_inspeccion DATE,
    fecha_analisis TIMESTAMPTZ DEFAULT NOW()
);

-- History / Audit Log
CREATE TABLE intervenciones_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valvula_id UUID REFERENCES valvulas(id) ON DELETE CASCADE,
    tipo_evento TEXT,
    descripcion TEXT,
    usuario TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW()
);
