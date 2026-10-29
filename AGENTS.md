# Antigravity Workspace Rules for Divine (Sixth Sense Studio)

Always enforce the following non-negotiable rules when generating or modifying code in this repository:

1. **Strict Air-Gap (Zero External Write Actions):**
   - Never add outbound email sending (SMTP, Resend, SendGrid, Gmail Send, or automatic `mailto:` triggers).
   - Never add outbound integrations to Houzz Pro, QuickBooks Payroll Online, Zelle, Plaid, or banking APIs.
   - All outputs must be presented as copy-ready text blocks, printable packets, or downloadable CSV/JSON exports.

2. **Mandatory Verification Status Badges:**
   - Every generated draft, comparison row, payment packet, payroll summary, and report must explicitly display its status (e.g., `Draft — Needs Human Verification`, `Discrepancy Found — Needs Review`, `Verified by Reviewer`, `Waiting for Meliza's Written Approval`, `Meliza Written Approval Logged`, `Completed Manually`).
   - AI or automated logic may only assign draft, needs-verification, or discrepancy statuses.
   - Transitioning to verified, waiting-approval, approved, or completed-manually statuses requires an explicit human UI interaction by the Reviewer (including verification checkboxes and reference notes).

3. **Out-of-Scope Financial & Accounting Guardrails:**
   - Divine must never perform bookkeeping, general ledger review, bank reconciliations, month-end close, tax calculations/filings, or client collections/payments.
   - Payment comparisons must always include the explicit disclaimer: *"A comparison performed by Divine is not confirmation that a payment is safe or approved. You must verify the invoice, project, recipient, and amount, obtain Meliza’s written approval, send any Zelle payment yourself, and save the confirmation."*

4. **Confidentiality & Local Storage:**
   - Store all client, vendor, employee, payroll, and financial data locally within the workspace database/storage.

5. **Houzz Pro Companion Alignment:**
   - Maintain alignment with the 6 official Houzz Pro workflows in `src/data/houzzKnowledge.ts` (`My Items` Product Library, `Selections Tracker` Planning/Financials/Procurement preset views & two-way PO sync, `Create Purchase Orders`, `Merge Purchase Orders` for draft POs sharing the same vendor and project, and `Manage Your Vendors` with tags and CSV templates).
