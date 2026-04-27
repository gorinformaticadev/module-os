import { Controller, Get } from '@nestjs/common';
import { Public } from './shared/decorators/public.decorator';

@Controller('ordem_servico')
export class OrdemServicoHealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', module: 'ordem_servico' };
  }
}

