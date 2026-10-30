type E2ePayment = {
  commerceOrder: string;
  status: number;
  email: string;
};

const store = new Map<string, E2ePayment>();

export function e2eMockCreatePayment(input: {
  commerceOrder: string;
  email: string;
  urlReturn: string;
}): { flowOrder: string; url: string; token: string } {
  const token = `e2e-${input.commerceOrder}`;
  store.set(token, {
    commerceOrder: input.commerceOrder,
    status: 1,
    email: input.email,
  });
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
  const checkout = new URL("/api/e2e/flow/checkout", base);
  checkout.searchParams.set("token", token);
  checkout.searchParams.set("return", input.urlReturn);
  return {
    flowOrder: `e2e-${Date.now()}`,
    url: checkout.toString(),
    token,
  };
}

export function e2eMockGetPaymentStatus(token: string): {
  flowOrder: string;
  commerceOrder: string;
  status: number;
} {
  const row = store.get(token);
  if (!row) {
    throw new Error("Token E2E de Flow no encontrado");
  }
  return {
    flowOrder: "e2e-1",
    commerceOrder: row.commerceOrder,
    status: row.status,
  };
}

export function e2eMockMarkPaid(token: string): void {
  const row = store.get(token);
  if (!row) {
    throw new Error("Token E2E de Flow no encontrado");
  }
  row.status = 2;
}
