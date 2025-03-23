import {
    generateSchemaTypes,
    generateReactQueryComponents,
  } from '@openapi-codegen/typescript'
  import { defineConfig } from '@openapi-codegen/cli'
  
  export default defineConfig({
    chcn: {
      from: {
        source: 'url',
        url: 'http://localhost:8000/api-docs-json',
      },
      outputDir: './generated/api', // Thư mục đầu ra
      to: async (context) => {
        const filenamePrefix = 'chcn'
        const { schemasFiles } = await generateSchemaTypes(context, {
          filenamePrefix,
        })
        await generateReactQueryComponents(context, {
          filenamePrefix,
          schemasFiles,
        })
      },
    },
  })