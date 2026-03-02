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
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      driving_lessons: {
        Row: {
          created_at: string
          datum: string
          dauer_minuten: number
          einheiten: number
          fahrzeug_typ: Database["public"]["Enums"]["fahrzeug_typ"]
          id: string
          instructor_id: string | null
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
          instructor_id?: string | null
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
          instructor_id?: string | null
          preis?: number
          student_id?: string
          typ?: Database["public"]["Enums"]["driving_lesson_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "driving_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
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
          created_at: string
          datum: string
          fahrzeug_typ: Database["public"]["Enums"]["fahrzeug_typ"]
          id: string
          instructor_id: string | null
          preis: number
          status: string
          student_id: string
          typ: Database["public"]["Enums"]["exam_typ"]
        }
        Insert: {
          created_at?: string
          datum?: string
          fahrzeug_typ?: Database["public"]["Enums"]["fahrzeug_typ"]
          id?: string
          instructor_id?: string | null
          preis?: number
          status?: string
          student_id: string
          typ: Database["public"]["Enums"]["exam_typ"]
        }
        Update: {
          created_at?: string
          datum?: string
          fahrzeug_typ?: Database["public"]["Enums"]["fahrzeug_typ"]
          id?: string
          instructor_id?: string | null
          preis?: number
          status?: string
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
      open_items: {
        Row: {
          beschreibung: string
          betrag_bezahlt: number
          betrag_gesamt: number
          created_at: string
          datum: string
          id: string
          referenz_id: string
          status: string
          student_id: string
          typ: string
        }
        Insert: {
          beschreibung: string
          betrag_bezahlt?: number
          betrag_gesamt: number
          created_at?: string
          datum?: string
          id?: string
          referenz_id: string
          status?: string
          student_id: string
          typ: string
        }
        Update: {
          beschreibung?: string
          betrag_bezahlt?: number
          betrag_gesamt?: number
          created_at?: string
          datum?: string
          id?: string
          referenz_id?: string
          status?: string
          student_id?: string
          typ?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          betrag: number
          created_at: string
          id: string
          open_item_id: string
          payment_id: string
        }
        Insert: {
          betrag: number
          created_at?: string
          id?: string
          open_item_id: string
          payment_id: string
        }
        Update: {
          betrag?: number
          created_at?: string
          id?: string
          open_item_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_open_item_id_fkey"
            columns: ["open_item_id"]
            isOneToOne: false
            referencedRelation: "open_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          aktiv: boolean
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_sign_in: string | null
        }
        Insert: {
          aktiv?: boolean
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_sign_in?: string | null
        }
        Update: {
          aktiv?: boolean
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_sign_in?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          bezeichnung: string
          created_at: string
          id: string
          notiz: string | null
          preis: number
          preis_id: string | null
          status: Database["public"]["Enums"]["service_status"]
          student_id: string
        }
        Insert: {
          bezeichnung: string
          created_at?: string
          id?: string
          notiz?: string | null
          preis?: number
          preis_id?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          student_id: string
        }
        Update: {
          bezeichnung?: string
          created_at?: string
          id?: string
          notiz?: string | null
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
          geburtsdatum: string | null
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
          geburtsdatum?: string | null
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
          geburtsdatum?: string | null
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
          instructor_id: string | null
          lektion: number | null
          student_id: string
          typ: Database["public"]["Enums"]["theory_session_typ"]
        }
        Insert: {
          created_at?: string
          datum?: string
          id?: string
          instructor_id?: string | null
          lektion?: number | null
          student_id: string
          typ: Database["public"]["Enums"]["theory_session_typ"]
        }
        Update: {
          created_at?: string
          datum?: string
          id?: string
          instructor_id?: string | null
          lektion?: number | null
          student_id?: string
          typ?: Database["public"]["Enums"]["theory_session_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "theory_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sekretaerin"
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
      app_role: ["admin", "sekretaerin"],
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
