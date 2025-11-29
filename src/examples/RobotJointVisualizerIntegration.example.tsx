// Example: Integrating RobotJointVisualizer with Real-Time API Data

import { useState, useEffect } from "react";
import { RobotJointVisualizer } from "@/components/RobotJointVisualizer";
import { useRealtimeData } from "@/hooks/useRealtimeData";

/**
 * OPTION 1: Using Real-Time WebSocket Data
 * ------------------------------------------
 * This example shows how to connect the visualizer to live telemetry data
 */

export function RobotDetailWithLiveData() {
  const { data: telemetry } = useRealtimeData();

  // Transform API data to match visualizer format
  const jointData = [
    {
      id: "neck",
      label: "Neck Joint",
      x: "50%",
      y: "12%",
      dof: 3,
      status: telemetry?.joints?.neck?.status || "ok",
      temperature: telemetry?.joints?.neck?.temperature || 38,
      torque: telemetry?.joints?.neck?.torque || 12,
      angle: telemetry?.joints?.neck?.angle || 5,
      targetAngle: telemetry?.joints?.neck?.targetAngle || 5,
    },
    // ... repeat for all 16 joints
  ];

  return <RobotJointVisualizer jointData={jointData} />;
}

/**
 * OPTION 2: Fetching from REST API
 * ------------------------------------------
 * Use this approach if you're polling data periodically
 */

