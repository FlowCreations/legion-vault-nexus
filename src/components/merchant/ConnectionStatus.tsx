import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  status: "active" | "invalid" | "not_configured";
  loading?: boolean;
}

export const ConnectionStatus = ({ status, loading }: ConnectionStatusProps) => {
  if (loading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  switch (status) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Connected
        </Badge>
      );
    case "invalid":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Invalid
        </Badge>
      );
    case "not_configured":
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Not Configured
        </Badge>
      );
  }
};
