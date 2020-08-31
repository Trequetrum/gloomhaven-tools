import { ImgIcon } from './img-icon';

export interface ClassData {
  title: string;
  race: string;
  handSize: number;
  healthType: 'high' | 'mid' | 'low';
  description: string;
  abilitiesrange: [number, number];
  perks: [
    {
      description: string;
      count?: number;
    }
  ];
  icon: ImgIcon;
}
