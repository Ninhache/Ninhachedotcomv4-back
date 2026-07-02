import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { Locale } from '@prisma/client';
import { CvService } from './cv.service';
import { UpdateCvConfigDto } from './dto/cv-config.dto';
import { GenerateCvDto } from './dto/generate-cv.dto';
import { LatexCompileError } from './latex/compile';

/**
 * Admin-only CV generator. Every route here is protected by the global
 * JwtAuthGuard (no `@Public()`), so only the authenticated back-office reaches
 * it. The generated PDFs are served as static `/uploads/...` files.
 */
@Controller('cv')
export class CvController {
    constructor(private readonly cvService: CvService) {}

    private coerceLocale(value?: string): Locale {
        return value === 'en' ? 'en' : 'fr';
    }

    /** Selectable inventory (ids + labels) to build the admin checkboxes. */
    @Get('data')
    getData(@Query('locale') locale?: string) {
        return this.cvService.getInventory(this.coerceLocale(locale));
    }

    /** Current persisted template + selection + last generated URLs. */
    @Get('config')
    getConfig() {
        return this.cvService.getConfig();
    }

    /** Persist the template + selection chosen in the builder. */
    @Put('config')
    updateConfig(@Body() dto: UpdateCvConfigDto) {
        return this.cvService.updateConfig(dto);
    }

    /**
     * Generate the CV PDF(s). On a LaTeX failure, surface the Tectonic log in
     * the 400 body so the operator can see what broke.
     */
    @Post('generate')
    async generate(@Body() dto: GenerateCvDto) {
        try {
            return await this.cvService.generate(dto);
        } catch (err) {
            if (err instanceof LatexCompileError) {
                throw new BadRequestException({
                    message: err.message,
                    log: err.log,
                });
            }
            throw err;
        }
    }
}
