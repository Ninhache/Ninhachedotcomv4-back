import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { FindAllTagsQueryDto } from './dto/find-all.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagService: TagsService) {}

    @Post()
    create(@Body() dto: CreateTagDto) {
        return this.tagService.create(dto);
    }

    @Public()
    @Get()
    findAll(@Query() query: FindAllTagsQueryDto) {
        return this.tagService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tagService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
        return this.tagService.update(id, dto);
    }

    @Patch(':id/visibility')
    setVisibility(@Param('id') id: string, @Body() dto: UpdateVisibilityDto) {
        return this.tagService.setVisibility(id, dto.isVisible);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tagService.remove(id);
    }
}
