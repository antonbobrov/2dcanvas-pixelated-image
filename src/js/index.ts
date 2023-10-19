import '../styles/index.scss';
import { vevet } from '@anton.bobrov/vevet-init';
import { CanvasImage } from './CanvasImage';

// @ts-ignore
window.vevetAppInit = vevet;

const containers = document.querySelectorAll('.image-container');
containers.forEach((container) => {
  if (container instanceof HTMLElement) {
    const src = container.getAttribute('data-src');
    const kind = container.getAttribute('data-kind');
    const seed = container.getAttribute('data-seed');

    if (!src) {
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const canvas = new CanvasImage({
        container,
        image,
        kind: (kind as any) || undefined,
        seed: seed ? parseInt(seed, 10) || undefined : undefined,
      });
    };

    image.src = src;
  }
});
