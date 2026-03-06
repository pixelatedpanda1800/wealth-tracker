import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WealthSnapshot } from './wealth-snapshot.entity';
import { WealthSource } from './wealth-source.entity';
import { CreateWealthSnapshotDto } from './dto/create-wealth-snapshot.dto';

@Injectable()
export class WealthService {
  constructor(
    @InjectRepository(WealthSnapshot)
    private wealthRepository: Repository<WealthSnapshot>,
    @InjectRepository(WealthSource)
    private sourceRepository: Repository<WealthSource>,
  ) {}

  async findAllSnapshots(): Promise<WealthSnapshot[]> {
    const snapshots = await this.wealthRepository.find({
      order: { year: 'ASC' },
    });

    // Sort chronologically: year then month
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return snapshots.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
  }

  async createOrUpdateSnapshot(
    dto: CreateWealthSnapshotDto,
  ): Promise<WealthSnapshot> {
    const existing = await this.wealthRepository.findOne({
      where: { year: dto.year, month: dto.month },
    });

    if (existing) {
      // Update existing
      Object.assign(existing, dto);
      return this.wealthRepository.save(existing);
    }

    // Create new
    const newSnapshot = this.wealthRepository.create(dto);
    return this.wealthRepository.save(newSnapshot);
  }

  async removeSnapshot(id: string): Promise<void> {
    await this.wealthRepository.delete(id);
  }

  async findAllSources(): Promise<WealthSource[]> {
    return this.sourceRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createSource(data: Partial<WealthSource>): Promise<WealthSource> {
    const source = this.sourceRepository.create(data);
    return this.sourceRepository.save(source);
  }

  async removeSource(id: string): Promise<void> {
    await this.sourceRepository.delete(id);
  }

  async updateSource(
    id: string,
    data: Partial<WealthSource>,
  ): Promise<WealthSource | null> {
    await this.sourceRepository.update(id, data);
    return this.sourceRepository.findOneBy({ id });
  }

  async exportToCsv(): Promise<string> {
    const sources = await this.findAllSources();
    const snapshots = await this.findAllSnapshots();

    // Build header row
    const headers = ['Year', 'Month', ...sources.map((s) => s.name)];
    const rows: string[] = [headers.join(',')];

    // Build data rows
    for (const snapshot of snapshots) {
      const values = sources.map((s) => {
        const val = snapshot.values?.[s.id];
        return val !== undefined ? val.toString() : '';
      });
      rows.push(
        [snapshot.year.toString(), snapshot.month, ...values].join(','),
      );
    }

    return rows.join('\n');
  }

  async importFromCsv(
    csvData: string,
  ): Promise<{ rowsProcessed: number; newSources: string[] }> {
    const lines = csvData
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);
    if (lines.length < 2) {
      return { rowsProcessed: 0, newSources: [] };
    }

    const headerLine = lines[0];
    const headers = this.parseCsvLine(headerLine);
    // First two columns should be Year, Month
    const sourceNames = headers.slice(2);

    // Map source names to IDs, create missing sources
    const existingSources = await this.findAllSources();
    const sourceMap: Record<string, string> = {}; // name -> id
    const newSources: string[] = [];

    for (const name of sourceNames) {
      const existing = existingSources.find(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        sourceMap[name] = existing.id;
      } else {
        // Create new source as 'cash'
        const created = await this.createSource({
          name,
          category: 'cash' as any,
        });
        sourceMap[name] = created.id;
        newSources.push(name);
      }
    }

    // Process data rows
    let rowsProcessed = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length < 2) continue;

      const year = parseInt(cols[0], 10);
      const month = cols[1];
      if (isNaN(year) || !month) continue;

      const values: Record<string, number> = {};
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

  private parseCsvLine(line: string): string[] {
    // Simple CSV parser handling quoted fields
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
}
