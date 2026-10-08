"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const cmb_realtime_1 = require("@moshaver/cmb-realtime");
let RealtimeService = class RealtimeService {
    hub = new cmb_realtime_1.InMemoryRealtimeHub();
    stream(userId) {
        return new rxjs_1.Observable((subscriber) => {
            const unsubscribe = this.hub.subscribe(userId, (event) => subscriber.next(event));
            return unsubscribe;
        });
    }
    emitToUser(userId, type, data) {
        this.hub.emitToUser(userId, type, data);
    }
    emitToUsers(userIds, type, data) {
        this.hub.emitToUsers(userIds, type, data);
    }
    connectionCount(userId) {
        return this.hub.connectionCount(userId);
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = __decorate([
    (0, common_1.Injectable)()
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map