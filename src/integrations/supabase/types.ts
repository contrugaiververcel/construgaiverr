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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anuncios: {
        Row: {
          bairro: string
          categoria: string
          cidade: string
          condicao: string | null
          criado_em: string | null
          descricao: string
          dias_locacao: number | null
          entrega: boolean | null
          id: string
          imagens: string[] | null
          medidas: string | null
          preco: number
          preco_oferta: number | null
          quantidade: number | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          bairro: string
          categoria: string
          cidade: string
          condicao?: string | null
          criado_em?: string | null
          descricao: string
          dias_locacao?: number | null
          entrega?: boolean | null
          id?: string
          imagens?: string[] | null
          medidas?: string | null
          preco: number
          preco_oferta?: number | null
          quantidade?: number | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          bairro?: string
          categoria?: string
          cidade?: string
          condicao?: string | null
          criado_em?: string | null
          descricao?: string
          dias_locacao?: number | null
          entrega?: boolean | null
          id?: string
          imagens?: string[] | null
          medidas?: string | null
          preco?: number
          preco_oferta?: number | null
          quantidade?: number | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anuncios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          anuncio_id: string | null
          comentario: string | null
          criado_em: string | null
          id: string
          nota: number
          usuario_id: string
          vendedor_id: string
        }
        Insert: {
          anuncio_id?: string | null
          comentario?: string | null
          criado_em?: string | null
          id?: string
          nota: number
          usuario_id: string
          vendedor_id: string
        }
        Update: {
          anuncio_id?: string | null
          comentario?: string | null
          criado_em?: string | null
          id?: string
          nota?: number
          usuario_id?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      carrinho: {
        Row: {
          anuncio_id: string
          criado_em: string | null
          id: string
          quantidade: number
          total: number
          usuario_id: string
          dias_locacao?: number | null
        }
        Insert: {
          anuncio_id: string
          criado_em?: string | null
          id?: string
          quantidade?: number
          total?: number
          usuario_id: string
          dias_locacao?: number | null
        }
        Update: {
          anuncio_id?: string
          criado_em?: string | null
          id?: string
          quantidade?: number
          total?: number
          usuario_id?: string
          dias_locacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "carrinho_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrinho_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      enderecos: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          criado_em: string | null
          id: string
          informacoes_adicionais: string | null
          nome_destinatario: string
          numero: string | null
          rua: string
          sem_numero: boolean | null
          telefone_contato: string
          tipo_endereco: string
          uf: string
          usuario_id: string
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          criado_em?: string | null
          id?: string
          informacoes_adicionais?: string | null
          nome_destinatario: string
          numero?: string | null
          rua: string
          sem_numero?: boolean | null
          telefone_contato: string
          tipo_endereco: string
          uf: string
          usuario_id: string
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          criado_em?: string | null
          id?: string
          informacoes_adicionais?: string | null
          nome_destinatario?: string
          numero?: string | null
          rua?: string
          sem_numero?: boolean | null
          telefone_contato?: string
          tipo_endereco?: string
          uf?: string
          usuario_id?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          anuncio_id: string
          criado_em: string | null
          id: string
          usuario_id: string
        }
        Insert: {
          anuncio_id: string
          criado_em?: string | null
          id?: string
          usuario_id: string
        }
        Update: {
          anuncio_id?: string
          criado_em?: string | null
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          anuncio_id: string
          id: string
          pedido_id: string
          preco_unitario: number
          quantidade: number
          subtotal: number
          status: string | null
          codigo_rastreio: string | null
          dias_locacao?: number | null
        }
        Insert: {
          anuncio_id: string
          id?: string
          pedido_id: string
          preco_unitario: number
          quantidade?: number
          subtotal?: number
          status?: string | null
          codigo_rastreio?: string | null
          dias_locacao?: number | null
        }
        Update: {
          anuncio_id?: string
          id?: string
          pedido_id?: string
          preco_unitario?: number
          quantidade?: number
          subtotal?: number
          status?: string | null
          codigo_rastreio?: string | null
          dias_locacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          conteudo: string
          criado_em: string | null
          destinatario_id: string
          id: string
          remetente_id: string
        }
        Insert: {
          conteudo: string
          criado_em?: string | null
          destinatario_id: string
          id?: string
          remetente_id: string
        }
        Update: {
          conteudo?: string
          criado_em?: string | null
          destinatario_id?: string
          id?: string
          remetente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          conteudo: string
          criado_em: string | null
          id: string
          lida: boolean | null
          tag: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          conteudo: string
          criado_em?: string | null
          id?: string
          lida?: boolean
          tag?: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          conteudo?: string
          criado_em?: string | null
          id?: string
          lida?: boolean
          tag?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          criado_em: string | null
          endereco_id: string
          id: string
          opcao_entrega: string
          status: string | null
          total: number
          usuario_id: string
          codigo_rastreio: string | null
        }
        Insert: {
          criado_em?: string | null
          endereco_id: string
          id?: string
          opcao_entrega: string
          status?: string | null
          total: number
          usuario_id: string
          codigo_rastreio?: string | null
        }
        Update: {
          criado_em?: string | null
          endereco_id?: string
          id?: string
          opcao_entrega?: string
          status?: string | null
          total?: number
          usuario_id?: string
          codigo_rastreio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey_public"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          aceito_termos: boolean | null
          bairro: string | null
          cidade: string | null
          cnpj: string | null
          criado_em: string | null
          data_nascimento: string | null
          descricao_empresa: string | null
          email: string
          id: string
          logo_empresa: string | null
          nome: string
          nome_empresa: string | null
          telefone: string | null
          telefone_movel: string | null
        }
        Insert: {
          aceito_termos?: boolean | null
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          descricao_empresa?: string | null
          email: string
          id?: string
          logo_empresa?: string | null
          nome: string
          nome_empresa?: string | null
          telefone?: string | null
          telefone_movel?: string | null
        }
        Update: {
          aceito_termos?: boolean | null
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          descricao_empresa?: string | null
          email?: string
          id?: string
          logo_empresa?: string | null
          nome?: string
          nome_empresa?: string | null
          telefone?: string | null
          telefone_movel?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          banner_1_url: string | null
          banner_2_url: string | null
          favicon_url: string | null
          id: string
          titulo_encontre: string | null
          titulo_ofertas: string | null
          updated_at: string | null
        }
        Insert: {
          banner_1_url?: string | null
          banner_2_url?: string | null
          favicon_url?: string | null
          id?: string
          titulo_encontre?: string | null
          titulo_ofertas?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_1_url?: string | null
          banner_2_url?: string | null
          favicon_url?: string | null
          id?: string
          titulo_encontre?: string | null
          titulo_ofertas?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          criado_em: string | null
        }
        Insert: {
          id?: string
          user_id: string
          criado_em?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          criado_em?: string | null
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
      get_vendedor_pedidos: {
        Args: {
          vendedor_id: string
        }
        Returns: any[]
      }
      is_admin: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "cliente" | "vendedor"
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
      app_role: ["cliente", "vendedor"],
    },
  },
} as const