export interface HouzzProGuideSection {
  id: string;
  title: string;
  sourceUrl: string;
  navigationPath: string;
  summary: string;
  keyWorkflowSteps: string[];
  divinePreparationRole: string;
  keldiaManualActionInHouzz: string;
  supportedFieldsAndColumns: string[];
}

export const HOUZZ_PRO_KNOWLEDGE_BASE: HouzzProGuideSection[] = [
  {
    id: 'hp-product-library',
    title: '1. Product Library ("My Items") & Draft Project Items',
    sourceUrl: 'https://pro.houzz.com/pro-help/r/how-to-use-the-product-library-in-houzz-pro',
    navigationPath: 'Left Nav → Company Icon → Library → My Items',
    summary:
      'Central repository in Houzz Pro for all sourced products, services, finishes, and fixtures across projects. Supports Houzz Pro Clipper, Manual Entry, Brand Catalogs, and CSV Bulk Import (up to 500 items per CSV). Also supports assigning items directly as "Draft Project Items" before formal proposals.',
    keyWorkflowSteps: [
      'Access via Left Navigation → Company icon → My Items (under Library).',
      'Populate via Houzz Pro Clipper extension, Create New (title, category, vendor, description, pricing, up to 5 images), or Import CSV template (up to 500 entries).',
      'Assign items to a specific project early as "Draft Project Items" so they sit with a Draft status ready to pull into Selection Boards, Mood Boards, or Proposals.',
    ],
    divinePreparationRole:
      'Divine formats extracted quote and locked-spec items into Houzz-compatible CSV rows (Title, Category, Room, Vendor, SKU, Finish/Description, Unit Cost, Markup/Price) so you can copy-paste or bulk import them into My Items or Draft Project Items.',
    keldiaManualActionInHouzz:
      'Verify Divine’s extracted item specs against the designer’s locked specification and Approved Quote, then click "Create New" or "Import" inside Houzz Pro → Company → My Items.',
    supportedFieldsAndColumns: [
      'Item Title',
      'Category (e.g., Lighting, Furniture, Plumbing)',
      'Vendor',
      'SKU / Model Number',
      'Finish / Description',
      'Unit Cost & Trade Discount',
      'Client Price / Markup',
      'Draft Project Assignment',
    ],
  },
  {
    id: 'hp-selections-tracker-designer',
    title: '2. Maximizing the Selections Tracker as a Designer',
    sourceUrl:
      'https://pro.houzz.com/pro-help/r/how-to-maximize-the-selections-tracker-as-a-designer',
    navigationPath: 'Project Overview → Planning → Selections → Tracker Tab',
    summary:
      'Best-practice designer setup for the Selections Tracker to replace disconnected spreadsheets. Emphasizes strict upfront data hygiene (Categories, Rooms, Linked Vendors), syncing Selection Boards for client approvals, and two-way sync between Tracker inline updates and Purchase Orders/Invoices.',
    keyWorkflowSteps: [
      'Up-Front Hygiene: Assign every item a clear Category (e.g., Lighting, Millwork) and Room (e.g., Foyer, Dining Room, Great Room) plus a linked Vendor.',
      'Sync with Selection Boards: Clients approve/reject options visually on Selection Boards; approved items convert directly into Proposals, Invoices, or Purchase Orders without re-typing.',
      'Two-Way Document Sync: Inline updates made to Order Status or items in the Selections Tracker automatically sync with linked Purchase Orders and Invoices in Houzz Pro.',
    ],
    divinePreparationRole:
      'Divine organizes source documents (POs, Quotes, Acknowledgments, Invoices, Carrier Tracking) by Houzz Room & Category, flags budget or delivery risks, and prepares proposed inline tracker updates and draft client status notes.',
    keldiaManualActionInHouzz:
      'Verify Divine’s proposed updates against original vendor PDFs and enter the verified values into the Selections Tracker (knowing two-way sync will update linked Houzz POs).',
    supportedFieldsAndColumns: [
      'Room',
      'Category',
      'Vendor / Subcontractor',
      'Client Approval Status (Approved / Rejected / Pending)',
      'Budget vs. Actual Cost',
      'Profit Margin & Tax',
      'Internal Notes',
    ],
  },
  {
    id: 'hp-selections-tracker-usage',
    title: '3. How to Use the Selections Tracker (Views, Columns & Inline Procurement)',
    sourceUrl: 'https://pro.houzz.com/pro-help/r/how-to-use-the-selections-tracker',
    navigationPath:
      'Project → Planning → Selections → Tracker Tab (or Global Search → All Selections Tracker)',
    summary:
      'Operational guide to switching between Preset Views (Planning, Financials, Procurement), toggling/reordering columns via the Columns Icon (three vertical bars), creating custom columns (e.g., Tracking Number, Mafer Receiving), and updating Procurement / Order Status inline.',
    keyWorkflowSteps: [
      'Switch Preset Views at the top of the Tracker between "Planning", "Financials", and "Procurement".',
      'Click the Columns icon (three vertical bars) to show/hide, resize, reorder, or click "Create New Column" for custom fields.',
      'In the "Procurement" preset view, update key logistics columns inline: Procurement (Order Status: Needs Action, Approved, Ordered, Backordered, Shipped, Delivered), Order Date, Estimated Delivery (ETA), and linked Purchase Order.',
    ],
    divinePreparationRole:
      'Divine mirrors Houzz Pro’s exact "Procurement" and "Financials" view columns (Room, Category, Item, Vendor, Cost, Budget Variance, Procurement Status, Order Date, Estimated Delivery, Linked PO#) so you can verify side-by-side.',
    keldiaManualActionInHouzz:
      'Open Houzz Pro → Selections → Tracker → Procurement View and update the inline status, Order Date, and Estimated Delivery after verifying Divine’s staging row.',
    supportedFieldsAndColumns: [
      'Preset View: Planning | Financials | Procurement',
      'Procurement Status (Needs Action, Approved, Ordered, Backordered, Shipped, Delivered)',
      'Order Date',
      'Estimated Delivery (ETA)',
      'Purchase Order (Linked PO #)',
      'Custom Columns (Carrier Tracking, Mafer Coordination)',
    ],
  },
  {
    id: 'hp-create-purchase-orders',
    title: '4. How to Create Purchase Orders in Houzz Pro',
    sourceUrl: 'https://pro.houzz.com/pro-help/r/how-to-create-purchase-orders',
    navigationPath:
      'Estimate / Proposal / Invoice → Actions → Create Purchase Order (or Selection Board → Convert)',
    summary:
      'Instructions for generating Purchase Orders in Houzz Pro by converting existing Estimates, Proposals, Invoices, or approved Selection Boards without re-entering item data.',
    keyWorkflowSteps: [
      'From Estimates, Proposals, or Invoices: Check the boxes next to specific line items to include (or leave all unchecked to convert the entire document).',
      'Click "Purchase Order" in the top menu / bottom action bar, or go to Actions → Create Purchase Order.',
      'From Selections Boards: Once a client approves items, click the "Convert" button in the top right corner to generate POs.',
      'In the pop-up window, assign or confirm the correct Vendor/Subcontractor for each item and click "Create Purchase Order".',
    ],
    divinePreparationRole:
      'Divine prepares Draft Purchase Orders from the designer’s locked specifications and approved quotes, checking SKU, finish, quantity, unit price, and freight before you create or finalize the PO in Houzz Pro.',
    keldiaManualActionInHouzz:
      'Review Divine’s Draft PO against the locked spec and approved quote, then use Houzz Pro (Convert / Actions → Create Purchase Order) to generate and submit the official PO.',
    supportedFieldsAndColumns: [
      'Source Document (Estimate / Proposal / Invoice / Selection Board)',
      'Selected Line Items (Checkboxes)',
      'Assigned Vendor / Subcontractor',
      'Unit Cost, Quantity, Shipping/Freight',
      'PO Status (Draft vs. Sent/Active)',
    ],
  },
  {
    id: 'hp-merge-purchase-orders',
    title: '5. How to Merge Purchase Orders in Houzz Pro',
    sourceUrl: 'https://pro.houzz.com/pro-help/r/how-to-merge-purchase-orders',
    navigationPath: 'Open Draft Purchase Order → Actions Menu → Merge Purchase Orders',
    summary:
      'Allows consolidating multiple separate purchase orders into a single PO document in Houzz Pro, provided they are in Draft stage and share the exact same Vendor and Project.',
    keyWorkflowSteps: [
      'Eligibility Rule: Only available for Purchase Orders that are still in the "Draft" stage and belong to the SAME Vendor and SAME Project.',
      'Step 1: Open one of the target draft Purchase Orders in Houzz Pro.',
      'Step 2: Click the "Actions" menu and select "Merge Purchase Orders".',
      'Step 3: Check the boxes next to the eligible draft POs you want to combine and click "Merge" (attachments are preserved; old separate draft POs are automatically deleted).',
    ],
    divinePreparationRole:
      'Divine automatically scans open Draft POs across Sixth Sense Studio projects to detect when multiple Draft POs share the same Vendor and Project, recommending eligible POs for you to merge in Houzz Pro to save on combined freight.',
    keldiaManualActionInHouzz:
      'Open the target Draft PO in Houzz Pro, click Actions → Merge Purchase Orders, select the eligible sibling draft POs, and click Merge.',
    supportedFieldsAndColumns: [
      'Eligibility Check: Draft Stage = True',
      'Eligibility Check: Same Project = True',
      'Eligibility Check: Same Vendor = True',
      'Combined Line Items & Attachments',
    ],
  },
  {
    id: 'hp-manage-vendors',
    title: '6. How to Manage Your Vendors in Houzz Pro',
    sourceUrl: 'https://pro.houzz.com/pro-help/r/how-to-manage-your-vendors',
    navigationPath: 'Left Nav → Company Icon → Vendors (Actions → Import Vendor List / Manage Tags)',
    summary:
      'Centralized directory in Houzz Pro to store, organize, bulk-import, and tag vendors and subcontractors, tracking primary contacts and active PO counts.',
    keyWorkflowSteps: [
      'Access via Left Navigation → Company icon → Vendors.',
      'View key directory columns: Vendor Name, Primary Contact, Custom Tags, Number of Active POs, and Date Added.',
      'Bulk Import: Click Actions (top right) → Import Vendor List → Download CSV template → Upload populated vendor spreadsheet.',
      'Categorize with Tags: Add custom trade/product tags under Vendor Edit or via Actions → Manage Tags to quickly filter vendors when building estimates, tracking selections, or creating POs.',
    ],
    divinePreparationRole:
      'Divine tracks vendor profiles alongside studio payment compliance requirements (W-9, COI expiration, Lien Release status, on-file Zelle handle, and Houzz Category Tags) and formats vendor records for Houzz CSV import.',
    keldiaManualActionInHouzz:
      'Maintain the official vendor directory in Houzz Pro → Company → Vendors and use Actions → Manage Tags / Import Vendor List.',
    supportedFieldsAndColumns: [
      'Vendor Name',
      'Primary Contact Info',
      'Custom Category / Trade Tags',
      'Active PO Count',
      'Date Added',
      'Studio Compliance Extensions (W-9, COI, Lien Release, On-File Zelle)',
    ],
  },
];

export interface HouzzMergeCandidate {
  id: string;
  projectName: string;
  vendorName: string;
  draftPoNumbers: string[];
  itemsSummary: string[];
  combinedAmount: number;
  estimatedFreightSavings: number;
  houzzNavigationHint: string;
}

export const INITIAL_HOUZZ_MERGE_CANDIDATES: HouzzMergeCandidate[] = [
  {
    id: 'merge-cand-1',
    projectName: 'Coral Gables Residence — Castellanos',
    vendorName: 'Vanguard Custom Furniture',
    draftPoNumbers: ['PO-SSS-2026-048 (Draft)', 'PO-SSS-2026-049 (Draft)'],
    itemsSummary: [
      'Primary Suite Custom Bouclé Lounge Pair (2 Chairs) — $5,500',
      'Primary Suite Matching Bouclé Ottoman — $1,450',
    ],
    combinedAmount: 6950,
    estimatedFreightSavings: 220,
    houzzNavigationHint:
      'Both POs are in DRAFT stage for Vanguard Custom Furniture on Coral Gables Residence. In Houzz Pro: Open PO-SSS-2026-048 → Actions → Merge Purchase Orders → Check PO-SSS-2026-049 → Click Merge.',
  },
];
