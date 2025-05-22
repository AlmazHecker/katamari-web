import * as THREE from "three";
import * as CANNON from "cannon-es";

export const GROUND_BODY_ID = 101;

// // земля по которой будет катится сфера
export class Ground {
  public readonly body: CANNON.Body;
  public readonly mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const planeGeo = new THREE.PlaneGeometry(100, 100);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.05,
      transparent: false,
    });

    this.mesh = new THREE.Mesh(planeGeo, shadowMat);
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, -1, 0);
    this.mesh.rotation.x = -Math.PI / 2;
    scene.add(this.mesh);

    const groundMaterial = new CANNON.Material({ friction: 0.5 });
    const groundShape = new CANNON.Plane();

    this.body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: groundMaterial,
      shape: groundShape,
    });

    this.body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2,
    );
    this.body.id = GROUND_BODY_ID;
  }
}
