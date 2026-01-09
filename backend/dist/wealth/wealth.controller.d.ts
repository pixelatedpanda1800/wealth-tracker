import { WealthService } from './wealth.service';
import { CreateWealthSnapshotDto } from './dto/create-wealth-snapshot.dto';
export declare class WealthController {
    private readonly wealthService;
    constructor(wealthService: WealthService);
    findAll(): Promise<import("./wealth-snapshot.entity").WealthSnapshot[]>;
    create(createWealthSnapshotDto: CreateWealthSnapshotDto): Promise<import("./wealth-snapshot.entity").WealthSnapshot>;
    remove(id: string): Promise<void>;
    findAllSources(): Promise<import("./wealth-source.entity").WealthSource[]>;
    createSource(data: any): Promise<import("./wealth-source.entity").WealthSource>;
    updateSource(id: string, data: any): Promise<import("./wealth-source.entity").WealthSource | null>;
    removeSource(id: string): Promise<void>;
}
