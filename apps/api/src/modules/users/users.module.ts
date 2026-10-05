import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Session } from "../../database/entities/session.entity";
import { User } from "../../database/entities/user.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({imports:[TypeOrmModule.forFeature([User,UserRoleAssignment,Session])],controllers:[UsersController],providers:[UsersService]})
export class UsersModule {}
