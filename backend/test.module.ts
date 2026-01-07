import { Module, Controller, Get } from '@nestjs/common';

@Controller('api/test-ordem-servico')
export class TestController {
    @Get()
    test() {
        return { message: 'Módulo ordem_servico carregado com sucesso!' };
    }
}

@Module({
    controllers: [TestController],
})
export class TestOrdemServicoModule {
    constructor() {
        console.log('🧪 TEST MÓDULO ORDEM_SERVICO CARREGADO!!! 🧪');
    }
}