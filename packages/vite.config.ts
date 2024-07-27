import type { UserConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default {
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  },
  plugins: [dts()],
  
} satisfies UserConfig
