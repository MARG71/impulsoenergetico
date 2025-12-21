import { Suspense } from "react";
import AdminsContenido from "./AdminsContenido";

export default function AdminsPage() {
  return (
    <Suspense fallback={<div className="text-white/80">Cargando admins…</div>}>
      <AdminsContenido />
    </Suspense>
  );
}
