import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiException } from "../exceptions/api.exception";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  if (!request.user) throw new ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
  return request.user;
});
