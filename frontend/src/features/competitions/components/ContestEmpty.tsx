import { CalendarX2 } from "lucide-react";
import type { ReactNode } from "react";
import EmptyState from "../../../components/EmptyState";

export default function ContestEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      icon={CalendarX2}
      title={title}
      subtitle={description}
      action={action}
    />
  );
}
