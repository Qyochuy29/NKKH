"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const ung_dung_module_1 = require("./ung-dung.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(ung_dung_module_1.UngDungModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors({
        origin: '*',
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🛡️ SafeVoice AI running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=khoi-dong.js.map
