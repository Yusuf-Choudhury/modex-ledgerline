import { Suspense } from "react";
import { getStore } from "@/lib/pm/store";
import { Shell } from "@/components/work/Shell";

export const dynamic = "force-dynamic";

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const s = await getStore();
  const projects = await s.listProjects();
  return (
    <Suspense>
      <Shell projects={projects} mode={s.mode}>{children}</Shell>
    </Suspense>
  );
}
