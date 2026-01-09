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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WealthSnapshot = void 0;
const typeorm_1 = require("typeorm");
let WealthSnapshot = class WealthSnapshot {
    id;
    year;
    month;
    values;
    createdAt;
    updatedAt;
};
exports.WealthSnapshot = WealthSnapshot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WealthSnapshot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WealthSnapshot.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3 }),
    __metadata("design:type", String)
], WealthSnapshot.prototype, "month", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json', { default: '{}' }),
    __metadata("design:type", Object)
], WealthSnapshot.prototype, "values", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WealthSnapshot.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WealthSnapshot.prototype, "updatedAt", void 0);
exports.WealthSnapshot = WealthSnapshot = __decorate([
    (0, typeorm_1.Entity)('wealth_snapshots'),
    (0, typeorm_1.Unique)(['year', 'month'])
], WealthSnapshot);
//# sourceMappingURL=wealth-snapshot.entity.js.map