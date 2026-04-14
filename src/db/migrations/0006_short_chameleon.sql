CREATE TABLE "crop_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"crop_id" text NOT NULL,
	"label_sv" text NOT NULL,
	"label_en" text NOT NULL,
	"germination_min_soil_temp_c" smallint,
	"germination_opt_soil_temp_c" smallint,
	"days_to_germination_min" smallint,
	"days_to_germination_max" smallint,
	"days_to_maturity_min" smallint,
	"days_to_maturity_max" smallint,
	"transplant_tolerance" text NOT NULL,
	"gdd_required" smallint,
	"plant_before_first_frost_days" smallint,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" text PRIMARY KEY NOT NULL,
	"name_sv" text NOT NULL,
	"name_en" text NOT NULL,
	"lifecycle" text NOT NULL,
	"frost_tolerance" text NOT NULL,
	"min_night_temp_c" smallint,
	"daylength_requirement" text DEFAULT 'neutral' NOT NULL,
	"notes_sv" text,
	"notes_en" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crop_methods" ADD CONSTRAINT "crop_methods_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;