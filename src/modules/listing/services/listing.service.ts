// listing.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ActivityType, ListingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { GeneratorService, Web3Service } from '@common/providers';
import { CreateListingDto } from '@modules/listing/dto/create-listing.dto';
import { ListingDto } from '../dto/listing.dto';
import { OrderParameters } from '@common/types';
import {
  FilterParams,
  UserFilterByOption,
} from '@common/dto/filter-params.dto';
import { PaginationParams } from '@common/dto/pagenation-params.dto';
import { NotFoundException } from 'src/errors';

@Injectable()
export class ListingService {
  private logger = new Logger(ListingService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly generatorService: GeneratorService,
    private readonly web3Service: Web3Service,
  ) {}

  async getListings(args: Prisma.ListingFindManyArgs) {
    return this.prismaService.listing.findMany(args);
  }

  async getListing(args: Prisma.ListingFindFirstArgs) {
    return this.prismaService.listing.findFirst({
      ...args,
      include: {
        nft: true,
        seller: true,
      },
    });
  }

  async getLisitingsByUser(
    sellerId: string,
    { filterBy }: FilterParams,
    { limit = 20, startId = 1 }: PaginationParams,
  ) {
    const offset = (startId - 1) * limit;
    try {
      switch (filterBy) {
        case UserFilterByOption.LISTING:
          const data = await this.prismaService.listing.findMany({
            where: {
              sellerId,
              OR: [
                { status: ListingStatus.ACTIVE },
                { status: ListingStatus.SOLD },
              ],
            },
            skip: offset,
            take: limit,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              seller: true,
              nft: {
                include: {
                  collection: true,
                },
              },
            },
          });
          return {
            listings: data,
            nextId:
              data.length > 0 && data.length >= limit ? startId + 1 : null,
            previousId: startId <= 1 ? 1 : startId - 1,
          };
        default:
          return [];
      }
    } catch (error) {
      throw new NotFoundException('Resource not found');
    }
  }

  async createListing(userId: string, data: CreateListingDto) {
    const order: OrderParameters = JSON.parse(data.parameters);
    const price = BigInt(
      order.consideration.reduce((a, c) => a + Number(c.startAmount), ''),
    );
    const startTime = new Date(Number(order.startTime) * 1000);
    const endTime = new Date(Number(order.endTime) * 1000);

    const listing = await this.prismaService.listing.findFirst({
      where: {
        nftId: data.nftId,
        status: ListingStatus.ACTIVE,
      },
    });

    try {
      if (listing) {
        return await this.prismaService.listing.update({
          where: {
            id: listing.id,
          },
          data: {
            price,
            startTime,
            endTime,
            signature: data.signature,
          },
        });
      } else {
        const newListing = await this.prismaService.listing.create({
          data: {
            id: this.generatorService.uuid(),
            nftId: undefined,
            price,
            network: data.network,
            startTime,
            endTime,
            signature: data.signature,
            status: ListingStatus.ACTIVE,
            seller: {
              connect: {
                id: userId,
              },
            },
            nft: {
              connect: {
                id: data.nftId,
              },
            },
          } as Omit<Prisma.ListingCreateInput, 'nftId'>,
        });

        await this.prismaService.activity.create({
          data: {
            id: this.generatorService.uuid(),
            // @ts-ignore
            price: String(price),
            actionType: ActivityType.LISTED,
            txHash: '',
            nft: {
              connect: {
                id: data.nftId,
              },
            },
            seller: {
              connect: {
                id: userId,
              },
            },
          },
        });

        return newListing;
      }
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async cancelListing(userId: string, data: ListingDto) {
    const order = await this.web3Service.cancelListing(data);
    if (order.error !== '') {
      this.logger.error(order.error);
      throw new HttpException(order.error, HttpStatus.BAD_REQUEST);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (user.walletAddress !== order.orderParameters.offerer)
      throw new HttpException(
        'Invalid Transaction Sender',
        HttpStatus.EXPECTATION_FAILED,
      );

    try {
      const updatedListing = await this.prismaService.listing.update({
        where: {
          id: data.id,
        },
        data: {
          status: ListingStatus.INACTIVE,
        },
      });

      await this.prismaService.activity.create({
        data: {
          id: this.generatorService.uuid(),
          // @ts-ignore
          price: String(order.orderParameters.offer[0].startAmount),
          actionType: ActivityType.UNLISTED,
          txHash: data.txHash,
          nft: {
            connect: {
              id: data.nftId,
            },
          },
          seller: {
            connect: {
              id: userId,
            },
          },
        },
      });

      return updatedListing;
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async buyListing(userId: string, data: ListingDto) {
    const result = await this.web3Service.buyListing(data);
    if (result.error !== '') {
      this.logger.error(result.error);
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (user.walletAddress !== result.orderParameters.recipient)
      throw new HttpException(
        'Invalid Transaction Sender',
        HttpStatus.EXPECTATION_FAILED,
      );

    try {
      const updatedListing = await this.prismaService.listing.update({
        where: {
          id: data.id,
        },
        data: {
          status: ListingStatus.SOLD,
        },
      });

      await this.prismaService.nFT.update({
        where: {
          id: data.nftId,
        },
        data: {
          ownerId: userId,
        },
      });

      await this.prismaService.activity.create({
        data: {
          id: this.generatorService.uuid(),
          // @ts-ignore
          price: String(result.orderParameters.consideration[0].amount),
          actionType: ActivityType.SOLD,
          txHash: data.txHash,
          nft: {
            connect: {
              id: data.nftId,
            },
          },
          seller: {
            connect: {
              id: userId,
            },
          },
        },
      });

      return updatedListing;
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
