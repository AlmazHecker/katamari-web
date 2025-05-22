import * as CANNON from "cannon-es";

export const createWalls = (world: CANNON.World) => {
  const wallMaterial = new CANNON.Material({
    friction: 0,
    restitution: 0,
  });

  const w = window.innerWidth / 128 + 0.5;
  const h = window.innerHeight / 128 + 0.5;

  const walls: Record<string, CANNON.Body> = {};

  const createPlane = (
    rotationAxis: CANNON.Vec3,
    rotationAngle: number,
    position: CANNON.Vec3,
  ) => {
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: wallMaterial,
      shape,
    });
    body.quaternion.setFromAxisAngle(rotationAxis, rotationAngle);
    body.position.copy(position);
    world.addBody(body);
    return body;
  };

  walls["left"] = createPlane(
    new CANNON.Vec3(0, 1, 0),
    Math.PI / 2,
    new CANNON.Vec3(-w, 0, 0),
  );
  walls["right"] = createPlane(
    new CANNON.Vec3(0, 1, 0),
    -Math.PI / 2,
    new CANNON.Vec3(w, 0, 0),
  );
  walls["bottom"] = createPlane(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI,
    new CANNON.Vec3(0, 0, h),
  );
  walls["top"] = createPlane(
    new CANNON.Vec3(0, 0, 0),
    0,
    new CANNON.Vec3(0, 0, -h),
  );
};
