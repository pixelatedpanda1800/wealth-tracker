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
exports.WealthController = void 0;
const common_1 = require("@nestjs/common");
const wealth_service_1 = require("./wealth.service");
const create_wealth_snapshot_dto_1 = require("./dto/create-wealth-snapshot.dto");
let WealthController = class WealthController {
    wealthService;
    constructor(wealthService) {
        this.wealthService = wealthService;
    }
    findAll() {
        return this.wealthService.findAllSnapshots();
    }
    create(createWealthSnapshotDto) {
        return this.wealthService.createOrUpdateSnapshot(createWealthSnapshotDto);
    }
    remove(id) {
        return this.wealthService.removeSnapshot(id);
    }
    findAllSources() {
        return this.wealthService.findAllSources();
    }
    createSource(data) {
        return this.wealthService.createSource(data);
    }
    updateSource(id, data) {
        return this.wealthService.updateSource(id, data);
    }
    removeSource(id) {
        return this.wealthService.removeSource(id);
    }
};
exports.WealthController = WealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_wealth_snapshot_dto_1.CreateWealthSnapshotDto]),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('sources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "findAllSources", null);
__decorate([
    (0, common_1.Post)('sources'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "createSource", null);
__decorate([
    (0, common_1.Patch)('sources/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "updateSource", null);
__decorate([
    (0, common_1.Delete)('sources/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WealthController.prototype, "removeSource", null);
exports.WealthController = WealthController = __decorate([
    (0, common_1.Controller)('wealth'),
    __metadata("design:paramtypes", [wealth_service_1.WealthService])
], WealthController);
//# sourceMappingURL=wealth.controller.js.map