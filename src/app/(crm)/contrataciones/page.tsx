import { Suspense } from "react";
import ContratacionesContenido from "./ContratacionesContenido";

export default function Page() {
  return (
    <Suspense>
      <ContratacionesContenido />
    </Suspense>
  );
}
