"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const api_exception_1 = require("../exceptions/api.exception");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    if (!request.user)
        throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
    return request.user;
});
//# sourceMappingURL=current-user.decorator.js.map