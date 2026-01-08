export type SummaryRow = {
    session_id: string;
    template_id: string;
    template_name: string;
    session_date: string; // YYYY-MM-DD
    finished_at: string | null;
    planned_sets: number;
    logged_sets: number;
    modalities: string[];
    has_pr: boolean;
  };
  
  export type TemplateRow = { id: string; name: string; sort_order: number };
  
  export type Filters = {
    templateId: string; // "ALL" or template uuid
    modality: "ALL" | "REPS" | "ISOMETRIC";
    onlyPr: boolean;
  };
  