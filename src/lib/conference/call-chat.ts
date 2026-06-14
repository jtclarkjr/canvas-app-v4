import { z } from 'zod'

export const CALL_CHAT_TEXT_TOPIC = 'call-chat'
export const CALL_CHAT_VERSION = '1'
export const CALL_CHAT_MAX_LENGTH = 4000

export const callChatContentSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty.')
  .max(CALL_CHAT_MAX_LENGTH, 'Keep messages under 4000 characters.')

export const callChatAttributesSchema = z.object({
  v: z.literal(CALL_CHAT_VERSION),
  id: z.uuid(),
  createdAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid timestamp.'
  }),
  senderName: z.string().trim().min(1).max(120),
  senderColor: z.string().max(80).optional()
})

export type CallChatAttributes = z.infer<typeof callChatAttributesSchema>
