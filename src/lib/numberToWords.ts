const a = [
  "",
  "One ",
  "Two ",
  "Three ",
  "Four ",
  "Five ",
  "Six ",
  "Seven ",
  "Eight ",
  "Nine ",
  "Ten ",
  "Eleven ",
  "Twelve ",
  "Thirteen ",
  "Fourteen ",
  "Fifteen ",
  "Sixteen ",
  "Seventeen ",
  "Eighteen ",
  "Nineteen ",
];
const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

function inWords(num: number): string {
  if (num === 0) return "Zero ";
  const str = ("000000000" + num).slice(-9);
  const match = str.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return "";

  let n1 = Number(match[1]); // Crore
  let n2 = Number(match[2]); // Lakh
  let n3 = Number(match[3]); // Thousand
  let n4 = Number(match[4]); // Hundred
  let n5 = Number(match[5]); // Tens/Ones

  let out = "";
  out += n1 !== 0 ? (a[n1] || b[Math.floor(n1 / 10)] + a[n1 % 10]) + "Crore " : "";
  out += n2 !== 0 ? (a[n2] || b[Math.floor(n2 / 10)] + a[n2 % 10]) + "Lakh " : "";
  out += n3 !== 0 ? (a[n3] || b[Math.floor(n3 / 10)] + a[n3 % 10]) + "Thousand " : "";
  out += n4 !== 0 ? (a[n4] || b[Math.floor(n4 / 10)] + a[n4 % 10]) + "Hundred " : "";
  out += n5 !== 0 ? (out !== "" ? "and " : "") + (a[n5] || b[Math.floor(n5 / 10)] + a[n5 % 10]) : "";

  return out;
}

export function convertAmountToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Rupees Zero Only";
  const absoluteAmount = Math.abs(amount);
  const rupees = Math.floor(absoluteAmount);
  const paise = Math.round((absoluteAmount - rupees) * 100);

  let words = "Rupees " + inWords(rupees).trim();
  if (paise > 0) {
    words += " and " + inWords(paise).trim() + "Paise";
  }
  words += " Only";
  return words;
}
