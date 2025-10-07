CREATE TABLE IF NOT EXISTS "quickbooks"."companies" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."customers" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"display_name" varchar(255),
	"print_on_check_name" varchar(255),
	"active" boolean DEFAULT true,
	"primary_phone" varchar(50),
	"alternate_phone" varchar(50),
	"mobile" varchar(50),
	"fax" varchar(50),
	"primary_email_addr" varchar(255),
	"web_addr" varchar(500),
	"taxable" boolean DEFAULT true,
	"balance" double precision,
	"notes" text,
	"company_id" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."estimate_line_items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"estimate_id" varchar(50) NOT NULL,
	"line_num" integer,
	"description" text,
	"amount" double precision,
	"qty" double precision,
	"unit_price" double precision,
	"item_id" varchar(50),
	"item_name" varchar(255),
	"item_type" varchar(50),
	"tax_code_id" varchar(50),
	"service_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."estimates" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"doc_number" varchar(50),
	"txn_date" timestamp,
	"expiration_date" timestamp,
	"total_amt" double precision,
	"status" varchar(50),
	"customer_id" varchar(50),
	"company_id" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."invoice_line_items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"invoice_id" varchar(50) NOT NULL,
	"line_num" integer,
	"description" text,
	"amount" double precision,
	"qty" double precision,
	"unit_price" double precision,
	"item_id" varchar(50),
	"item_name" varchar(255),
	"item_type" varchar(50),
	"tax_code_id" varchar(50),
	"service_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."invoices" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"doc_number" varchar(50),
	"txn_date" timestamp,
	"due_date" timestamp,
	"total_amt" double precision,
	"balance" double precision,
	"customer_id" varchar(50),
	"company_id" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"description" text,
	"active" boolean DEFAULT true,
	"unit_price" double precision,
	"type" varchar(50),
	"qty_on_hand" double precision,
	"company_id" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks"."tokens" (
	"id" bigint PRIMARY KEY NOT NULL,
	"company_id" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" varchar(50) DEFAULT 'Bearer',
	"scope" text,
	"expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"realm_id" varchar(50),
	"base_url" varchar(500),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_name_idx" ON "quickbooks"."customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_email_idx" ON "quickbooks"."customers" USING btree ("primary_email_addr");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tokens_realm" ON "quickbooks"."tokens" USING btree ("realm_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tokens_active" ON "quickbooks"."tokens" USING btree ("is_active");