import sharpService from "astro/assets/services/sharp";

/**
 * Delivery encoder for article images.
 *
 * Source files stay untouched. Astro resizes to the reading column and
 * emits WebP. Each variant is encoded twice: lossless WebP, and WebP at
 * quality 82. The smaller buffer ships. Diagrams often stay lossless.
 * Photographs stay sharp at quality 82 instead of growing past the source.
 */
const service = {
  ...sharpService,
  validateOptions(...args) {
    const validated = sharpService.validateOptions(...args);
    if (validated && validated.quality == null) {
      validated.quality = 82;
    }
    return validated;
  },
  async transform(inputBuffer, transform, config, logger) {
    const lossless = await encode(inputBuffer, transform, config, logger, true);
    const compact = await encode(inputBuffer, transform, config, logger, false);
    return byteLength(lossless.data) <= byteLength(compact.data)
      ? lossless
      : compact;
  },
};

async function encode(inputBuffer, transform, config, logger, lossless) {
  const serviceConfig = config.service?.config ?? {};
  const nextConfig = {
    ...config,
    service: {
      ...config.service,
      config: {
        ...serviceConfig,
        webp: lossless
          ? { lossless: true, effort: 6, smartSubsample: true }
          : { quality: 82, effort: 6, smartSubsample: true },
      },
    },
  };

  return sharpService.transform(
    inputBuffer,
    { ...transform, quality: lossless ? undefined : 82 },
    nextConfig,
    logger,
  );
}

function byteLength(data) {
  return data?.byteLength ?? data?.length ?? Number.POSITIVE_INFINITY;
}

export default service;
