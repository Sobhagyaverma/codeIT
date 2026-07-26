import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import EmptyState from "../../../components/EmptyState";

type EmptyPracticeProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyPractice({
  title = "No problems found",
  description = "Try changing your search or filters.",
  action,
  className = "",
}: EmptyPracticeProps) {
  return (
    <EmptyState
      icon={BookOpen}
      title={title}
      subtitle={description}
      action={action}
      className={`rounded-xl py-12 ${className}`}
    />
  );
}
