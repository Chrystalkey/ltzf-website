// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: "https://pazufa.de",
    base: "/",
    trailingSlash: "never",
    output: "static", // Explicitly set static site generation
    build: {
        format: "directory", // Generate directory/index.html for clean URLs
    },
    vite: {
        resolve: {
            alias: {
                '@': '/src',
                '@lib': '/src/lib',
                '@components': '/src/components',
                '@layouts': '/src/layouts',
            }
        },
        server: {
            fs: {
                allow: ['..']
            }
        }
    }
});
