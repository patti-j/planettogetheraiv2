import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  BarChart3, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  TrendingDown 
} from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: "briefcase" | "chart-line" | "exclamation-triangle" | "clock";
  color: "blue" | "green" | "red" | "orange";
  showProgress?: boolean;
  progressValue?: number;
}

const iconMap = {
  briefcase: Briefcase,
  "chart-line": BarChart3,
  "exclamation-triangle": AlertTriangle,
  clock: Clock,
};

const colorMap = {
  blue: {
    bg: "bg-blue-100",
    text: "text-primary",
    accent: "text-accent",
  },
  green: {
    bg: "bg-green-100",
    text: "text-accent",
    accent: "text-accent",
  },
  red: {
    bg: "bg-red-100",
    text: "text-error",
    accent: "text-error",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-warning",
    accent: "text-accent",
  },
};

export default function MetricsCard({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  showProgress = false,
  progressValue = 0 
}: MetricsCardProps) {
  const Icon = iconMap[icon];
  const colors = colorMap[color];
  const isPositive = change?.includes("+") || change?.includes("improved");
  const isNegative = change?.includes("attention") || change?.includes("Requires");

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
        </div>
        
        {showProgress && (
          <div className="mt-2">
            <Progress value={progressValue} className="h-2" />
          </div>
        )}
        
        {change && !showProgress && (
          <div className="mt-2 flex items-center">
            {isPositive && <TrendingUp className="w-4 h-4 mr-1 text-accent" />}
            {isNegative && <TrendingDown className="w-4 h-4 mr-1 text-error" />}
            <span className={`text-sm ${
              isPositive ? colors.accent : 
              isNegative ? "text-error" : 
              colors.accent
            }`}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
