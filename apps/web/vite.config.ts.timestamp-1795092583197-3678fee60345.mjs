// vite.config.ts
import { defineConfig } from 'file:///home/ubuntu/repos/careerradar/node_modules/.pnpm/vite@6.4.6_@types+node@20.19.43_jiti@2.7.0_lightningcss@1.33.0_tsx@4.23.15/node_modules/vite/dist/node/index.js';
import react from 'file:///home/ubuntu/repos/careerradar/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@6.4.6_@types+node@20.19.43_jiti@2.7.0_lightningcss@1.33.0_tsx@4.23.15_/node_modules/@vitejs/plugin-react/dist/index.js';
import tailwindcss from 'file:///home/ubuntu/repos/careerradar/node_modules/.pnpm/@tailwindcss+vite@4.3.5_vite@6.4.6_@types+node@20.19.43_jiti@2.7.0_lightningcss@1.33.0_tsx@4.23.15_/node_modules/@tailwindcss/vite/dist/index.mjs';
import { fileURLToPath, URL } from 'node:url';
var __vite_injected_original_import_meta_url =
  'file:///home/ubuntu/repos/careerradar/apps/web/vite.config.ts';
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', __vite_injected_original_import_meta_url)) },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS91YnVudHUvcmVwb3MvY2FyZWVycmFkYXIvYXBwcy93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3VidW50dS9yZXBvcy9jYXJlZXJyYWRhci9hcHBzL3dlYi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS91YnVudHUvcmVwb3MvY2FyZWVycmFkYXIvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHJlc29sdmU6IHsgYWxpYXM6IHsgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSkgfSB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LlZJVEVfQVBJX1BST1hZID8/ICdodHRwOi8vbG9jYWxob3N0OjQwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVTLFNBQVMsb0JBQW9CO0FBQ3BVLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixTQUFTLGVBQWUsV0FBVztBQUhtSixJQUFNLDJDQUEyQztBQUt2TyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUMsRUFBRSxFQUFFO0FBQUEsRUFDNUUsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUSxRQUFRLElBQUksa0JBQWtCO0FBQUEsUUFDdEMsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
