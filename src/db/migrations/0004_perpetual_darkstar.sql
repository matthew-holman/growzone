CREATE TABLE "weather_stations" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"elevation_m" numeric(6, 3) NOT NULL,
	"last_frost_doy" smallint,
	"last_frost_p90" smallint,
	"first_frost_doy" smallint,
	"first_frost_p10" smallint,
	"growing_days" smallint,
	"gdd_annual" numeric(7, 1),
	"gdd_p10" numeric(7, 1),
	"gdd_p90" numeric(7, 1),
	"gdd_cv" numeric(4, 2),
	"monthly_mean_temps" numeric(4, 1)[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
