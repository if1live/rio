import { Liquid } from "liquidjs";
import { settings } from "../settings/index.js";

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});

// liquidjs 네이밍에 맞춤
engine.registerFilter("to_fixed", (value, digits) => {
  const v = Number(value);
  const d = Number(digits);
  return v.toFixed(d);
});
