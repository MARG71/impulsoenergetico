//src/app/(crm)/comisiones-globales/page.tsx
import { Suspense } from "react";
import ComisionesGlobalesContenido from "./ComisionesGlobalesContenido";

export default function Page() {
  return (
    <Suspense>
      <ComisionesGlobalesContenido />
    </Suspense>
  );
}
