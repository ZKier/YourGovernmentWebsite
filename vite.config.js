import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
    plugins: [cesium()],
    server: {
        watch: {
            usePolling: true,
            interval: 500,

            ignored: [
                "**/node_modules/**",
                "**/.git/**",
                "**/data/**",
                "**/python/**",
                "**/.venv/**",
                "**/*.gpkg",
                "**/*.geojson",
                "**/*.sqlite",
                "**/*.db",
            ],
        },
    },
});