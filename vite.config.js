import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

export default defineConfig({
    css: {
        lightningcss: false,
    },
    plugins: [react()],

    server: {
        host: "0.0.0.0",
        port: 23050,
        strictPort: true,
        // Allow the prerender service to reach the dev server via its internal
        // hostname (http://frontend:23050) — Vite 8 blocks unknown hosts by default.
        allowedHosts: ["localhost", "frontend"],
    },

    preview: {
        host: "0.0.0.0",
        port: 23050,
        strictPort: true,
    },

    build: {
        outDir: "dist",
        assetsDir: "assets",
        sourcemap: false,
        minify: "esbuild",
        target: "esnext",
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    router: ["react-router-dom"],
                    ui: [
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-dropdown-menu",
                        "@radix-ui/react-toast",
                        "@radix-ui/react-tooltip",
                    ],
                    utils: ["ky", "@tanstack/react-query", "zustand"],
                    animations: ["framer-motion"],
                },
            },
        },
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 1000,
    },

    resolve: {
        dedupe: ["react", "react-dom"],
        tsconfigPaths: true,
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
            "@layouts": fileURLToPath(new URL("./src/components/layouts", import.meta.url)),
            "@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
            "@routes": fileURLToPath(new URL("./src/routes", import.meta.url)),
            "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
            "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
            "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
            "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
            "@styles": fileURLToPath(new URL("./src/styles", import.meta.url)),
            "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
            "@stores": fileURLToPath(new URL("./src/stores", import.meta.url)),
            "@types": fileURLToPath(new URL("./src/types", import.meta.url)),
        },
    },

    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    optimizeDeps: {
        include: [
            "react",
            "react-dom",
            "react-router-dom",
            "ky",
            "@tanstack/react-query",
            "zustand",
            "framer-motion",
        ],
    },

    base: "/",
    sourcemap: process.env.NODE_ENV === "development",
});
