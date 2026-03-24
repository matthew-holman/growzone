CREATE TABLE "postcode_zones" (
	"postcode" text PRIMARY KEY NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"zone_id" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
