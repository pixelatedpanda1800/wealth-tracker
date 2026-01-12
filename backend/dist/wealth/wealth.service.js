"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WealthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wealth_snapshot_entity_1 = require("./wealth-snapshot.entity");
const wealth_source_entity_1 = require("./wealth-source.entity");
let WealthService = class WealthService {
    wealthRepository;
    sourceRepository;
    constructor(wealthRepository, sourceRepository) {
        this.wealthRepository = wealthRepository;
        this.sourceRepository = sourceRepository;
    }
    async findAllSnapshots() {
        const snapshots = await this.wealthRepository.find({
            order: { year: 'ASC' },
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return snapshots.sort((a, b) => {
            if (a.year !== b.year)
                return a.year - b.year;
            return months.indexOf(a.month) - months.indexOf(b.month);
        });
    }
    async createOrUpdateSnapshot(dto) {
        const existing = await this.wealthRepository.findOne({
            where: { year: dto.year, month: dto.month },
        });
        if (existing) {
            Object.assign(existing, dto);
            return this.wealthRepository.save(existing);
        }
        const newSnapshot = this.wealthRepository.create(dto);
        return this.wealthRepository.save(newSnapshot);
    }
    async removeSnapshot(id) {
        await this.wealthRepository.delete(id);
    }
    async findAllSources() {
        return this.sourceRepository.find({ order: { createdAt: 'ASC' } });
    }
    async createSource(data) {
        const source = this.sourceRepository.create(data);
        return this.sourceRepository.save(source);
    }
    async removeSource(id) {
        await this.sourceRepository.delete(id);
    }
    async updateSource(id, data) {
        await this.sourceRepository.update(id, data);
        return this.sourceRepository.findOneBy({ id });
    }
    async exportToCsv() {
        const sources = await this.findAllSources();
        const snapshots = await this.findAllSnapshots();
        const headers = ['Year', 'Month', ...sources.map(s => s.name)];
        const rows = [headers.join(',')];
        for (const snapshot of snapshots) {
            const values = sources.map(s => {
                const val = snapshot.values?.[s.id];
                return val !== undefined ? val.toString() : '';
            });
            rows.push([snapshot.year.toString(), snapshot.month, ...values].join(','));
        }
        return rows.join('\n');
    }
    async importFromCsv(csvData) {
        const lines = csvData.trim().split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) {
            return { rowsProcessed: 0, newSources: [] };
        }
        const headerLine = lines[0];
        const headers = this.parseCsvLine(headerLine);
        const sourceNames = headers.slice(2);
        const existingSources = await this.findAllSources();
        const sourceMap = {};
        const newSources = [];
        for (const name of sourceNames) {
            const existing = existingSources.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                sourceMap[name] = existing.id;
            }
            else {
                const created = await this.createSource({ name, category: 'cash' });
                sourceMap[name] = created.id;
                newSources.push(name);
            }
        }
        let rowsProcessed = 0;
        for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCsvLine(lines[i]);
            if (cols.length < 2)
                continue;
            const year = parseInt(cols[0], 10);
            const month = cols[1];
            if (isNaN(year) || !month)
                continue;
            const values = {};
            for (let j = 0; j < sourceNames.length; j++) {
                const val = parseFloat(cols[j + 2] || '0');
                if (!isNaN(val)) {
                    values[sourceMap[sourceNames[j]]] = val;
                }
            }
            await this.createOrUpdateSnapshot({ year, month, values });
            rowsProcessed++;
        }
        return { rowsProcessed, newSources };
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
};
exports.WealthService = WealthService;
exports.WealthService = WealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wealth_snapshot_entity_1.WealthSnapshot)),
    __param(1, (0, typeorm_1.InjectRepository)(wealth_source_entity_1.WealthSource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WealthService);
//# sourceMappingURL=wealth.service.js.map