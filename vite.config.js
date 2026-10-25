import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BOOTSTRAP_PATH = fileURLToPath(new URL("./public/ga-bootstrap.js", import.meta.url));
const BOOTSTRAP_HASH = createHash("sha256")
    .update(readFileSync(BOOTSTRAP_PATH))
    .digest("hex")
    .slice(0, 12);

/**
 * Inject the Google tag into the production HTML shell.
 *
 * The tag has to be discoverable in the raw HTML for Google's installation
 * checker, so it cannot be created only after the consent banner is answered.
 * `ga-bootstrap.js` declares a denied Consent Mode v2 default before gtag.js
 * loads; the app upgrades consent after the visitor accepts analytics.
 */
function googleTagPlugin(gaId) {
    return {
        name: "htashop-google-tag",
        transformIndexHtml(html, ctx) {
            // Dev serves the shell without the tag so local traffic never
            // reaches the property. `vite preview` serves the built HTML.
            if (ctx.server) return html;

            return {
                html,
                tags: [
                    {
                        tag: "script",
                        attrs: { src: `/ga-bootstrap.js?v=${BOOTSTRAP_HASH}`, "data-ga-id": gaId },
                        injectTo: "head-prepend",
                    },
                    {
                        tag: "script",
                        attrs: {
                            async: true,
                            src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`,
                            "data-gdpr-ga4": "true",
                        },
                        injectTo: "head",
                    },
                ],
            };
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const gaId = (env.VITE_GA4_ID || env.VITE_GA_ID || "G-XE1P8GG082").trim() || "G-XE1P8GG082";

    return {
        css: {
            lightningcss: false,
        },
        plugins: [react(), googleTagPlugin(gaId)],

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
            // minify defaults to the rolldown/oxc minifier — esbuild is not installed
            target: "esnext",
            rollupOptions: {
                output: {
                    // Rolldown-vite requires a function (object form is not supported).
                    // Preserves the previous chunk groupings by module path.
                    manualChunks(id) {
                        if (!id.includes("node_modules")) return undefined;
                        if (id.includes("@radix-ui")) return "ui";
                        if (id.includes("react-router-dom")) return "router";
                        if (id.includes("@tanstack")) return "utils";
                        if (id.includes("framer-motion")) return "animations";
                        if (id.includes("ky") || id.includes("zustand")) return "utils";
                        if (id.includes("react")) return "vendor";
                        return undefined;
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
    };
});
