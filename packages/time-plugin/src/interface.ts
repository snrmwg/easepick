import { DateTime } from '@easepick/datetime';
import { IBaseConfig } from '@easepick/base-plugin';

export interface ITimeConfig extends IBaseConfig {
  native?: boolean;
  seconds?: boolean;
  stepHours?: number;
  stepMinutes?: number;
  stepSeconds?: number;
  format12?: boolean;
}
