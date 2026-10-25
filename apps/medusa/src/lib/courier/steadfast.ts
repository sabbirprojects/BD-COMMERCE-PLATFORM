import { CourierAdapter, CourierCreateParcelParams, CourierCreateParcelResult, CourierCancelResult } from "./types"

export class SteadfastAdapter implements CourierAdapter {
  code = "steadfast"
  name = "Steadfast Courier"

  private apiKey = process.env.STEADFAST_API_KEY || "mock_sf_api_key_test"
  private secretKey = process.env.STEADFAST_SECRET_KEY || "mock_sf_secret_test"
  private baseUrl = process.env.STEADFAST_BASE_URL || "https://api.steadfast.com.bd/v1"

  async createParcel(params: CourierCreateParcelParams): Promise<CourierCreateParcelResult> {
    const codAmountBdt = Math.round(params.codAmountPaisa / 100)

    // Check if real API call should be executed or mocked
    if (this.apiKey.startsWith("mock_") || process.env.NODE_ENV === "test") {
      const mockId = `sf_cons_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const mockTracking = `STDF${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`
      return {
        consignmentExternalId: mockId,
        trackingCode: mockTracking,
        courierFeePaisa: 6000, // ৳60 standard quoted fee
        labelUrl: `https://steadfast.com.bd/labels/${mockTracking}.pdf`,
        rawResponse: {
          status: 200,
          message: "Consignment created successfully (mock sandbox)",
          consignment: {
            consignment_id: mockId,
            tracking_code: mockTracking,
            invoice: params.displayId,
            recipient_name: params.recipientName,
            recipient_phone: params.recipientPhone,
            recipient_address: params.recipientAddress,
            cod_amount: codAmountBdt,
            status: "in_review",
          },
        },
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/create_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
          "Secret-Key": this.secretKey,
        },
        body: JSON.stringify({
          invoice: String(params.displayId || params.orderId),
          recipient_name: params.recipientName,
          recipient_phone: params.recipientPhone,
          recipient_address: params.recipientAddress,
          cod_amount: codAmountBdt,
          note: params.notes || "Handle with care",
        }),
      })

      const data = await res.json()
      if (!res.ok || data.status !== 200) {
        throw new Error(data.message || `Steadfast API error: HTTP ${res.status}`)
      }

      return {
        consignmentExternalId: String(data.consignment?.consignment_id),
        trackingCode: String(data.consignment?.tracking_code),
        courierFeePaisa: 6000,
        labelUrl: `https://steadfast.com.bd/labels/${data.consignment?.tracking_code}.pdf`,
        rawResponse: data,
      }
    } catch (err: any) {
      throw new Error(`Steadfast booking failed: ${err.message}`)
    }
  }

  async cancelParcel(consignmentExternalId: string, reason?: string): Promise<CourierCancelResult> {
    if (this.apiKey.startsWith("mock_") || process.env.NODE_ENV === "test") {
      return {
        success: true,
        message: "Consignment canceled successfully (mock sandbox)",
        rawResponse: { status: 200, consignment_id: consignmentExternalId, reason },
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/cancel_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
          "Secret-Key": this.secretKey,
        },
        body: JSON.stringify({
          consignment_id: consignmentExternalId,
          reason: reason || "Customer canceled order",
        }),
      })
      const data = await res.json()
      return {
        success: res.ok && data.status === 200,
        message: data.message,
        rawResponse: data,
      }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  async getTracking(trackingCode: string): Promise<any> {
    return {
      tracking_code: trackingCode,
      status: "in_transit",
      courier: "steadfast",
      url: `https://steadfast.com.bd/t/${trackingCode}`,
    }
  }
}
