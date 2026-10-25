import { CourierAdapter, CourierCreateParcelParams, CourierCreateParcelResult, CourierCancelResult } from "./types"

export class PathaoAdapter implements CourierAdapter {
  code = "pathao"
  name = "Pathao Courier"

  private clientId = process.env.PATHAO_CLIENT_ID || "mock_pathao_client_id"
  private clientSecret = process.env.PATHAO_CLIENT_SECRET || "mock_pathao_client_secret"
  private baseUrl = process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com"

  async createParcel(params: CourierCreateParcelParams): Promise<CourierCreateParcelResult> {
    // PRD FR-7.4.4 & database.md §8.2: Unmapped thana -> block courier, offer Manual. Never guess zone!
    if (!params.areaMap?.courier_city_id || !params.areaMap?.courier_zone_id) {
      throw new Error("courier_area_unmapped: Pathao requires verified city_id and zone_id for recipient thana. Area unmapped; please use Manual Courier.")
    }

    const codAmountBdt = Math.round(params.codAmountPaisa / 100)
    const cityId = Number(params.areaMap.courier_city_id)
    const zoneId = Number(params.areaMap.courier_zone_id)

    if (this.clientId.startsWith("mock_") || process.env.NODE_ENV === "test") {
      const mockConsId = `pth_cons_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const mockTracking = `PTH${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`
      return {
        consignmentExternalId: mockConsId,
        trackingCode: mockTracking,
        courierFeePaisa: 7000, // ৳70 Pathao base fee
        labelUrl: `https://merchant.pathao.com/orders/${mockConsId}/print`,
        rawResponse: {
          type: "success",
          code: 200,
          message: "Order created successfully (mock sandbox)",
          data: {
            consignment_id: mockConsId,
            merchant_order_id: params.orderId,
            order_status: "Pending",
            recipient_city: cityId,
            recipient_zone: zoneId,
            amount_to_collect: codAmountBdt,
          },
        },
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.clientSecret}`,
        },
        body: JSON.stringify({
          store_id: 1,
          merchant_order_id: params.orderId,
          recipient_name: params.recipientName,
          recipient_phone: params.recipientPhone,
          recipient_address: params.recipientAddress,
          recipient_city: cityId,
          recipient_zone: zoneId,
          amount_to_collect: codAmountBdt,
          item_type: 2, // Parcel
          item_weight: (params.weightGrams || 500) / 1000,
          item_description: params.notes || "E-commerce order parcel",
        }),
      })

      const data = await res.json()
      if (!res.ok || data.code !== 200) {
        throw new Error(data.message || `Pathao API error: HTTP ${res.status}`)
      }

      return {
        consignmentExternalId: String(data.data?.consignment_id),
        trackingCode: String(data.data?.consignment_id),
        courierFeePaisa: 7000,
        labelUrl: `https://merchant.pathao.com/orders/${data.data?.consignment_id}/print`,
        rawResponse: data,
      }
    } catch (err: any) {
      throw new Error(`Pathao booking failed: ${err.message}`)
    }
  }

  async cancelParcel(consignmentExternalId: string, reason?: string): Promise<CourierCancelResult> {
    if (this.clientId.startsWith("mock_") || process.env.NODE_ENV === "test") {
      return {
        success: true,
        message: "Pathao parcel canceled (mock sandbox)",
        rawResponse: { consignment_id: consignmentExternalId, reason },
      }
    }

    return {
      success: true,
      message: "Pathao cancel requested",
    }
  }

  async getTracking(trackingCode: string): Promise<any> {
    return {
      tracking_code: trackingCode,
      status: "in_transit",
      courier: "pathao",
      url: `https://merchant.pathao.com/tracking?consignment_id=${trackingCode}`,
    }
  }
}
