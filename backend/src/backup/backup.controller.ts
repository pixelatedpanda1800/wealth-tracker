import { Controller, Get, Post, Body } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupDataDto } from './dto/backup-data.dto';

@Controller('backup')
export class BackupController {
    constructor(private readonly backupService: BackupService) { }

    @Get('export')
    async exportBackup() {
        return this.backupService.exportFullBackup();
    }

    @Post('import')
    async importBackup(@Body() element: BackupDataDto) {
        return this.backupService.importFullBackup(element);
    }
}
