import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import { normalizePath } from "vite";
import { fileURLToPath } from "node:url";

function fromRoot (relativePath) {
  return normalizePath(fileURLToPath(new URL(relativePath, import.meta.url)));
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  plugins: [
    vue(),
    Components({
      dirs: ["src/components"],
      extensions: ["vue"],
    }),
    AutoImport({
      imports: [
        "vue",
      ],
    }),
  ],
  /* __TEST__ */
  resolve: {
    alias: {
      "@global": fromRoot("./src/global"),
      "@util": fromRoot("./src/util"),
      "@com": fromRoot("./src/components"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@global/inject.scss";`,
      },
    },
  }
})
