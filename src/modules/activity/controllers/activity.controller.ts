// activity.controller.ts

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../services/activity.service';
import { FilterParams } from '@common/dto/filter-params.dto';
import { PaginationParams } from '@common/dto/pagenation-params.dto';

const moduleName = 'activity';

@ApiTags(moduleName)
@Controller(moduleName)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation({ summary: 'Get activities by user' })
  @Public()
  @Get('user/:userId')
  async getUserActivities(
    @Param('userId') userId: string,
    @Query() filter: FilterParams,
    @Query() pagination: PaginationParams,
  ) {
    return await this.activityService.getActivitiesByUser(
      userId,
      filter,
      pagination,
    );
  }

  @ApiOperation({
    summary: 'Get activities of collection',
    description: 'public',
  })
  @Public()
  @Get('collection/:collectionId')
  async getCollectionActivities(
    @Param('collectionId') collectionId: string,
    @Query() pagination: PaginationParams,
  ) {
    const { limit, startId } = pagination;
    const offset = (startId - 1) * limit;
    const data = await this.activityService.getActivities({
      where: {
        nft: {
          collectionId: collectionId,
        },
        OR: [
          { actionType: ActivityType.MINTED },
          { actionType: ActivityType.SOLD },
          { actionType: ActivityType.ACCPETED_OFFER },
        ],
      },
      take: limit,
      skip: offset,
    });
    return {
      activity: data,
      nextId: data.length > 0 && data.length >= limit ? startId + 1 : null,
      previousId: startId <= 1 ? 1 : startId - 1,
    };
  }

  @ApiOperation({ summary: 'Get activities of NFT', description: 'public' })
  @Public()
  @Get('nft/:nftId')
  async getNftActivities(@Param('nftId') nftId: string) {
    return await this.activityService.getActivities({
      where: {
        nftId,
      },
    });
  }
}
