import type { ApiConfig } from './types';
import { airKoreaApis } from './definitions/airkorea';
import { consumerRecalls } from './definitions/consumer-recalls';
import { foodsafetyKoreaApis } from './definitions/foodsafety-korea';
import { haccpApis } from './definitions/haccp';
import { infectiousDiseaseApis } from './definitions/infectious-disease';
import { livingWeatherApis } from './definitions/living-weather';
import { mfdsApis } from './definitions/mfds';

export const API_REGISTRY: ApiConfig[] = [
  ...airKoreaApis,
  ...consumerRecalls,
  ...foodsafetyKoreaApis,
  ...haccpApis,
  ...infectiousDiseaseApis,
  ...livingWeatherApis,
  ...mfdsApis,
];

export const getApiById = (id: string): ApiConfig | undefined =>
  API_REGISTRY.find((a) => a.id === id);

export const DEFAULT_PAGE_SIZE = 20;
