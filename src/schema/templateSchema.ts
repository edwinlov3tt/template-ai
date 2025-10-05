
const schema = {
  $id: 'https://template-ai.dev/schemas/template.json',
  type: 'object',
  required: ['id','version','canvas','slots','constraints','tokens','accessibility'],
  properties: {
    id: { type: 'string', minLength: 1 },
    version: { type: 'integer', minimum: 1 },
    canvas: {
      type: 'object',
      required: ['baseViewBox','ratios'],
      properties: {
        baseViewBox: {
          type: 'array',
          items: { type: 'number' },
          minItems: 4,
          maxItems: 4,
          description: 'Base coordinate system [x, y, width, height]'
        },
        ratios: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          description: 'Supported aspect ratios (e.g., "1:1", "16:9", "728x90")'
        }
      },
      additionalProperties: false
    },
    tokens: {
      type: 'object',
      required: ['palette', 'typography'],
      properties: {
        palette: {
          type: 'object',
          additionalProperties: { type: 'string', pattern: '^#[0-9A-Fa-f]{3,8}$' },
          description: 'Color tokens (hex format)'
        },
        typography: {
          type: 'object',
          patternProperties: {
            '^.*$': {
              type: 'object',
              properties: {
                family: { type: 'string' },
                weight: { type: 'integer', minimum: 100, maximum: 900 },
                minSize: { type: 'number', minimum: 0 },
                maxSize: { type: 'number', minimum: 0 },
                upper: { type: 'boolean' }
              }
            }
          },
          description: 'Typography style definitions'
        }
      },
      additionalProperties: false
    },
    slots: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name','type','z'],
        properties: {
          name: { type: 'string', minLength: 1 },
          type: { enum: ['image','text','button','shape'] },
          z: { type: 'integer', description: 'Z-index for layering' },
          fit: { enum: ['contain','cover','fill'], description: 'Image fit mode' },
          style: { type: 'string', description: 'Reference to typography token' },
          maxLines: { type: 'integer', minimum: 1 },
          removeBg: { type: 'boolean', description: 'Apply background removal' },
          avoidTextOverlap: { type: 'boolean' },
          chip: {
            type: 'object',
            properties: {
              fill: { type: 'string' },
              radius: { type: 'number', minimum: 0 },
              padding: {
                type: 'array',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 4
              }
            }
          },
          overlay: {
            type: 'object',
            properties: {
              fill: { type: 'string', pattern: '^#[0-9A-Fa-f]{3,8}$' },
              alpha: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['fill', 'alpha']
          }
        },
        additionalProperties: true
      }
    },
    constraints: {
      type: 'object',
      properties: {
        global: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eq: { type: 'string', description: 'Equality constraint' },
              ineq: { type: 'string', description: 'Inequality constraint' },
              avoidOverlap: { type: 'array', items: { type: 'string' } },
              with: { type: 'string' },
              switch: { type: 'string' },
              targets: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        byRatio: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                eq: { type: 'string' },
                ineq: { type: 'string' },
                switch: { type: 'string' },
                targets: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      additionalProperties: false
    },
    accessibility: {
      type: 'object',
      required: ['contrastPolicy'],
      properties: {
        contrastPolicy: {
          type: 'object',
          required: ['mode', 'min'],
          properties: {
            mode: { enum: ['WCAG', 'APCA'] },
            min: { type: 'number', minimum: 0 }
          },
          additionalProperties: false
        },
        fallbacks: {
          type: 'array',
          items: { enum: ['autoChip', 'invertText', 'increaseOverlay'] }
        }
      },
      additionalProperties: false
    },
    sample: {
      type: 'object',
      description: 'Sample content for preview',
      additionalProperties: { type: 'string' }
    },
    frames: {
      type: 'object',
      description: 'Original SVG geometry by ratio (e.g., "1:1") for fallback layout',
      additionalProperties: {
        type: 'object',
        description: 'Frame geometries for each slot in this ratio',
        additionalProperties: {
          type: 'object',
          required: ['x', 'y', 'width', 'height'],
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number', minimum: 0 },
            height: { type: 'number', minimum: 0 }
          },
          additionalProperties: false
        }
      }
    },
    defs: {
      type: 'string',
      description: 'Preserved SVG defs markup (gradients, clipPaths, masks, patterns)'
    }
  },
  additionalProperties: false
} as const

export default schema
