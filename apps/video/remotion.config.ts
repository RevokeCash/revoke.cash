import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setEntryPoint('src/index.ts');
Config.overrideWebpackConfig((currentConfiguration) => enableTailwind(currentConfiguration));
