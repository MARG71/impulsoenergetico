import { Suspense } from "react";
import ClientesContenido from "./ClientesContenido";

export default function Page() {
  return (
    <Suspense>
      <ClientesContenido />
    </Suspense>
  );
}
