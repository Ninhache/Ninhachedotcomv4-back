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
import { AliasService } from 'src/alias/alias.service';
import { isRaw } from 'src/alias/raw';
import { Public } from 'src/auth/public.decorator';
import { RevalidateContent } from 'src/revalidation/revalidate.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectService } from './project.service';

@RevalidateContent('projects')
@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly alias: AliasService,
  ) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Public()
  @Get()
  async findAll(@Query('locale') locale = 'fr', @Query('raw') raw?: string) {
    const projects = await this.projectService.findAll();
    return isRaw(raw) ? projects : this.alias.resolveObject(projects, locale);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('locale') locale = 'fr',
    @Query('raw') raw?: string,
  ) {
    const project = await this.projectService.findOne(id);
    return isRaw(raw) ? project : this.alias.resolveObject(project, locale);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete("/:id")
  delete(@Param('id') id: string) {
    return this.projectService.deleteById(id);
  }
}
