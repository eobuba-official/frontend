import type { Branch } from '@/api/types'

// FALLBACK: used by BranchExploreView only if GET /branches/nearby errors out (the
// endpoint itself is live now). Positions are offsets from wherever the viewer
// actually is, not fixed real addresses, so the demo always shows pins near the
// current user instead of only working in central Seoul.

interface MockBranchTemplate {
  branchId: number
  name: string
  phone: string
  offsetKm: { lat: number; lng: number }
}

const MOCK_BRANCH_TEMPLATES: MockBranchTemplate[] = [
  { branchId: 1001, name: 'KB국민은행 1호점', phone: '02-1588-9999', offsetKm: { lat: 0.25, lng: 0.15 } },
  { branchId: 1002, name: 'KB국민은행 2호점', phone: '02-1588-9999', offsetKm: { lat: -0.1, lng: 0.35 } },
  { branchId: 1003, name: 'KB국민은행 3호점', phone: '02-1588-9999', offsetKm: { lat: 0.4, lng: -0.2 } },
  { branchId: 1004, name: 'KB국민은행 4호점', phone: '02-1588-9999', offsetKm: { lat: -0.35, lng: -0.15 } },
  { branchId: 1005, name: 'KB국민은행 5호점', phone: '02-1588-9999', offsetKm: { lat: 0.6, lng: 0.3 } },
  { branchId: 1006, name: 'KB국민은행 6호점', phone: '02-1588-9999', offsetKm: { lat: -0.5, lng: 0.4 } },
  { branchId: 1007, name: 'KB국민은행 7호점', phone: '02-1588-9999', offsetKm: { lat: 0.15, lng: -0.5 } },
  { branchId: 1008, name: 'KB국민은행 8호점', phone: '02-1588-9999', offsetKm: { lat: -0.2, lng: -0.55 } },
]

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

const KM_PER_DEGREE_LAT = 111

export function buildMockBranchesNear(origin: { lat: number; lng: number }): Branch[] {
  const kmPerDegreeLng = KM_PER_DEGREE_LAT * Math.cos(toRad(origin.lat))

  return MOCK_BRANCH_TEMPLATES.map((template) => ({
    branchId: template.branchId,
    name: template.name,
    // real branches have a real address in the DB (BranchResponse.address) — these
    // mock positions are arbitrary offsets with no matching street address, so this
    // is just filler text; a real API call replaces it with the actual address as-is
    address: 'KB국민은행 인근 지점',
    phone: template.phone,
    lat: origin.lat + template.offsetKm.lat / KM_PER_DEGREE_LAT,
    lng: origin.lng + template.offsetKm.lng / kmPerDegreeLng,
    distanceKm: null,
  }))
}
