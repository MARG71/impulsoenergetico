-- 1) Quitar el UNIQUE antiguo (si existe)
ALTER TABLE "ReglaComisionGlobal"
  DROP CONSTRAINT IF EXISTS "ReglaComisionGlobal_seccionId_subSeccionId_nivel_key";

-- 2) Quitar también el nuevo si lo llegaste a crear alguna vez
ALTER TABLE "ReglaComisionGlobal"
  DROP CONSTRAINT IF EXISTS "ReglaComisionGlobal_adminId_seccionId_subSeccionId_nivel_key";

-- 3) UNIQUE parcial para reglas TENANT (adminId NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "ReglaComisionGlobal_tenant_unique"
ON "ReglaComisionGlobal" ("adminId","seccionId","subSeccionId","nivel")
WHERE "adminId" IS NOT NULL;

-- 4) UNIQUE parcial para reglas GLOBALES (adminId IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "ReglaComisionGlobal_global_unique"
ON "ReglaComisionGlobal" ("seccionId","subSeccionId","nivel")
WHERE "adminId" IS NULL;
