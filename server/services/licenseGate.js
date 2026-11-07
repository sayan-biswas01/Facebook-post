/**
 * লাইসেন্স গেট: ফিল্ড না থাকলে বা মান না মিললে ছবি বাতিল। অনুমান করে কখনো approve হয় না।
 * ফলাফল: { status: 'approved' | 'review' | 'rejected', reason }
 */

// প্রতিটি উৎসের জন্য "CC0/Public Domain" এর স্পষ্ট নিয়ম। নতুন উৎস যোগ করলে এখানে নিয়ম লিখুন।
const RULES = {
  met: { field: "isPublicDomain", isOpen: (v) => v === true },
};

// এই উৎসগুলোর ছবি স্বয়ংক্রিয়ভাবে approve হবে না, সবসময় review কিউতে যাবে।
const ALWAYS_REVIEW = new Set([
  "loc",
  "nara",
  "wikimedia",
  "internetarchive",
  "dpla",
]);

export function checkLicense(item) {
  if (!item.imageUrl) return { status: "rejected", reason: "ছবির URL নেই" };

  const lic = item.license || {};
  if (
    lic.field === undefined ||
    lic.field === "" ||
    lic.value === undefined ||
    lic.value === null
  ) {
    return { status: "rejected", reason: "লাইসেন্স ফিল্ড পাওয়া যায়নি" };
  }

  if (ALWAYS_REVIEW.has(item.source)) {
    return {
      status: "review",
      reason: "এই উৎসের রাইটস আইটেমভেদে আলাদা, নিজে দেখে নিন",
    };
  }

  const rule = RULES[item.source];
  if (!rule)
    return { status: "review", reason: "এই উৎসের জন্য কোনো নিয়ম লেখা নেই" };
  if (rule.field !== lic.field)
    return { status: "rejected", reason: `ফিল্ড মেলেনি (${lic.field})` };

  return rule.isOpen(lic.value)
    ? { status: "approved", reason: "" }
    : { status: "rejected", reason: `${lic.field} = ${lic.value}` };
}
