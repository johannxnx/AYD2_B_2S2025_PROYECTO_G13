// src/components/finanzas/FacturaBadge.tsx
import React from "react";

interface Props {
  estado: string;
}

const clases: Record<string, string> = {
  BORRADOR:      "fn-badge fn-badge-borrador",
  VALIDADA:      "fn-badge fn-badge-validada",
  CERTIFICADA:   "fn-badge fn-badge-certificada",
  ANULADA:       "fn-badge fn-badge-anulada",
  PENDIENTE:     "fn-badge fn-badge-pendiente",
  PAGADA:        "fn-badge fn-badge-pagada",
  VENCIDA:       "fn-badge fn-badge-vencida",
  CHEQUE:        "fn-badge fn-badge-cheque",
  TRANSFERENCIA: "fn-badge fn-badge-transferencia",
};

const FacturaBadge: React.FC<Props> = ({ estado }) => (
  <span className={clases[estado] ?? "fn-badge fn-badge-gris"}>
    {estado}
  </span>
);

export default FacturaBadge;