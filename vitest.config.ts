import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // https://github.com/vitest-dev/vitest/discussions/3320
  // 순정 esbuild로는 emitDecoratorMetadata가 작동하지 않아서 우회
  plugins: [swc.vite()],
});
