# I.S.T.D PRO (Backend / Server Side and Database)

Inventory and sales management system built with modern web technologies.

The Backend handles all business logic, user authentication, product management, sales processing, and inventory tracking.

Backend (Server)           
┌─────────────────────────────────────────────────┐              
│Node.js + Express                                              
│├── Authentication Routes (/api/auth)                         
│├── Products Routes (/api/products)                            
│├── Sales Routes (/api/sales)                                  
│├── Invoices Routes (/api/invoices)                            
│├── AI Routes (/api/ai)                                       
││   ├── POST /generate-description                             
││   ├── POST /suggest-discount                               
││   ├── POST /sales-analysis                                   
││   └── POST /inventory-insights                              
│├── Middleware (JWT verification, error handling)              
│└── Controllers (business logic)                                                                                       
└─────────────────────────────────────────────────┘   

Database        
┌────────────────────────────────────────────────────────────────┐
│Collections:                                                   
│├── Users (name, email, password, role)                        
│├── Products (sku, name, price, stock, cost, description, etc.)
│├── Sales (items array, total, tax, discount, etc.)            
│└── Invoices (invoice number, sale reference, PDF URL)        
└────────────────────────────────────────────────────────────────┘
