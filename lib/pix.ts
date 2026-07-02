// Generador de Pix "Copia e Cola" (BR Code / EMV) — sin gateway, sin comisión.
// Estándar EMV-QRCPS del Banco Central: campos TLV + CRC-16/CCITT-FALSE.

function tlv(id: string, valor: string) {
  const len = valor.length.toString().padStart(2, "0");
  return `${id}${len}${valor}`;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) sobre todo el payload + "6304".
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(txt: string, max: number) {
  return txt
    .normalize("NFD") // decompõe acentos (é -> e + marca)
    .replace(/[^A-Za-z0-9 ]/g, "") // remove marcas e símbolos
    .toUpperCase()
    .slice(0, max);
}

export function gerarPixCopiaECola(params: {
  chave: string;
  nome: string;
  cidade: string;
  valor?: number; // opcional -> Pix de valor abierto
  txid?: string; // identificador (hasta 25), default "***"
  descricao?: string;
}) {
  const { chave, nome, cidade, valor, txid = "***", descricao } = params;

  // Merchant Account Information (GUI Pix + chave + descripción opcional)
  const mai =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", chave) +
    (descricao ? tlv("02", sanitize(descricao, 40)) : "");

  const payloadSemCRC =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", valor ? "12" : "11") + // 12 = dinâmico p/ valor fixo lido, 11 = estático
    tlv("26", mai) +
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda BRL
    (valor ? tlv("54", valor.toFixed(2)) : "") +
    tlv("58", "BR") +
    tlv("59", sanitize(nome, 25)) +
    tlv("60", sanitize(cidade, 15)) +
    tlv("62", tlv("05", sanitize(txid, 25) || "***")) +
    "6304"; // ID + len del CRC

  return payloadSemCRC + crc16(payloadSemCRC);
}
