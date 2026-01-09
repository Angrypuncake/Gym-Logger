export type SummaryRow = {
    session_id: string;
    vault_id: string;
    template_id: string;
    template_name: string;
    session_date: string; // YYYY-MM-DD
    started_at: string | null;
    finished_at: string | null;
    planned_sets: number;
    logged_sets: number;
    total_reps: number;
    total_iso_sec: number;
    modalities: string[];
    has_pr: boolean;
  };
  
  export type TemplateRow = { id: string; name: string; sort_order: number };
  
  export type PrType = "REPS_MAX_WEIGHT" | "REPS_MAX_REPS" | "ISO_MAX_DURATION";
  