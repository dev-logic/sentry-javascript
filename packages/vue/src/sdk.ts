import { buildMetadata, init as browserInit } from '@sentry/browser';
import { getGlobalObject, logger } from '@sentry/utils';

import { DEFAULT_HOOKS } from './constants';
import { attachErrorHandler } from './errorhandler';
import { createTracingMixins } from './tracing';
import { Options, TracingOptions, Vue } from './types';

const PACKAGE_NAME = 'vue';

const DEFAULT_CONFIG: Options = {
  Vue: getGlobalObject<{ Vue: Vue }>().Vue,
  attachProps: true,
  logErrors: false,
  hooks: DEFAULT_HOOKS,
  timeout: 2000,
  trackComponents: false,
};

/**
 * Inits the Vue SDK
 */
export function init(
  config: Partial<Omit<Options, 'tracingOptions'> & { tracingOptions: Partial<TracingOptions> }> = {},
): void {
  const options = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  buildMetadata(options, PACKAGE_NAME, [PACKAGE_NAME]);

  browserInit(options);

  if (!options.Vue && !options.app) {
    logger.warn(
      'Misconfigured SDK. Vue specific errors will not be captured.\n' +
        'Update your `Sentry.init` call with an appropriate config option:\n' +
        '`app` (Application Instance - Vue 3) or `Vue` (Vue Constructor - Vue 2).',
    );
    return;
  }

  if (options.Vue) {
    vueInit(options.Vue, options);
  } else if (options.app) {
    const apps = Array.isArray(options.app) ? options.app : [options.app];
    apps.forEach(app => vueInit(app, options));
  }
}

const vueInit = (app: Vue, options: Options): void => {
  attachErrorHandler(app, options);

  if ('tracesSampleRate' in options || 'tracesSampler' in options) {
    app.mixin(
      createTracingMixins({
        ...options,
        ...options.tracingOptions,
      }),
    );
  }
};
