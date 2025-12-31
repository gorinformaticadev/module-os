"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Save, ArrowRight, CalendarClock } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function OrdemServicoConfiguracoesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  const [config, setConfig] = useState({
    title: '',
    content: '',
    audience: 'all',
    cronExpression: '0 9 * * *',
    enabled: true
  });

  const getFrequencyType = (cron: string) => {
    if (!cron) return 'daily';
    if (cron.startsWith('*/')) return 'interval';
    const parts = cron.split(' ');
    if (parts.length < 5) return 'custom';

    if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') return 'daily';
    if (parts[2] === '*' && parts[3] === '*' && parts[4] !== '*') return 'weekly';
    if (parts[2] !== '*' && parts[3] === '*' && parts[4] === '*') return 'monthly';

    return 'custom';
  };

  const getTimeFromCron = (cron: string) => {
    try {
      const parts = cron.split(' ');
      if (parts.length < 2) return '09:00';
      const minute = parts[0].padStart(2, '0');
      const hour = parts[1].padStart(2, '0');
      return `${hour}:${minute}`;
    } catch {
      return '09:00';
    }
  };

  const generateCron = (type: string, time: string, day: string = '1', interval: string = '15') => {
    const [hour, minute] = time.split(':');
    const safeHour = hour || '09';
    const safeMinute = minute || '00';

    switch (type) {
      case 'daily':
        return `${parseInt(safeMinute)} ${parseInt(safeHour)} * * *`;
      case 'weekly':
        return `${parseInt(safeMinute)} ${parseInt(safeHour)} * * ${day}`;
      case 'monthly':
        return `${parseInt(safeMinute)} ${parseInt(safeHour)} ${day} * *`;
      case 'interval':
        return `*/${interval} * * * *`;
      default:
        return '0 9 * * *';
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/modules/ordem_servico/config/notifications');
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!config.title || !config.content) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o conteúdo da notificação.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      await api.post('/modules/ordem_servico/config/notifications', config);
      toast({
        title: 'Sucesso',
        description: 'Novo agendamento criado.',
      });
      setConfig({
        ...config,
        title: '',
        content: ''
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: 'Erro ao criar',
        description: 'Ocorreu um erro ao criar o agendamento.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Configurações de Agendamento
        </h1>
        <Link href="/configuracoes/sistema/cron">
          <Button variant="outline" className="gap-2">
            Ver todas as rotinas (Cron)
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>
              Crie uma nova regra de notificação automática.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Ex: Lembrete Diário"
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Input
                value={config.content}
                onChange={(e) => setConfig({ ...config, content: e.target.value })}
                placeholder="Mensagem da notificação..."
              />
            </div>

            <div className="space-y-2">
              <Label>Público Alvo</Label>
              <Select
                value={config.audience}
                onValueChange={(val) => setConfig({ ...config, audience: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Geral (Todos)</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select
                value={getFrequencyType(config.cronExpression)}
                onValueChange={(type) => {
                  const newCron = generateCron(type, '09:00', '1', '30');
                  setConfig({ ...config, cronExpression: newCron });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário (Todo dia)</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="interval">Intervalo (Minutos)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {getFrequencyType(config.cronExpression) === 'daily' && (
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={getTimeFromCron(config.cronExpression)}
                  onChange={(e) => {
                    const time = e.target.value;
                    if (!time) return;
                    const [hour, minute] = time.split(':');
                    setConfig({ ...config, cronExpression: `${parseInt(minute)} ${parseInt(hour)} * * *` });
                  }}
                />
              </div>
            )}

            <Button onClick={handleCreate} disabled={saving} className="w-full mt-4">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agendamentos Ativos</CardTitle>
            <CardDescription>
              Lista de notificações agendadas para envio automático.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando agendamentos...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{schedule.title}</h3>
                        <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                          {schedule.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-balance text-muted-foreground">{schedule.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {schedule.cron_expression}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Destino: {schedule.audience === 'all' ? 'Todos' : schedule.audience}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
