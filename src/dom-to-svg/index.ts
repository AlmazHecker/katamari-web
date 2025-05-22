import { ConversionOptions } from "./types";
import { getElementDimensions } from "./utils/dom";
import { ElementCloner } from "./services/element-cloner";
import { CssProcessor } from "./services/css-processor";
import { SvgGenerator } from "./services/svg-generator";

const cssProcessor = new CssProcessor();
const elementCloner = new ElementCloner();
const svgGenerator = new SvgGenerator();

export async function convertElementToSvgDataUrl(
  element: HTMLElement,
  options: ConversionOptions,
): Promise<string> {
  const { width, height } = getElementDimensions(element, options);
  const clonedElement = await elementCloner.clone(element, options, true);

  await cssProcessor.processStyles(clonedElement!, options);
  await svgGenerator.processElement(clonedElement!, options);
  svgGenerator.applyStylesToClone(clonedElement!, options);
  return svgGenerator.createSvgWithForeignObject(
    clonedElement as HTMLElement,
    width,
    height,
  );
}
