import * as React from 'react';

type ModelViewerElementProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: string;
  'ar-placement'?: 'floor' | 'wall';
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  'auto-rotate-delay'?: number;
  'rotation-per-second'?: string;
  'interaction-prompt'?: string;
  'interaction-prompt-threshold'?: number;
  'shadow-intensity'?: string;
  'shadow-softness'?: string;
  exposure?: string;
  loading?: string;
  reveal?: string;
  poster?: string;
  orientation?: string;
  scale?: string;
  'camera-orbit'?: string;
  'field-of-view'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'min-field-of-view'?: string;
  'max-field-of-view'?: string;
  'environment-image'?: string;
  'skybox-image'?: string;
  'tone-mapping'?: string;
  'draco-decoder-config'?: string;
  'xr-environment'?: boolean;
  onLoad?: () => void;
  onError?: (e: Event) => void;
  onArStatus?: (e: CustomEvent) => void;
}, HTMLElement>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElementProps;
    }
  }
}

export {};
