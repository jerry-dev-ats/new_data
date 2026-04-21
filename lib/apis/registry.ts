import type { ApiConfig } from './types';
import { consumerRecalls } from './definitions/consumer-recalls';
import { foodsafetyKoreaApis } from './definitions/foodsafety-korea';
import { haccpApis } from './definitions/haccp';
import { mfdsApis } from './definitions/mfds';

export const API_REGISTRY: ApiConfig[] = [
  ...consumerRecalls,
  ...foodsafetyKoreaApis,
  ...haccpApis,
  ...mfdsApis,
];

export const getApiById = (id: string): ApiConfig | undefined =>
  API_REGISTRY.find((a) => a.id === id);

export const DEFAULT_PAGE_SIZE = 20;
