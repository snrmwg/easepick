import { DateTime } from '@easepick/datetime';
import { IBaseConfig } from '@easepick/base-plugin';

export interface IRangeConfig extends IBaseConfig {
  elementEnd?: HTMLElement | string;
  startDate?: DateTime;
  endDate?: DateTime;
  repick?: boolean;
  strict?: boolean;
  delimiter?: string;
  tooltip?: boolean;
  tooltipNumber?: (num: number) => number;
  locale?: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other?: string;
  }
  documentClick?: boolean | (() => void);
}
