// activity.service.ts

import {
  FilterParams,
  UserFilterByOption,
} from '@common/dto/filter-params.dto';
import { PaginationParams } from '@common/dto/pagenation-params.dto';
import { SearchParams } from '@common/dto/search-params.dto';
import {
  CollectionSortByOption,
  SortParams,
} from '@common/dto/sort-params.dto';
import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prismaService: PrismaService) {}

  async getActivities(args: Prisma.ActivityFindManyArgs) {
    return await this.prismaService.activity.findMany({
      ...args,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        nft: {
          include: {
            collection: true,
          },
        },
        seller: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        buyer: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async getActivitiesByUser(
    userId: string,
    { filterBy }: FilterParams,
    { limit = 20, startId = 1 }: PaginationParams,
  ) {
    const offset = (startId - 1) * limit;
    switch (filterBy) {
      case UserFilterByOption.ACTIVITY:
        const data = await this.prismaService.activity.findMany({
          where: {
            OR: [{ buyerId: userId }, { sellerId: userId }],
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            buyer: true,
            seller: true,
            nft: {
              include: {
                collection: true,
              },
            },
          },
          take: limit,
          skip: offset,
        });
        return {
          activity: data,
          nextId: data.length > 0 && data.length >= limit ? startId + 1 : null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
      default:
        return {
          activity: [],
          nextId: null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
    }
  }
}
