import { Suspense } from "react";
import ComisionesInformeContenido from "./ComisionesInformeContenido";

export default function Page() {
  return (
    <Suspense>
      <ComisionesInformeContenido />
    </Suspense>
  );
}
