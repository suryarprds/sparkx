import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft as LeftIcon,
  ArrowRight,
  Circle,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RotateCw,
  RotateCcw,
  Zap,
  Turtle,
  Hand,
  Bot,
  Power,
  CheckCircle2,
} from "lucide-react";
import * as THREE from 'three';
import { Vec3 } from 'cannon-es';
import { initPhysics, stepPhysics, addStaticBox } from '../sim/physics';
import { createRobot, updateRobot, Humanoid } from '../sim/robot';
import { setupControls, inputState } from '../sim/controls';

interface RobotSimulationProps {
  robotId?: string;
}

type ControlMode = 'autonomous' | 'manual' | 'standby';

export const RobotSimulation = ({ robotId }: RobotSimulationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const robotRef = useRef<Humanoid | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [controlMode, setControlMode] = useState<ControlMode>('standby');
  const [showHandoverConfirm, setShowHandoverConfirm] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const autonomousIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update robot speed when moveSpeed changes
  useEffect(() => {
    if (robotRef.current) {
      const speedMultiplier = moveSpeed === 'slow' ? 0.5 : moveSpeed === 'fast' ? 2 : 1;
      robotRef.current.setSpeed(speedMultiplier);
    }
  }, [moveSpeed]);

  // Autonomous mode simulation (UI only - actual robot autonomy handled by backend)
  useEffect(() => {
    if (controlMode === 'autonomous' && robotRef.current) {
      // Simulate autonomous behavior with random movements for visualization
      // Note: This is for 3D visualization only, not real robot control data
      const performAutonomousAction = () => {
        if (!robotRef.current || controlMode !== 'autonomous') return;
        
        const actions = ['forward', 'left', 'right', 'rotateLeft', 'rotateRight'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        // Execute action for a short duration
        handleDirectionPress(randomAction);
        setTimeout(() => {
          if (controlMode === 'autonomous') {
            handleDirectionRelease();
          }
        }, 1000 + Math.random() * 2000); // 1-3 seconds
      };

      // Start autonomous behavior
      autonomousIntervalRef.current = setInterval(performAutonomousAction, 3000);
      
      return () => {
        if (autonomousIntervalRef.current) {
          clearInterval(autonomousIntervalRef.current);
        }
      };
    } else {
      if (autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
        autonomousIntervalRef.current = null;
      }
    }
  }, [controlMode]);

  const handleTakeControl = () => {
    setShowHandoverConfirm(true);
  };

  const confirmTakeControl = () => {
    setControlMode('manual');
    setShowHandoverConfirm(false);
    // Stop any ongoing autonomous actions
    if (robotRef.current) {
      robotRef.current.stop();
    }
    setActiveDirection(null);
    setIsOperating(false);
  };

  const handleReleaseControl = () => {
    setControlMode('standby');
    // Stop all movements
    if (robotRef.current) {
      robotRef.current.stop();
    }
    setActiveDirection(null);
    setIsOperating(false);
  };

  const handleStartAutonomous = () => {
    setControlMode('autonomous');
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202530);

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(6, 4, 8);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    scene.add(dir);

    const grid = new THREE.GridHelper(200, 200, 0x555555, 0x333333);
    scene.add(grid);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 1, metalness: 0 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    initPhysics();

    // Professional Environment Setup
    
    // Create platform/stage
    function addPlatform(pos: THREE.Vector3, size: THREE.Vector3, color: number) {
      const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
      const mat = new THREE.MeshStandardMaterial({ 
        color, 
        roughness: 0.7, 
        metalness: 0.3,
        emissive: color,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      addStaticBox(new Vec3(pos.x, pos.y, pos.z), new Vec3(size.x / 2, size.y / 2, size.z / 2));
    }

    // Create cylindrical pillars
    function addPillar(pos: THREE.Vector3, radius: number, height: number, color: number) {
      const geo = new THREE.CylinderGeometry(radius, radius, height, 16);
      const mat = new THREE.MeshStandardMaterial({ 
        color, 
        roughness: 0.4, 
        metalness: 0.6 
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      addStaticBox(new Vec3(pos.x, pos.y, pos.z), new Vec3(radius, height / 2, radius));
    }

    // Create steps/stairs
    function addStairs(startPos: THREE.Vector3, steps: number, stepHeight: number, stepDepth: number, stepWidth: number) {
      for (let i = 0; i < steps; i++) {
        const pos = new THREE.Vector3(
          startPos.x,
          startPos.y + (i * stepHeight) + stepHeight / 2,
          startPos.z + (i * stepDepth)
        );
        const size = new THREE.Vector3(stepWidth, stepHeight, stepDepth);
        const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const mat = new THREE.MeshStandardMaterial({ 
          color: 0x4a5568, 
          roughness: 0.8, 
          metalness: 0.2 
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        addStaticBox(new Vec3(pos.x, pos.y, pos.z), new Vec3(size.x / 2, size.y / 2, size.z / 2));
      }
    }

    // Training area platforms (cyan themed)
    addPlatform(new THREE.Vector3(5, 0.25, 0), new THREE.Vector3(3, 0.5, 3), 0x06b6d4);
    addPlatform(new THREE.Vector3(-5, 0.15, -5), new THREE.Vector3(2, 0.3, 2), 0x0891b2);
    addPlatform(new THREE.Vector3(0, 0.4, 8), new THREE.Vector3(4, 0.8, 2), 0x0e7490);

    // Decorative pillars
    addPillar(new THREE.Vector3(-8, 1.5, 0), 0.3, 3, 0x64748b);
    addPillar(new THREE.Vector3(8, 1.5, 0), 0.3, 3, 0x64748b);
    addPillar(new THREE.Vector3(0, 1.5, -8), 0.3, 3, 0x64748b);

    // Stairs
    addStairs(new THREE.Vector3(-3, 0, -8), 4, 0.3, 0.4, 2);
    
    // Marker posts
    addPillar(new THREE.Vector3(10, 0.75, 5), 0.15, 1.5, 0xfbbf24);
    addPillar(new THREE.Vector3(10, 0.75, -5), 0.15, 1.5, 0xfbbf24);
    addPillar(new THREE.Vector3(-10, 0.75, 5), 0.15, 1.5, 0xfbbf24);
    addPillar(new THREE.Vector3(-10, 0.75, -5), 0.15, 1.5, 0xfbbf24);

    // Low barrier walls
    addPlatform(new THREE.Vector3(0, 0.25, -12), new THREE.Vector3(8, 0.5, 0.3), 0x475569);
    addPlatform(new THREE.Vector3(12, 0.25, 0), new THREE.Vector3(0.3, 0.5, 8), 0x475569);

    const robot = createRobot(scene);
    robotRef.current = robot;

    const controls = setupControls(canvas, camera);

    const handleResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let last = performance.now();
    function loop(now: number) {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      stepPhysics(dt);

      // If keyboard has input, use it directly; otherwise pass null to let robot.ts use commandState
      const hasKeyboardInput = inputState.forward !== 0 || inputState.strafe !== 0 || inputState.jump;
      const input = hasKeyboardInput ? inputState : null;
      updateRobot(robot, input, dt);

      const torso = robot.parts.torso.mesh.position;
      controls.setTarget(torso.clone());

      grid.position.x = Math.floor(torso.x);
      grid.position.z = Math.floor(torso.z);
      groundMesh.position.x = Math.floor(torso.x);
      groundMesh.position.z = Math.floor(torso.z);

      controls.update(dt);
      renderer.render(scene, camera);

      animationFrameRef.current = requestAnimationFrame(loop);
    }
    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleDirectionPress = (direction: string) => {
    // Only allow manual control in manual mode
    if (controlMode !== 'manual') return;
    
    setActiveDirection(direction);
    setIsOperating(true);
    if (!robotRef.current) return;

    const robot = robotRef.current;
    const speedMultiplier = moveSpeed === 'slow' ? 0.5 : moveSpeed === 'fast' ? 2 : 1;
    robot.setSpeed(speedMultiplier);
    
    switch (direction) {
      case 'forward':
        robot.moveForward();
        break;
      case 'backward':
        robot.moveBackward();
        break;
      case 'left':
        robot.moveRight(); // Swapped: camera is behind robot
        break;
      case 'right':
        robot.moveLeft(); // Swapped: camera is behind robot
        break;
      case 'jump':
        robot.jump();
        break;
      case 'rotateLeft':
        robot.rotateRight(); // Swapped for camera perspective
        break;
      case 'rotateRight':
        robot.rotateLeft(); // Swapped for camera perspective
        break;
    }
  };

  const handleDirectionRelease = () => {
    const wasJump = activeDirection === 'jump';
    setActiveDirection(null);
    setIsOperating(false);
    // Stop all movements except jump
    if (robotRef.current && !wasJump) {
      robotRef.current.stop();
    }
  };

  const handleEmergencyStop = () => {
    setActiveDirection(null);
    setIsOperating(false);
    if (robotRef.current) {
      robotRef.current.stop();
    }
    // Emergency stop forces to standby mode
    setControlMode('standby');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-4">
      {/* Mode Control Header */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            {controlMode === 'autonomous' && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
                <Bot className="w-3.5 h-3.5 mr-1.5" />
                Autonomous
              </Badge>
            )}
            {controlMode === 'manual' && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Hand className="w-3.5 h-3.5 mr-1.5" />
                Tele-operation
              </Badge>
            )}
            {controlMode === 'standby' && (
              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                <Power className="w-3.5 h-3.5 mr-1.5" />
                Standby
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartAutonomous}
              disabled={controlMode === 'autonomous'}
              variant={controlMode === 'autonomous' ? 'default' : 'outline'}
              size="sm"
              className={`h-9 px-3 ${controlMode === 'autonomous' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}`}
            >
              <Bot className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Auto</span>
            </Button>
            
            <Button
              onClick={handleTakeControl}
              disabled={controlMode === 'manual'}
              variant={controlMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              className={`h-9 px-3 ${controlMode === 'manual' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-700'}`}
            >
              <Hand className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Manual</span>
            </Button>
            
            <Button
              onClick={handleReleaseControl}
              disabled={controlMode === 'standby'}
              variant={controlMode === 'standby' ? 'default' : 'outline'}
              size="sm"
              className={`h-9 px-3 ${controlMode === 'standby' ? 'bg-slate-600 hover:bg-slate-700' : 'border-slate-700'}`}
            >
              <Power className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Standby</span>
            </Button>
          </div>
        </div>

        {/* Handover Confirmation Dialog */}
        {showHandoverConfirm && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-500 mb-1.5">Confirm Control Handover</h4>
                <p className="text-xs text-amber-400 mb-3">
                  Take manual control from the autonomous system? Robot will stop all autonomous actions.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={confirmTakeControl}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm
                  </Button>
                  <Button
                    onClick={() => setShowHandoverConfirm(false)}
                    size="sm"
                    variant="outline"
                    className="border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 3D Simulation View */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden h-[548px]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-cyan-100 font-medium">3D Robot Simulation</span>
          </div>
          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            size="sm"
            className="text-cyan-400 hover:text-cyan-300"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
        <div className="bg-slate-950 flex items-center justify-center h-[500px]">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            style={{ display: 'block' }}
          />
        </div>
      </Card>

      {/* Control Panel */}
      <Card className="bg-slate-900/50 border-slate-800 relative h-[548px]">
        <div className="p-3 space-y-2 h-full flex flex-col">
          {/* Disabled overlay for non-manual modes */}
          {controlMode !== 'manual' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
              <div className="text-center p-6">
                <Hand className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="text-lg font-semibold text-slate-300 mb-2">Manual Controls Disabled</p>
                <p className="text-sm text-slate-400 mb-4">
                  Click "Take Control" to enable tele-operation mode
                </p>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-base font-semibold text-cyan-100 mb-3">
              Movement Controls
            </h3>

            {/* Directional Controls */}
            <div className="flex items-center gap-3">
              {/* Left side - Emergency Stop */}
              <Button
                onClick={handleEmergencyStop}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg border-4 border-red-800 flex-shrink-0"
                size="lg"
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">STOP</span>
                </div>
              </Button>

              {/* Center - Directional pad */}
              <div className="flex flex-col items-center gap-2 flex-1">
                {/* Forward */}
                <Button
                  size="default"
                  variant={activeDirection === "forward" ? "default" : "outline"}
                  className={`w-16 h-16 ${
                    activeDirection === "forward"
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
                  }`}
                  onMouseDown={() => handleDirectionPress("forward")}
                  onMouseUp={handleDirectionRelease}
                  onTouchStart={() => handleDirectionPress("forward")}
                  onTouchEnd={handleDirectionRelease}
                >
                  <ArrowUp className="w-8 h-8" />
                </Button>

                {/* Left, Stop, Right */}
                <div className="flex gap-2">
                  <Button
                    size="default"
                    variant={activeDirection === "left" ? "default" : "outline"}
                    className={`w-16 h-16 ${
                      activeDirection === "left"
                        ? "bg-cyan-600 hover:bg-cyan-700"
                        : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
                    }`}
                    onMouseDown={() => handleDirectionPress("left")}
                    onMouseUp={handleDirectionRelease}
                    onTouchStart={() => handleDirectionPress("left")}
                    onTouchEnd={handleDirectionRelease}
                  >
                    <LeftIcon className="w-8 h-8" />
                  </Button>

                  <Button
                    size="default"
                    variant="outline"
                    className="w-16 h-16 border-slate-600 text-slate-400 hover:bg-slate-800/50"
                    onClick={handleEmergencyStop}
                  >
                    <Circle className="w-6 h-6" />
                  </Button>

                  <Button
                    size="default"
                    variant={activeDirection === "right" ? "default" : "outline"}
                    className={`w-16 h-16 ${
                      activeDirection === "right"
                        ? "bg-cyan-600 hover:bg-cyan-700"
                        : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
                    }`}
                    onMouseDown={() => handleDirectionPress("right")}
                    onMouseUp={handleDirectionRelease}
                    onTouchStart={() => handleDirectionPress("right")}
                    onTouchEnd={handleDirectionRelease}
                  >
                    <ArrowRight className="w-8 h-8" />
                  </Button>
                </div>

                {/* Backward */}
                <Button
                  size="default"
                  variant={activeDirection === "backward" ? "default" : "outline"}
                  className={`w-16 h-16 ${
                    activeDirection === "backward"
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
                  }`}
                  onMouseDown={() => handleDirectionPress("backward")}
                  onMouseUp={handleDirectionRelease}
                  onTouchStart={() => handleDirectionPress("backward")}
                  onTouchEnd={handleDirectionRelease}
                >
                  <ArrowDown className="w-8 h-8" />
                </Button>
              </div>
            </div>

            {/* Speed Control */}
            <div className="mt-2">
              <label className="text-xs text-cyan-200 mb-1 block">Movement Speed</label>
              <div className="grid grid-cols-3 gap-1">
                <Button
                  size="sm"
                  variant={moveSpeed === 'slow' ? 'default' : 'outline'}
                  className={moveSpeed === 'slow' ? 'bg-cyan-600' : 'border-cyan-700 text-cyan-100'}
                  onClick={() => setMoveSpeed('slow')}
                >
                  <Turtle className="w-4 h-4 mr-1" />
                  Slow
                </Button>
                <Button
                  size="sm"
                  variant={moveSpeed === 'normal' ? 'default' : 'outline'}
                  className={moveSpeed === 'normal' ? 'bg-cyan-600' : 'border-cyan-700 text-cyan-100'}
                  onClick={() => setMoveSpeed('normal')}
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  variant={moveSpeed === 'fast' ? 'default' : 'outline'}
                  className={moveSpeed === 'fast' ? 'bg-cyan-600' : 'border-cyan-700 text-cyan-100'}
                  onClick={() => setMoveSpeed('fast')}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Fast
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="border-t border-slate-800 pt-2 mt-2">
            <h4 className="text-sm font-semibold text-cyan-100 mb-2">Advanced Actions</h4>
            
            {/* Jump */}
            <Button
              size="default"
              variant={activeDirection === "jump" ? "default" : "outline"}
              className={`w-full mb-2 h-10 ${
                activeDirection === "jump"
                  ? "bg-cyan-600 hover:bg-cyan-700"
                  : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
              }`}
              onMouseDown={() => handleDirectionPress("jump")}
              onMouseUp={handleDirectionRelease}
              onTouchStart={() => handleDirectionPress("jump")}
              onTouchEnd={handleDirectionRelease}
            >
              Jump
            </Button>
            
            {/* Rotation Controls */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              <Button
                size="default"
                variant={activeDirection === "rotateLeft" ? "default" : "outline"}
                className={`h-12 text-xs ${
                  activeDirection === "rotateLeft"
                    ? "bg-cyan-600 hover:bg-cyan-700"
                    : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
                }`}
                onMouseDown={() => handleDirectionPress("rotateLeft")}
                onMouseUp={handleDirectionRelease}
                onTouchStart={() => handleDirectionPress("rotateLeft")}
                onTouchEnd={handleDirectionRelease}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Rotate Left
              </Button>
              <Button
                size="default"
                variant={activeDirection === "rotateRight" ? "default" : "outline"}
                className={`h-12 text-xs ${
                  activeDirection === "rotateRight"
                    ? "bg-cyan-600 hover:bg-cyan-700"
                    : "border-cyan-700 text-cyan-100 hover:bg-cyan-950/50"
                }`}
                onMouseDown={() => handleDirectionPress("rotateRight")}
                onMouseUp={handleDirectionRelease}
                onTouchStart={() => handleDirectionPress("rotateRight")}
                onTouchEnd={handleDirectionRelease}
              >
                <RotateCw className="w-5 h-5 mr-2" />
                Rotate Right
              </Button>
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};
