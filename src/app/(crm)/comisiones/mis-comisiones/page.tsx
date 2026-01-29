import { Suspense } from "react";
import MisComisionesContenido from "./MisComisionesContenido";

export default function Page() {
  return (
    <Suspense>
      <MisComisionesContenido />
    </Suspense>
  );
}
