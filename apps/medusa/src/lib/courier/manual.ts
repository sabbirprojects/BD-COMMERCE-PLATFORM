import { CourierAdapter, CourierCreateParcelParams, CourierCreateParcelResult, CourierCancelResult } from "./types"

export class ManualCourierAdapter implements CourierAdapter {
  code = "manual"
  name = "Manual / In-House Courier"

  async createParcel(params: CourierCreateParcelParams): Promise<CourierCreateParcelResult> {
    const manualConsId = `man_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const trackingCode = `MAN${Date.now().toString().slice(-6)}`

    return {
      consignmentExternalId: manualConsId,
      trackingCode,
      courierFeePaisa: 5000, // ৳50 default internal/rider cost
      labelUrl: `/admin/couriers/labels/${manualConsId}`,
      rawResponse: {
        mode: "manual_fallback",
        created_at: new Date().toISOString(),
        order_id: params.orderId,
        recipient_phone: params.recipientPhone,
        cod_amount_paisa: params.codAmountPaisa,
      },
    }
  }

  async cancelParcel(consignmentExternalId: string, reason?: string): Promise<CourierCancelResult> {
    return {
      success: true,
      message: "Manual consignment marked as canceled",
      rawResponse: { consignment_id: consignmentExternalId, reason },
    }
  }

  async getTracking(trackingCode: string): Promise<any> {
    return {
      tracking_code: trackingCode,
      status: "dispatched",
      courier: "manual",
      notes: "In-house courier or external paper consignment",
    }
  }
}
