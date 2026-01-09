import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Param, Delete, Patch } from '@nestjs/common';
import { WealthService } from './wealth.service';
import { CreateWealthSnapshotDto } from './dto/create-wealth-snapshot.dto';

@Controller('wealth')
export class WealthController {
    constructor(private readonly wealthService: WealthService) { }

    @Get()
    findAll() {
        return this.wealthService.findAllSnapshots();
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() createWealthSnapshotDto: CreateWealthSnapshotDto) {
        return this.wealthService.createOrUpdateSnapshot(createWealthSnapshotDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.wealthService.removeSnapshot(id);
    }

    @Get('sources')
    findAllSources() {
        return this.wealthService.findAllSources();
    }

    @Post('sources')
    createSource(@Body() data: any) {
        return this.wealthService.createSource(data);
    }

    @Patch('sources/:id')
    updateSource(@Param('id') id: string, @Body() data: any) {
        return this.wealthService.updateSource(id, data);
    }

    @Delete('sources/:id')
    removeSource(@Param('id') id: string) {
        return this.wealthService.removeSource(id);
    }
}
