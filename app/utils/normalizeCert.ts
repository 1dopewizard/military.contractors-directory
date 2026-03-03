/**
 * @file Certification name normalization utility
 * @description Normalizes certification names to consistent format for display
 */

/**
 * Map of common certification variations to their normalized form
 */
const CERT_NORMALIZATIONS: Record<string, string> = {
  // CompTIA certifications
  "comptia_security+": "CompTIA Security+",
  comptia_securityplus: "CompTIA Security+",
  "comptia security+": "CompTIA Security+",
  "security+": "CompTIA Security+",
  "sec+": "CompTIA Security+",

  "comptia_network+": "CompTIA Network+",
  comptia_networkplus: "CompTIA Network+",
  "comptia network+": "CompTIA Network+",
  "network+": "CompTIA Network+",
  "net+": "CompTIA Network+",

  "comptia_a+": "CompTIA A+",
  comptia_aplus: "CompTIA A+",
  "comptia a+": "CompTIA A+",
  "a+": "CompTIA A+",

  "comptia_cysa+": "CompTIA CySA+",
  comptia_cysaplus: "CompTIA CySA+",
  "comptia cysa+": "CompTIA CySA+",
  "cysa+": "CompTIA CySA+",
  "certified cybersecurity analyst (cysa+)": "CompTIA CySA+",

  "comptia_linux+": "CompTIA Linux+",
  comptia_linuxplus: "CompTIA Linux+",
  "comptia linux+": "CompTIA Linux+",
  "linux+": "CompTIA Linux+",

  "comptia_pentest+": "CompTIA PenTest+",
  comptia_pentestplus: "CompTIA PenTest+",
  "comptia pentest+": "CompTIA PenTest+",
  "pentest+": "CompTIA PenTest+",

  "comptia_casp+": "CompTIA CASP+",
  "casp+": "CompTIA CASP+",

  // CISSP variations
  cissp: "CISSP",
  "(isc)2 cissp": "CISSP",
  "(isc)² cissp": "CISSP",
  "certified information systems security professional": "CISSP",

  // CEH variations
  ceh: "CEH",
  "ceh (certified ethical hacker)": "CEH",
  "certified ethical hacker": "CEH",

  // CCNA/CCNP variations
  ccna: "Cisco CCNA",
  "cisco ccna": "Cisco CCNA",
  "cisco certified network associate": "Cisco CCNA",
  ccnp: "Cisco CCNP",
  "ccnp enterprise": "Cisco CCNP Enterprise",

  // PMP variations
  pmp: "PMP",
  "project management professional": "PMP",

  // ITIL variations
  itil: "ITIL 4 Foundation",
  "itil 4": "ITIL 4 Foundation",
  "itil foundation": "ITIL 4 Foundation",

  // AWS variations
  aws_cloud_practitioner: "AWS Cloud Practitioner",
  "aws cloud practitioner": "AWS Cloud Practitioner",
  "aws certified cloud practitioner": "AWS Cloud Practitioner",
  "aws solutions architect associate": "AWS Solutions Architect – Associate",
  "aws certified solutions architect – associate":
    "AWS Solutions Architect – Associate",
  "aws certified sysops administrator": "AWS SysOps Administrator – Associate",
  "aws certified sysops administrator – associate":
    "AWS SysOps Administrator – Associate",

  // Azure variations
  "azure fundamentals": "Azure Fundamentals (AZ-900)",
  "azure administrator associate": "Azure Administrator Associate",

  // OSHA variations
  "osha 30": "OSHA 30-Hour",
  "osha 30 hour": "OSHA 30-Hour",
  "osha 30-hour": "OSHA 30-Hour",
  "osha 10": "OSHA 10-Hour",
  "osha 10 hour": "OSHA 10-Hour",
  "osha 10-hour": "OSHA 10-Hour",

  // FAA variations
  "faa a&p": "FAA A&P",
  "faa airframe & powerplant": "FAA A&P",
  "faa airframe and powerplant": "FAA A&P",
  "a&p": "FAA A&P",

  // Medical certifications
  bls: "BLS",
  "basic life support": "BLS",
  acls: "ACLS",
  "advanced cardiovascular life support": "ACLS",
  pals: "PALS",
  "pediatric advanced life support": "PALS",

  // Supply chain certifications
  "apics cscp": "APICS CSCP",
  cscp: "APICS CSCP",
  "apics cltd": "APICS CLTD",
  cltd: "APICS CLTD",

  // Security certifications (non-IT)
  cpp: "CPP",
  "certified protection professional": "CPP",
  psp: "PSP",
  "physical security professional": "PSP",

  // BICSI variations
  "bicsi installer": "BICSI Installer",
  "bicsi installer certification": "BICSI Installer",
  "bicsi technician": "BICSI Technician",
  "bicsi cabling certifications": "BICSI Installer",
};

/**
 * Normalize a certification name to a consistent format
 * @param cert - The certification name to normalize
 * @returns The normalized certification name
 */
export function normalizeCert(cert: string): string {
  if (!cert) return cert;

  // Check exact match first (case-insensitive)
  const lowerCert = cert.toLowerCase().trim();
  if (CERT_NORMALIZATIONS[lowerCert]) {
    return CERT_NORMALIZATIONS[lowerCert];
  }

  // Clean up common formatting issues
  let normalized = cert
    // Replace underscores with spaces
    .replace(/_/g, " ")
    // Fix multiple spaces
    .replace(/\s+/g, " ")
    // Trim whitespace
    .trim();

  // Check again after cleanup
  const cleanedLower = normalized.toLowerCase();
  if (CERT_NORMALIZATIONS[cleanedLower]) {
    return CERT_NORMALIZATIONS[cleanedLower];
  }

  return normalized;
}

/**
 * Normalize an array of certification names
 * @param certs - Array of certification names
 * @returns Array of normalized certification names (deduplicated)
 */
export function normalizeCerts(certs: string[]): string[] {
  if (!certs || !Array.isArray(certs)) return [];

  const normalized = certs.map(normalizeCert);

  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  return normalized.filter((cert) => {
    const lower = cert.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}
