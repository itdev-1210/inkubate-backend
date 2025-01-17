/* eslint-disable @typescript-eslint/no-unused-vars */
// nft.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ActivityType, ContractType, NFT, Prisma } from '@prisma/client';

import { GeneratorService, Web3Service } from '@common/providers';
import { PaginationParams } from '@common/dto/pagenation-params.dto';
import { SearchParams } from '@common/dto/search-params.dto';
import {
  CollectionSortByOption,
  SortParams,
} from '@common/dto/sort-params.dto';
import {
  FilterParams,
  UserFilterByOption,
} from '@common/dto/filter-params.dto';
import { CreateNftDto } from '../dto/create-nft.dto';
import { GetNftDto } from '../dto/get-nft.dto';

@Injectable()
export class NftService {
  private logger = new Logger(NftService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly web3Service: Web3Service,
    private generatorService: GeneratorService,
  ) {}

  async getNft(data: GetNftDto) {
    const nft = await this.prismaService.nFT.findFirst({
      where: data,
      include: {
        collection: true,
        owner: true,
      },
    });

    let activites = [];

    if (nft)
      activites = await this.prismaService.activity.findMany({
        where: {
          nftId: nft.id,
        },
      });

    return {
      ...nft,
      activites: activites,
    };
  }

  async getNfts(args: Prisma.NFTFindManyArgs): Promise<NFT[]> {
    return this.prismaService.nFT.findMany({
      ...args,
      include: {
        collection: true,
        owner: true,
      },
    });
  }

  async getNftsByCollection(
    collectionId: string,
    { sortAscending, sortBy }: SortParams,
    { contains }: SearchParams,
    { limit = 20, startId = 1 }: PaginationParams,
  ) {
    const offset = (startId - 1) * limit;
    const nfts = await this.prismaService.nFT.findMany({
      where: {
        collectionId,
        name: { contains: contains ? contains.slice(0, 2) : undefined },
      },
      include: {
        owner: true,
        collection: true,
      },
      take: limit,
      skip: offset,
    });
    return {
      nfts: nfts,
      nextId: nfts.length > 0 && nfts.length >= limit ? startId + 1 : null,
      previousId: startId <= 1 ? 1 : startId - 1,
    };
    // const activitiesAll = await this.prismaService.activity.findMany({
    //   where: { nftId: { in: nfts.map((nft) => nft.id) } },
    // });

    // const soldActivities = activitiesAll.filter(
    //   (activity) => activity.actionType === ActivityType.SOLD,
    // );

    // const listingActivities = activitiesAll.filter(
    //   (activity) => activity.actionType === ActivityType.LISTED,
    // );

    // const offerActivities = activitiesAll.filter(
    //   (activity) => activity.actionType === ActivityType.CREATED_OFFER,
    // );

    // const order = sortAscending === 'asc' ? 1 : -1;
    // const start = startId * offset;
    // const end = limit ? startId * offset + limit : -1;

    // switch (sortBy) {
    //   case CollectionSortByOption.LISTING_DATE:
    //     return listingActivities
    //       .sort((a, b) => {
    //         if (a.createdAt < b.createdAt) {
    //           return order;
    //         } else if (a.createdAt > b.createdAt) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);

    //   case CollectionSortByOption.BEST_OFFER:
    //     return offerActivities
    //       .sort((a, b) => {
    //         if (a.price < b.price) {
    //           return order;
    //         } else if (a.price > b.price) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);

    //   case CollectionSortByOption.LAST_SALE_PRICE:
    //     return soldActivities
    //       .sort((a, b) => {
    //         if (a.price < b.price) {
    //           return order;
    //         } else if (a.price > b.price) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);

    //   case CollectionSortByOption.LAST_SALE_DATE:
    //     return soldActivities
    //       .sort((a, b) => {
    //         if (a.createdAt < b.createdAt) {
    //           return order;
    //         } else if (a.createdAt > b.createdAt) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);

    //   case CollectionSortByOption.CREATED_DATE:
    //     return nfts
    //       .sort((a, b) => {
    //         if (a.createdAt < b.createdAt) {
    //           return order;
    //         } else if (a.createdAt > b.createdAt) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);

    //   case CollectionSortByOption.FAVORITE_COUNT:
    //     break;

    //   case CollectionSortByOption.EXPIRATION_DATE:
    //     return listingActivities
    //       .sort((a, b) => {
    //         if (a.createdAt < b.createdAt) {
    //           return order;
    //         } else if (a.createdAt > b.createdAt) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);

    //   default:
    //     console.log(listingActivities);
    //     return listingActivities
    //       .sort((a, b) => {
    //         if (a.price < b.price) {
    //           return order;
    //         } else if (a.price > b.price) {
    //           return order * -1;
    //         }
    //         return 0;
    //       })
    //       .slice(start, end);
    // }
  }

