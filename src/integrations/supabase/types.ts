export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      driving_lessons: {
        Row: {
          created_at: string
          datum: string
          dauer_minuten: number
          einheiten: number
          fahrzeug_typ: Database["public"]["Enums"]["fahrzeug_typ"]
          id: string
          preis: number
          student_id: string
          typ: Database["public"]["Enums"]["driving_lesson_typ"]
        }
        Insert: {
          created_at?: string
          datum?: string
          dauer_minuten?: number
          einheiten?: number
          fahrzeug_typ?: Database["public"]["Enums"]["fahrzeug_typ"]
          id?: string
          preis?: number
          student_id: string
          typ: Database["public"]["Enums"]["driving_lesson_typ"]
        }
        Update: {
          created_at?: string
          datum?: string
          dauer_minuten?: number
          einheiten?: number
          fahrzeug_typ?: Database["public"]["Enums"]["fahrzeug_typ"]
          id?: string
          preis?: number
          student_id?: string
          typ?: Database["public"]["Enums"]["driving_lesson_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "driving_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          bestanden: boolean
          created_at: string
          datum: string
          fahrzeug_typ: Database["public"]["Enums"]["fahrzeug_typ"]
          id: string
          instructor_id: string | null
          preis: number
          student_id: string
          typ: Database["public"]["Enums"]["exam_typ"]
        }
        Insert: {
          bestanden?: boolean
          created_at?: string
          datum?: string
          fahrzeug_typ?: Database["public"]["Enums"]["fahrzeug_typ"]
          id?: string
          instructor_id?: string | null
          preis?: number
          student_id: string
          typ: Database["public"]["Enums"]["exam_typ"]
        }
        Update: {
          bestanden?: boolean
          created_at?: string
          datum?: string
          fahrzeug_typ?: Database["public"]["Enums"]["fahrzeug_typ"]
          id?: string
          instructor_id?: string | null
          preis?: number
          student_id?: string
          typ?: Database["public"]["Enums"]["exam_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "exams_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_lessons: {
        Row: {
          created_at: string
          datum: string
          dauer_minuten: number
          id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          datum?: string
          dauer_minuten?: number
          id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          datum?: string
          dauer_minuten?: number
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          aktiv: boolean
          created_at: string
          email: string | null
          id: string
          nachname: string
          telefon: string | null
          vorname: string
        }
        Insert: {
          aktiv?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nachname: string
          telefon?: string | null
          vorname: string
        }
        Update: {
          aktiv?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nachname?: string
          telefon?: string | null
          vorname?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          betrag: number
          created_at: string
          datum: string
          id: string
          service_id: string | null
          student_id: string
          zahlungsart: Database["public"]["Enums"]["zahlungsart_enum"]
        }
        Insert: {
          betrag?: number
          created_at?: string
          datum?: string
          id?: string
          service_id?: string | null
          student_id: string
          zahlungsart?: Database["public"]["Enums"]["zahlungsart_enum"]
        }
        Update: {
          betrag?: number
          created_at?: string
          datum?: string
          id?: string
          service_id?: string | null
          student_id?: string
          zahlungsart?: Database["public"]["Enums"]["zahlungsart_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          aktiv: boolean
          bezeichnung: string
          created_at: string
          einheit: string | null
          id: string
          kategorie: string
          preis: number
        }
        Insert: {
          aktiv?: boolean
          bezeichnung: string
          created_at?: string
          einheit?: string | null
          id?: string
          kategorie: string
          preis?: number
        }
        Update: {
          aktiv?: boolean
          bezeichnung?: string
          created_at?: string
          einheit?: string | null
          id?: string
          kategorie?: string
          preis?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          bezeichnung: string
          created_at: string
          id: string
          preis: number
          preis_id: string | null
          status: Database["public"]["Enums"]["service_status"]
          student_id: string
        }
        Insert: {
          bezeichnung: string
          created_at?: string
          id?: string
          preis?: number
          preis_id?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          student_id: string
        }
        Update: {
          bezeichnung?: string
          created_at?: string
          id?: string
          preis?: number
          preis_id?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_preis_id_fkey"
            columns: ["preis_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          fahrschule: string
          fuehrerscheinklasse: Database["public"]["Enums"]["fuehrerscheinklasse_enum"]
          id: string
          ist_umschreiber: boolean
          nachname: string
          status: string | null
          telefon: string | null
          vorname: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          fahrschule?: string
          fuehrerscheinklasse: Database["public"]["Enums"]["fuehrerscheinklasse_enum"]
          id?: string
          ist_umschreiber?: boolean
          nachname: string
          status?: string | null
          telefon?: string | null
          vorname: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          fahrschule?: string
          fuehrerscheinklasse?: Database["public"]["Enums"]["fuehrerscheinklasse_enum"]
          id?: string
          ist_umschreiber?: boolean
          nachname?: string
          status?: string | null
          telefon?: string | null
          vorname?: string
        }
        Relationships: []
      }
      theory_sessions: {
        Row: {
          created_at: string
          datum: string
          id: string
          student_id: string
          typ: Database["public"]["Enums"]["theory_session_typ"]
        }
        Insert: {
          created_at?: string
          datum?: string
          id?: string
          student_id: string
          typ: Database["public"]["Enums"]["theory_session_typ"]
        }
        Update: {
          created_at?: string
          datum?: string
          id?: string
          student_id?: string
          typ?: Database["public"]["Enums"]["theory_session_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "theory_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          aktiv: boolean
          bezeichnung: string
          created_at: string
          id: string
          kennzeichen: string
          typ: Database["public"]["Enums"]["fahrzeug_typ"]
        }
        Insert: {
          aktiv?: boolean
          bezeichnung: string
          created_at?: string
          id?: string
          kennzeichen?: string
          typ?: Database["public"]["Enums"]["fahrzeug_typ"]
        }
        Update: {
          aktiv?: boolean
          bezeichnung?: string
          created_at?: string
          id?: string
          kennzeichen?: string
          typ?: Database["public"]["Enums"]["fahrzeug_typ"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      driving_lesson_typ:
        | "uebungsstunde"
        | "ueberland"
        | "autobahn"
        | "nacht"
        | "fehlstunde"
        | "testfahrt_b197"
      exam_typ: "theorie" | "praxis"
      fahrzeug_typ: "automatik" | "schaltwagen"
      fuehrerscheinklasse_enum: "B" | "B78" | "B197"
      service_status: "offen" | "bezahlt" | "erledigt"
      theory_session_typ: "grundstoff" | "klassenspezifisch"
      zahlungsart_enum: "bar" | "ec" | "ueberweisung"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      driving_lesson_typ: [
        "uebungsstunde",
        "ueberland",
        "autobahn",
        "nacht",
        "fehlstunde",
        "testfahrt_b197",
      ],
      exam_typ: ["theorie", "praxis"],
      fahrzeug_typ: ["automatik", "schaltwagen"],
      fuehrerscheinklasse_enum: ["B", "B78", "B197"],
      service_status: ["offen", "bezahlt", "erledigt"],
      theory_session_typ: ["grundstoff", "klassenspezifisch"],
      zahlungsart_enum: ["bar", "ec", "ueberweisung"],
    },
  },
} as const
