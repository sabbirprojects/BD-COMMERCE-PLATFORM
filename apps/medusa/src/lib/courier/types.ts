export interface CourierCreateParcelParams {
  orderId: string
  displayId: string | number
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  division: string
  district: string
  thana: string
  codAmountPaisa: number
  weightGrams?: number
  notes?: string
  areaMap?: {
    courier_city_id?: string | null
    courier_zone_id?: string | null
    courier_area_id?: string | null
    area_name_raw?: string | null
  } | null
}

export interface CourierCreateParcelResult {
  consignmentExternalId: string
  trackingCode: string
  courierFeePaisa?: number
  labelUrl?: string
  rawResponse?: any
}

export interface CourierCancelResult {
  success: boolean
  message?: string
  rawResponse?: any
}

export interface CourierAdapter {
  code: string
  name: string
  createParcel(params: CourierCreateParcelParams): Promise<CourierCreateParcelResult>
  cancelParcel(consignmentExternalId: string, reason?: string): Promise<CourierCancelResult>
  getTracking(trackingCode: string): Promise<any>
}

export interface AreaResolutionResult {
  mapped: boolean
  courier_city_id?: string | null
  courier_zone_id?: string | null
  courier_area_id?: string | null
  area_name_raw?: string | null
  source?: "direct" | "alias" | "district_fallback" | "unmapped"
}
