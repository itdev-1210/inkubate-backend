// collection.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { GeneratorService } from '@common/providers';
import { Collection, PeriodType, Prisma } from '@prisma/client';
import { SearchParams } from '@common/dto/search-params.dto';
import { PaginationParams } from '@common/dto/pagenation-params.dto';

@Injectable()
export class CollectionService {
  constructor(
    private readonly prismaService: PrismaService,
    private generatorService: GeneratorService,
  ) {}

  async getCollections(
    { contains }: SearchParams,
    { limit = 4, startId = 1 }: PaginationParams,
  ) {
    const offset = (startId - 1) * limit;
    const data = await this.prismaService.collection.findMany({
      ...(contains && {
        where: {
          OR: [
            {
              name: {
                contains: contains ? contains : undefined,
                mode: 'insensitive'
              },
            },
            {
              address: {
                contains: contains ? contains : undefined,
                mode: 'insensitive'
              },
            },
          ],
        },
      }),
      include: {
        avatar: true,
        banner: true,
        creator: true,
        _count: {
          select: {
            nfts: true,
          },
        },
      },

      skip: offset,
      take: limit,
    });
    return {
      collections: data,
      nextId: data.length > 0 && data.length >= limit ? startId + 1 : null,
      previousId: startId <= 1 ? 1 : startId - 1,
    };
  }

  public async getCollection(
    args: Prisma.CollectionFindUniqueArgs,
  ): Promise<Collection> {
    return await this.prismaService.collection.findUnique({
      ...args,
      include: {
        avatar: true,
        banner: true,
        creator: true,
        nfts: { select: { _count: true } },
      },
    });
  }

  async createCollection(
    userId: string,
    data: Omit<Prisma.CollectionCreateInput, 'id' | 'creator'>,
  ) {
    const collection = await this.prismaService.collection.create({
      data: {
        ...data,
        id: data.address,
        creator: {
          connect: {
            id: userId,
          },
        },
      },
    });

    for (const period of Object.values(PeriodType)) {
      await this.prismaService.stat.create({
        data: {
          id: this.generatorService.uuid(),
          collectionId: collection.id,
          owners: 0,
          listedItems: 0,
          salesItems: 0,
          floorPrice: BigInt(0),
          volume: BigInt(0),
          period,
        },
      });
    }

    return collection;
  }
}
