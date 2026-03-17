import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import path from 'path'

// Cesium is hoisted to the root workspace node_modules
const cesiumBuildRoot = path.resolve(__dirname, '../node_modules/cesium/Build')

export default defineConfig({
  base: './',
  plugins: [
    react(),
    cesium({
      cesiumBuildRootPath: cesiumBuildRoot,
      cesiumBuildPath: path.join(cesiumBuildRoot, 'Cesium'),
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          // Map libraries
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // State management
          'vendor-zustand': ['zustand'],
          // Heavy simulation panels — loaded lazily but chunked separately
          'chunk-zombie': [
            './src/components/Zombie/ZombiePanel',
            './src/components/Zombie/ZombieStats',
            './src/components/Zombie/ZombieMapLayer',
          ],
          'chunk-pandemic': [
            './src/components/Pandemic/PandemicPanel',
            './src/components/Pandemic/PandemicStats',
            './src/components/Pandemic/PandemicMapLayer',
          ],
          'chunk-asteroid': [
            './src/components/Asteroid/AsteroidPanel',
            './src/components/Asteroid/AsteroidResultsPanel',
            './src/components/Asteroid/AsteroidMapLayer',
          ],
          'chunk-emp': [
            './src/components/EMP/EMPPanel',
            './src/components/EMP/EMPResultsPanel',
            './src/components/EMP/EMPMapLayer',
          ],
          'chunk-geopolitics': [
            './src/components/Geopolitics/GeopoliticsPanel',
            './src/components/Geopolitics/PredictionPanel',
          ],
        },
      },
    },
  },
})
