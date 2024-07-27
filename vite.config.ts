import type { UserConfig } from 'vite'

export default {
  build: {
    lib: {
      entry: 'packages/core/src/index.ts',
      formats: ['es'],
      fileName: 'index'
    },
    
  }
} satisfies UserConfig
