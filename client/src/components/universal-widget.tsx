import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Settings,
  Eye,
  EyeOff,
  X,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { WidgetConfig, WidgetDataProcessor, SystemData } from '@/lib/widget-library';
import ScheduleOptimizationWidget from '@/components/schedule-optimization-widget';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface UniversalWidgetProps {
  config: WidgetConfig;
  data: SystemData;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onToggle?: (id: string) => void;
  onRefresh?: (id: string) => void;
  readOnly?: boolean;
  showControls?: boolean;
  className?: string;
}

export default function UniversalWidget({
  config,
  data,
  onEdit,
  onRemove,
  onToggle,
  onRefresh,
  readOnly = false,
  showControls = true,
  className = ""
}: UniversalWidgetProps) {
  const processor = new WidgetDataProcessor(data);
  const widgetData = useMemo(() => processor.processWidgetData(config), [config, data]);

  const renderKPIWidget = () => {
    if (!widgetData) return <div className="text-center text-muted-foreground">No data available</div>;
    
    const { value, label, change, trend } = widgetData;
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {change && (
            <div className={`flex items-center justify-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              {change}
            </div>
          )}
        </div>
        {widgetData.items && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Items</p>
            {widgetData.items.slice(0, 3).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="truncate">{item.name || `Item ${item.id}`}</span>
                <Badge variant="outline" className="text-xs">
                  {item.status || item.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderChartWidget = () => {
    if (!widgetData || !widgetData.chartData) {
      return <div className="text-center text-muted-foreground">No chart data available</div>;
    }

    // Ensure chartData has proper structure for Chart.js
    const { chartData } = widgetData;
    if (!chartData || !chartData.datasets || !Array.isArray(chartData.datasets)) {
      return <div className="text-center text-muted-foreground">Invalid chart data structure</div>;
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            boxWidth: 12,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          titleFont: {
            size: 12
          },
          bodyFont: {
            size: 11
          }
        }
      },
      scales: config.chartType === 'pie' || config.chartType === 'doughnut' ? undefined : {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 10
            }
          }
        }
      }
    };

    const chartHeight = "200px";

    try {
      return (
        <div style={{ height: chartHeight }}>
          {config.chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
          {config.chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          {config.chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
          {(config.chartType === 'line' || config.chartType === 'area') && <Line data={chartData} options={chartOptions} />}
          {!config.chartType && <Bar data={chartData} options={chartOptions} />}
        </div>
      );
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <div className="text-center text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Chart unavailable</p>
        </div>
      );
    }
  };

  const renderTableWidget = () => {
    if (!widgetData || !widgetData.columns || !widgetData.rows) {
      return <div className="text-center text-muted-foreground">No table data available</div>;
    }

    return (
      <ScrollArea className="h-48">
        <Table>
          <TableHeader>
            <TableRow>
              {widgetData.columns.map((col: any) => (
                <TableHead key={col.key} className="text-xs">{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {widgetData.rows.map((row: any, index: number) => (
              <TableRow key={index}>
                {widgetData.columns.map((col: any) => (
                  <TableCell key={col.key} className="text-xs">
                    {col.key === 'status' ? (
                      <Badge variant="outline" className="text-xs">
                        {row[col.key]}
                      </Badge>
                    ) : col.key === 'priority' ? (
                      <Badge 
                        variant={row[col.key] === 'high' ? 'destructive' : 'default'} 
                        className="text-xs"
                      >
                        {row[col.key]}
                      </Badge>
                    ) : (
                      row[col.key]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  const renderProgressWidget = () => {
    if (!widgetData) return <div className="text-center text-muted-foreground">No data available</div>;

    const { value, completed, total, label } = widgetData;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span>{value.toFixed(1)}%</span>
          </div>
          <Progress value={value} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed} completed</span>
            <span>{total} total</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGaugeWidget = () => {
    if (!widgetData) return <div className="text-center text-muted-foreground">No data available</div>;

    const { value, max, label, thresholds } = widgetData;
    const percentage = (value / max) * 100;
    
    // Determine color based on thresholds
    let color = '#10b981'; // default green
    if (thresholds) {
      for (const threshold of thresholds) {
        if (value <= threshold.value) {
          color = threshold.color;
          break;
        }
      }
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {value.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <Progress value={percentage} className="h-3" />
        {widgetData.available !== undefined && widgetData.total !== undefined && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{widgetData.available} available</span>
            <span>{widgetData.total} total</span>
          </div>
        )}
      </div>
    );
  };

  const renderAlertWidget = () => {
    if (!widgetData || !widgetData.items) {
      return <div className="text-center text-muted-foreground">No alerts</div>;
    }

    return (
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {widgetData.items.map((alert: any, index: number) => (
            <div key={index} className="flex items-start gap-2 p-2 rounded border">
              <AlertTriangle 
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  alert.severity === 'critical' ? 'text-red-500' : 
                  alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} 
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{alert.title}</p>
                <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'default'} 
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{alert.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderListWidget = () => {
    if (!widgetData || !widgetData.items) {
      return <div className="text-center text-muted-foreground">No items</div>;
    }

    return (
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {widgetData.items.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 rounded border">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.priority && (
                  <Badge 
                    variant={item.priority === 'high' ? 'destructive' : 'default'} 
                    className="text-xs"
                  >
                    {item.priority}
                  </Badge>
                )}
                {item.status && (
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderScheduleOptimizationWidget = () => {
    return (
      <ScheduleOptimizationWidget 
        config={config}
        data={data}
        onAction={(action, data) => {
          // Handle optimization actions if needed
          console.log('Optimization action:', action, data);
        }}
      />
    );
  };

  const renderWidgetContent = () => {
    console.log('UniversalWidget rendering type:', config.type, 'for widget:', config.title);
    switch (config.type) {
      case 'kpi':
        return renderKPIWidget();
      case 'chart':
        return renderChartWidget();
      case 'table':
        return renderTableWidget();
      case 'progress':
        return renderProgressWidget();
      case 'gauge':
        return renderGaugeWidget();
      case 'alert':
        return renderAlertWidget();
      case 'list':
        return renderListWidget();
      case 'schedule-optimization':
        return renderScheduleOptimizationWidget();
      default:
        console.log('Unknown widget type encountered:', config.type, 'Full config:', config);
        return <div className="text-center text-muted-foreground">Unknown widget type: {config.type}</div>;
    }
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="min-w-0 flex-1">
            <span className="truncate">{config.title}</span>
            {config.subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-1">{config.subtitle}</p>
            )}
          </div>
          
          {showControls && !readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onRefresh && (
                  <DropdownMenuItem onClick={() => onRefresh(config.id)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(config.id)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onToggle && (
                  <DropdownMenuItem onClick={() => onToggle(config.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Toggle
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem onClick={() => onRemove(config.id)} className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
}

export { UniversalWidget };