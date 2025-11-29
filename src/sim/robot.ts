import * as THREE from 'three';
import { Body, Box, Vec3, Material, HingeConstraint, PointToPointConstraint, Sphere } from 'cannon-es';
import { world } from './physics';

export interface Limb {
  body: Body;
  mesh: THREE.Mesh;
}

export interface Humanoid {
  parts: Record<string, Limb>;
  joints: HingeConstraint[];
  moveForward: () => void;
  moveBackward: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  stop: () => void;
  jump: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  setSpeed: (speed: number) => void;
  _commandState?: { 
    forward: number; 
    strafe: number; 
    shouldJump: boolean;
    rotateSpeed: number;
    moveSpeedMultiplier: number;
  };
}

function syncPart(p: Limb) {
  p.mesh.position.set(p.body.position.x, p.body.position.y, p.body.position.z);
  p.mesh.quaternion.set(p.body.quaternion.x, p.body.quaternion.y, p.body.quaternion.z, p.body.quaternion.w);
}

function makeBox(size: THREE.Vector3, color: number, mass?: number) {
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  const shape = new Box(new Vec3(size.x / 2, size.y / 2, size.z / 2));
  const body = new Body({ 
    mass: mass !== undefined ? mass : Math.max(size.x * size.y * size.z * 0.15, 0.3), 
    shape, 
    material: new Material('robot'),
    linearDamping: 0.4,
    angularDamping: 0.8
  });
  return { body, mesh };
}

function makeSphere(radius: number, color: number, mass?: number) {
  const geo = new THREE.SphereGeometry(radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  const shape = new Sphere(radius);
  const body = new Body({ 
    mass: mass !== undefined ? mass : Math.max(radius * radius * radius * 0.15, 0.3), 
    shape, 
    material: new Material('robot'),
    linearDamping: 0.4,
    angularDamping: 0.8
  });
  return { body, mesh };
}

function makeRoundedBox(size: THREE.Vector3, color: number, mass?: number) {
  // Create a rounded box geometry with smooth corners
  const radius = 0.05; // Corner radius
  const widthSegments = 8;
  const heightSegments = 8;
  const depthSegments = 8;
  
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z, widthSegments, heightSegments, depthSegments);
  
  // Get position attribute and smooth the corners by pushing vertices outward
  const positionAttribute = geo.getAttribute('position');
  const positions = positionAttribute.array as Float32Array;
  
  // Move vertices to create rounded corners
  const hx = size.x / 2;
  const hy = size.y / 2;
  const hz = size.z / 2;
  
  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i];
    let y = positions[i + 1];
    let z = positions[i + 2];
    
    // Round the corners by normalizing edge vertices
    const edgeX = Math.abs(x) > (hx - 0.01);
    const edgeY = Math.abs(y) > (hy - 0.01);
    const edgeZ = Math.abs(z) > (hz - 0.01);
    
    if ((edgeX || edgeY || edgeZ)) {
      // Smooth corners on edges
      if (edgeX && edgeY) {
        x = Math.sign(x) * (hx - radius * 0.5);
        y = Math.sign(y) * (hy - radius * 0.5);
      }
      if (edgeY && edgeZ) {
        y = Math.sign(y) * (hy - radius * 0.5);
        z = Math.sign(z) * (hz - radius * 0.5);
      }
      if (edgeX && edgeZ) {
        x = Math.sign(x) * (hx - radius * 0.5);
        z = Math.sign(z) * (hz - radius * 0.5);
      }
      
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
    }
  }
  
  (positionAttribute as any).needsUpdate = true;
  geo.computeVertexNormals();
  
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  
  const shape = new Box(new Vec3(size.x / 2, size.y / 2, size.z / 2));
  const body = new Body({ 
    mass: mass !== undefined ? mass : Math.max(size.x * size.y * size.z * 0.15, 0.3), 
    shape, 
    material: new Material('robot'),
    linearDamping: 0.4,
    angularDamping: 0.8
  });
  return { body, mesh };
}

