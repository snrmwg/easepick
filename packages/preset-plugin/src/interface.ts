import { IBaseConfig } from '@easepick/base-plugin';

export interface IPresetConfig extends IBaseConfig {
  customPreset?: Record<string, unknown>;
  customLabels?: string[];
  position?: string;
}
