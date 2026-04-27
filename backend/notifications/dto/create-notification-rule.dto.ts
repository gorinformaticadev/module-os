/**
 * DTO para criação de regras de notificação
 * Define contrato explícito entre frontend e backend
 */
export interface TriggerConfigDto {
  event_type?: string;
  condition?: Record<string, any> | string;
  frequency?: {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  [key: string]: any;
}

export interface RecipientDto {
  type: string;
  identifier?: string;
  config?: Record<string, any>;
}

export interface CreateNotificationRuleDto {
  title: string;
  description?: string | null;
  enabled?: boolean;
  trigger_type?: string;
  trigger_config?: TriggerConfigDto | null;
  channel?: string;
  recipients?: RecipientDto[] | null;
  message_template?: string | null;
  max_executions?: number | null;
  expires_at?: string | null;
}
