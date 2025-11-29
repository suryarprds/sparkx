import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export interface JointData {
  name: string;
  angle: number;
  targetAngle: number;
  torque: number;
  temperature: number;
  status: "ok" | "warning" | "error";
}

export interface JointGroup {
  name: string;
  joints: JointData[];
}

/**
 * Shared hook for joint telemetry data from database
 * Fetches real-time joint data from API
 */
export function useJointData() {
  const { id: robotId } = useParams();
  const [jointGroups, setJointGroups] = useState<JointGroup[]>([]);

  // Fetch joint data from API
  useEffect(() => {
    if (!robotId) return;

    const fetchJointData = async () => {
      try {
        const response = await fetch(`/api/robots/${robotId}`);
        if (!response.ok) throw new Error('Failed to fetch robot data');
        
        const data = await response.json();
        
        if (data.joints && data.joints.length > 0) {
          // Map database joints to display format
          const mappedGroups = mapDatabaseJointsToGroups(data.joints);
          setJointGroups(mappedGroups);
        }
      } catch (error) {
        console.error('Error fetching joint data:', error);
      }
    };

    fetchJointData();
    
    // Refresh every 3 seconds for real-time updates
    const interval = setInterval(fetchJointData, 3000);
    return () => clearInterval(interval);
  }, [robotId]);

  return jointGroups;
}

// Helper function to map database joints to component format
function mapDatabaseJointsToGroups(dbJoints: any[]): JointGroup[] {
  const groups: { [key: string]: JointData[] } = {};

  dbJoints.forEach((joint) => {
    const jointName = joint.jointName;
    
    // Determine group based on joint name
    let groupName = "";
    let displayName = jointName;
    
    if (jointName === "Neck") {
      groupName = "Neck Joint (3 DOF)";
      displayName = "Neck";
    } else if (jointName.includes("Shoulder")) {
      groupName = "Shoulder Joints (6 DOF)";
      displayName = jointName; // "Shoulder_Left" or "Shoulder_Right"
    } else if (jointName.includes("Elbow")) {
      groupName = "Elbow Joints (6 DOF)";
      displayName = jointName;
    } else if (jointName.includes("Wrist")) {
      groupName = "Wrist Joints (4 DOF)";
      displayName = jointName;
    } else if (jointName.includes("Gripper")) {
      groupName = "Grippers (2 DOF)";
      displayName = jointName;
    } else if (jointName === "Hip") {
      groupName = "Hip Joint (3 DOF)";
      displayName = "Hip";
    } else if (jointName.includes("Knee_High")) {
      groupName = "Knee High Joints (2 DOF)";
      displayName = jointName;
    } else if (jointName.includes("Knee_Low")) {
      groupName = "Knee Low Joints (2 DOF)";
      displayName = jointName;
    } else if (jointName.includes("Ankle")) {
      groupName = "Ankle Joints (4 DOF)";
      displayName = jointName;
    } else {
      groupName = `${jointName} Joint`;
      displayName = jointName;
    }

    const status = mapDatabaseStatus(joint.status, joint.temperatureC, joint.currentPositionDeg, joint.targetPositionDeg);

    const jointData: JointData = {
      name: displayName,
      angle: joint.currentPositionDeg || 0,
      targetAngle: joint.targetPositionDeg || 0,
      torque: joint.currentTorqueNm || 0,
      temperature: joint.temperatureC || 0,
      status: status,
    };

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(jointData);
  });

  return Object.entries(groups).map(([name, joints]) => ({
    name,
    joints,
  }));
}

// Map database status to component status
function mapDatabaseStatus(
  dbStatus: string | null, 
  temp: number | null, 
  currentPos: number | null, 
  targetPos: number | null
): "ok" | "warning" | "error" {
  // Check database status first
  if (dbStatus === "error" || dbStatus === "disabled") return "error";
  if (dbStatus === "warning") return "warning";

  // Check temperature thresholds
  if (temp !== null && temp > 60) return "error";
  if (temp !== null && temp > 55) return "warning";

  // Check position deviation
  if (currentPos !== null && targetPos !== null) {
    const deviation = Math.abs(currentPos - targetPos);
    if (deviation > 10) return "error";
    if (deviation > 5) return "warning";
  }

  return "ok";
}
