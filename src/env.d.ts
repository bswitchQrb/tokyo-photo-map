/// <reference types="@rsbuild/core/types" />

declare module '*.geojson.json' {
  const value: import('geojson').FeatureCollection;
  export default value;
}
