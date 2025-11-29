import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
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
} from "lucide-react";
import * as THREE from 'three';
import { Vec3 } from 'cannon-es';
import { initPhysics, stepPhysics, addStaticBox } from '../sim/physics';
import { createRobot, updateRobot, Humanoid } from '../sim/robot';
import { setupControls, inputState } from '../sim/controls';

const RemoteControl = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const robotRef = useRef<Humanoid | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  
  // Update robot speed when moveSpeed changes
  useEffect(() => {
    if (robotRef.current) {
      const speedMultiplier = moveSpeed === 'slow' ? 0.5 : moveSpeed === 'fast' ? 2 : 1;
      robotRef.current.setSpeed(speedMultiplier);
    }
  }, [moveSpeed]);
  const animationFrameRef = useRef<number | null>(null);

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
    addPlatform(new THREE.Vector3(5, 0.25, 0), new THREE.Vector3(3, 0.5, 3), 0x06b6d4); // Center platform
    addPlatform(new THREE.Vector3(-5, 0.15, -5), new THREE.Vector3(2, 0.3, 2), 0x0891b2); // Small platform
    addPlatform(new THREE.Vector3(0, 0.4, 8), new THREE.Vector3(4, 0.8, 2), 0x0e7490); // Long platform

    // Decorative pillars around the area
    addPillar(new THREE.Vector3(-8, 1.5, 0), 0.3, 3, 0x64748b);
    addPillar(new THREE.Vector3(8, 1.5, 0), 0.3, 3, 0x64748b);
    addPillar(new THREE.Vector3(0, 1.5, -8), 0.3, 3, 0x64748b);

    // Stairs for robot to climb
    addStairs(new THREE.Vector3(-3, 0, -8), 4, 0.3, 0.4, 2);
    
    // Marker posts (taller thin pillars)
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
        robot.moveLeft();
        break;
      case 'right':
        robot.moveRight();
        break;
      case 'jump':
        robot.jump();
        break;
      case 'rotateLeft':
        robot.rotateLeft();
        break;
      case 'rotateRight':
        robot.rotateRight();
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
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-cyan-100 hover:text-cyan-50 hover:bg-cyan-950/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant={isOperating ? "default" : "secondary"} className="bg-cyan-600">
              {isOperating ? "Operating" : "Standby"}
            </Badge>
            <h1 className="text-xl md:text-2xl font-bold text-cyan-50">
              Robot #{id} - Remote Control
            </h1>
          </div>
        </div>

        {/* Main Control Interface */}
        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
          {/* 3D Simulation View */}
          <Card className={`bg-slate-900/50 border-slate-800 overflow-hidden ${isFullscreen ? 'lg:col-span-2' : ''}`}>
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
            <div className={`bg-slate-950 flex items-center justify-center ${isFullscreen ? 'h-[calc(100vh-250px)]' : 'h-96'}`}>
              <canvas 
                ref={canvasRef} 
                className="w-full h-full block"
              />
            </div>
            <div className="p-4 bg-slate-900/30">
              <p className="text-sm text-slate-400">
                Use WASD keys to move, SPACE to jump, or use the control buttons below. Drag mouse to rotate camera.
              </p>
            </div>
          </Card>

          {/* Control Panel */}
          {!isFullscreen && (
            <Card className="bg-slate-900/50 border-slate-800">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-cyan-100 mb-4">
                    Movement Controls
                  </h3>

                  {/* Directional Controls */}
                  <div className="flex flex-col items-center gap-3">
                    {/* Forward */}
                    <Button
                      size="lg"
                      variant={activeDirection === "forward" ? "default" : "outline"}
                      className={`w-20 h-20 ${
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
                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        variant={activeDirection === "left" ? "default" : "outline"}
                        className={`w-20 h-20 ${
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
                        size="lg"
                        variant="outline"
                        className="w-20 h-20 border-slate-600 text-slate-400 hover:bg-slate-800/50"
                        onClick={handleEmergencyStop}
                      >
                        <Circle className="w-8 h-8" />
                      </Button>

                      <Button
                        size="lg"
                        variant={activeDirection === "right" ? "default" : "outline"}
                        className={`w-20 h-20 ${
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
                      size="lg"
                      variant={activeDirection === "backward" ? "default" : "outline"}
                      className={`w-20 h-20 ${
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

                    {/* Jump */}
                    <Button
                      size="lg"
                      variant={activeDirection === "jump" ? "default" : "outline"}
                      className={`w-full mt-2 ${
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
                  </div>
                </div>

                {/* Additional Controls */}
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-cyan-100 mb-3">Advanced Actions</h4>
                  
                  {/* Rotation Controls */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Button
                      size="lg"
                      variant={activeDirection === "rotateLeft" ? "default" : "outline"}
                      className={`h-16 ${
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
                      size="lg"
                      variant={activeDirection === "rotateRight" ? "default" : "outline"}
                      className={`h-16 ${
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

                  {/* Speed Control */}
                  <div>
                    <label className="text-xs text-cyan-200 mb-2 block">Movement Speed</label>
                    <div className="grid grid-cols-3 gap-2">
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

                {/* Emergency Stop */}
                <Button
                  onClick={handleEmergencyStop}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Emergency Stop
                </Button>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-sm text-slate-400">
                    Status: {isOperating ? 'Operating' : 'Ready'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Speed: {moveSpeed.charAt(0).toUpperCase() + moveSpeed.slice(1)}
                  </p>
                  {activeDirection && (
                    <p className="text-sm text-cyan-400 animate-pulse">
                      Action: {activeDirection.charAt(0).toUpperCase() + activeDirection.slice(1).replace(/([A-Z])/g, ' $1')}
                    </p>
                  )}
                  <p className="text-sm text-slate-400">
                    Connection: Secure
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoteControl;
