// launchpad.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Launchpad, LaunchpadStatus } from '@prisma/client';
import { CurrentUser, Public } from '@common/decorators';
import { AccessTokenGuard } from '@common/guards';
import { IPayloadUserJwt } from '@common/interfaces';
import { LaunchpadService } from '@modules/launchpad/services/launchpad.service';
import { CreateLaunchpadDto } from '@modules/launchpad/dto/create-launchpad.dto';
import { GetLaunchpadDto } from '@modules/launchpad/dto/get-launchpad.dto';

const moduleName = 'launchpad';

@ApiTags(moduleName)
@Controller(moduleName)
export class LaunchpadController {
  constructor(private launchpadService: LaunchpadService) {}

  @ApiOperation({ summary: 'Create new launchpad', description: 'forbidden' })
  @ApiBody({ type: CreateLaunchpadDto })
  @ApiResponse({ type: GetLaunchpadDto })
  @UseGuards(AccessTokenGuard)
  @Post()
  async createLaunchpad(
    @CurrentUser() payload: IPayloadUserJwt,
    @Body() data: CreateLaunchpadDto,
  ): Promise<Launchpad> {
    return await this.launchpadService.createLaunchpad(payload.id, data);
  }

  @ApiOperation({ summary: 'Find all launchpad' })
  @ApiResponse({ type: [GetLaunchpadDto] })
  @Public()
  @Get()
  async getLaunchpads() {
    return await this.launchpadService.getLaunchpads({
      where: { status: LaunchpadStatus.PUBLISHED },
    });
  }

  @ApiOperation({ summary: 'Find all launchpad' })
  @ApiResponse({ type: [GetLaunchpadDto] })
  @UseGuards(AccessTokenGuard)
  @Post('get')
  async getAllLaunchpads() {
    return await this.launchpadService.getLaunchpads({});
  }

  @ApiOperation({ summary: 'Find launchpad by id' })
  @ApiResponse({ type: GetLaunchpadDto })
  @Public()
  @Get(':id')
  async getLaunchpad(@Param('id') id: string) {
    return await this.launchpadService.getLaunchpad({ where: { id } });
  }

  @ApiOperation({ summary: 'Update launchpad', description: 'forbidden' })
  @ApiBody({ type: CreateLaunchpadDto })
  @ApiResponse({ type: GetLaunchpadDto })
  @UseGuards(AccessTokenGuard)
  @Put(':id')
  async updateLaunchpad(
    @Param('id') id: string,
    @CurrentUser() payload: IPayloadUserJwt,
    @Body() data: CreateLaunchpadDto,
  ) {
    return this.launchpadService.updateLaunchpad(payload.id, {
      data: data,
      where: { id: id },
    });
  }

  @ApiOperation({ summary: 'Delete launchpad', description: 'forbidden' })
  @ApiResponse({ type: GetLaunchpadDto })
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  async deleteLaunchpad(
    @Param('id') id: string,
    @CurrentUser() payload: IPayloadUserJwt,
  ) {
    return this.launchpadService.deleteLaunchpad(payload.id, {
      where: { id: id },
    });
  }

  // @ApiOperation({ summary: 'Apply launchpad', description: 'forbidden' })
  // @ApiBody({ type: ApplyLaunchpadDto })
  // @UseGuards(AccessTokenGuard)
  // @Post('apply')
  // async applyLaunchpad(@Body() data: ApplyLaunchpadDto): Promise<Collection> {
  //   return this.launchpadService.applyLaunchpad(data.id);
  // }
}
