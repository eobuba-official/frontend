import type { KakaoLatLng, KakaoMap, KakaoMapsNamespace, KakaoMarkerImage } from './kakaoMaps'

// default (unselected) marker: a plain circle, like Naver Map's location dots
function circleMarkerSrc() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8" fill="#e8443f" stroke="#ffffff" stroke-width="3"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// selected marker: a pointed teardrop pin, popped up larger so the tapped branch stands out
function pinMarkerSrc() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#e8443f"/><circle cx="15" cy="15" r="6.2" fill="#ffffff"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function branchMarkerImage(maps: KakaoMapsNamespace, isSelected: boolean): KakaoMarkerImage {
  if (isSelected) {
    return new maps.MarkerImage(pinMarkerSrc(), new maps.Size(30, 38), {
      offset: new maps.Point(15, 38),
    })
  }
  return new maps.MarkerImage(circleMarkerSrc(), new maps.Size(22, 22), {
    offset: new maps.Point(11, 11),
  })
}

export function myLocationMarkerImage(maps: KakaoMapsNamespace): KakaoMarkerImage {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="#2f6fed" stroke="#ffffff" stroke-width="3"/></svg>`
  return new maps.MarkerImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, new maps.Size(24, 24), {
    offset: new maps.Point(12, 12),
  })
}

// Pans (animated, via panTo) so `latlng` renders vertically centered between the top of
// the map viewport and a bottom sheet covering `sheetPx` of it — not the map container's
// true center. Uses pixel<->latlng projection math instead of panBy so the direction is
// never ambiguous: the target is placed sheetPx/2 above whatever ends up as the new true
// center.
export function centerAboveSheet(map: KakaoMap, maps: KakaoMapsNamespace, latlng: KakaoLatLng, sheetPx: number) {
  const projection = map.getProjection()
  const point = projection.pointFromCoords(latlng)
  const shiftedPoint = new maps.Point(point.x, point.y + sheetPx / 2)
  map.panTo(projection.coordsFromPoint(shiftedPoint))
}
