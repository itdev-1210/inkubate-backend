import { BigNumber, utils } from 'ethers';

export const checkSum = (input: string): string => {
  return utils.getAddress(input);
};

export const bigNumber = BigNumber.from;

export const bigNumberToHex = (v: unknown): string => bigNumber(v)._hex;

export const bigNumberToString = (v: unknown): string =>
  bigNumber(v).toString();

export const bigNumberToNumber = (v: unknown): number => Number(bigNumber(v));

export const resolveIpfs = (url: string) => {
  const ipfsPrefix = 'ipfs://';
  const ipfs2 = 'ipfs//';
  const pintaPrefix = 'https://gateway.pinata.cloud/ipfs/';
  const patternipfs = new RegExp('^' + ipfsPrefix);
  const ipfstest = patternipfs.test(url);
  const pattern = new RegExp('^' + pintaPrefix);
  const pattern3 = new RegExp('^' + ipfs2);
  const hasPrefix3 = pattern3.test(url);
  const hasPrefix = pattern.test(url);
  const pattern1 = new RegExp('^' + 'https://ipfs.io/ipfs/');
  const hasPrefix1 = pattern1.test(url);
  if (hasPrefix3) {
    return url.replace(pattern3, 'https://gateway.ipfs.io/ipfs/');
  } else if (ipfstest) {
    return url.replace(patternipfs, 'https://gateway.ipfs.io/ipfs/');
  } else if (hasPrefix) {
    return url.replace(pattern, 'https://gateway.ipfs.io/ipfs/');
  } else if (hasPrefix1)
    return url.replace(pattern1, 'https://gateway.ipfs.io/ipfs/');
  else return url;
};