export function createRobot(scene: THREE.Scene): Humanoid {
  const parts: Record<string, Limb> = {};
  const joints: HingeConstraint[] = [];
  
  // Calculate positions from ground up for proper standing pose
  // Feet on ground at y=0.08 (half of foot height)
  const footHeight = 0.15;
  const footY = footHeight / 2 + 0.08; // Slightly above ground for stability
  
  // Lower legs
  const lowerLegHeight = 0.6;
  const lowerLegY = footY + footHeight / 2 + lowerLegHeight / 2;
  
  // Upper legs
  const upperLegHeight = 0.65;
  const upperLegY = lowerLegY + lowerLegHeight / 2 + upperLegHeight / 2;
  
  // Torso
  const torsoHeight = 1.0;
  const torsoY = upperLegY + upperLegHeight / 2 + torsoHeight / 2;
  
  // Torso - rectangular with smoothed edges for realistic body shape
  const torsoSize = new THREE.Vector3(0.5, torsoHeight, 0.25);
  const torso = makeRoundedBox(torsoSize, 0x4cc9f0, 5.0);
  torso.body.position.set(0, torsoY, 0);
  scene.add(torso.mesh);
  world.addBody(torso.body);
  parts.torso = torso;

  // Head - proper size and position (round sphere)
  const headRadius = 0.2;
  const head = makeSphere(headRadius, 0xffd6a5, 1.5);
  head.body.position.set(0, torsoY + torsoHeight / 2 + headRadius, 0);
  scene.add(head.mesh);
  world.addBody(head.body);
  parts.head = head;
  const neck = new PointToPointConstraint(torso.body, new Vec3(0, torsoHeight / 2, 0), head.body, new Vec3(0, -headRadius, 0));
  world.addConstraint(neck);

  // Face features - eyes, nose, and mouth (using local coordinates relative to head)
  const faceZ = headRadius + 0.01; // Front of head
  
  // Left eye (local coordinates)
  const leftEyeGeo = new THREE.SphereGeometry(0.03, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftEye = new THREE.Mesh(leftEyeGeo, eyeMat);
  leftEye.position.set(-0.06, 0.03, faceZ);
  head.mesh.add(leftEye);
  
  // Right eye (local coordinates)
  const rightEye = new THREE.Mesh(leftEyeGeo, eyeMat);
  rightEye.position.set(0.06, 0.03, faceZ);
  head.mesh.add(rightEye);
  
  // Eye highlights (pupils) - local coordinates
  const pupilGeo = new THREE.SphereGeometry(0.015, 16, 16);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x4cc9f0, emissive: 0x4cc9f0, emissiveIntensity: 0.5 });
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.06, 0.03, faceZ + 0.02);
  head.mesh.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.06, 0.03, faceZ + 0.02);
  head.mesh.add(rightPupil);
  
  // Nose (local coordinates)
  const noseGeo = new THREE.ConeGeometry(0.02, 0.06, 8);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xffb380 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, -0.01, faceZ + 0.03);
  nose.rotation.x = Math.PI / 2; // Point forward
  head.mesh.add(nose);

  // Arms - realistic proportions
  const upperArmHeight = 0.5;
  const lowerArmHeight = 0.45;
  const upperArmY = torsoY + torsoHeight / 2 - upperArmHeight / 2 - 0.1;
  const lowerArmY = upperArmY - upperArmHeight / 2 - lowerArmHeight / 2;
  
  const upperArmL = makeRoundedBox(new THREE.Vector3(0.12, upperArmHeight, 0.12), 0x90dbf4); parts.upperArmL = upperArmL;
  const lowerArmL = makeRoundedBox(new THREE.Vector3(0.1, lowerArmHeight, 0.1), 0x90dbf4); parts.lowerArmL = lowerArmL;
  upperArmL.body.position.set(-0.38, upperArmY, 0);
  lowerArmL.body.position.set(-0.38, lowerArmY, 0);
  scene.add(upperArmL.mesh); scene.add(lowerArmL.mesh);
  world.addBody(upperArmL.body); world.addBody(lowerArmL.body);
  const shoulderL = new HingeConstraint(torso.body, upperArmL.body, {
    pivotA: new Vec3(-0.31, torsoSize.y / 2 - 0.1, 0), axisA: new Vec3(1, 0, 0),
    pivotB: new Vec3(0, upperArmHeight / 2, 0), axisB: new Vec3(1, 0, 0),
  });
  shoulderL.collideConnected = false;
  joints.push(shoulderL);
  const elbowL = new HingeConstraint(upperArmL.body, lowerArmL.body, {
    pivotA: new Vec3(0, -upperArmHeight / 2, 0), axisA: new Vec3(1, 0, 0),
    pivotB: new Vec3(0, lowerArmHeight / 2, 0), axisB: new Vec3(1, 0, 0),
  });
  elbowL.collideConnected = false;
  joints.push(elbowL);

  const upperArmR = makeRoundedBox(new THREE.Vector3(0.12, upperArmHeight, 0.12), 0x90dbf4); parts.upperArmR = upperArmR;
  const lowerArmR = makeRoundedBox(new THREE.Vector3(0.1, lowerArmHeight, 0.1), 0x90dbf4); parts.lowerArmR = lowerArmR;
  upperArmR.body.position.set(0.38, upperArmY, 0);
  lowerArmR.body.position.set(0.38, lowerArmY, 0);
  scene.add(upperArmR.mesh); scene.add(lowerArmR.mesh);
  world.addBody(upperArmR.body); world.addBody(lowerArmR.body);
  const shoulderR = new HingeConstraint(torso.body, upperArmR.body, {
    pivotA: new Vec3(0.31, torsoSize.y / 2 - 0.1, 0), axisA: new Vec3(1, 0, 0),
    pivotB: new Vec3(0, upperArmHeight / 2, 0), axisB: new Vec3(1, 0, 0),
  });
  shoulderR.collideConnected = false;
  joints.push(shoulderR);
  const elbowR = new HingeConstraint(upperArmR.body, lowerArmR.body, {
    pivotA: new Vec3(0, -upperArmHeight / 2, 0), axisA: new Vec3(1, 0, 0),
    pivotB: new Vec3(0, lowerArmHeight / 2, 0), axisB: new Vec3(1, 0, 0),
  });
  elbowR.collideConnected = false;
  joints.push(elbowR);

  // Legs - realistic human proportions with proper constraints
  const upperLegL = makeRoundedBox(new THREE.Vector3(0.16, upperLegHeight, 0.16), 0x4895ef, 1.5); parts.upperLegL = upperLegL;
  const lowerLegL = makeRoundedBox(new THREE.Vector3(0.14, lowerLegHeight, 0.14), 0x4895ef, 1.2); parts.lowerLegL = lowerLegL;
  upperLegL.body.position.set(-0.15, upperLegY, 0);
  lowerLegL.body.position.set(-0.15, lowerLegY, 0);
  scene.add(upperLegL.mesh); scene.add(lowerLegL.mesh);
  world.addBody(upperLegL.body); world.addBody(lowerLegL.body);
  
  // Completely freeze hip with multiple point constraints in all directions
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(-0.12, -torsoHeight / 2, 0), upperLegL.body, new Vec3(0, upperLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(-0.12, -torsoHeight / 2, 0.08), upperLegL.body, new Vec3(0, upperLegHeight / 2, 0.08)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(-0.12, -torsoHeight / 2, -0.08), upperLegL.body, new Vec3(0, upperLegHeight / 2, -0.08)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(-0.04, -torsoHeight / 2, 0), upperLegL.body, new Vec3(0.08, upperLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(-0.20, -torsoHeight / 2, 0), upperLegL.body, new Vec3(-0.08, upperLegHeight / 2, 0)));
  
  // Completely freeze knee with multiple point constraints in all directions
  world.addConstraint(new PointToPointConstraint(upperLegL.body, new Vec3(0, -upperLegHeight / 2, 0), lowerLegL.body, new Vec3(0, lowerLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(upperLegL.body, new Vec3(0.07, -upperLegHeight / 2, 0), lowerLegL.body, new Vec3(0.07, lowerLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(upperLegL.body, new Vec3(-0.07, -upperLegHeight / 2, 0), lowerLegL.body, new Vec3(-0.07, lowerLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(upperLegL.body, new Vec3(0, -upperLegHeight / 2, 0.07), lowerLegL.body, new Vec3(0, lowerLegHeight / 2, 0.07)));
  world.addConstraint(new PointToPointConstraint(upperLegL.body, new Vec3(0, -upperLegHeight / 2, -0.07), lowerLegL.body, new Vec3(0, lowerLegHeight / 2, -0.07)));

  const upperLegR = makeRoundedBox(new THREE.Vector3(0.16, upperLegHeight, 0.16), 0x4895ef, 1.5); parts.upperLegR = upperLegR;
  const lowerLegR = makeRoundedBox(new THREE.Vector3(0.14, lowerLegHeight, 0.14), 0x4895ef, 1.2); parts.lowerLegR = lowerLegR;
  upperLegR.body.position.set(0.15, upperLegY, 0);
  lowerLegR.body.position.set(0.15, lowerLegY, 0);
  scene.add(upperLegR.mesh); scene.add(lowerLegR.mesh);
  world.addBody(upperLegR.body); world.addBody(lowerLegR.body);
  
  // Completely freeze hip with multiple point constraints in all directions
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(0.12, -torsoHeight / 2, 0), upperLegR.body, new Vec3(0, upperLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(0.12, -torsoHeight / 2, 0.08), upperLegR.body, new Vec3(0, upperLegHeight / 2, 0.08)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(0.12, -torsoHeight / 2, -0.08), upperLegR.body, new Vec3(0, upperLegHeight / 2, -0.08)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(0.04, -torsoHeight / 2, 0), upperLegR.body, new Vec3(-0.08, upperLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(torso.body, new Vec3(0.20, -torsoHeight / 2, 0), upperLegR.body, new Vec3(0.08, upperLegHeight / 2, 0)));
  
  // Completely freeze knee with multiple point constraints in all directions
  world.addConstraint(new PointToPointConstraint(upperLegR.body, new Vec3(0, -upperLegHeight / 2, 0), lowerLegR.body, new Vec3(0, lowerLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(upperLegR.body, new Vec3(0.07, -upperLegHeight / 2, 0), lowerLegR.body, new Vec3(0.07, lowerLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(upperLegR.body, new Vec3(-0.07, -upperLegHeight / 2, 0), lowerLegR.body, new Vec3(-0.07, lowerLegHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(upperLegR.body, new Vec3(0, -upperLegHeight / 2, 0.07), lowerLegR.body, new Vec3(0, lowerLegHeight / 2, 0.07)));
  world.addConstraint(new PointToPointConstraint(upperLegR.body, new Vec3(0, -upperLegHeight / 2, -0.07), lowerLegR.body, new Vec3(0, lowerLegHeight / 2, -0.07)));

  // Simple hands with fingers (3 segments each hand)
  const palmY = lowerArmY - lowerArmHeight / 2 - 0.04;
  function addHandWithFingers(prefix: string, wristBody: Body, side: number) {
    const palm = makeRoundedBox(new THREE.Vector3(0.08, 0.05, 0.08), 0x64dfdf, 0.15); 
    palm.body.position.set(0.38 * side, palmY, 0);
    scene.add(palm.mesh); world.addBody(palm.body); parts[prefix+'Palm'] = palm;
    
    // ULTRA STRONG wrist lock - 9 point constraint grid
    const wristConstraints = [
      new PointToPointConstraint(wristBody, new Vec3(0, -lowerArmHeight / 2, 0), palm.body, new Vec3(0, 0.025, 0)),
      new PointToPointConstraint(wristBody, new Vec3(0.04, -lowerArmHeight / 2, 0), palm.body, new Vec3(0.04, 0.025, 0)),
      new PointToPointConstraint(wristBody, new Vec3(-0.04, -lowerArmHeight / 2, 0), palm.body, new Vec3(-0.04, 0.025, 0)),
      new PointToPointConstraint(wristBody, new Vec3(0, -lowerArmHeight / 2, 0.04), palm.body, new Vec3(0, 0.025, 0.04)),
      new PointToPointConstraint(wristBody, new Vec3(0, -lowerArmHeight / 2, -0.04), palm.body, new Vec3(0, 0.025, -0.04)),
      new PointToPointConstraint(wristBody, new Vec3(0.04, -lowerArmHeight / 2, 0.04), palm.body, new Vec3(0.04, 0.025, 0.04)),
      new PointToPointConstraint(wristBody, new Vec3(-0.04, -lowerArmHeight / 2, 0.04), palm.body, new Vec3(-0.04, 0.025, 0.04)),
      new PointToPointConstraint(wristBody, new Vec3(0.04, -lowerArmHeight / 2, -0.04), palm.body, new Vec3(0.04, 0.025, -0.04)),
      new PointToPointConstraint(wristBody, new Vec3(-0.04, -lowerArmHeight / 2, -0.04), palm.body, new Vec3(-0.04, 0.025, -0.04)),
    ];
    wristConstraints.forEach(c => { c.collideConnected = false; world.addConstraint(c); });

    const fingerCount = 4;
    for (let i = 0; i < fingerCount; i++) {
      const base = makeRoundedBox(new THREE.Vector3(0.04, 0.07, 0.04), 0x64dfdf, 0.04);
      const mid = makeRoundedBox(new THREE.Vector3(0.035, 0.06, 0.035), 0x64dfdf, 0.03);
      const tip = makeRoundedBox(new THREE.Vector3(0.03, 0.05, 0.03), 0x64dfdf, 0.02);
      const xOffset = -0.06 + i * 0.04;
      base.body.position.set(0.38 * side + xOffset, palmY - 0.06, 0.1);
      mid.body.position.set(0.38 * side + xOffset, palmY - 0.11, 0.12);
      tip.body.position.set(0.38 * side + xOffset, palmY - 0.15, 0.14);
      scene.add(base.mesh); scene.add(mid.mesh); scene.add(tip.mesh);
      world.addBody(base.body); world.addBody(mid.body); world.addBody(tip.body);
      parts[`${prefix}Finger${i}Base`] = base; parts[`${prefix}Finger${i}Mid`] = mid; parts[`${prefix}Finger${i}Tip`] = tip;
      
      // Multi-point constraints for each finger joint to prevent detachment
      const baseConstraints = [
        new PointToPointConstraint(palm.body, new Vec3(xOffset, -0.025, 0.04), base.body, new Vec3(0, 0.035, 0)),
        new PointToPointConstraint(palm.body, new Vec3(xOffset + 0.015, -0.025, 0.04), base.body, new Vec3(0.015, 0.035, 0)),
        new PointToPointConstraint(palm.body, new Vec3(xOffset - 0.015, -0.025, 0.04), base.body, new Vec3(-0.015, 0.035, 0)),
      ];
      baseConstraints.forEach(c => { c.collideConnected = false; world.addConstraint(c); });
      
      const midConstraints = [
        new PointToPointConstraint(base.body, new Vec3(0, -0.035, 0.02), mid.body, new Vec3(0, 0.03, 0)),
        new PointToPointConstraint(base.body, new Vec3(0.015, -0.035, 0.02), mid.body, new Vec3(0.015, 0.03, 0)),
        new PointToPointConstraint(base.body, new Vec3(-0.015, -0.035, 0.02), mid.body, new Vec3(-0.015, 0.03, 0)),
      ];
      midConstraints.forEach(c => { c.collideConnected = false; world.addConstraint(c); });
      
      const tipConstraints = [
        new PointToPointConstraint(mid.body, new Vec3(0, -0.03, 0.02), tip.body, new Vec3(0, 0.025, 0)),
        new PointToPointConstraint(mid.body, new Vec3(0.012, -0.03, 0.02), tip.body, new Vec3(0.012, 0.025, 0)),
        new PointToPointConstraint(mid.body, new Vec3(-0.012, -0.03, 0.02), tip.body, new Vec3(-0.012, 0.025, 0)),
      ];
      tipConstraints.forEach(c => { c.collideConnected = false; world.addConstraint(c); });
    }
  }
  addHandWithFingers('L', lowerArmL.body, -1);
  addHandWithFingers('R', lowerArmR.body, 1);

  // Feet - proper humanoid feet on the ground with strong ankle constraints
  const footL = makeRoundedBox(new THREE.Vector3(0.18, footHeight, 0.3), 0x4361ee, 0.8); parts.footL = footL;
  const footR = makeRoundedBox(new THREE.Vector3(0.18, footHeight, 0.3), 0x4361ee, 0.8); parts.footR = footR;
  footL.body.position.set(-0.15, footY, 0.05);
  footR.body.position.set(0.15, footY, 0.05);
  scene.add(footL.mesh); scene.add(footR.mesh);
  world.addBody(footL.body); world.addBody(footR.body);
  
  // Strong ankle constraints - multiple points for rigidity
  world.addConstraint(new PointToPointConstraint(lowerLegL.body, new Vec3(0, -lowerLegHeight / 2, 0), footL.body, new Vec3(0, footHeight / 2, -0.05)));
  world.addConstraint(new PointToPointConstraint(lowerLegL.body, new Vec3(0.05, -lowerLegHeight / 2, 0.05), footL.body, new Vec3(0.05, footHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(lowerLegL.body, new Vec3(-0.05, -lowerLegHeight / 2, 0.05), footL.body, new Vec3(-0.05, footHeight / 2, 0)));
  
  world.addConstraint(new PointToPointConstraint(lowerLegR.body, new Vec3(0, -lowerLegHeight / 2, 0), footR.body, new Vec3(0, footHeight / 2, -0.05)));
  world.addConstraint(new PointToPointConstraint(lowerLegR.body, new Vec3(0.05, -lowerLegHeight / 2, 0.05), footR.body, new Vec3(0.05, footHeight / 2, 0)));
  world.addConstraint(new PointToPointConstraint(lowerLegR.body, new Vec3(-0.05, -lowerLegHeight / 2, 0.05), footR.body, new Vec3(-0.05, footHeight / 2, 0)));

  ;(world as any).humanoidParts = parts;

  // Register joints in world
  joints.forEach(j => world.addConstraint(j));

  // Initialize torso orientation
  torso.body.quaternion.setFromEuler(0, 0, 0, 'XYZ');

  // High-level command state
  const commandState = { 
    forward: 0, 
    strafe: 0, 
    shouldJump: false, 
    jumpFrames: 0,
    rotateSpeed: 0,
    moveSpeedMultiplier: 1
  };

  // High-level movement commands
  const commands = {
    moveForward: () => { commandState.forward = 1; commandState.strafe = 0; },
    moveBackward: () => { commandState.forward = -1; commandState.strafe = 0; },
    moveLeft: () => { commandState.strafe = -1; commandState.forward = 0; },
    moveRight: () => { commandState.strafe = 1; commandState.forward = 0; },
    stop: () => { commandState.forward = 0; commandState.strafe = 0; commandState.rotateSpeed = 0; },
    jump: () => { commandState.shouldJump = true; commandState.jumpFrames = 5; },
    rotateLeft: () => { commandState.rotateSpeed = 3; },
    rotateRight: () => { commandState.rotateSpeed = -3; },
    setSpeed: (multiplier: number) => { commandState.moveSpeedMultiplier = multiplier; }
  };

  return { parts, joints, ...commands, _commandState: commandState, _shoulderL: shoulderL, _shoulderR: shoulderR, _elbowL: elbowL, _elbowR: elbowR };
}

export function updateRobot(h: Humanoid, input: { forward: number; strafe: number; jump: boolean; leftArmUp?: boolean; leftArmDown?: boolean; rightArmUp?: boolean; rightArmDown?: boolean } | null, dt: number) {
  const torso = h.parts.torso.body;
  const head = h.parts.head.body;
  
  // Use command state if no manual input provided
  const commandState = (h as any)._commandState;
  
  // If no input provided, create from command state
  if (!input && commandState) {
    input = { 
      forward: commandState.forward, 
      strafe: commandState.strafe, 
      jump: commandState.shouldJump 
    };
  }
  
  // Handle jump frames countdown
  if (commandState && commandState.jumpFrames > 0) {
    commandState.jumpFrames--;
    if (commandState.jumpFrames === 0) {
      commandState.shouldJump = false;
    }
  }
  
  if (!input) {
    input = { forward: 0, strafe: 0, jump: false };
  }
  
  // Arm controls
  const shoulderL = (h as any)._shoulderL as HingeConstraint;
  const shoulderR = (h as any)._shoulderR as HingeConstraint;
  const elbowL = (h as any)._elbowL as HingeConstraint;
  const elbowR = (h as any)._elbowR as HingeConstraint;
  
  // Get arm bodies for damping and stabilization
  const upperArmL = h.parts.upperArmL?.body;
  const upperArmR = h.parts.upperArmR?.body;
  const lowerArmL = h.parts.lowerArmL?.body;
  const lowerArmR = h.parts.lowerArmR?.body;
  const palmL = h.parts.LPalm?.body;
  const palmR = h.parts.RPalm?.body;
  
  // Dampen arm rotations to prevent wild movements
  if (upperArmL) {
    upperArmL.angularVelocity.scale(0.8, upperArmL.angularVelocity);
    // Lock upper arm orientation (except for shoulder rotation)
    upperArmL.quaternion.set(upperArmL.quaternion.x, 0, 0, upperArmL.quaternion.w);
    upperArmL.quaternion.normalize();
  }
  if (lowerArmL) {
    lowerArmL.angularVelocity.scale(0.9, lowerArmL.angularVelocity);
    // Keep lower arm straight
    lowerArmL.quaternion.set(0, 0, 0, 1);
  }
  if (upperArmR) {
    upperArmR.angularVelocity.scale(0.8, upperArmR.angularVelocity);
    // Lock upper arm orientation (except for shoulder rotation)
    upperArmR.quaternion.set(upperArmR.quaternion.x, 0, 0, upperArmR.quaternion.w);
    upperArmR.quaternion.normalize();
  }
  if (lowerArmR) {
    lowerArmR.angularVelocity.scale(0.9, lowerArmR.angularVelocity);
    // Keep lower arm straight
    lowerArmR.quaternion.set(0, 0, 0, 1);
  }
  
  // Lock palms/wrists completely - prevent any twisting
  // COMPLETE LOCK - FINGERS AND PALMS when standing still (but allow arms to move)
  const isMoving = input.forward !== 0 || input.strafe !== 0;
  const isManualArmControl = input.leftArmUp || input.leftArmDown || input.rightArmUp || input.rightArmDown;
  
  if (!isMoving && !isManualArmControl) {
    // Only freeze palms and fingers when standing still, let arms hang naturally
    const palmL = h.parts.LPalm?.body;
    const palmR = h.parts.RPalm?.body;
    
    // Freeze palms
    [palmL, palmR].forEach(part => {
      if (part) {
        part.velocity.scale(0.1, part.velocity);
        part.angularVelocity.scale(0.1, part.angularVelocity);
      }
    });
    
    // Freeze all 24 finger segments
    for (let i = 0; i < 4; i++) {
      const fingerParts = [
        h.parts[`LFinger${i}Base`]?.body,
        h.parts[`LFinger${i}Mid`]?.body,
        h.parts[`LFinger${i}Tip`]?.body,
        h.parts[`RFinger${i}Base`]?.body,
        h.parts[`RFinger${i}Mid`]?.body,
        h.parts[`RFinger${i}Tip`]?.body,
      ];
      fingerParts.forEach(part => {
        if (part) {
          part.velocity.scale(0.1, part.velocity);
          part.angularVelocity.scale(0.1, part.angularVelocity);
        }
      });
    }
  }
  
  // Keep elbows straight when not moving arms
  if (!isManualArmControl && elbowL) {
    elbowL.enableMotor();
    elbowL.setMotorSpeed(0);
    elbowL.setMotorMaxForce(100);
  }
  if (!isManualArmControl && elbowR) {
    elbowR.enableMotor();
    elbowR.setMotorSpeed(0);
    elbowR.setMotorMaxForce(100);
  }
  
  // Realistic arm swinging - ONLY when moving forward/backward  
  if (shoulderL) {
    if (input.leftArmUp) {
      shoulderL.enableMotor();
      shoulderL.setMotorSpeed(-2); // Raise arm (reduced speed for stability)
      shoulderL.setMotorMaxForce(300);
    } else if (input.leftArmDown) {
      shoulderL.enableMotor();
      shoulderL.setMotorSpeed(2); // Lower arm (reduced speed for stability)
      shoulderL.setMotorMaxForce(300);
    } else if (input.forward !== 0 && !isManualArmControl) {
      // Automatic arm swing ONLY during forward/backward movement
      const walkCycle = (Date.now() / 300) % (Math.PI * 2); // ~0.3 second cycle
      const swingAngle = Math.sin(walkCycle) * 0.4; // Swing amplitude
      shoulderL.enableMotor();
      shoulderL.setMotorSpeed(swingAngle * 7); // Proportional swing
      shoulderL.setMotorMaxForce(200);
    } else {
      shoulderL.disableMotor();
    }
  }
  
  if (shoulderR) {
    if (input.rightArmUp) {
      shoulderR.enableMotor();
      shoulderR.setMotorSpeed(-2); // Raise arm (reduced speed for stability)
      shoulderR.setMotorMaxForce(300);
    } else if (input.rightArmDown) {
      shoulderR.enableMotor();
      shoulderR.setMotorSpeed(2); // Lower arm (reduced speed for stability)
      shoulderR.setMotorMaxForce(300);
    } else if (input.forward !== 0 && !isManualArmControl) {
      // Automatic arm swing ONLY during forward/backward movement (opposite phase from left arm)
      const walkCycle = (Date.now() / 300) % (Math.PI * 2);
      const swingAngle = Math.sin(walkCycle + Math.PI) * 0.4; // Opposite phase
      shoulderR.enableMotor();
      shoulderR.setMotorSpeed(swingAngle * 7);
      shoulderR.setMotorMaxForce(200);
    } else {
      shoulderR.disableMotor();
    }
  }
  
  // Strong upright stabilization to keep robot standing - INSTANT
  const stabilizationTorque = 1000; // Increased from 500
  const angVel = torso.angularVelocity;
  
  // Apply rotation from command state
  if (commandState && commandState.rotateSpeed !== 0) {
    torso.angularVelocity.y = commandState.rotateSpeed * (commandState.moveSpeedMultiplier || 1);
  } else {
    // Lock rotational velocity immediately when not rotating
    torso.angularVelocity.set(0, angVel.y * 0.85, 0); // Completely lock X and Z rotation
  }
  
  // Keep torso upright using corrective torque
  // Extract roll (x) and pitch (z) angles using quaternion
  const q = torso.quaternion;
  const roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
  const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.y - q.z * q.x))));
  
  // Instantly lock torso upright if nearly straight
  if (Math.abs(roll) < 0.05 || Math.abs(pitch) < 0.05) {
    torso.quaternion.set(0, torso.quaternion.y, 0, torso.quaternion.w);
    torso.quaternion.normalize();
  } else {
    // Strong corrective torque if tilted
    torso.applyTorque(new Vec3(-roll * stabilizationTorque, 0, -pitch * stabilizationTorque));
  }
  
  // Keep head upright and stable - lock rotation completely
  head.angularVelocity.set(0, 0, 0);
  head.quaternion.set(0, 0, 0, 1); // Reset to no rotation
  
  // Add upward force on feet when on ground for extra stability
  const footL = h.parts.footL.body;
  const footR = h.parts.footR.body;
  if (footL.position.y < 0.3) {
    footL.applyForce(new Vec3(0, 50, 0), new Vec3(0, 0, 0));
    // Instantly lock feet movement
    footL.velocity.x = 0;
    footL.velocity.z = 0;
    if (footL.velocity.y > 0) footL.velocity.y = 0; // Prevent lifting
  }
  if (footR.position.y < 0.3) {
    footR.applyForce(new Vec3(0, 50, 0), new Vec3(0, 0, 0));
    // Instantly lock feet movement
    footR.velocity.x = 0;
    footR.velocity.z = 0;
    if (footR.velocity.y > 0) footR.velocity.y = 0; // Prevent lifting
  }
  
  // Lock legs straight - apply corrective torques to keep knees and hips from bending
  const upperLegL = h.parts.upperLegL.body;
  const lowerLegL = h.parts.lowerLegL.body;
  const upperLegR = h.parts.upperLegR.body;
  const lowerLegR = h.parts.lowerLegR.body;
  
  // Instantly lock leg rotations
  upperLegL.angularVelocity.set(0, 0, 0);
  lowerLegL.angularVelocity.set(0, 0, 0);
  upperLegR.angularVelocity.set(0, 0, 0);
  lowerLegR.angularVelocity.set(0, 0, 0);
  
  // Instantly lock leg orientation to be perfectly straight
  upperLegL.quaternion.set(0, 0, 0, 1);
  lowerLegL.quaternion.set(0, 0, 0, 1);
  upperLegR.quaternion.set(0, 0, 0, 1);
  lowerLegR.quaternion.set(0, 0, 0, 1);
  
  // Add direct upward force on legs to counter gravity
  upperLegL.applyForce(new Vec3(0, 4, 0));
  lowerLegL.applyForce(new Vec3(0, 4, 0));
  upperLegR.applyForce(new Vec3(0, 4, 0));
  lowerLegR.applyForce(new Vec3(0, 4, 0));
  
  // Movement controls - direct position movement without physics forces
  const baseSpeed = 3.0; // units per second
  const moveSpeed = baseSpeed * (commandState?.moveSpeedMultiplier || 1);
  if (input.forward !== 0 || input.strafe !== 0) {
    // Calculate movement direction
    const moveX = input.strafe * moveSpeed * dt;
    const moveZ = input.forward * moveSpeed * dt;
    
    // Move entire robot by directly updating all body positions
    Object.values(h.parts).forEach(part => {
      part.body.position.x += moveX;
      part.body.position.z += moveZ;
      // Reset velocities to prevent physics interference
      part.body.velocity.x = 0;
      part.body.velocity.z = 0;
    });
  }
  
  // Jump with space - check if robot is near ground
  const standingHeight = 1.95; // Expected torso height when standing
  if (input.jump && torso.position.y < standingHeight + 0.3) {
    torso.applyImpulse(new Vec3(0, 8, 0));
  }

  // Sync all parts
  Object.values(h.parts).forEach(syncPart);
}
