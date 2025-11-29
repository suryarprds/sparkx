import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { useJointData, JointData } from "@/hooks/useJointData";

export function JointStatusPanel() {
  const jointGroups = useJointData();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="w-3 h-3 text-success" />;
      case "warning":
        return <AlertCircle className="w-3 h-3 text-warning" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return <Activity className="w-3 h-3 text-slate-600 dark:text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getTempColor = (temp: number) => {
    if (temp < 45) return "text-success";
    if (temp < 55) return "text-warning";
    return "text-destructive";
  };

  const totalJoints = jointGroups.reduce((acc, group) => acc + group.joints.length, 0);
  const healthyJoints = jointGroups.reduce(
    (acc, group) => acc + group.joints.filter((j) => j.status === "ok").length,
    0
  );
  const warningJoints = jointGroups.reduce(
    (acc, group) => acc + group.joints.filter((j) => j.status === "warning").length,
    0
  );
  const errorJoints = jointGroups.reduce(
    (acc, group) => acc + group.joints.filter((j) => j.status === "error").length,
    0
  );

  const healthPercentage = (healthyJoints / totalJoints) * 100;

  return (
    <Card className="p-4 card-gradient border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">32 DOF across 16 joint groups</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">{healthyJoints}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">{warningJoints}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium">{errorJoints}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Overall Health</span>
          <span className="text-sm font-bold">{healthPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={healthPercentage} className="h-2" />
      </div>

      {/* Organized by body sections */}
      <div className="space-y-6">
        {/* HEAD SECTION */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-800">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">Head</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jointGroups
              .filter((group) => group.name.includes("Neck"))
              .map((group) =>
                group.joints.map((joint) => (
                  <div
                    key={joint.name}
                    className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(joint.status)}
                        <span className="text-xs font-semibold">{joint.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs h-5 ${getStatusColor(joint.status)}`}>
                        {joint.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Angle</p>
                        <p className="text-xs font-mono font-bold">{joint.angle.toFixed(1)}°</p>
                        <p className="text-xs text-muted-foreground">(→{joint.targetAngle.toFixed(0)}°)</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Torque</p>
                        <p className="text-xs font-mono font-bold">{joint.torque.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Temp</p>
                        <p className={`text-xs font-mono font-bold ${getTempColor(joint.temperature)}`}>
                          {joint.temperature.toFixed(0)}°C
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>

        {/* UPPER BODY SECTION */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-800">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide">Upper Body</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jointGroups
              .filter((group) => 
                group.name.includes("Shoulder") || 
                group.name.includes("Elbow") || 
                group.name.includes("Wrist") || 
                group.name.includes("Gripper")
              )
              .map((group) => (
                <div key={group.name} className="space-y-2">
                  <h5 className="text-xs font-semibold text-blue-300 pl-1">{group.name}</h5>
                  {group.joints.map((joint) => (
                    <div
                      key={joint.name}
                      className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-blue-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(joint.status)}
                          <span className="text-xs font-semibold">{joint.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs h-5 ${getStatusColor(joint.status)}`}>
                          {joint.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Angle</p>
                          <p className="text-xs font-mono font-bold">{joint.angle.toFixed(1)}°</p>
                          <p className="text-xs text-muted-foreground">(→{joint.targetAngle.toFixed(0)}°)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Torque</p>
                          <p className="text-xs font-mono font-bold">{joint.torque.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Temp</p>
                          <p className={`text-xs font-mono font-bold ${getTempColor(joint.temperature)}`}>
                            {joint.temperature.toFixed(0)}°C
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>

        {/* LOWER BODY SECTION */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-800">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wide">Lower Body</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jointGroups
              .filter((group) => 
                group.name.includes("Hip") || 
                group.name.includes("Knee") || 
                group.name.includes("Ankle")
              )
              .map((group) => (
                <div key={group.name} className="space-y-2">
                  <h5 className="text-xs font-semibold text-purple-300 pl-1">{group.name}</h5>
                  {group.joints.map((joint) => (
                    <div
                      key={joint.name}
                      className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(joint.status)}
                          <span className="text-xs font-semibold">{joint.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs h-5 ${getStatusColor(joint.status)}`}>
                          {joint.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Angle</p>
                          <p className="text-xs font-mono font-bold">{joint.angle.toFixed(1)}°</p>
                          <p className="text-xs text-muted-foreground">(→{joint.targetAngle.toFixed(0)}°)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Torque</p>
                          <p className="text-xs font-mono font-bold">{joint.torque.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Temp</p>
                          <p className={`text-xs font-mono font-bold ${getTempColor(joint.temperature)}`}>
                            {joint.temperature.toFixed(0)}°C
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
