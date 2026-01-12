import { Repository } from 'typeorm';
import { WealthSnapshot } from './wealth-snapshot.entity';
import { WealthSource } from './wealth-source.entity';
import { CreateWealthSnapshotDto } from './dto/create-wealth-snapshot.dto';
export declare class WealthService {
    private wealthRepository;
    private sourceRepository;
    constructor(wealthRepository: Repository<WealthSnapshot>, sourceRepository: Repository<WealthSource>);
    findAllSnapshots(): Promise<WealthSnapshot[]>;
    createOrUpdateSnapshot(dto: CreateWealthSnapshotDto): Promise<WealthSnapshot>;
    removeSnapshot(id: string): Promise<void>;
    findAllSources(): Promise<WealthSource[]>;
    createSource(data: Partial<WealthSource>): Promise<WealthSource>;
    removeSource(id: string): Promise<void>;
    updateSource(id: string, data: Partial<WealthSource>): Promise<WealthSource | null>;
    exportToCsv(): Promise<string>;
    importFromCsv(csvData: string): Promise<{
        rowsProcessed: number;
        newSources: string[];
    }>;
    private parseCsvLine;
}
