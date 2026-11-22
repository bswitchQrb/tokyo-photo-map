/**
 * 地図（SVG）の配色。SVG 属性に直接渡すため CSS 変数ではなくここで管理する。
 * UI 側の配色は App.css の :root を参照。値は「旅の記録帳」のパレットに合わせている。
 */
export const mapColors = {
  municipality: '#fffaf0', // 生成りの紙
  municipalityHover: '#f3e6cc',
  visited: '#d9694c', // 朱肉
  visitedHover: '#c4553a',
  stroke: '#c9b79a', // 市区の境目（鉛筆の薄い線）
  strokeActive: '#3d3128',
  border: '#5b4636', // 23区と市部の境目（インク）
  borderWidth: 1.6,
  strokeWidth: 0.7,
  strokeWidthActive: 1.6,
};
