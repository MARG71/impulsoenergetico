"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectClient({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    // replace para no dejar el /share en historial
    router.replace(to);
  }, [to, router]);

  return null;
}
