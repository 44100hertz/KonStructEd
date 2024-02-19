import { defineConfig } from "@solidjs/start/config";
import { ViteRsw } from "vite-plugin-rsw";

export default defineConfig({
    start: { ssr: false },
    plugins: [
        ViteRsw(),
    ]
});
