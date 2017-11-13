import { isString } from "./inspect";
import { IElement } from "../types";

export function resolveTarget(target: any): IElement {
  return isString(target.tagName) ? target : document.querySelector(target)
}
