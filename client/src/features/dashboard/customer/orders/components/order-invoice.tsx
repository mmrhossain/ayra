"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SITE_LOGO } from "@/config/site";
import { getOptimizedImage } from "@/helpers/cloudinary";
import { pickOrderAddress } from "@/features/dashboard/customer/orders/utils";
import type { CheckoutAddress, CustomerOrder } from "@/features/dashboard/customer/orders/types";
import type { PublicSettings } from "@/features/settings/types";
import "./order-invoice.css";

type Props = { order: CustomerOrder; store: PublicSettings["store"] };
const subscribe = () => () => {};
const number = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? number.format(amount) : "-";
};
const label = (value: string) => value.replace(/_/g, " ").toLowerCase();
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka",
  });
};

function Address({ title, value }: { title: string; value?: CheckoutAddress | null }) {
  return <section className="invoice-address">
    <h2 className="invoice-eyebrow">{title}</h2>
    {value ? <>
      <p className="invoice-recipient">{value.fullName}</p>
      <address>
        <span>{[value.addressLine1, value.addressLine2].filter(Boolean).join(", ")}</span>
        <span>{[value.thana, value.district, value.division, value.postalCode].filter(Boolean).join(", ")}</span>
        {value.country && <span>{value.country}</span>}
      </address>
      {value.phone && <p>{value.phone}</p>}
      {value.email && <p>{value.email}</p>}
    </> : <p className="invoice-muted">Not provided</p>}
  </section>;
}

export function InvoiceDocument({ order, store }: Props) {
  const shipping = pickOrderAddress(order, "SHIPPING");
  const billing = pickOrderAddress(order, "BILLING") ?? shipping;
  const currency = order.currency || store.currency || "BDT";
  const status = order.paymentStatus || "PENDING";
  const paid = status === "PAID";
  const paymentMethods = [...new Set((order.payments ?? []).map(payment => payment.method))];
  const method = paymentMethods.map(value => value === "COD" ? "Cash on delivery" : value === "SSLCOMMERZ" ? "Online payment" : label(value)).join(" / ");
  const invoiceNumber = order.invoiceNumber || order.orderNumber;
  const items = order.items ?? [];

  return <article className="order-invoice" aria-label={"Invoice " + invoiceNumber}>
    <header className="invoice-header">
      <div className="invoice-brand">
        {/* A native image also renders reliably in the isolated print document. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="invoice-logo" src={getOptimizedImage(store.logoUrl || SITE_LOGO, 320)} alt={store.name} width={144} height={60} />
        <p className="invoice-store-name">{store.name}</p>
        {store.address && <p className="invoice-muted invoice-store-address">{store.address}</p>}
        <div className="invoice-contact">
          {store.supportEmail && <span>{store.supportEmail}</span>}
          {store.supportPhone && <span>{store.supportPhone}</span>}
        </div>
      </div>
      <div className="invoice-title">
        <p className="invoice-eyebrow">Customer copy</p>
        <h1>Invoice</h1>
        <span className={"invoice-payment-badge " + (paid ? "invoice-paid" : "invoice-awaiting")}>
          <span aria-hidden="true" />{label(status)}
        </span>
      </div>
    </header>

    <dl className="invoice-reference-grid">
      <div><dt>Invoice number</dt><dd>{invoiceNumber}</dd></div>
      <div><dt>Order number</dt><dd>{order.orderNumber}</dd></div>
      <div><dt>Issued on</dt><dd>{date(order.createdAt)}</dd></div>
      <div><dt>Currency</dt><dd>{currency}</dd></div>
    </dl>

    <div className="invoice-address-grid">
      <Address title="Bill to" value={billing} />
      <Address title="Ship to" value={shipping} />
      <section className="invoice-payment-details">
        <h2 className="invoice-eyebrow">Payment & delivery</h2>
        {method && <p className="invoice-recipient">{method}</p>}
        <p className="invoice-capitalize">Payment {label(status)}</p>
        <p className="invoice-capitalize">Order {label(order.status)}</p>
        {order.shippingMethodName && <p>{order.shippingMethodName}</p>}
      </section>
    </div>

    <div className="invoice-items-heading">
      <h2>Order details</h2>
      <span>{items.reduce((count, item) => count + item.quantity, 0)} items</span>
    </div>
    <table className="invoice-table">
      <caption className="invoice-sr-only">Purchased items. Prices in {currency}.</caption>
      <thead><tr><th scope="col">Item / description</th><th scope="col">Unit price</th><th scope="col">Qty</th><th scope="col">Amount</th></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <td>
          <p className="invoice-product-name">{item.productName}</p>
          {item.variantName && <p className="invoice-item-meta">{item.variantName}</p>}
          {item.sku && <p className="invoice-item-meta">SKU: {item.sku}</p>}
          {item.taxRate != null && (item.taxClassName || Number(item.taxAmount ?? 0) > 0) && <p className="invoice-item-meta">
            {item.taxClassName || "VAT / Tax"}: {Number(item.taxRate)}%
          </p>}
        </td>
        <td data-label="Unit price">{money(item.unitPrice)}</td>
        <td data-label="Qty">{item.quantity}</td>
        <td data-label="Amount">{money(item.subtotal)}</td>
      </tr>)}</tbody>
    </table>

    <div className="invoice-bottom-grid">
      <section className="invoice-thank-you">
        <span className="invoice-small-rule" />
        <h2>Thank you for shopping with us.</h2>
        <p>We appreciate your order and look forward to welcoming you again.</p>
        {(store.supportEmail || store.supportPhone) && <p className="invoice-help">Questions about this invoice? Contact us with your order number.</p>}
      </section>
      <dl className="invoice-totals">
        <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
        {Number(order.discountAmount ?? 0) > 0 && <div><dt>Discount</dt><dd>-{money(order.discountAmount)}</dd></div>}
        {Number(order.taxAmount ?? 0) > 0 && <div><dt>VAT / Tax</dt><dd>{money(order.taxAmount)}</dd></div>}
        <div><dt>Shipping charge</dt><dd>{money(order.shippingAmount)}</dd></div>
        <div className="invoice-grand-total"><dt>Grand total <small>{currency}</small></dt><dd>{money(order.grandTotal)}</dd></div>
      </dl>
    </div>
    <footer className="invoice-footer">
      <span>{store.name}</span><span>Computer-generated invoice. No signature required.</span>
    </footer>
  </article>;
}

export function OrderInvoice(props: Props) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  useEffect(() => {
    let previousTitle: string | null = null;
    const beforePrint = () => {
      previousTitle ??= document.title;
      document.title = "Invoice-" + (props.order.invoiceNumber || props.order.orderNumber);
    };
    const afterPrint = () => {
      if (previousTitle !== null) document.title = previousTitle;
      previousTitle = null;
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      afterPrint();
    };
  }, [props.order.invoiceNumber, props.order.orderNumber]);

  return <>
    <InvoiceDocument {...props} />
    {hydrated && createPortal(<div id="invoice-print-root"><InvoiceDocument {...props} /></div>, document.body)}
  </>;
}
