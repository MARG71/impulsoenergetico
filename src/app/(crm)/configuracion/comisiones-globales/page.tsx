import { Suspense } from "react";
import ComisionesGlobalesContenido from "./ComisionesGlobalesContenido";

export default function Page() {
  return (
    <Suspense>
      <ComisionesGlobalesContenido />
    </Suspense>
  );
}
