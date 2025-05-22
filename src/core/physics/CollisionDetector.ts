import { PlayerBall } from "../objects/PlayerBall.ts";
import * as THREE from "three";

import { convertElementToSvgDataUrl } from "../../dom-to-svg";
import {
  getElementDimensions,
  isInstanceOf,
} from "../../dom-to-svg/utils/dom.ts";
import { createImageFromDataUrl } from "../../dom-to-svg/utils/resource.ts";
import { ConversionOptions } from "../../dom-to-svg/types.ts";

const fallbackTextures = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjeOVs+h8ABd8CYi1S+dsAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+L2H5T8ABywCu6jZrOAAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjMFkR/B8ABHICLzubqAYAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjcGr98h8ABYMCu80FMR0AAAAASUVORK5CYII=",
];

export class CollisionDetector {
  private isLocked = false;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly camera: THREE.OrthographicCamera,
    private readonly scene: THREE.Scene,
    private readonly playerBall: PlayerBall,
  ) {}

  public detectCollidingElements(screenPos: THREE.Vector2) {
    const elements = document.elementsFromPoint(screenPos.x, screenPos.y);

    this.filterCollidingElements(elements);
  }

  private filterCollidingElements(domElements: Element[]) {
    domElements.forEach((element) => {
      if (
        isInstanceOf(element, HTMLElement) &&
        element.dataset.sticky &&
        (element.style.visibility !== "hidden" ||
          element.style.visibility === null) &&
        this.playerBall.model.position.y <= 1
        // || isInstanceOf(element, SVGSVGElement)
      ) {
        this.handleCollision(element);
        delete element.dataset.sticky;
      }
    });
  }

  private async handleCollision(element: HTMLElement) {
    if (this.isLocked) return;
    this.isLocked = true;

    if (element.nodeName === "SPAN") {
      const bgColor = getComputedStyle(document.body).backgroundColor;
      element.style.display = "inline-block";
      element.style.borderRadius = "4px";
      element.style.background = bgColor || "transparent";
    } else if (element.parentElement) {
      Array.from(element.parentElement.getElementsByTagName("img")).forEach(
        (img) => {
          if (img.style.background === "") {
            img.setAttribute("data-temp-bg", "true");
            img.style.background = "red";
          }
        },
      );
    }
    const textureLoader = new THREE.TextureLoader();

    let textureUrl = "";
    let renderFailed = false;

    try {
      textureUrl = await this.convertElementToDataUrl(element, {
        pixelRatio: window.devicePixelRatio,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        // backgroundColor: "rgb(30,30,30)", // need to change this to use inverted color
      });
    } catch {
      renderFailed = true;
    }

    if (element.parentElement) {
      Array.from(element.parentElement.getElementsByTagName("img")).forEach(
        (img) => {
          if (img.dataset.tempBg) {
            delete img.dataset.tempBg;
            img.style.background = "";
          }
        },
      );
    }

    this.isLocked = false;
    // removedLinkElements.forEach((link) => document.head.appendChild(link));

    if (renderFailed || !textureUrl) {
      textureUrl =
        fallbackTextures[Math.floor(Math.random() * fallbackTextures.length)];
    }

    const texture = textureLoader.load(textureUrl);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      metalness: 0.5,
      roughness: 1,
    });

    const geometry = new THREE.PlaneGeometry(
      element.clientWidth / 64,
      element.clientHeight / 64,
    );

    const mesh = new THREE.Mesh(geometry, material);
    const rect = element.getBoundingClientRect();
    const targetPosition = this.projectToGroundPlane(
      new THREE.Vector2(
        rect.left + rect.width / 2 - this.playerBall.model.position.x,
        rect.top + rect.height / 2 - this.playerBall.model.position.z,
      ),
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(targetPosition.x, -0.1, targetPosition.z);

    this.scene.add(mesh);
    this.playerBall.model.attach(mesh);
    element.style.visibility = "hidden";
  }

  private async renderElementToCanvas(
    element: HTMLElement,
    options: ConversionOptions,
  ): Promise<HTMLCanvasElement> {
    const { width, height } = getElementDimensions(element, options);
    const dataUrl = await convertElementToSvgDataUrl(element, options);
    const image = await createImageFromDataUrl(dataUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    const renderWidth = width;
    const renderHeight = height;
    canvas.width = renderWidth * pixelRatio;
    canvas.height = renderHeight * pixelRatio;

    // safeguard for bigger desktops
    if (canvas.width > 16384 || canvas.height > 16384) {
      if (canvas.width > canvas.height) {
        canvas.height *= 16384 / canvas.width;
        canvas.width = 16384;
      } else {
        canvas.width *= 16384 / canvas.height;
        canvas.height = 16384;
      }
    }

    canvas.style.width = `${renderWidth}`;
    canvas.style.height = `${renderHeight}`;

    if (options.backgroundColor) {
      context.fillStyle = options.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  private async convertElementToDataUrl(
    element: HTMLElement,
    options: ConversionOptions,
  ) {
    return (await this.renderElementToCanvas(element, options)).toDataURL();
  }

  private projectToGroundPlane(screenCoords: THREE.Vector2): THREE.Vector3 {
    const { x, y } = screenCoords;
    const canvas = this.renderer.domElement;
    const bounds = canvas.getBoundingClientRect();
    const pixelX = (x - bounds.left) * window.devicePixelRatio;
    const pixelY = (y - bounds.top) * window.devicePixelRatio;

    const ndc = new THREE.Vector2(
      (pixelX / canvas.width) * 2 - 1,
      -(pixelY / canvas.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    const groundIntersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0)),
      groundIntersection,
    );
    return groundIntersection;
  }
}