export function RobotDetailWithRestAPI({ robotId }: { robotId: string }) {
  const [jointData, setJointData] = useState([]);

  useEffect(() => {
    const fetchJointData = async () => {
      const response = await fetch(`/api/robots/${robotId}/joints`);
      const data = await response.json();
      setJointData(transformApiDataToJoints(data));
    };

    fetchJointData();
    const interval = setInterval(fetchJointData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [robotId]);

  return <RobotJointVisualizer jointData={jointData} />;
}

/**
 * Helper: Transform API Response to Joint Data
 * ------------------------------------------
 */
function transformApiDataToJoints(apiData: any) {
  const JOINT_POSITIONS = [
    { id: "neck", label: "Neck Joint", x: "50%", y: "12%", dof: 3 },
    { id: "shoulder_left", label: "Left Shoulder", x: "35%", y: "20%", dof: 3 },
    { id: "shoulder_right", label: "Right Shoulder", x: "65%", y: "20%", dof: 3 },
    { id: "elbow_left", label: "Left Elbow", x: "28%", y: "35%", dof: 3 },
    { id: "elbow_right", label: "Right Elbow", x: "72%", y: "35%", dof: 3 },
    { id: "wrist_left", label: "Left Wrist", x: "24%", y: "48%", dof: 2 },
    { id: "wrist_right", label: "Right Wrist", x: "76%", y: "48%", dof: 2 },
    { id: "gripper_left", label: "Left Gripper", x: "22%", y: "55%", dof: 1 },
    { id: "gripper_right", label: "Right Gripper", x: "78%", y: "55%", dof: 1 },
    { id: "hip", label: "Hip Joint", x: "50%", y: "50%", dof: 3 },
    { id: "knee_high_left", label: "Left Knee High", x: "42%", y: "63%", dof: 1 },
    { id: "knee_high_right", label: "Right Knee High", x: "58%", y: "63%", dof: 1 },
    { id: "knee_low_left", label: "Left Knee Low", x: "40%", y: "73%", dof: 1 },
    { id: "knee_low_right", label: "Right Knee Low", x: "60%", y: "73%", dof: 1 },
    { id: "ankle_left", label: "Left Ankle", x: "42%", y: "88%", dof: 2 },
    { id: "ankle_right", label: "Right Ankle", x: "58%", y: "88%", dof: 2 },
  ];

  return JOINT_POSITIONS.map((position) => {
    const jointData = apiData.joints?.[position.id] || {};
    
    return {
      ...position,
      status: jointData.status || "ok",
      temperature: jointData.temperature || 0,
      torque: jointData.torque || 0,
      angle: jointData.angle || 0,
      targetAngle: jointData.targetAngle || 0,
    };
  });
}

/**
 * OPTION 3: Mapping from JointStatusPanel Data
 * ------------------------------------------
 * If you already have joint data in the format used by JointStatusPanel
 */

export function mapJointGroupsToVisualizer(jointGroups: any[]) {
  // Map from your existing joint groups structure
  const mapping = {
    "Neck Pitch": { id: "neck", x: "50%", y: "12%" },
    "L Shoulder Pitch": { id: "shoulder_left", x: "35%", y: "20%" },
    "R Shoulder Pitch": { id: "shoulder_right", x: "65%", y: "20%" },
    "L Elbow Pitch": { id: "elbow_left", x: "28%", y: "35%" },
    "R Elbow Pitch": { id: "elbow_right", x: "72%", y: "35%" },
    "L Wrist Pitch": { id: "wrist_left", x: "24%", y: "48%" },
    "R Wrist Pitch": { id: "wrist_right", x: "76%", y: "48%" },
    "L Gripper": { id: "gripper_left", x: "22%", y: "55%" },
    "R Gripper": { id: "gripper_right", x: "78%", y: "55%" },
    "Hip Pitch": { id: "hip", x: "50%", y: "50%" },
    "L Knee High": { id: "knee_high_left", x: "42%", y: "63%" },
    "R Knee High": { id: "knee_high_right", x: "58%", y: "63%" },
    "L Knee Low": { id: "knee_low_left", x: "40%", y: "73%" },
    "R Knee Low": { id: "knee_low_right", x: "60%", y: "73%" },
    "L Ankle Pitch": { id: "ankle_left", x: "42%", y: "88%" },
    "R Ankle Pitch": { id: "ankle_right", x: "58%", y: "88%" },
  };

  const visualizerData: any[] = [];

  jointGroups.forEach((group) => {
    group.joints.forEach((joint: any) => {
      const mapped = mapping[joint.name as keyof typeof mapping];
      if (mapped) {
        visualizerData.push({
          ...mapped,
          label: joint.name,
          dof: 1, // You can calculate this from the group
          status: joint.status,
          temperature: joint.temperature,
          torque: joint.torque,
          angle: joint.angle,
          targetAngle: joint.targetAngle,
        });
      }
    });
  });

  return visualizerData;
}

/**
 * OPTION 4: Expected API Response Format
 * ------------------------------------------
 * This is the ideal format your backend should return
 */

interface IdealAPIResponse {
  robotId: string;
  timestamp: string;
  joints: {
    neck: JointStatus;
    shoulder_left: JointStatus;
    shoulder_right: JointStatus;
    elbow_left: JointStatus;
    elbow_right: JointStatus;
    wrist_left: JointStatus;
    wrist_right: JointStatus;
    gripper_left: JointStatus;
    gripper_right: JointStatus;
    hip: JointStatus;
    knee_high_left: JointStatus;
    knee_high_right: JointStatus;
    knee_low_left: JointStatus;
    knee_low_right: JointStatus;
    ankle_left: JointStatus;
    ankle_right: JointStatus;
  };
}

interface JointStatus {
  status: "ok" | "warning" | "error";
  temperature: number; // Celsius
  torque: number; // Newton-meters
  angle: number; // Degrees
  targetAngle: number; // Degrees
  dof: number; // Degrees of freedom
  // Optional additional fields
  load?: number; // Percentage
  voltage?: number; // Volts
  current?: number; // Amps
  errorCode?: string;
}

/**
 * Example Usage in RobotDetail.tsx
 * ------------------------------------------
 */

// In your RobotDetail component:
/*
import { RobotJointVisualizer } from "@/components/RobotJointVisualizer";
import { JointStatusPanel } from "@/components/JointStatusPanel";

function RobotDetail() {
  const { id } = useParams();
  const { data: jointTelemetry } = useRealtimeData(`robots/${id}/joints`);

  return (
    <Tabs defaultValue="visual">
      <TabsList>
        <TabsTrigger value="visual">Visual Map</TabsTrigger>
        <TabsTrigger value="table">Detailed Table</TabsTrigger>
      </TabsList>
      
      <TabsContent value="visual">
        <RobotJointVisualizer data={jointTelemetry} />
      </TabsContent>
      
      <TabsContent value="table">
        <JointStatusPanel data={jointTelemetry} />
      </TabsContent>
    </Tabs>
  );
}
*/

/**
 * WebSocket Integration Example
 * ------------------------------------------
 */

export function useJointTelemetry(robotId: string) {
  const [jointData, setJointData] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://your-api.com/robots/${robotId}/telemetry`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "joint_update") {
        setJointData(transformApiDataToJoints(data.payload));
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => ws.close();
  }, [robotId]);

  return jointData;
}

/**
 * Status Calculation Helper
 * ------------------------------------------
 * Calculate joint status based on thresholds
 */

export function calculateJointStatus(joint: {
  temperature: number;
  torque: number;
  angle: number;
  targetAngle: number;
}): "ok" | "warning" | "error" {
  // Temperature thresholds
  if (joint.temperature > 75) return "error";
  if (joint.temperature > 60) return "warning";

  // Angle deviation
  const angleDiff = Math.abs(joint.angle - joint.targetAngle);
  if (angleDiff > 10) return "error";
  if (angleDiff > 5) return "warning";

  // Torque thresholds (example)
  if (joint.torque > 100) return "warning";

  return "ok";
}
