import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from "@/hooks/useAPI";

const Alerts = () => {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch alerts from API
  const { data: apiAlerts = [], isLoading } = useAlerts({ 
    resolved: statusFilter === "resolved" ? true : statusFilter === "active" ? false : undefined 
  });
  
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();

  const handleAcknowledge = (alertId: number) => {
    acknowledgeMutation.mutate({ id: alertId, acknowledgedBy: "User" });
  };

  const handleResolve = (alertId: number) => {
    resolveMutation.mutate({ 
      id: alertId, 
      resolvedBy: "User",
      resolutionNotes: "Resolved from UI" 
    });
  };

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return apiAlerts.filter((alert) => {
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (typeFilter !== "all") {
        // Handle type variations (e.g., "battery" matches both "battery" and "battery_critical")
        const alertTypeLower = alert.alertType.toLowerCase();
        const filterTypeLower = typeFilter.toLowerCase();
        if (!alertTypeLower.startsWith(filterTypeLower) && alertTypeLower !== filterTypeLower) {
          return false;
        }
      }
      return true;
    });
  }, [apiAlerts, severityFilter, typeFilter]);

  // Sort by timestamp (newest first)
  const sortedAlerts = [...filteredAlerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "info":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <Clock className="w-5 h-5" />;
      case "info":
        return <Eye className="w-5 h-5" />;
      default:
        return <EyeOff className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "battery":
      case "battery_critical":
        return "Battery Alert";
      case "temperature":
      case "overheating":
        return "Temperature Alert";
      case "offline":
      case "connection_lost":
        return "Offline Alert";
      case "error":
      case "system_error":
        return "System Error";
      case "maintenance":
        return "Maintenance Due";
      default:
        return type;
    }
  };

  const unresolvedCount = apiAlerts.filter((a) => !a.isResolved).length;
  const resolvedCount = apiAlerts.filter((a) => a.isResolved).length;
  const criticalUnresolvedCount = apiAlerts.filter((a) => !a.isResolved && a.severity === "critical").length;
  const acknowledgedUnresolvedCount = apiAlerts.filter((a) => !a.isResolved && a.isAcknowledged).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Alerts...</h1>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Alert Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time system alerts and notifications
          </p>
        </div>
        <Badge className="bg-destructive text-destructive-foreground hidden sm:flex">
          {unresolvedCount} Active
        </Badge>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Total Alerts</span>
            <p className="text-xl sm:text-2xl font-bold">{apiAlerts.length}</p>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-destructive">Unresolved</span>
            <p className="text-xl sm:text-2xl font-bold text-destructive">{unresolvedCount}</p>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Resolved</span>
            <p className="text-xl sm:text-2xl font-bold text-success">
              {resolvedCount}
            </p>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Critical</span>
            <p className="text-xl sm:text-2xl font-bold text-destructive">
              {criticalUnresolvedCount}
            </p>
            <p className="text-xs text-muted-foreground">Unresolved</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-8 p-4 sm:p-5 card-gradient border border-border rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Severity</label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="battery_critical">Battery</SelectItem>
                <SelectItem value="overheating">Temperature</SelectItem>
                <SelectItem value="connection_lost">Offline</SelectItem>
                <SelectItem value="system_error">Error</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {sortedAlerts.length > 0 ? (
          sortedAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 card-gradient border transition-all ${
                alert.isResolved ? "border-border opacity-75" : "border-border hover:border-primary"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Severity Icon */}
                <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                  {getSeverityIcon(alert.severity)}
                </div>

                {/* Alert Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base">{alert.robot?.name || 'Unknown'}</h3>
                        <Badge className="text-xs">{alert.robotId}</Badge>
                        <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {getTypeLabel(alert.alertType)}
                      </p>
                    </div>
                    {alert.isAcknowledged && (
                      <Badge className="bg-success text-success-foreground text-xs flex-shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-foreground mb-3">{alert.message}</p>

                  {/* Timestamp & Acknowledgment Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(new Date(alert.createdAt))}</span>
                      {alert.isAcknowledged && alert.acknowledgedAt && (
                        <span className="ml-2">
                          • Acknowledged {formatTime(new Date(alert.acknowledgedAt))}
                          {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!alert.isAcknowledged && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="text-xs h-8"
                      disabled={acknowledgeMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {!alert.isResolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(alert.id)}
                      className="text-xs h-8"
                      disabled={resolveMutation.isPending}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center card-gradient border-border">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success opacity-50" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Alerts</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "active"
                ? "All alerts have been resolved!"
                : "No alerts match your filters."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Alerts;
