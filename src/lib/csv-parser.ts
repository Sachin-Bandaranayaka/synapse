import Papa from 'papaparse';
import { z } from 'zod';

export const LeadSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone number is required"),
  second_phone: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  product_code: z.string().min(1, "Product code is required"),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export type LeadData = z.infer<typeof LeadSchema>;

export interface ParseResult {
  validLeads: LeadData[];
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validLeads: LeadData[] = [];
        const errors: ParseResult['errors'] = [];

        results.data.forEach((row: any, index: number) => {
          const result = LeadSchema.safeParse(row);

          if (!result.success) {
            errors.push({
              row: index + 2, // +2 because 1-based index and header row
              errors: result.error.errors.map(err =>
                `${err.path.join('.')}: ${err.message}`
              ),
            });
          } else {
            validLeads.push(result.data);
          }
        });

        resolve({ validLeads, errors });
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}
