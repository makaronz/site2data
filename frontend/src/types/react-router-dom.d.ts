import * as React from 'react';
import { RouteProps, RoutesProps } from 'react-router-dom';

declare module 'react-router-dom' {
  // Nadpisujemy problematyczne typy
  export function Routes(props: RoutesProps): React.ReactElement;
  export function Route(props: RouteProps): React.ReactElement;
} 