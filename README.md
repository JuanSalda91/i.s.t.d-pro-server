# 🧭 I.S.T.D PRO — Inventory & Sales Tracker Dashboard

The I.S.T.D PRO backend is a RESTful API built with Node.js, Express, MongoDB Atlas, and Mongoose to power the inventory, sales, and invoicing features of the dashboard. It handles business logic, data persistence, and secure communication with the frontend client.

## ✨ Core Responsibilities:

- Manage inventory items (create, read, update, delete).
- Handle sales records and link them to inventory items.
- Generate and store invoice data for each sale.
- Provide structured JSON responses for the frontend dashboard.
- Support printable invoice workflows by exposing invoice endpoints for PDF generation on the frontend.

## 🧰 Tech Stack:

- Runtime: Node.js
- Framework: Express
- Database: MongoDB Atlas (cloud-hosted MongoDB)
- ODM: Mongoose for schema definitions and data modeling
- Environment Management: dotenv (for environment variables like DB connection string, ports, etc.)