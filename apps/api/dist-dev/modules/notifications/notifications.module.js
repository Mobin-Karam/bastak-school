"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const notification_entity_1 = require("../../database/entities/notification.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const notification_preference_entity_1 = require("../../database/entities/notification-preference.entity");
const push_subscription_entity_1 = require("../../database/entities/push-subscription.entity");
const push_service_1 = require("./push.service");
const push_controller_1 = require("./push.controller");
const realtime_module_1 = require("../realtime/realtime.module");
const notifications_service_1 = require("./notifications.service");
const notifications_controller_1 = require("./notifications.controller");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                notification_entity_1.Notification,
                student_entity_1.Student,
                user_entity_1.User,
                push_subscription_entity_1.PushSubscription,
                notification_preference_entity_1.NotificationPreference,
            ]),
            realtime_module_1.RealtimeModule,
        ],
        controllers: [notifications_controller_1.NotificationsController, push_controller_1.PushController],
        providers: [notifications_service_1.NotificationsService, push_service_1.PushService],
        exports: [notifications_service_1.NotificationsService, push_service_1.PushService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map