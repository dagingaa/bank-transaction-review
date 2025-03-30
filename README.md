# Bank Transaction Review

A modern web application for importing, categorizing, analyzing, and visualizing bank transactions.

![Bank Transaction Review](/app/opengraph-image.png)

## Features

- **CSV Import with Smart Mapping**
  - Import bank transactions from CSV files
  - Intelligent column mapping with customization options
  - Support for multiple date formats (DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY)
  - Handles large transaction datasets with chunked processing

- **Transaction Management**
  - View all transactions in a sortable, filterable table
  - Categorize transactions individually or in bulk
  - Filter transactions by date range
  - Sort by date, description, amount, or category

- **Categories**
  - Create, edit, and delete custom categories
  - Save and load category presets
  - Automated category suggestions

- **Financial Analysis**
  - Summary of total income, expenses, and balance
  - Breakdown of transactions by category
  - Category-specific balance calculation
  - Negative balance highlighting

- **Data Visualization**
  - Interactive pie charts for income categories
  - Interactive pie charts for expense categories
  - Visual tooltips with detailed information

- **Export & Sharing**
  - Export transactions with categories to CSV
  - Formatted exports ready for spreadsheet applications

- **Modern UI/UX**
  - Clean, responsive design
  - Dark and light mode support
  - Built with Next.js and Tailwind CSS

## Technology Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Recharts](https://recharts.org/) - Data visualization
- [PapaParse](https://www.papaparse.com/) - CSV parsing

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bank-transaction-review.git
   cd bank-transaction-review
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Import Transactions**
   - Click "Import CSV" and select your bank statement CSV file
   - Map columns to appropriate fields in your data
   - Click "Import" to load your transactions

2. **Manage Categories**
   - Add custom categories using the Categories panel
   - Save your category set for future use
   - Apply categories to transactions

3. **Analyze Data**
   - Use the transaction summary to see total income, expenses, and balance
   - Explore the visual breakdown of categories
   - Filter by date range to analyze specific periods

4. **Export Results**
   - Export your categorized transactions to CSV for use in other applications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Privacy

This application processes all data locally in your browser. No transaction data is ever sent to a server or stored in the cloud.