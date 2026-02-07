import { Suspense } from "react";
import ComisionesAsientosContenido from "./ComisionesAsientosContenido";

export default function Page() {
  return (
    <Suspense>
      <ComisionesAsientosContenido />
    </Suspense>
  );
}
