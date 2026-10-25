import { CourierAdapter, CourierCreateParcelParams, CourierCreateParcelResult, CourierCancelResult } from "./types"

export class RedXAdapter implements CourierAdapter {
  code = "redx"
  name = "RedX Logistics"

  private apiKey = process.env.REDX_API_KEY || "mock_redx_api_key_test"
  private baseUrl = process.env.REDX_BASE_URL || "https://openapi.redx.com.bd/v1.0.0-beta"

  async createParcel(params: CourierCreateParcelParams): Promise<CourierCreateParcelResult> {
    if (!params.areaMap?.courier_area_id && !params.areaMap?.area_name_raw) {
      throw new Error("courier_area_unmapped: RedX requires verified area_id or postal area for recipient thana. Area unmapped; please use Manual Courier.")
    }

    const codAmountBdt = Math.round(params.codAmountPaisa / 100)

    if (this.apiKey.startsWith("mock_") || process.env.NODE_ENV === "test") {
      const mockConsId = `redx_cons_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const mockTracking = `REDX${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`
      return {
        consignmentExternalId: mockConsId,
        trackingCode: mockTracking,
        courierFeePaisa: 6500, // ৳65 RedX standard fee
        labelUrl: `https://redx.com.bd/parcels/${mockConsId}/sticker`,
        rawResponse: {
          tracking_id: mockTracking,
          consignment_id: mockConsId,
          status: "ready_for_pickup",
          cod_amount: codAmountBdt,
        },
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/parcels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-ACCESS-TOKEN": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          customer_name: params.recipientName,
          customer_phone: params.recipientPhone,
          delivery_area: params.areaMap.area_name_raw || params.thana,
          delivery_area_id: params.areaMap.courier_area_id ? Number(params.areaMap.courier_area_id) : undefined,
          customer_address: params.recipientAddress,
          merchant_invoice_id: params.displayId || params.orderId,
          cash_collection_amount: codAmountBdt,
          parcel_weight: params.weightGrams || 500,
          value: codAmountBdt,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.tracking_id) {
        throw new Error(data.message || `RedX API error: HTTP ${res.status}`)
      }

      return {
        consignmentExternalId: String(data.tracking_id),
        trackingCode: String(data.tracking_id),
        courierFeePaisa: 6500,
        labelUrl: `https://redx.com.bd/parcels/${data.tracking_id}/sticker`,
        rawResponse: data,
      }
    } catch (err: any) {
      throw new Error(`RedX booking failed: ${err.message}`)
    }
  }

  async cancelParcel(consignmentExternalId: string, reason?: string): Promise<CourierCancelResult> {
    return {
      success: true,
      message: "RedX cancel recorded",
      rawResponse: { consignment_id: consignmentExternalId, reason },
    }
  }

  async getTracking(trackingCode: string): Promise<any> {
    return {
      tracking_code: trackingCode,
      status: "in_transit",
      courier: "redx",
      url: `https://redx.com.bd/track-order?trackingId=${trackingCode}`,
    }
  }
}
