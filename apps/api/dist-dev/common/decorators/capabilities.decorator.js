"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireCapabilities = exports.CAPABILITIES_KEY = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
exports.CAPABILITIES_KEY = "capabilities";
const RequireCapabilities = (...capabilities) => (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.CAPABILITIES_KEY, capabilities), (0, swagger_1.ApiExtension)("x-required-capabilities", capabilities), (0, swagger_1.ApiForbiddenResponse)({ description: `Requires capabilities: ${capabilities.join(", ")}` }));
exports.RequireCapabilities = RequireCapabilities;
//# sourceMappingURL=capabilities.decorator.js.map