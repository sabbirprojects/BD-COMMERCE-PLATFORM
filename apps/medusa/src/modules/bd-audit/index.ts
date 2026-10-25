import { Module } from "@medusajs/framework/utils"
import BdAuditModuleService from "./service"

export const BD_AUDIT_MODULE = "bd_audit"

export default Module(BD_AUDIT_MODULE, {
  service: BdAuditModuleService,
})
