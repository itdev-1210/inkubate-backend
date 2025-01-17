// user.service.ts

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GeneratorService } from '@common/providers';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { UpdateUsernameDto } from '@modules/user/dto/update-username.dto';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    private prismaService: PrismaService,
    private generatorService: GeneratorService,
  ) {}

  public async createUser(
    data: Omit<Prisma.UserCreateInput, 'id' | 'username'>,
  ) {
    return this.prismaService.user.create({
      data: {
        id: data.walletAddress,
        username: data.walletAddress,
        ...data,
      },
    });
  }

  /* Queries */
  public async getUser(args: Prisma.UserFindUniqueArgs): Promise<User> {
    return await this.prismaService.user.findUnique(args);
  }

  public async getManyUsers(args: Prisma.UserFindManyArgs): Promise<User[]> {
    return await this.prismaService.user.findMany(args);
  }

  public async countManyUsers(args: Prisma.UserCountArgs): Promise<number> {
    return await this.prismaService.user.count(args);
  }

  public async updateOneUser(args: Prisma.UserUpdateArgs): Promise<User> {
    try {
      return await this.prismaService.user.update({
        ...args,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async deleteOneUser(args: Prisma.UserDeleteArgs): Promise<User> {
    try {
      return await this.prismaService.user.delete(args);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async updateUsername(userId: string, { username }: UpdateUsernameDto) {
    const existingUsername = await this.prismaService.user.findUnique({
      where: { username: username },
    });
    if (existingUsername)
      throw new BadRequestException('username already exists');

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: { username },
    });
    // const authTokens = await this.authService.generateAuthToken({
    //   id: user.id,
    //   username,
    //   roles: user.roles,
    // });
    // await this.authService.updateRefreshToken({ username }, authTokens.refreshToken);
    return user;
  }

  public async availableUsername({ username }: UpdateUsernameDto) {
    this.logger.log(
      `${'*'.repeat(20)} availableUsername(${username}) ${'*'.repeat(20)}`,
    );
    return !(await this.prismaService.user.findUnique({
      where: { username: username },
    }));
  }
}
