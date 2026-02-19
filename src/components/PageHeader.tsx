import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: ReactNode;
}

const PageHeader = ({ title, description, icon: Icon, action }: PageHeaderProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
