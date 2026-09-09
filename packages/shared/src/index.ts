/**
 * Formats numeric price to Indian standard Lakhs (L) and Crores (Cr).
 * e.g., 4500000 -> ₹45 Lakh, 12500000 -> ₹1.25 Cr
 */
export function formatPriceINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lac = amount / 100000;
    return `₹${lac % 1 === 0 ? lac : lac.toFixed(2)} Lakh`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Masks phone numbers to prevent privacy leaks in public APIs
 * e.g., "+91 9876543210" -> "+91 987****210"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'Hidden';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 7) return '******';
  return clean.slice(0, 3) + '****' + clean.slice(-3);
}

/**
 * Builds safe WhatsApp direct link with pre-filled enquiry message
 */
export function buildWhatsAppLink(
  phone: string,
  propertyTitle: string,
  propertyId: string
): string {
  const digits = phone.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(
    `Hello, I am interested in your property listing "${propertyTitle}" (ID: ${propertyId}) on EstatePlatform. Is it still available?`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

/**
 * Compute pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Format date to human-readable format
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
