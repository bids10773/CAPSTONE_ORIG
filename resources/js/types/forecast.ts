export interface ForecastPoint {
    month: string;
    predicted_cases: number;
    lower_bound: number;
    upper_bound: number;
}

export interface HistoryPoint {
    month: string;
    cases: number;
    fitted_cases?: number;
    disease?: string;
}

export interface DiseaseForecast {
    disease: string;
    history: HistoryPoint[];
    forecast: ForecastPoint[];
    seasonal_pattern: { month_index: number; effect: number }[];
    metrics: {
        level: number;
        trend: number;
        rmse: number;
        growth_percentage: number;
        direction: 'increasing' | 'decreasing' | 'stable';
    };
    explanation: string;
}

export interface ForecastDashboardData {
    meta: {
        is_demo: boolean;
        label: string;
        disclaimer: string;
        generated_at: string;
    };
    filters: {
        diseases: string[];
        selected_disease: string | null;
        selected_year: number | null;
        horizon: number;
    };
    summary: {
        total_diseases: number;
        most_common_disease: string | null;
        highest_predicted_disease: string | null;
        highest_growth: string | null;
        highest_growth_percentage: number;
        lowest_growth: string | null;
        lowest_growth_percentage: number;
    };
    history: HistoryPoint[];
    diseases: DiseaseForecast[];
}
