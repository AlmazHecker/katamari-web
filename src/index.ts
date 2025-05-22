import { PLAYER_BALL_BODY_ID, PlayerBall } from "./core/objects/PlayerBall.ts";
import { setup } from "./core/setup.ts";
import { setupKeyboardListener } from "./keyboard";
import { createWalls } from "./core/physics/Walls.ts";
import { Ground, GROUND_BODY_ID } from "./core/physics/Ground.ts";
import { markCollidable } from "./core/markCollidable.ts";
import { CollisionDetector } from "./core/physics/CollisionDetector.ts";

function main() {
  const { camera, renderer, scene, world } = setup();
  markCollidable();

  const playerBall = new PlayerBall(renderer, camera);
  playerBall.init().then(() => {
    world.addBody(playerBall.body);
    scene.add(playerBall.model);
    createWalls(world);

    const ground = new Ground(scene);
    world.addBody(ground.body);

    const collisionDetector = new CollisionDetector(
      renderer,
      camera,
      scene,
      playerBall,
    );
    const keys = setupKeyboardListener(playerBall);

    const animate = () => {
      world.fixedStep();
      playerBall.updateMovement(keys);

      const screenPos = playerBall.getScreenPosition();
      collisionDetector.detectCollidingElements(screenPos);

      renderer.render(scene, camera);

      requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const w = height / 64;
      const h = width / 64 / w;

      camera.left = (-h * w) / 2;
      camera.right = (h * w) / 2;
      camera.top = w / 2;
      camera.bottom = -w / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      world.bodies = world.bodies.filter((body) => {
        return body.id === PLAYER_BALL_BODY_ID || body.id === GROUND_BODY_ID;
      });

      createWalls(world);
    });
  });
}

if (!window.KATAMARI_EXTENSION_INJECTED) {
  window.KATAMARI_EXTENSION_INJECTED = true;
  main();
}
