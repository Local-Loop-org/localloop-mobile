// src/shared/theme/applyDefaultFont.ts
//
// Applies Space Grotesk as the app-wide default font family from a single call,
// without editing every component. React 19 deprecates `Text.defaultProps`, so
// we patch the forwardRef `render` of `Text`/`TextInput` to inject a base
// `fontFamily` BEHIND any style the component already sets — so a component that
// explicitly uses `fonts.mono` (JetBrains Mono) still wins.
//
// This is a Phase-1 stopgap. Phase 2 introduces a themed `Text` primitive and
// the full per-component type scale; this patch can then be removed.

import React from 'react';
import { Text, TextInput } from 'react-native';
import { fonts } from './index';

type StyledElement = React.ReactElement<{ style?: unknown }>;

interface Patchable {
  render?: (...args: unknown[]) => StyledElement;
  __localloopFontPatched?: boolean;
}

function patch(Component: unknown, fontFamily: string): void {
  const target = Component as Patchable;
  const original = target.render;
  if (typeof original !== 'function' || target.__localloopFontPatched) return;

  target.render = function patchedRender(...args: unknown[]): StyledElement {
    const element = original.apply(this, args);
    return React.cloneElement(element, {
      style: [{ fontFamily }, element.props.style],
    });
  };
  target.__localloopFontPatched = true;
}

export function applyDefaultFont(): void {
  patch(Text, fonts.display);
  patch(TextInput, fonts.display);
}
