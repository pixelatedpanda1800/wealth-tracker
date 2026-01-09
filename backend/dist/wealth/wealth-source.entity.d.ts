export declare enum WealthSourceCategory {
    INVESTMENT = "investment",
    CASH = "cash",
    PENSION = "pension"
}
export declare class WealthSource {
    id: string;
    name: string;
    category: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}
