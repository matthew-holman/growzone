import type { NearestStation } from "../services/stationLookup.js";

export interface ClimateProfile {
  postcode:         string;
  lastFrostDoy:     number;
  lastFrostP90:     number;
  firstFrostDoy:    number;
  firstFrostP10:    number;
  growingDays:      number;
  gddAnnual:        number;
  gddP10:           number;
  gddP90:           number;
  gddCv:            number;
  monthlyMeanTemps: number[];
}

export interface StationWeight {
  station:    NearestStation;
  weight:     number;     // 1 / distance²
  elevDeltaM: number;     // postcode elevation minus station elevation
                          // positive = postcode higher than station
                          // negative = postcode lower than station
}

export interface CalendarWindow {
  startMonth: number   // 1–12
  startDay:   number   // 1–31
  endMonth:   number
  endDay:     number
}

export type FeasibilityStatus = 'feasible' | 'marginal' | 'infeasible'

export interface MethodCalendar {
  methodId:          string
  methodLabelSv:     string
  methodLabelEn:     string
  feasibility:       FeasibilityStatus
  feasibilityReason: string | null
  sowIndoors:        CalendarWindow | null
  directSow:         CalendarWindow | null
  transplant:        CalendarWindow | null
  harvest:           CalendarWindow | null
}

export interface CropCalendar {
  cropId:     string
  cropNameSv: string
  cropNameEn: string
  lifecycle:  string
  methods:    MethodCalendar[]
}
