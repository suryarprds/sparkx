import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Zap,
  Settings as SettingsIcon,
  User,
  Shield,
  Database,
  Save,
  RotateCcw,
  Check,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Settings {
  // User Preferences
  notifications: boolean;
  soundAlerts: boolean;
  theme: "dark" | "light" | "auto";
  language: "en" | "es" | "fr" | "de";
  
  // Alert Preferences
  criticalAlertNotification: boolean;
  warningAlertNotification: boolean;
  infoAlertNotification: boolean;
  alertEmailNotification: boolean;
  
  // Fleet Configuration
  maintenanceInterval: number;
  batteryThreshold: number;
  temperatureThreshold: number;
  offlineThreshold: number;
  
  // System Settings
  autoRefreshInterval: number;
  dataRetentionDays: number;
  logLevel: "debug" | "info" | "warning" | "error";
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedFirmwareFile, setSelectedFirmwareFile] = useState<File | null>(null);
  const [firmwareError, setFirmwareError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<Settings>({
    // User Preferences
    notifications: true,
    soundAlerts: true,
    theme: "dark",
    language: "en",
    
    // Alert Preferences
    criticalAlertNotification: true,
    warningAlertNotification: true,
    infoAlertNotification: false,
    alertEmailNotification: true,
    
    // Fleet Configuration
    maintenanceInterval: 90,
    batteryThreshold: 20,
    temperatureThreshold: 70,
    offlineThreshold: 60,
    
    // System Settings
    autoRefreshInterval: 30,
    dataRetentionDays: 90,
    logLevel: "info",
  });

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleReset = () => {
    setSettings({
      notifications: true,
      soundAlerts: true,
      theme: "dark",
      language: "en",
      criticalAlertNotification: true,
      warningAlertNotification: true,
      infoAlertNotification: false,
      alertEmailNotification: true,
      maintenanceInterval: 90,
      batteryThreshold: 20,
      temperatureThreshold: 70,
      offlineThreshold: 60,
      autoRefreshInterval: 30,
      dataRetentionDays: 90,
      logLevel: "info",
    });
    setSaveStatus("idle");
  };

  const handleFirmwareFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".bin") && !file.name.endsWith(".hex")) {
        setFirmwareError("Invalid firmware file. Please select a .bin or .hex file.");
        setSelectedFirmwareFile(null);
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setFirmwareError("File too large. Maximum size is 100MB.");
        setSelectedFirmwareFile(null);
        return;
      }

      setSelectedFirmwareFile(file);
      setFirmwareError("");
    }
  };

  const handleClearFirmwareFile = () => {
    setSelectedFirmwareFile(null);
    setFirmwareError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Settings & Configuration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage preferences, alerts, and fleet settings
          </p>
        </div>
      </div>

      {/* Main Settings Container */}
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="preferences" className="text-xs sm:text-sm py-3 data-[state=active]:bg-primary">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm py-3 data-[state=active]:bg-primary">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="fleet" className="text-xs sm:text-sm py-3 data-[state=active]:bg-primary">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span>Fleet</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm py-3 data-[state=active]:bg-primary">
            <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* User Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-4 sm:p-5 lg:p-6 card-gradient border-border">
            <h2 className="text-lg sm:text-xl font-bold mb-6">User Preferences</h2>

            {/* Theme Setting */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="theme" className="text-sm font-semibold">
                  Theme
                </Label>
                <Badge variant="outline" className="w-fit">{settings.theme}</Badge>
              </div>
              <Select value={settings.theme} onValueChange={(value: any) => handleSettingChange("theme", value)}>
                <SelectTrigger id="theme" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Choose your preferred theme</p>
            </div>

            {/* Language Setting */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="language" className="text-sm font-semibold">
                  Language
                </Label>
                <Badge variant="outline" className="w-fit">{settings.language.toUpperCase()}</Badge>
              </div>
              <Select value={settings.language} onValueChange={(value: any) => handleSettingChange("language", value)}>
                <SelectTrigger id="language" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Select your preferred language</p>
            </div>

            {/* Notifications Toggle */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold block">Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground mt-1">Receive in-app notifications</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                  className="flex-shrink-0"
                />
              </div>
            </div>

            {/* Sound Alerts Toggle */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold block">Sound Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-1">Play sound on critical alerts</p>
                </div>
                <Switch
                  checked={settings.soundAlerts}
                  onCheckedChange={(checked) => handleSettingChange("soundAlerts", checked)}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alert Preferences Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-4 sm:p-5 lg:p-6 card-gradient border-border">
            <h2 className="text-lg sm:text-xl font-bold mb-6">Alert Notification Settings</h2>

            {/* Alert Type Toggles */}
            <div className="mb-6 pb-6 border-b border-border">
              <h3 className="text-sm font-semibold mb-4">In-App Alerts by Severity</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-destructive/10">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold block">Critical Alerts</Label>
                    <p className="text-xs text-muted-foreground">System errors, critical failures</p>
                  </div>
                  <Switch
                    checked={settings.criticalAlertNotification}
                    onCheckedChange={(checked) => handleSettingChange("criticalAlertNotification", checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-warning/10">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold block">Warning Alerts</Label>
                    <p className="text-xs text-muted-foreground">Low battery, high temperature</p>
                  </div>
                  <Switch
                    checked={settings.warningAlertNotification}
                    onCheckedChange={(checked) => handleSettingChange("warningAlertNotification", checked)}
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/10">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold block">Info Alerts</Label>
                    <p className="text-xs text-muted-foreground">Maintenance reminders, status updates</p>
                  </div>
                  <Switch
                    checked={settings.infoAlertNotification}
                    onCheckedChange={(checked) => handleSettingChange("infoAlertNotification", checked)}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div>
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold block">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send daily alert summary to admin@sparkx.io</p>
                </div>
                <Switch
                  checked={settings.alertEmailNotification}
                  onCheckedChange={(checked) => handleSettingChange("alertEmailNotification", checked)}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Fleet Configuration Tab */}
        <TabsContent value="fleet" className="space-y-4">
          <Card className="p-4 sm:p-5 lg:p-6 card-gradient border-border">
            <h2 className="text-lg sm:text-xl font-bold mb-6">Fleet Configuration</h2>

            {/* Maintenance Interval */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="maintenance" className="text-sm font-semibold">
                  Maintenance Interval (days)
                </Label>
                <Badge className="bg-primary/20 text-primary w-fit\">{settings.maintenanceInterval}d</Badge>
              </div>
              <Input
                id="maintenance"
                type="number"
                value={settings.maintenanceInterval}
                onChange={(e) => handleSettingChange("maintenanceInterval", parseInt(e.target.value))}
                className="h-9 text-sm"
                min="30"
                max="365"
              />
              <p className="text-xs text-muted-foreground mt-2\">Schedule maintenance every N days</p>
            </div>

            {/* Battery Threshold */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="battery" className="text-sm font-semibold">
                  Battery Alert Threshold (%)
                </Label>
                <Badge className="bg-warning/20 text-warning w-fit\">{settings.batteryThreshold}%</Badge>
              </div>
              <Input
                id="battery"
                type="number"
                value={settings.batteryThreshold}
                onChange={(e) => handleSettingChange("batteryThreshold", parseInt(e.target.value))}
                className="h-9 text-sm"
                min="5"
                max="50"
              />
              <p className="text-xs text-muted-foreground mt-2\">Alert when battery drops below this level</p>
            </div>

            {/* Temperature Threshold */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="temperature" className="text-sm font-semibold">
                  Temperature Alert Threshold (°C)
                </Label>
                <Badge className="bg-destructive/20 text-destructive w-fit\">{settings.temperatureThreshold}°C</Badge>
              </div>
              <Input
                id="temperature"
                type="number"
                value={settings.temperatureThreshold}
                onChange={(e) => handleSettingChange("temperatureThreshold", parseInt(e.target.value))}
                className="h-9 text-sm"
                min="50"
                max="90"
              />
              <p className="text-xs text-muted-foreground mt-2\">Alert when temperature exceeds this level</p>
            </div>

            {/* Offline Threshold */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="offline" className="text-sm font-semibold">
                  Offline Threshold (minutes)
                </Label>
                <Badge className="bg-muted/50 w-fit\">{settings.offlineThreshold}m</Badge>
              </div>
              <Input
                id="offline"
                type="number"
                value={settings.offlineThreshold}
                onChange={(e) => handleSettingChange("offlineThreshold", parseInt(e.target.value))}
                className="h-9 text-sm"
                min="5"
                max="180"
              />
              <p className="text-xs text-muted-foreground mt-2\">Consider robot offline after this duration</p>
            </div>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="p-4 sm:p-5 lg:p-6 card-gradient border-border">
            <h2 className="text-lg sm:text-xl font-bold mb-6">System Settings</h2>

            {/* Auto Refresh */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="refresh" className="text-sm font-semibold">
                  Auto-Refresh Interval (seconds)
                </Label>
                <Badge className="bg-primary/20 text-primary w-fit">{settings.autoRefreshInterval}s</Badge>
              </div>
              <Input
                id="refresh"
                type="number"
                value={settings.autoRefreshInterval}
                onChange={(e) => handleSettingChange("autoRefreshInterval", parseInt(e.target.value))}
                className="h-9 text-sm"
                min="5"
                max="300"
              />
              <p className="text-xs text-muted-foreground mt-2">How often to refresh dashboard data</p>
            </div>

            {/* Data Retention */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="retention" className="text-sm font-semibold">
                  Data Retention (days)
                </Label>
                <Badge className="bg-primary/20 text-primary w-fit">{settings.dataRetentionDays}d</Badge>
              </div>
              <Input
                id="retention"
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => handleSettingChange("dataRetentionDays", parseInt(e.target.value))}
                className="h-9 text-sm"
                min="7"
                max="365"
              />
              <p className="text-xs text-muted-foreground mt-2">Retain historical data for N days</p>
            </div>

            {/* Log Level */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <Label htmlFor="loglevel" className="text-sm font-semibold">
                  Log Level
                </Label>
                <Badge variant="outline" className="w-fit">{settings.logLevel}</Badge>
              </div>
              <Select value={settings.logLevel} onValueChange={(value: any) => handleSettingChange("logLevel", value)}>
                <SelectTrigger id="loglevel" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug (Verbose)</SelectItem>
                  <SelectItem value="info">Info (Normal)</SelectItem>
                  <SelectItem value="warning">Warning (Issues Only)</SelectItem>
                  <SelectItem value="error">Error (Critical Only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Control system logging verbosity</p>
            </div>

            {/* System Info */}
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-mono">1.0.0-beta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Endpoint:</span>
                  <span className="font-mono text-primary">api.sparkx.io</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-mono">Just now</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Firmware Upload Card */}
          <Card className="p-4 sm:p-5 lg:p-6 card-gradient border-border">
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Firmware
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Upload firmware files to update fleet robots. Files will be available for deployment through the robot detail pages.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firmware-upload" className="text-sm font-medium">
                  Select Firmware File (.bin, .hex)
                </Label>
                <Input
                  id="firmware-upload"
                  type="file"
                  accept=".bin,.hex"
                  ref={fileInputRef}
                  onChange={handleFirmwareFileSelect}
                  className="mt-2 cursor-pointer"
                />
                {selectedFirmwareFile && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">{selectedFirmwareFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFirmwareFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearFirmwareFile}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                {firmwareError && (
                  <Alert className="mt-3 bg-destructive/10 border-destructive/30">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive text-sm">
                      {firmwareError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Alert className="bg-warning/10 border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning text-xs">
                  <strong>Important:</strong> Firmware files uploaded here will be stored in the system and made available for deployment to individual robots through their detail pages. Ensure files are validated before uploading.
                </AlertDescription>
              </Alert>

              <Button 
                disabled={!selectedFirmwareFile}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload to System
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 p-4 rounded-lg card-gradient border border-border">
        <div className="flex-1">
          {saveStatus === "saving" && (
            <p className="text-xs sm:text-sm text-muted-foreground animate-pulse">Saving settings...</p>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-success">
              <Check className="w-4 h-4 flex-shrink-0" />
              Settings saved successfully
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm h-9 flex-1 sm:flex-none"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <Button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            size="sm"
            className="text-xs sm:text-sm h-9 flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
