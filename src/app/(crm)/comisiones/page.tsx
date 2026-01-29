import { Suspense } from "react";
import ComisionesContenido from "./ComisionesContenido";

export default function Page() {
  return (
    <Suspense>
      <ComisionesContenido />
    </Suspense>
  );
}
