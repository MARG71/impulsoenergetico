//src/app/(crm)/configuracion/secciones/page.tsx
import { Suspense } from "react";
import SeccionesContenido from "./SeccionesContenido";

export default function Page() {
  return (
    <Suspense>
      <SeccionesContenido />
    </Suspense>
  );
}
