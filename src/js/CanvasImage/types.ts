export interface IProps {
  container: HTMLElement;
  image: HTMLImageElement;
  kind?: 'rect' | 'circle';
  seed?: number;
}

export interface ISeedCords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ISeed extends ISeedCords {
  rgb: [number, number, number];
}
