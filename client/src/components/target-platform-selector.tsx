import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface TargetPlatformSelectorProps {
  value: "mobile" | "desktop" | "both";
  onChange: (value: "mobile" | "desktop" | "both") => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function TargetPlatformSelector({ 
  value, 
  onChange, 
  label = "Target Platform",
  disabled = false,
  className = ""
}: TargetPlatformSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="target-platform">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="target-platform">
          <SelectValue placeholder="Select target platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desktop">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>Desktop Only</span>
            </div>
          </SelectItem>
          <SelectItem value="mobile">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile Only</span>
            </div>
          </SelectItem>
          <SelectItem value="both">
            <div className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              <span>Both Desktop & Mobile</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        {value === "desktop" && "Widget will only be shown on desktop devices"}
        {value === "mobile" && "Widget will only be shown on mobile devices"}
        {value === "both" && "Widget will be shown on all devices"}
      </p>
    </div>
  );
}