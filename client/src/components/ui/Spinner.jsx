import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn.js";

export default function Spinner({ className }) {
  return <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />;
}
