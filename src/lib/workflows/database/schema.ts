import { z } from 'zod'

const databasePositionSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0)
})

export const databaseColumnSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  dataType: z.string().trim().min(1).max(120).default('text'),
  nullable: z.boolean().default(true),
  primaryKey: z.boolean().default(false),
  unique: z.boolean().default(false),
  identity: z.boolean().default(false),
  defaultValue: z.string().trim().max(240).optional()
})

export const databaseTableSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  schema: z.string().trim().min(1).max(120).default('public'),
  description: z.string().default(''),
  position: databasePositionSchema.default({ x: 0, y: 0 }),
  columns: z.array(databaseColumnSchema).default([])
})

export const databaseRelationSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().max(160).optional(),
  sourceTableId: z.string().trim().min(1),
  sourceColumnId: z.string().trim().min(1),
  targetTableId: z.string().trim().min(1),
  targetColumnId: z.string().trim().min(1),
  onDelete: z.string().trim().max(80).optional()
})

export const databaseFlowDefinitionSchema = z
  .object({
    version: z.literal(1).default(1),
    flowType: z.literal('database'),
    name: z.string().trim().min(1).max(120).default('Database'),
    description: z.string().default(''),
    tables: z.array(databaseTableSchema).default([]),
    relations: z.array(databaseRelationSchema).default([])
  })
  .superRefine((definition, context) => {
    const tableIds = new Set<string>()
    const columnsByTable = new Map<string, Set<string>>()

    for (const table of definition.tables) {
      if (tableIds.has(table.id)) {
        context.addIssue({
          code: 'custom',
          path: ['tables'],
          message: `Duplicate database table id: ${table.id}`
        })
      }
      tableIds.add(table.id)

      const columnIds = new Set<string>()
      for (const column of table.columns) {
        if (columnIds.has(column.id)) {
          context.addIssue({
            code: 'custom',
            path: ['tables', table.id, 'columns'],
            message: `Duplicate column id ${column.id} in table ${table.id}.`
          })
        }
        if (column.primaryKey && column.nullable) {
          context.addIssue({
            code: 'custom',
            path: ['tables', table.id, 'columns', column.id, 'nullable'],
            message: `Primary key column ${column.id} cannot be nullable.`
          })
        }
        columnIds.add(column.id)
      }
      columnsByTable.set(table.id, columnIds)
    }

    const relationIds = new Set<string>()
    for (const relation of definition.relations) {
      if (relationIds.has(relation.id)) {
        context.addIssue({
          code: 'custom',
          path: ['relations'],
          message: `Duplicate database relation id: ${relation.id}`
        })
      }
      relationIds.add(relation.id)

      if (
        !columnsByTable
          .get(relation.sourceTableId)
          ?.has(relation.sourceColumnId)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['relations', relation.id, 'sourceColumnId'],
          message: `Relation ${relation.id} references a missing source column.`
        })
      }

      if (
        !columnsByTable
          .get(relation.targetTableId)
          ?.has(relation.targetColumnId)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['relations', relation.id, 'targetColumnId'],
          message: `Relation ${relation.id} references a missing target column.`
        })
      }
    }
  })

export type DatabaseColumn = z.infer<typeof databaseColumnSchema>
export type DatabaseTable = z.infer<typeof databaseTableSchema>
export type DatabaseRelation = z.infer<typeof databaseRelationSchema>
export type DatabaseFlowDefinition = z.infer<
  typeof databaseFlowDefinitionSchema
>
