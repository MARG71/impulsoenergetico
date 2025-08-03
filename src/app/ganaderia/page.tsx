import GanaderiaContenido from "./GanaderiaContenido";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <GanaderiaContenido />
    </Suspense>
  );
}
