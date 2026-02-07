import { Suspense } from "react";
import ComisionesLiquidacionesContenido from "./ComisionesLiquidacionesContenido";

export default function Page() {
  return (
    <Suspense>
      <ComisionesLiquidacionesContenido />
    </Suspense>
  );
}
