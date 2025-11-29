import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Zap,
  Radio,
  Target,
  BarChart3,
  Shield,
  Gauge,
  Thermometer,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface WCAMetric {
  parameter: string;
  nominal: number;
  current: number;
  min: number;
  max: number;
  unit: string;
  margin: number; // percentage margin to limits
  status: "safe" | "warning" | "critical";
}

interface ToleranceStackup {
  chain: string;
  nominalPosition: number;
  actualPosition: number;
  toleranceAccumulation: number;
  driftRate: number; // μm/hour
  calibrationAge: number; // hours since last cal
  status: "excellent" | "good" | "recalibrate" | "critical";
}

interface SignalIntegrityMetric {
  bus: string;
  type: string;
  snr: number; // dB
  errorRate: number; // errors per million
  emi: number; // dBμV/m
  jitter: number; // nanoseconds
  status: "excellent" | "good" | "degraded" | "poor";
}

interface FMEAEntry {
  component: string;
  failureMode: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Risk Priority Number
  mitigation: string;
}

interface ReliabilityMetric {
  component: string;
  mttf: number; // hours
  failureRate: number; // failures per million hours (λ)
  survivalProb: number; // 0-100%
  weibullBeta: number; // shape parameter
  confidence: number; // 0-100%
}

export function DesignReliabilityAnalysis() {
  const [wcaMetrics, setWcaMetrics] = useState<WCAMetric[]>([
    {
      parameter: "Motor Voltage",
      nominal: 48.0,
      current: 47.8,
      min: 44.0,
      max: 52.0,
      unit: "V",
      margin: 52.5,
      status: "safe",
    },
    {
      parameter: "Peak Current",
      nominal: 15.0,
      current: 14.2,
      min: 0,
      max: 18.0,
      unit: "A",
      margin: 21.1,
      status: "safe",
    },
    {
      parameter: "Junction Temp",
      nominal: 65.0,
      current: 72.0,
      min: -20.0,
      max: 85.0,
      unit: "°C",
      margin: 15.3,
      status: "warning",
    },
    {
      parameter: "Core Voltage",
      nominal: 3.3,
      current: 3.28,
      min: 3.135,
      max: 3.465,
      unit: "V",
      margin: 56.1,
      status: "safe",
    },
  ]);

  const [toleranceData, setToleranceData] = useState<ToleranceStackup[]>([
    {
      chain: "Right Arm Endpoint",
      nominalPosition: 850.0,
      actualPosition: 850.18,
      toleranceAccumulation: 0.42,
      driftRate: 0.012,
      calibrationAge: 168,
      status: "excellent",
    },
    {
      chain: "Left Leg Ankle",
      nominalPosition: 1250.0,
      actualPosition: 1250.65,
      toleranceAccumulation: 1.85,
      driftRate: 0.038,
      calibrationAge: 336,
      status: "good",
    },
    {
      chain: "Hip Joint Center",
      nominalPosition: 320.0,
      actualPosition: 320.91,
      toleranceAccumulation: 2.94,
      driftRate: 0.052,
      calibrationAge: 504,
      status: "recalibrate",
    },
    {
      chain: "Neck Orientation",
      nominalPosition: 45.0,
      actualPosition: 45.12,
      toleranceAccumulation: 0.68,
      driftRate: 0.008,
      calibrationAge: 240,
      status: "good",
    },
  ]);

  const [signalMetrics, setSignalMetrics] = useState<SignalIntegrityMetric[]>([
    {
      bus: "CAN Bus 1 (Motors)",
      type: "CAN-FD",
      snr: 42.5,
      errorRate: 0.8,
      emi: 28.5,
      jitter: 12,
      status: "excellent",
    },
    {
      bus: "CAN Bus 2 (Sensors)",
      type: "CAN-FD",
      snr: 38.2,
      errorRate: 2.3,
      emi: 32.1,
      jitter: 18,
      status: "good",
    },
    {
      bus: "EtherCAT Master",
      type: "EtherCAT",
      snr: 45.8,
      errorRate: 0.2,
      emi: 25.3,
      jitter: 8,
      status: "excellent",
    },
    {
      bus: "IMU I2C",
      type: "I2C",
      snr: 35.1,
      errorRate: 5.2,
      emi: 38.7,
      jitter: 25,
      status: "good",
    },
    {
      bus: "LiDAR Serial",
      type: "RS-485",
      snr: 31.8,
      errorRate: 12.5,
      emi: 42.3,
      jitter: 35,
      status: "degraded",
    },
  ]);

  const [fmeaData] = useState<FMEAEntry[]>([
    {
      component: "Motor Driver",
      failureMode: "Thermal Shutdown",
      severity: 8,
      occurrence: 3,
      detection: 2,
      rpn: 48,
      mitigation: "Enhanced cooling + temp monitoring",
    },
    {
      component: "Joint Bearing",
      failureMode: "Excessive Wear",
      severity: 7,
      occurrence: 4,
      detection: 3,
      rpn: 84,
      mitigation: "Vibration analysis + scheduled replacement",
    },
    {
      component: "Battery Cell",
      failureMode: "Capacity Fade",
      severity: 6,
      occurrence: 5,
      detection: 2,
      rpn: 60,
      mitigation: "SOH monitoring + cycle counting",
    },
    {
      component: "Power Supply",
      failureMode: "Voltage Dropout",
      severity: 9,
      occurrence: 2,
      detection: 1,
      rpn: 18,
      mitigation: "Redundant supply + UPS backup",
    },
    {
      component: "CAN Transceiver",
      failureMode: "Bus-Off State",
      severity: 7,
      occurrence: 3,
      detection: 2,
      rpn: 42,
      mitigation: "Auto-recovery + bus isolation",
    },
  ]);

  const [reliabilityMetrics] = useState<ReliabilityMetric[]>([
    {
      component: "Motor Controllers",
      mttf: 45000,
      failureRate: 22.2,
      survivalProb: 97.8,
      weibullBeta: 2.8,
      confidence: 95,
    },
    {
      component: "Joint Bearings",
      mttf: 28000,
      failureRate: 35.7,
      survivalProb: 94.2,
      weibullBeta: 3.2,
      confidence: 92,
    },
    {
      component: "Power Supply",
      mttf: 65000,
      failureRate: 15.4,
      survivalProb: 98.9,
      weibullBeta: 2.1,
      confidence: 98,
    },
    {
      component: "Battery Pack",
      mttf: 18000,
      failureRate: 55.6,
      survivalProb: 89.5,
      weibullBeta: 4.1,
      confidence: 88,
    },
    {
      component: "Sensors",
      mttf: 52000,
      failureRate: 19.2,
      survivalProb: 98.2,
      weibullBeta: 2.5,
      confidence: 96,
    },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWcaMetrics((prev) =>
        prev.map((metric) => {
          const variation = (Math.random() - 0.5) * 0.2;
          const newCurrent = metric.current + variation;
          const range = metric.max - metric.min;
          const distanceToLimit = Math.min(
            newCurrent - metric.min,
            metric.max - newCurrent
          );
          const margin = (distanceToLimit / range) * 100;

          return {
            ...metric,
            current: newCurrent,
            margin,
            status:
              margin > 30 ? "safe" : margin > 15 ? "warning" : "critical",
          };
        })
      );

      setToleranceData((prev) =>
        prev.map((item) => {
          const newDrift = item.driftRate * (item.calibrationAge + 2);
          const newAccumulation = Math.abs(
            item.actualPosition - item.nominalPosition
          );

          return {
            ...item,
            calibrationAge: item.calibrationAge + 0.033, // 2 seconds in hours
            toleranceAccumulation: newAccumulation,
            status:
              item.calibrationAge > 720
                ? "critical"
                : item.calibrationAge > 480
                ? "recalibrate"
                : newAccumulation < 1.0
                ? "excellent"
                : "good",
          };
        })
      );

      setSignalMetrics((prev) =>
        prev.map((metric) => {
          const snrVariation = (Math.random() - 0.5) * 1;
          const newSnr = metric.snr + snrVariation;

          return {
            ...metric,
            snr: newSnr,
            errorRate: metric.errorRate + (Math.random() - 0.5) * 0.5,
            emi: metric.emi + (Math.random() - 0.5) * 2,
            jitter: Math.max(5, metric.jitter + (Math.random() - 0.5) * 3),
            status:
              newSnr > 40
                ? "excellent"
                : newSnr > 35
                ? "good"
                : newSnr > 30
                ? "degraded"
                : "poor",
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getWCAStatusColor = (status: WCAMetric["status"]) => {
    switch (status) {
      case "safe":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-destructive";
    }
  };

  const getToleranceStatusColor = (status: ToleranceStackup["status"]) => {
    switch (status) {
      case "excellent":
        return "text-success";
      case "good":
        return "text-green-400";
      case "recalibrate":
        return "text-warning";
      case "critical":
        return "text-destructive";
    }
  };

  const getSignalStatusColor = (status: SignalIntegrityMetric["status"]) => {
    switch (status) {
      case "excellent":
        return "text-success";
      case "good":
        return "text-green-400";
      case "degraded":
        return "text-warning";
      case "poor":
        return "text-destructive";
    }
  };

  const getRPNColor = (rpn: number) => {
    if (rpn < 40) return "text-success";
    if (rpn < 80) return "text-warning";
    return "text-destructive";
  };

  const getRPNBadgeColor = (rpn: number) => {
    if (rpn < 40) return "bg-success text-success-foreground";
    if (rpn < 80) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  return (
    <Card className="p-4 card-gradient border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-semibold text-lg">Engineering Analysis</h3>
            <p className="text-xs text-muted-foreground">
              Worst-case analysis, tolerances, signal quality, failure prediction
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-cyan-400 border-cyan-400">
          ISO 13482 Compliant
        </Badge>
      </div>

      {/* WCA - Worst Case Analysis */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-orange-400" />
          <h4 className="text-sm font-semibold">Worst Case Analysis (WCA)</h4>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {wcaMetrics.map((metric, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{metric.parameter}</span>
                <Badge
                  variant="outline"
                  className={getWCAStatusColor(metric.status)}
                >
                  {metric.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-lg font-bold font-mono">
                    {metric.current.toFixed(2)} {metric.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nominal</p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {metric.nominal.toFixed(2)} {metric.unit}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Range: {metric.min} - {metric.max} {metric.unit}
                  </span>
                  <span className={`font-bold ${getWCAStatusColor(metric.status)}`}>
                    {metric.margin.toFixed(1)}% margin
                  </span>
                </div>
                <Progress value={metric.margin} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tolerance Stack-up Analysis */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold">Tolerance Stack-up & Calibration Drift</h4>
        </div>
        <div className="space-y-2">
          {toleranceData.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{item.chain}</span>
                <Badge
                  variant="outline"
                  className={getToleranceStatusColor(item.status)}
                >
                  {item.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Position Error:</span>
                  <p className="font-bold font-mono mt-1">
                    {(item.actualPosition - item.nominalPosition).toFixed(2)} mm
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tolerance Σ:</span>
                  <p className="font-bold font-mono mt-1">
                    ±{item.toleranceAccumulation.toFixed(2)} mm
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Drift Rate:</span>
                  <p className="font-bold font-mono mt-1">
                    {item.driftRate.toFixed(3)} μm/h
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cal. Age:</span>
                  <p className={`font-bold font-mono mt-1 ${
                    item.calibrationAge > 480 ? "text-warning" : "text-success"
                  }`}>
                    {Math.floor(item.calibrationAge)}h
                  </p>
                </div>
              </div>
              {item.status === "recalibrate" || item.status === "critical" ? (
                <div className="mt-2 p-2 rounded bg-warning/10 border border-warning/30">
                  <p className="text-xs text-warning flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Calibration required: {item.calibrationAge > 720 ? "OVERDUE" : "Due soon"}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Signal Integrity */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-green-400" />
          <h4 className="text-sm font-semibold">Signal Integrity & EMI Analysis</h4>
        </div>
        <div className="space-y-2">
          {signalMetrics.map((metric, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{metric.bus}</span>
                  <span className="text-xs text-muted-foreground">({metric.type})</span>
                </div>
                <Badge
                  variant="outline"
                  className={getSignalStatusColor(metric.status)}
                >
                  {metric.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">SNR:</span>
                  <p className={`font-bold font-mono mt-1 ${getSignalStatusColor(metric.status)}`}>
                    {metric.snr.toFixed(1)} dB
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Error Rate:</span>
                  <p className="font-bold font-mono mt-1">
                    {metric.errorRate.toFixed(1)} /M
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">EMI:</span>
                  <p className="font-bold font-mono mt-1">
                    {metric.emi.toFixed(1)} dBμV/m
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Jitter:</span>
                  <p className="font-bold font-mono mt-1">
                    {metric.jitter.toFixed(0)} ns
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FMEA - Failure Mode Effects Analysis */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <h4 className="text-sm font-semibold">FMEA - Risk Priority Analysis</h4>
        </div>
        <div className="space-y-2">
          {fmeaData
            .sort((a, b) => b.rpn - a.rpn)
            .map((entry, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold">{entry.component}</span>
                    <p className="text-xs text-muted-foreground">{entry.failureMode}</p>
                  </div>
                  <Badge className={getRPNBadgeColor(entry.rpn)}>
                    RPN: {entry.rpn}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Severity:</span>
                    <p className="font-bold font-mono mt-1">{entry.severity}/10</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Occurrence:</span>
                    <p className="font-bold font-mono mt-1">{entry.occurrence}/10</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Detection:</span>
                    <p className="font-bold font-mono mt-1">{entry.detection}/10</p>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700">
                  <p className="text-xs">
                    <span className="text-muted-foreground">Mitigation:</span>{" "}
                    <span className="text-cyan-400">{entry.mitigation}</span>
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reliability Metrics (MTTF, Weibull, Survival) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-semibold">Reliability Analysis (MTTF, Weibull Distribution)</h4>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {reliabilityMetrics.map((metric, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{metric.component}</span>
                <div className="flex items-center gap-1">
                  {metric.survivalProb > 95 ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : metric.survivalProb > 90 ? (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">MTTF</p>
                  <p className="text-lg font-bold font-mono text-cyan-400">
                    {(metric.mttf / 1000).toFixed(1)}k h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Survival Probability</p>
                  <p className="text-lg font-bold font-mono text-success">
                    {metric.survivalProb.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={metric.survivalProb} className="h-1.5" />
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div>
                    <span className="text-muted-foreground">λ (FIT):</span>
                    <p className="font-mono font-bold">{metric.failureRate.toFixed(1)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">β (Weibull):</span>
                    <p className="font-mono font-bold">{metric.weibullBeta.toFixed(1)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <p className="font-mono font-bold">{metric.confidence}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
