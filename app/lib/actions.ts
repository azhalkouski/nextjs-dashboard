'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  // the amount is specifically set to coerce (change) from a string to a number
  // while also validating its type
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // It's usually goof practice to store monetary values in cents in your database to
  // eliminate JavaScript floating-point errors and ensure greater accuracy
  const amountInCents = amount * 100;

  const date = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  /**
   * Next.js has a Client-side Router Cache that stores the route segments in the
   * user's browser for a time. Along with `prefetching`, this cache ensures that
   * users can quickly navigate between routes while reducing the number of
   * requests made to the server.
   * 
   * Since you're updating the data displayed in the invoices route, you want to clear
   * this cache and trigger a  new requst to the server. You can do this with the
   * 'revalidatePath' function from Next.js
   */
  revalidatePath('/dashboard/invoices');
  /**
   * At this point, you also want to redirect the user back to the /dashboard/invoices
   * page.
   */
  redirect('/dashboard/invoices');
}
