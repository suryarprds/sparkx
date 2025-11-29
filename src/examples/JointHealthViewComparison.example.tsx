import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RobotJointVisualizer } from "@/components/RobotJointVisualizer";
import { JointStatusPanel } from "@/components/JointStatusPanel";
import { Eye, Table2 } from "lucide-react";

/**
 * Demo Component: Compare Visual vs Table View
 * 
 * This component demonstrates both approaches:
 * 1. Traditional table view (JointStatusPanel)
 * 2. New visual indicator view (RobotJointVisualizer)
 * 
 * Use this in RobotDetail.tsx to let users toggle between views
 */

export function JointHealthComparison() {
  return (
    <Card className="p-6">
      <Tabs defaultValue="visual" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Joint Health & Actuators</h3>
          <TabsList>
            <TabsTrigger value="visual" className="gap-2">
              <Eye className="w-4 h-4" />
              Visual Map
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="w-4 h-4" />
              Detailed Table
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="mt-0">
          <RobotJointVisualizer />
          <div className="mt-4 text-sm text-gray-500 text-center">
            💡 Hover over colored indicators to see detailed joint information
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <JointStatusPanel />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

/**
 * Usage Example 1: Simple Replacement
 * 
 * Replace the old JointStatusPanel with the new visualizer:
 */

// Before:
// <JointStatusPanel />

// After:
// <RobotJointVisualizer />

/**
 * Usage Example 2: Toggle Button
 * 
 * Add a toggle to switch between views:
 */

export function JointHealthWithToggle() {
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Joint Health & Actuators</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(v => v === "visual" ? "table" : "visual")}
        >
          {viewMode === "visual" ? (
            <>
              <Table2 className="w-4 h-4 mr-2" />
              Show Table
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show Visual
            </>
          )}
        </Button>
      </div>

      {viewMode === "visual" ? (
        <RobotJointVisualizer />
      ) : (
        <JointStatusPanel />
      )}
    </Card>
  );
}

/**
 * Usage Example 3: Side by Side (for comparison)
 * 
 * Show both views at once on larger screens:
 */

export function JointHealthSideBySide() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Visual Overview</h4>
        <RobotJointVisualizer />
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Detailed Status</h4>
        <JointStatusPanel />
      </div>
    </div>
  );
}

/**
 * Usage Example 4: Accordion Style (Current Implementation)
 * 
 * This is how it's currently integrated in RobotDetail.tsx:
 */

/*
<AccordionContent className="px-4 pb-4">
  <div className="space-y-4">
    <RobotJointVisualizer />
    <JointStatusPanel />
  </div>
</AccordionContent>
*/
