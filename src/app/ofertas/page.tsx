import { Suspense } from "react";
import HomeContenido from "../HomeContenido";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeContenido />
    </Suspense>
  );
}
