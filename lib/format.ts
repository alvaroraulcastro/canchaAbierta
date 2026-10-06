import type { Match, PaymentStatus } from "@/lib/sheets/schemas";
import type { Sport } from "@/lib/time";

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sportLabel(sport: Sport): string {
  return sport === "padel" ? "Pádel" : "Babyfútbol";
}

export function matchStatusLabel(status: Match["status"]): string {
  switch (status) {
    case "open":
      return "Abierto";
    case "closed":
      return "Cerrado";
    case "cancelled":
      return "Cancelado";
    case "completed":
      return "Finalizado";
  }
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "paid":
      return "Pagado";
    case "failed":
      return "Fallido";
    case "refunded":
      return "Reembolsado";
    case "cancelled":
      return "Cancelado";
  }
}

export function spotsLabel(currentPlayers: number, maxPlayers: number): string {
  return `${currentPlayers} / ${maxPlayers} cupos`;
}
