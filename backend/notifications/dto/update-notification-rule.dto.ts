/**
 * DTO para atualização de regras de notificação
 * Suporte a atualizações parciais (PATCH semantics)
 */
import { CreateNotificationRuleDto } from './create-notification-rule.dto';

export type UpdateNotificationRuleDto = Partial<Omit<CreateNotificationRuleDto, 'id' | 'created_at'>>;
