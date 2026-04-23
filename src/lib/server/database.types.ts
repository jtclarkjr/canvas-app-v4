export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      canvases: {
        Row: {
          id: string
          title: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      canvas_elements: {
        Row: {
          id: string
          canvas_id: string
          type: string
          data: Json | null
          x: number
          y: number
          z: number | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          canvas_id: string
          type: string
          data?: Json | null
          x: number
          y: number
          z?: number | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          canvas_id?: string
          type?: string
          data?: Json | null
          x?: number
          y?: number
          z?: number | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
