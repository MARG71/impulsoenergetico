import { Suspense } from "react";
import AdminEditarContenido from "./AdminEditarContenido";

export default function AdminEditarPage() {
  return (
    <Suspense fallback={<div className="text-white/80">Cargando admin…</div>}>
      <AdminEditarContenido />
    </Suspense>
  );
}
