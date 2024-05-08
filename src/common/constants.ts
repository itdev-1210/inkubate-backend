import { Network } from '@prisma/client';

export const networks: Record<
  Network,
  {
    chainId: number;
    url: string;
  }
> = {
  BNB: {
    chainId: 56,
    url: '',
  },
  MAIN: {
    chainId: 1,
    url: '',
  },
  RYOSHI: {
    chainId: 117722,
    url: '',
  },
};
