import { ValueTransformer } from 'typeorm';

/** Coerces Postgres numeric/decimal columns to JS number on read. */
export const decimalTransformer: ValueTransformer = {
    to: (value: number | null | undefined) => value,
    from: (value: string | number | null | undefined) => {
        if (value == null) return value as null | undefined;
        return typeof value === 'number' ? value : parseFloat(value);
    },
};
