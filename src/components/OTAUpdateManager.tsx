import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  FileText,
  Wifi,
  Battery,
  Zap,
  Loader2,
} from "lucide-react";

interface OTAUpdateManagerProps {
  robotId: string;
}

type UpdateStatus = "idle" | "checking" | "uploading" | "installing" | "flashing" | "rebooting" | "reconnecting" | "success" | "failed";

type UpdateStage = {
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
};

interface FirmwareVersion {
  version: string;
  releaseDate: string;
  size: string;
  description: string;
}

interface UpdateHistory {
  version: string;
  date: string;
  status: "success" | "failed";
  duration: string;
}

interface PrerequisiteCheck {
  name: string;
  status: "checking" | "passed" | "failed";
  message: string;
  icon: React.ReactNode;
}

export function OTAUpdateManager({ robotId }: OTAUpdateManagerProps) {
  const [currentVersion] = useState("2.4.1");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPrerequisiteDialog, setShowPrerequisiteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<UpdateStage | null>(null);
  const [prerequisites, setPrerequisites] = useState<PrerequisiteCheck[]>([]);

  const availableVersions: FirmwareVersion[] = [
    {
      version: "2.5.0",
      releaseDate: "2025-11-25",
      size: "45.2 MB",
      description: "Performance improvements, new motion algorithms, bug fixes",
    },
    {
      version: "2.4.2",
      releaseDate: "2025-11-18",
      size: "43.8 MB",
      description: "Security patch, stability improvements",
    },
  ];

  const updateHistory: UpdateHistory[] = [
    { version: "2.4.1", date: "2025-11-10 14:32", status: "success", duration: "4m 23s" },
    { version: "2.4.0", date: "2025-10-28 09:15", status: "success", duration: "4m 18s" },
    { version: "2.3.5", date: "2025-10-15 16:45", status: "failed", duration: "2m 10s" },
  ];

  const checkPrerequisites = async () => {
    setShowPrerequisiteDialog(true);
    setUpdateStatus("checking");
    
    const checks: PrerequisiteCheck[] = [
      { name: "Robot Status", status: "checking", message: "Checking robot online status...", icon: <Zap className="w-4 h-4" /> },
      { name: "Battery Level", status: "checking", message: "Verifying battery level...", icon: <Battery className="w-4 h-4" /> },
      { name: "Wi-Fi Connection", status: "checking", message: "Checking network connectivity...", icon: <Wifi className="w-4 h-4" /> },
      { name: "Storage Space", status: "checking", message: "Verifying available storage...", icon: <FileText className="w-4 h-4" /> },
    ];
    
    setPrerequisites(checks);
    
    // Simulate prerequisite checks
    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const passed = Math.random() > 0.1; // 90% pass rate
      checks[i] = {
        ...checks[i],
        status: passed ? "passed" : "failed",
        message: passed 
          ? `✓ ${checks[i].name} OK` 
          : `✗ ${checks[i].name} Failed - ${getFailureMessage(i)}`
      };
      
      setPrerequisites([...checks]);
      
      if (!passed) {
        setUpdateStatus("failed");
        setErrorMessage(`Prerequisites check failed: ${checks[i].name}`);
        return false;
      }
    }
    
    setUpdateStatus("idle");
    return true;
  };
  
  const getFailureMessage = (index: number) => {
    const messages = [
      "Robot is offline",
      "Battery below 30%",
      "Weak Wi-Fi signal",
      "Insufficient storage"
    ];
    return messages[index];
  };

  const updateStages: UpdateStage[] = [
    {
      name: "Preparing",
      description: "Initializing update process...",
      icon: <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />,
      progress: 10
    },
    {
      name: "Transferring",
      description: "Uploading firmware to robot...",
      icon: <Upload className="w-5 h-5 animate-pulse text-blue-400" />,
      progress: 35
    },
    {
      name: "Installing",
      description: "Installing firmware update...",
      icon: <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />,
      progress: 60
    },
    {
      name: "Flashing",
      description: "Writing to system memory...",
      icon: <Zap className="w-5 h-5 animate-pulse text-yellow-400" />,
      progress: 80
    },
    {
      name: "Rebooting",
      description: "Restarting robot system...",
      icon: <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />,
      progress: 90
    },
    {
      name: "Reconnecting",
      description: "Establishing connection...",
      icon: <Wifi className="w-5 h-5 animate-pulse text-green-400" />,
      progress: 98
    }
  ];

  const handleInitiateUpdate = (version: string) => {
    // Show confirmation dialog before starting update
    setSelectedVersion(version);
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = async () => {
    // User confirmed, start the update process
    setShowConfirmDialog(false);
    await handleUpdateProcess();
  };

  const handleUpdateProcess = async () => {
    // First check prerequisites
    const prerequisitesPassed = await checkPrerequisites();
    if (!prerequisitesPassed) {
      return;
    }
    
    // Close prerequisite dialog and open update progress dialog
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowPrerequisiteDialog(false);
    setShowUpdateDialog(true);

    setErrorMessage("");
    setUploadProgress(0);

    try {
      // Execute all update stages
      for (const stage of updateStages) {
        setCurrentStage(stage);
        await simulateStage(stage);
      }

      // Success
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUpdateStatus("success");
    } catch (error) {
      setUpdateStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "Update failed");
    }
  };

  const simulateStage = (stage: UpdateStage) => {
    return new Promise<void>((resolve) => {
      let progress = stage.progress - 10;
      const targetProgress = stage.progress;
      const interval = setInterval(() => {
        progress += Math.random() * 3;
        if (progress >= targetProgress) {
          progress = targetProgress;
          clearInterval(interval);
          setTimeout(resolve, 500);
        }
        setUploadProgress(Math.min(progress, 100));
      }, 150);
    });
  };

  const resetUpdate = () => {
    setUpdateStatus("idle");
    setUploadProgress(0);
    setErrorMessage("");
    setShowPrerequisiteDialog(false);
    setShowUpdateDialog(false);
    setShowConfirmDialog(false);
    setSelectedVersion("");
    setCurrentStage(null);
    setPrerequisites([]);
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-0">
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Confirm Firmware Update
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to update to version {selectedVersion}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertDescription className="text-sm">
                <strong>Important:</strong> The robot will reboot during this process and will be unavailable for several minutes. 
                Please ensure:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Battery is above 30%</li>
                  <li>Robot is not performing critical tasks</li>
                  <li>Stable Wi-Fi connection is available</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmUpdate}>
                <Download className="w-4 h-4 mr-2" />
                Confirm Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prerequisites Check Dialog */}
      <Dialog open={showPrerequisiteDialog} onOpenChange={setShowPrerequisiteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Checking Prerequisites
            </DialogTitle>
            <DialogDescription>
              Verifying robot is ready for firmware update...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {prerequisites.map((check, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className={`${
                  check.status === "checking" ? "text-cyan-400" :
                  check.status === "passed" ? "text-success" : "text-destructive"
                }`}>
                  {check.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                </div>
                {check.status === "checking" && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                {check.status === "passed" && <CheckCircle2 className="w-4 h-4 text-success" />}
                {check.status === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={(open) => {
        if (!open && updateStatus !== "success") {
          // Prevent closing during update
          return;
        }
        setShowUpdateDialog(open);
        if (!open && updateStatus === "success") {
          resetUpdate();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {updateStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Update Complete
                </>
              ) : updateStatus === "failed" ? (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  Update Failed
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  Installing Update
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {updateStatus === "success" 
                ? "Firmware update completed successfully!" 
                : updateStatus === "failed"
                ? errorMessage
                : "Please do not power off or disconnect the robot"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {updateStatus !== "success" && updateStatus !== "failed" && currentStage && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
                  {currentStage.icon}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{currentStage.name}</p>
                    <p className="text-xs text-muted-foreground">{currentStage.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-mono font-bold text-primary">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Update Stages:</p>
                  {updateStages.map((stage, index) => {
                    const isActive = stage.name === currentStage?.name;
                    const isComplete = uploadProgress > stage.progress;
                    return (
                      <div key={index} className={`flex items-center gap-2 text-xs p-2 rounded ${
                        isActive ? 'bg-primary/20 border border-primary/50' :
                        isComplete ? 'bg-success/10 border border-success/30' :
                        'bg-muted/30 border border-border'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        ) : isActive ? (
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                        )}
                        <span className={isActive ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {stage.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {updateStatus === "success" && (
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-success" />
                <p className="text-sm font-medium text-success mb-2">Update Successful!</p>
                <p className="text-xs text-muted-foreground">Robot is now running firmware v{selectedVersion}</p>
                <Button onClick={resetUpdate} className="mt-4">Close</Button>
              </div>
            )}

            {updateStatus === "failed" && (
              <div className="text-center py-4">
                <XCircle className="w-16 h-16 mx-auto mb-3 text-destructive" />
                <p className="text-sm font-medium text-destructive mb-2">Update Failed</p>
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
                <Button onClick={resetUpdate} variant="outline" className="mt-4">Close</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Current Version Card */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Current Version</h3>
              <p className="text-xs text-muted-foreground">Robot: {robotId}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-bold text-cyan-500 dark:text-cyan-400">v{currentVersion}</span>
            <Badge variant="outline" className="ml-2 bg-success/20 text-success border-success/30 text-xs">
              Active
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Updated</p>
            <p className="font-medium text-foreground">Nov 10, 2025</p>
          </div>
          <div>
            <p className="text-muted-foreground">Uptime</p>
            <p className="font-medium text-foreground">18d 7h</p>
          </div>
        </div>
      </Card>

        {/* Available Firmware Versions */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Download className="w-4 h-4" />
          Available Versions
        </h3>

        <div className="space-y-2">
          {availableVersions.map((fw) => (
            <div
              key={fw.version}
              className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400 text-sm">v{fw.version}</span>
                    {fw.version === "2.5.0" && (
                      <Badge variant="outline" className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fw.releaseDate}</span>
                    <span>•</span>
                    <span>{fw.size}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={fw.version === "2.5.0" ? "default" : "outline"} 
                  className={`text-xs ml-2 ${fw.version === "2.5.0" ? "bg-primary hover:bg-primary/90" : ""}`}
                  onClick={() => handleInitiateUpdate(fw.version)}
                  disabled={updateStatus === "checking" || showPrerequisiteDialog || showUpdateDialog}
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline ml-1">{fw.version === "2.5.0" ? "Update" : "Install"}</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{fw.description}</p>
            </div>
          ))}
        </div>
        </Card>
      </div>

      {/* Update History */}
      <Card className="p-3 sm:p-4 mt-3 sm:mt-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2 text-foreground">
          <FileText className="w-4 h-4" />
          Update History
        </h3>
        <div className="space-y-2">
          {updateHistory.map((history, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {history.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">v{history.version}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        history.status === "success"
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      }`}
                    >
                      {history.status === "success" ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{history.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-xs font-medium text-foreground">{history.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
