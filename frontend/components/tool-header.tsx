import { Badge } from "@/components/ui/badge";

export function ToolHeader({
  icon: Icon, title, subtitle, provider,
}: {
  icon: any; title: string; subtitle: string; provider?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-800">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {provider && <Badge variant={provider === "mock" ? "secondary" : "success"}>{provider === "mock" ? "Demo AI" : provider}</Badge>}
        </div>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
