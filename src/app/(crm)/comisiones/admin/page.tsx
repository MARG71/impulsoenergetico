import { Suspense } from "react";
import AdminComisionesContenido from "./AdminComisionesContenido";

export default function Page() {
  return (
    <Suspense>
      <AdminComisionesContenido />
    </Suspense>
  );
}
