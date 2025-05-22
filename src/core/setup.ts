import * as CANNON from "cannon-es";
import * as THREE from "three";

export const setup = () => {
  document.body.style.overflow = "hidden";

  const container = document.createElement("div");
  container.id = "canvas-container";
  Object.assign(container.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 99999,
  });
  document.body.appendChild(container);

  const w = window.innerHeight / 64;
  const h = window.innerWidth / 64 / w;

  const scene = new THREE.Scene();

  const width = window.innerWidth;
  const height = window.innerHeight;

  const camera = new THREE.OrthographicCamera(
    (-h * w) / 2,
    (h * w) / 2,
    w / 2,
    -w / 2,
    -100,
    1e3
  );
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);

  configureLights(scene);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.allowSleep = true;

  return { camera, renderer, scene, world };
};

const configureLights = (scene: THREE.Scene) => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.5 * Math.PI); // ~1.57
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI); // ~2.51
  directional.position.set(20, 20, -20);
  directional.shadow.bias = -5e-4;
  scene.add(directional);

  const point = new THREE.PointLight(0xffffff, 2 * Math.PI, 100); // ~6.28
  point.position.set(10, 40, -10);
  point.decay = 2;
  point.castShadow = true;
  point.shadow.mapSize.set(2048, 2048);
  point.shadow.bias = -5e-4;
  scene.add(point);
};
