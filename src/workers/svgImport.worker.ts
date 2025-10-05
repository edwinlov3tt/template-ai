// src/workers/svgImport.worker.ts
import * as Comlink from 'comlink'

type ImportResult = { templateJSON: any; warnings: string[] }

const api = {
  async importSvg(raw: string): Promise<ImportResult> {
    const warnings: string[] = []
    // TODO: run SVGO here with config that keeps viewBox
    // TODO: normalize xlink:href -> href
    // TODO: detect large data URIs and push warnings
    // TODO: build template JSON
    return { templateJSON: { slots: [] }, warnings }
  }
}

Comlink.expose(api)
