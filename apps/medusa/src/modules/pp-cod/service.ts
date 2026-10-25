import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/types"

/**
 * Cash on Delivery (COD) Payment Provider (pp_cod)
 *
 * Implements Prompt 09, PRD §7.1, CHK-PAY-01:
 * - Authorizes payment with ৳0 processing fee.
 * - Initial payment status is Awaiting / Pending Collection (authorized).
 * - Payment is captured only when parcel is delivered and money is collected.
 * - Refunds are NEVER automated (PRD FR-6.7.5).
 */
export class CodPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "cod"

  constructor(container: any, options: any) {
    super(container, options)
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = (input.data?.session_id as string) || `cod_session_${Date.now()}`
    return {
      id: sessionId,
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        payment_method: "cod",
        currency_code: input.currency_code || "bdt",
        amount: input.amount,
        cod_status: "pending_confirmation",
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...(input.data || {}),
        authorized_at: new Date().toISOString(),
        payment_method: "cod",
        fee_paisa: 0,
      },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        captured_at: new Date().toISOString(),
      },
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // PRD FR-6.7.5: Refunds are never automatic
    return {
      data: {
        ...(input.data || {}),
        refund_note: "Manual refund required per PRD FR-6.7.5",
      },
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return {
      data: input.data || {},
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...(input.data || {}),
        canceled_at: new Date().toISOString(),
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...(input.data || {}),
        amount: input.amount,
      },
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return {
      data: input.data || {},
    }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: input.data || {},
    }
  }

  async getWebhookActionAndData(data: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    return {
      action: "not_supported",
    }
  }
}

export default CodPaymentProviderService
