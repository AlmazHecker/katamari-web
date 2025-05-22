import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { lerp } from "three/src/math/MathUtils";
import { KeyState } from "../../keyboard.ts";

const gltfLoader = new GLTFLoader();

export const PLAYER_BALL_BODY_ID = 100;

export class PlayerBall {
  // Моделька
  public model!: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  // Физическое тело модельки
  public body!: CANNON.Body;
  public radius: number = 1;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly camera: THREE.OrthographicCamera,
  ) {}

  async init() {
    const gltf = await gltfLoader.loadAsync(
      `https://raw.githubusercontent.com/almazhecker/katamari-web/master/public/bebrik.glb`,
    );
    let material!: THREE.MeshPhysicalMaterial;

    gltf.scene.traverse((item) => {
      if ((item as THREE.Mesh).isMesh) {
        material = (item as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
        this.model = item as PlayerBall["model"];
      }
    });

    this.model.material = new THREE.MeshPhysicalMaterial({
      map: material.map,
      roughness: 0.5,
      reflectivity: 0.5,
      metalness: 0,
    });
    this.model.material.map!.colorSpace = THREE.SRGBColorSpace;

    this.model.castShadow = true;
    this.model.receiveShadow = true;
    this.model.position.set(0, 4, 0);
    this.model.scale.setScalar(0.02);
    this.model.matrixAutoUpdate = true;

    const shape = new CANNON.Sphere(this.radius);
    this.body = new CANNON.Body({
      mass: 5,
      shape,
      position: new CANNON.Vec3(0, 1, 0), // выше над Ground'ом
      material: new CANNON.Material({
        friction: 0.5,
        restitution: 0.8,
      }),
    });
    this.body.id = PLAYER_BALL_BODY_ID;
  }

  public syncWithBody() {
    // Позиция тела
    this.model.position.copy(this.body.position);
    // Вращение тела
    this.model.quaternion.copy(this.body.quaternion);
  }

  private screenPosition!: THREE.Vector2;
  private touchStartPosition: THREE.Vector2 | null = null;
  private touchEndPosition: THREE.Vector2 | null = null;

  private calculateImpulseStrength(a: THREE.Vector2, b: THREE.Vector2): number {
    return (
      (Math.hypot(b.x - a.x, b.y - a.y) /
        Math.hypot(window.innerWidth, window.innerHeight)) *
      120
    );
  }
  private applyScaledImpulse(strength: number, direction: CANNON.Vec3): void {
    const impulse = new CANNON.Vec3(0, 0, 0);
    direction.scale(strength, impulse);
    this.body.applyImpulse(impulse);
  }

  private calculateDirectionVector(
    start: THREE.Vector2,
    end: THREE.Vector2,
  ): CANNON.Vec3 {
    let direction = new CANNON.Vec3(end.x, 0, end.y);
    direction = direction.vsub(new CANNON.Vec3(start.x, 0, start.y));
    return direction.unit();
  }
  public updateMovement(keys: KeyState): void {
    this.screenPosition = this.getScreenPosition();
    this.handleViewportScroll(this.screenPosition);
    if (this.touchStartPosition && this.touchEndPosition) {
      const impulseStrength = this.calculateImpulseStrength(
        this.touchStartPosition,
        this.touchEndPosition,
      );
      const direction = this.calculateDirectionVector(
        this.touchStartPosition,
        this.touchEndPosition,
      );
      this.applyScaledImpulse(impulseStrength, direction);

      this.touchStartPosition = null;
      this.touchEndPosition = null;
    } else if (this.touchEndPosition) {
      const impulseStrength = this.calculateImpulseStrength(
        this.screenPosition,
        this.touchEndPosition,
      );
      const direction = this.calculateDirectionVector(
        this.screenPosition,
        this.touchEndPosition,
      );
      this.applyScaledImpulse(impulseStrength, direction);

      this.touchStartPosition = null;
      this.touchEndPosition = null;
    } else if (
      keys.KeyW ||
      keys.KeyA ||
      keys.KeyS ||
      keys.KeyD ||
      keys.ArrowUp ||
      keys.ArrowDown ||
      keys.ArrowLeft ||
      keys.ArrowRight
    ) {
      const velocity = this.body.velocity;

      if (keys.KeyW || keys.ArrowUp) velocity.z -= 0.1;
      if (keys.KeyS || keys.ArrowDown) velocity.z += 0.1;
      if (keys.KeyA || keys.ArrowLeft) velocity.x -= 0.1;
      if (keys.KeyD || keys.ArrowRight) velocity.x += 0.1;
    } else {
      this.body.linearDamping = 0.5;
      this.body.angularDamping = 0.5;
    }

    this.syncWithBody();
  }

  // public grow(factor: number = 1.07) {
  //   const newRadius = this.radius * factor;
  //   const positionAdjustment = newRadius - this.radius;
  //
  //   this.model.scale.multiplyScalar(factor);
  //   this.radius = newRadius;
  //
  //   const newShape = new CANNON.Sphere(this.radius);
  //   this.body.shapes = [];
  //   this.body.addShape(newShape);
  //
  //   this.body.position.y += positionAdjustment;
  //
  //   // Update mass properties (mass increases with volume, which is radius^3)
  //   // const massFactor = factor * factor * factor;
  //   // this.body.mass *= massFactor;
  //   // this.body.updateMassProperties();
  //
  //   this.syncWithBody();
  // }

  // canvas positions into browser screen positions
  public getScreenPosition(): THREE.Vector2 {
    const c = this.renderer.domElement;

    const v = new THREE.Vector3();
    v.setFromMatrixPosition(this.model.matrixWorld);

    v.project(this.camera);

    const x = lerp(0, c.width / window.devicePixelRatio, 0.5 + v.x / 2);
    const y = lerp(0, c.height / window.devicePixelRatio, 0.5 - v.y / 2);

    return new THREE.Vector2(Math.round(x), Math.round(y));
  }

  public handleTouchMove = (event: TouchEvent | MouseEvent): void => {
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    this.touchEndPosition = new THREE.Vector2(clientX, clientY);
  };

  private targetScrollX: number = 0;
  private targetScrollY: number = 0;
  private currentScrollX: number = 0;
  private currentScrollY: number = 0;
  private scrollLerpFactor: number = 0.1; // Adjust for smoother/faster response

  private handleViewportScroll(screenPos: THREE.Vector2): void {
    const buffer = 500;
    const maxScrollStep = 10;

    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const docW = document.documentElement.scrollWidth;
    const docH = document.documentElement.scrollHeight;

    const x = screenPos.x;
    const y = screenPos.y;

    // 1. Determine target scroll position
    this.targetScrollX = window.scrollX;
    this.targetScrollY = window.scrollY;

    if (x > viewW - buffer && this.targetScrollX + viewW < docW) {
      this.targetScrollX += maxScrollStep;
    } else if (x < buffer && this.targetScrollX > 0) {
      this.targetScrollX -= maxScrollStep;
    }

    if (y > viewH - buffer && this.targetScrollY + viewH < docH) {
      this.targetScrollY += maxScrollStep;
    } else if (y < buffer && this.targetScrollY > 0) {
      this.targetScrollY -= maxScrollStep;
    }

    // 2. Smoothly interpolate to target scroll position
    this.currentScrollX = THREE.MathUtils.lerp(
      this.currentScrollX,
      this.targetScrollX,
      this.scrollLerpFactor,
    );
    this.currentScrollY = THREE.MathUtils.lerp(
      this.currentScrollY,
      this.targetScrollY,
      this.scrollLerpFactor,
    );

    // 3. Calculate smooth scroll delta
    const scrollDeltaX = this.currentScrollX - window.scrollX;
    const scrollDeltaY = this.currentScrollY - window.scrollY;

    // 4. Apply smooth scroll if needed
    if (Math.abs(scrollDeltaX) > 0.1 || Math.abs(scrollDeltaY) > 0.1) {
      window.scrollTo({
        left: this.currentScrollX,
        top: this.currentScrollY,
        behavior: "auto", // 'smooth' can cause issues with precise tracking
      });

      // 5. Compensate ball position in world space
      const worldDeltaX =
        (scrollDeltaX / viewW) * (this.camera.right - this.camera.left);
      const worldDeltaZ =
        (scrollDeltaY / viewH) * (this.camera.top - this.camera.bottom);

      const pos = this.body.position;
      this.body.position.set(pos.x - worldDeltaX, pos.y, pos.z - worldDeltaZ);
    }
  }
}
