"use client";

import { use } from "react";
import { LiveTable } from "@/components/live-table";

export default function LiveTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LiveTable id={id} />;
}
