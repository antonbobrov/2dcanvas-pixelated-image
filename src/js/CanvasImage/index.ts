import {
  Ctx2D,
  Ctx2DPrerender,
  Timeline,
  spreadScope,
  clampScope,
} from '@anton.bobrov/vevet-init';
import { IAddEventListener, addEventListener } from 'vevet-dom';
import { IProps, ISeed, ISeedCords } from './types';

export class CanvasImage {
  get props() {
    return this._props;
  }

  get container() {
    return this.props.container;
  }

  private get seedSize() {
    return this.props.seed ?? 10;
  }

  private get kind() {
    return this.props.kind ?? 'rect';
  }

  private _ctx2d: Ctx2D;

  private _prerender: Ctx2DPrerender;

  private _seeds: ISeed[] = [];

  private _hoverTimeline?: Timeline;

  private _listeners: IAddEventListener[] = [];

  private get seeds() {
    return this._seeds;
  }

  constructor(private _props: IProps) {
    const { container, image } = this.props;

    this._prerender = new Ctx2DPrerender({
      container,
      media: image,
      shouldAppend: false,
      hasResize: false,
      dpr: 1,
      width: 0,
      height: 0,
    });

    this._prerender.addCallback('prerender', () => this._updateSeed());

    this._ctx2d = new Ctx2D(
      {
        container,
        shouldAppend: true,
        hasResize: true,
        // dpr: 'auto',
        dpr: 1,
      },
      false
    );

    this._ctx2d.addCallback('resize', () => {
      this._prerender.changeProps({
        width: this._ctx2d.width,
        height: this._ctx2d.height,
      });

      this._render();
    });

    this._ctx2d.init();

    this._setEvents();
  }

  public _setEvents() {
    this._hoverTimeline = new Timeline({ duration: 1000 });

    this._hoverTimeline.addCallback('progress', ({ easing }) =>
      this._render(1 - easing)
    );

    this._listeners.push(
      addEventListener(this.container, 'mouseenter', () =>
        this._hoverTimeline?.play()
      )
    );

    this._listeners.push(
      addEventListener(this.container, 'mouseleave', () =>
        this._hoverTimeline?.reverse()
      )
    );
  }

  private _updateSeed() {
    const { width, height, ctx } = this._prerender;
    const { seedSize } = this;

    this._seeds = [];

    let xEnd = 0;
    while (xEnd < width) {
      const xStart = xEnd;
      xEnd = Math.min(width, xEnd + seedSize);

      let yEnd = 0;
      while (yEnd < height) {
        const yStart = yEnd;
        yEnd = Math.min(height, yEnd + seedSize);

        const seedCoords: ISeedCords = {
          x: xStart,
          y: yStart,
          width: xEnd - xStart,
          height: yEnd - yStart,
        };

        const { data: rgbas } = ctx.getImageData(
          seedCoords.x,
          seedCoords.y,
          seedCoords.width,
          seedCoords.height
        );

        let r = 0;
        let g = 0;
        let b = 0;

        for (let i = 0; i < rgbas.length; i += 4) {
          r += rgbas[i];
          g += rgbas[i + 1];
          b += rgbas[i + 2];
        }

        r /= rgbas.length / 4;
        g /= rgbas.length / 4;
        b /= rgbas.length / 4;

        this._seeds.push({
          ...seedCoords,
          rgb: [r, g, b],
        });
      }
    }

    this._seeds.sort(() => Math.random() - 0.5);
  }

  private _render(progress = 1) {
    const { canRender, width, height, ctx } = this._ctx2d;
    const { seeds, seedSize, kind } = this;

    if (!canRender) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this._prerender.canvas, 0, 0);

    const seedSpreadScopes = spreadScope(seeds.length, 0.9);

    seeds.forEach((seed, index) => {
      ctx.beginPath();

      const seedProgress = clampScope(progress, seedSpreadScopes[index]);

      if (kind === 'circle') {
        ctx.arc(
          seed.x + seedSize / 2,
          seed.y + seedSize / 2,
          seedSize * 0.75 * seedProgress,
          0,
          Math.PI * 2,
          true
        );

        ctx.fillStyle = `rgb(${seed.rgb[0]}, ${seed.rgb[1]}, ${seed.rgb[2]})`;
      } else if (kind === 'rect') {
        ctx.rect(seed.x, seed.y, seed.width, seed.height);

        ctx.fillStyle = `rgba(${seed.rgb[0]}, ${seed.rgb[1]}, ${seed.rgb[2]}, ${seedProgress})`;
      }

      ctx.fill();

      ctx.closePath();
    });
  }

  public destroy() {
    this._ctx2d.destroy();
    this._prerender.destroy();

    this._hoverTimeline?.destroy();

    this._listeners.forEach((listener) => listener.remove());
  }
}
