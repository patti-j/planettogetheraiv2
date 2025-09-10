// Federation Test Status Component
// Visual display of test harness results in development mode

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  PlayCircle,
  Download,
  Activity,
  Package
} from 'lucide-react';
import { federationTestHarness } from '@/lib/federation-test-harness';
import type { TestHarnessReport } from '@/lib/federation-test-harness';

export function FederationTestStatus() {
  const [report, setReport] = useState<TestHarnessReport | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Check for existing report in window
    const checkForReport = () => {
      const windowReport = (window as any).__FEDERATION_TEST_REPORT__;
      if (windowReport) {
        setReport(windowReport);
      }
    };

    // Check immediately
    checkForReport();

    // Poll for report updates
    const interval = setInterval(checkForReport, 1000);

    return () => clearInterval(interval);
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setIsMinimized(false);
    setIsExpanded(true);
    
    try {
      const newReport = await federationTestHarness.runAllTests();
      setReport(newReport);
      (window as any).__FEDERATION_TEST_REPORT__ = newReport;
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const html = federationTestHarness.exportReportAsHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `federation-test-report-${new Date().toISOString()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Don't show in production
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!report && !isRunning) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={runTests}
          className="flex items-center gap-2 shadow-lg"
          variant="outline"
        >
          <PlayCircle className="h-4 w-4" />
          Run Federation Tests
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 shadow-lg"
          variant={report?.summary.failed === 0 ? 'default' : 'destructive'}
        >
          <Activity className="h-4 w-4" />
          Test Results
          {report && (
            <Badge variant={report.summary.failed === 0 ? 'default' : 'destructive'}>
              {report.summary.passed}/{report.summary.totalTests}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  const passRate = report ? ((report.summary.passed / report.summary.totalTests) * 100).toFixed(1) : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-auto">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Federation Test Status
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={exportReport}
                disabled={!report}
                data-testid="button-export-report"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid="button-toggle-expand"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsMinimized(true)}
                data-testid="button-minimize"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {isRunning ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Running tests...</p>
            </div>
          ) : report ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Passed</span>
                  </div>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {report.summary.passed}
                  </p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    <span className="text-xs font-medium text-red-600">Failed</span>
                  </div>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">
                    {report.summary.failed}
                  </p>
                </div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-600">Warnings</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                    {report.summary.warnings}
                  </p>
                </div>
              </div>

              {/* Pass Rate */}
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-xs font-medium">Pass Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        Number(passRate) >= 90 ? 'bg-green-500' :
                        Number(passRate) >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold">{passRate}%</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-2 bg-muted rounded space-y-1">
                <p className="text-xs font-medium mb-1">Performance</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-mono">{(report.totalDuration / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg Load Time</span>
                  <span className="font-mono">{report.performanceMetrics.averageLoadTime.toFixed(2)}ms</span>
                </div>
              </div>

              {/* Detailed Module Status */}
              {isExpanded && (
                <>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">Module Status</p>
                    <div className="space-y-1">
                      {report.moduleReports.map(module => (
                        <div 
                          key={module.moduleId}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            {module.overallStatus === 'pass' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : module.overallStatus === 'fail' ? (
                              <XCircle className="h-3 w-3 text-red-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            )}
                            <span className="text-xs font-medium">{module.moduleId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs py-0 h-5">
                              {module.initTime.toFixed(0)}ms
                            </Badge>
                            <Badge 
                              variant={
                                module.overallStatus === 'pass' ? 'default' :
                                module.overallStatus === 'fail' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs py-0 h-5"
                            >
                              {module.overallStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">Integration Tests</p>
                    <div className="space-y-1">
                      {report.integrationReports.map(test => (
                        <div 
                          key={test.name}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            {test.status === 'pass' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-xs">{test.name}</span>
                          </div>
                          <Badge 
                            variant={test.status === 'pass' ? 'default' : 'destructive'}
                            className="text-xs py-0 h-5"
                          >
                            {test.duration.toFixed(0)}ms
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={runTests}
                  data-testid="button-rerun-tests"
                >
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Re-run Tests
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    console.log('Full Report:', report);
                    console.table(report.moduleReports);
                  }}
                  data-testid="button-log-report"
                >
                  Log Details
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default FederationTestStatus;