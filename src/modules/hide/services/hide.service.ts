// hide.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { GeneratorService } from '@common/providers';
import {
  FilterParams,
  UserFilterByOption,
} from '@common/dto/filter-params.dto';
import { PaginationParams } from '@common/dto/pagenation-params.dto';

@Injectable()
export class HideService {
  private logger = new Logger(HideService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private generatorService: GeneratorService,
  ) {}

  async getHidesByUser(
    userId: string,
    { filterBy }: FilterParams,
    { limit = 20, startId = 1 }: PaginationParams,
  ) {
    const offset = (startId - 1) * limit;
    switch (filterBy) {
      case UserFilterByOption.HIDDEN:
        const data = await this.prismaService.hide.findMany({
          where: {
            userId,
          },
          skip: offset,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            nft: {
              include: {
                collection: true,
                owner: true,
              },
            },
          },
        });
        return {
          nfts: data,
          nextId: data.length > 0 && data.length >= limit ? startId + 1 : null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
    }
  }

  async createHide(userId: string, nftId: string) {
    return await this.prismaService.hide.create({
      data: {
        id: this.generatorService.uuid(),
        userId: undefined,
        nftId: undefined,
        user: {
          connect: {
            id: userId,
          },
        },
        nft: {
          connect: {
            id: nftId,
          },
        },
      } as Omit<Prisma.HideCreateInput, 'userId' | 'nftId'>,
    });
  }

  async deleteHide(id: string, userId: string) {
    try {
      return await this.prismaService.hide.delete({
        where: { id, userId },
      });
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
