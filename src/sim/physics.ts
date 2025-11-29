import { World, Body, Plane, Vec3, Material, ContactMaterial, Box as CBox } from 'cannon-es';

export let world: World;
export let groundBody: Body;
export const staticBodies: Body[] = [];

export function initPhysics() {
  world = new World({ gravity: new Vec3(0, -9.82, 0) });
  (world.solver as any).iterations = 20;
  world.defaultContactMaterial.contactEquationStiffness = 1e8;
  world.defaultContactMaterial.contactEquationRelaxation = 4;

  groundBody = new Body({ mass: 0, shape: new Plane() });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0, 'XYZ');
  world.addBody(groundBody);

  const groundMat = new Material('ground');
  const robotMat = new Material('robot');
  const cm = new ContactMaterial(groundMat, robotMat, { friction: 0.9, restitution: 0.0 });
  world.addContactMaterial(cm);
  groundBody.material = groundMat;
}

export function addStaticBox(pos: Vec3, size: Vec3) {
  const body = new Body({ mass: 0, shape: new CBox(new Vec3(size.x / 2, size.y / 2, size.z / 2)) });
  body.position.copy(pos);
  world.addBody(body);
  staticBodies.push(body);
}

export function stepPhysics(dt: number) {
  world.step(1 / 60, dt, 3);
}
