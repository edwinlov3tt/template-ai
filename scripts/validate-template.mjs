
import Ajv from 'ajv'
import schema from '../src/schema/templateSchema.ts'
import fs from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/validate-template.mjs path/to/template.json')
  process.exit(1)
}
const json = JSON.parse(fs.readFileSync(file,'utf8'))
const ajv = new Ajv({ allErrors:true, strict: false })
const validate = ajv.compile(schema)
const ok = validate(json)
if (!ok) {
  console.error('Validation errors:')
  validate.errors.forEach(err => {
    const path = err.instancePath || 'root'
    console.error(`  ${path}: ${err.message}`)
  })
  process.exit(2)
}
console.log('✓ Template is valid.')
