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
exports.WealthSource = exports.WealthSourceCategory = void 0;
const typeorm_1 = require("typeorm");
var WealthSourceCategory;
(function (WealthSourceCategory) {
    WealthSourceCategory["INVESTMENT"] = "investment";
    WealthSourceCategory["CASH"] = "cash";
    WealthSourceCategory["PENSION"] = "pension";
})(WealthSourceCategory || (exports.WealthSourceCategory = WealthSourceCategory = {}));
let WealthSource = class WealthSource {
    id;
    name;
    category;
    color;
    createdAt;
    updatedAt;
};
exports.WealthSource = WealthSource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WealthSource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WealthSource.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        default: WealthSourceCategory.CASH
    }),
    __metadata("design:type", String)
], WealthSource.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WealthSource.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WealthSource.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WealthSource.prototype, "updatedAt", void 0);
exports.WealthSource = WealthSource = __decorate([
    (0, typeorm_1.Entity)('wealth_sources')
], WealthSource);
//# sourceMappingURL=wealth-source.entity.js.map