  async getNftsByUser(
    userId: string,
    { sortAscending, sortBy }: SortParams,
    { contains }: SearchParams,
    { filterBy }: FilterParams,
    { limit = 20, startId = 1 }: PaginationParams,
  ) {
    const offset = (startId - 1) * limit;
    const order = sortAscending === 'asc' ? 'asc' : 'desc';

    const commonWhere = {
      name: contains ? { contains: contains.slice(0, 2) } : undefined,
      hides: {
        none: {},
      },
    };

    let args = {};

    switch (sortBy) {
      case CollectionSortByOption.LISTING_DATE:
        args = {
          orderBy: undefined,
          include: {
            hides: {
              where: {
                userId,
              },
            },
            listing: {
              orderBy: {
                createAt: order,
              },
            },
            owner: true,
            collection: true,
          },
        };
      case CollectionSortByOption.BEST_OFFER:
        args = {
          orderBy: undefined,
          include: {
            hides: {
              where: {
                userId,
              },
            },
            offers: {
              orderBy: {
                offerPrice: order,
              },
            },
            owner: true,
            collection: true,
          },
        };
      case CollectionSortByOption.LAST_SALE_PRICE:
        args = {
          orderBy: undefined,
          include: {
            hides: {
              where: {
                userId,
              },
            },
            activities: {
              where: {
                actionType: ActivityType.SOLD,
              },
              orderBy: {
                price: order,
              },
            },
            owner: true,
            collection: true,
          },
        };
      case CollectionSortByOption.LAST_SALE_DATE:
        args = {
          orderBy: undefined,
          include: {
            hides: {
              where: {
                userId,
              },
            },
            activities: {
              where: {
                actionType: ActivityType.SOLD,
              },
              orderBy: {
                createAt: order,
              },
            },
            owner: true,
            collection: true,
          },
        };
      case CollectionSortByOption.CREATED_DATE:
        args = {
          orderBy: {
            createAt: order,
          },
          include: {
            hides: {
              where: {
                userId,
              },
            },
            owner: true,
          },
        };
      case CollectionSortByOption.FAVORITE_COUNT:
        args = {
          orderBy: {
            likes: {
              _count: order,
            },
          },
          include: {
            hides: {
              where: {
                userId,
              },
            },
            owner: true,
            collection: true,
          },
        };
      case CollectionSortByOption.EXPIRATION_DATE:
        args = {
          orderBy: undefined,
          include: {
            hides: {
              where: {
                userId,
              },
            },
            listing: {
              orderBy: {
                endTime: order,
              },
            },
            owner: true,
            collection: true,
          },
        };
      default:
        args = {
          orderBy: undefined,
          include: {
            hides: {
              where: {
                userId,
              },
            },
            listing: {
              orderBy: {
                price: order,
              },
            },
            owner: true,
            collection: true,
          },
        };
    }

    switch (filterBy) {
      case UserFilterByOption.ERC721_NFTS:
        const nfts = await this.prismaService.nFT.findMany({
          where: {
            ...commonWhere,
            ownerId: userId,
            contractType: ContractType.ERC721,
          },
          skip: offset,
          take: limit,
          ...args,
        });
        return {
          nfts: nfts,
          nextId: nfts.length > 0 && nfts.length >= limit ? startId + 1 : null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
      case UserFilterByOption.ERC1155_NFTS:
        const ERC1155_NFTS = await this.prismaService.nFT.findMany({
          where: {
            ...commonWhere,
            ownerId: userId,
            contractType: ContractType.ERC1155,
          },
          skip: offset,
          take: limit,
          ...args,
        });
        return {
          nfts: ERC1155_NFTS,
          nextId:
            ERC1155_NFTS.length > 0 && ERC1155_NFTS.length >= limit
              ? startId + 1
              : null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
      case UserFilterByOption.CREATED:
        const CREATED = await this.prismaService.nFT.findMany({
          where: {
            ...commonWhere,
            minterId: userId,
          },
          skip: offset,
          take: limit,
          ...args,
        });
        return {
          nfts: CREATED,
          nextId:
            CREATED.length > 0 && CREATED.length >= limit ? startId + 1 : null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
      default:
        return {
          nfts: [],
          nextId: null,
          previousId: startId <= 1 ? 1 : startId - 1,
        };
    }
  }

  async createNft(userId: string, data: CreateNftDto): Promise<NFT[]> {
    const result = await this.web3Service.mintNft(data);
    if (result.error !== '') {
      this.logger.error(result.error);
      throw new HttpException(result.error, HttpStatus.EXPECTATION_FAILED);
    }

    try {
      const newNfts = await Promise.all(
        result.tokenDatas.map(
          async (tokenData) =>
            await this.prismaService.nFT.upsert({
              where: {
                id: `${String(
                  tokenData.tokenAddress,
                ).toLocaleLowerCase()}-${String(
                  tokenData.tokenId,
                ).toLocaleLowerCase()}`,
              },
              create: {
                id: `${String(
                  tokenData.tokenAddress,
                ).toLocaleLowerCase()}-${String(
                  tokenData.tokenId,
                ).toLocaleLowerCase()}`,
                collectionId: undefined,
                creatorId: undefined,
                tokenAddress: tokenData.tokenAddress,
                tokenId: tokenData.tokenId,
                tokenUri: tokenData.tokenUri,
                name: tokenData.metadata.name,
                image: tokenData.metadata.image,
                attributes: tokenData.metadata
                  .attributes as Prisma.InputJsonValue,
                royalty: 0,
                contractType: data.contractType,
                collection: {
                  connect: {
                    id: data.collectionId,
                  },
                },
                minter: {
                  connect: {
                    id: userId,
                  },
                },
                owner: {
                  connect: {
                    id: userId,
                  },
                },
              } as Omit<Prisma.NFTCreateInput, 'collectionId'>,
              update: {},
            }),
        ),
      );

      newNfts.map(async (nft) => {
        await this.prismaService.activity.create({
          data: {
            id: this.generatorService.uuid(),
            // @ts-ignore
            price: String(data.price),
            actionType: ActivityType.MINTED,
            txHash: data.txHash,
            nft: {
              connect: {
                id: nft.id,
              },
            },
            seller: {
              connect: {
                id: userId,
              },
            },
          },
        });
        this.logger.log(`New nft ${nft.id} is created`);
      });

      return newNfts;
    } catch (err) {
      console.log(err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
