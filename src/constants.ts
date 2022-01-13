export enum ERRORS {
  SERVER_NOT_STARTED = 'SERVER_NOT_STARTED',
}

// Maximum number of requests allowed for any external API calls like for the
// Google Sheets FL list or the YGOPRO API
export const MAX_REQUEST_ATTEMPTS = 3;

export enum LEGALITY {
  FORBIDDEN = 0,
  LIMITED = 1,
  SEMILIMITED = 2,
  UNLIMITED = 3,
}

export const SHONEN_JUMP_CUTOFF = 69;
export const YCSW_CUTOFF = 7;
export const LEGAL_SETS: Record<string, boolean> = {
  // Standard sets
  LOB: true,
  MRD: true,
  SRL: true,
  PSV: true,
  LON: true,
  LOD: true,
  PGD: true,
  MFC: true,
  DCR: true,
  IOC: true,
  AST: true,
  SOD: true,
  RDS: true,
  DB1: true,
  FET: true,
  DR1: true,
  TLM: true,
  DB2: true,
  CRV: true,
  EEN: true,
  DR2: true,
  SOI: true,
  EOJ: true,
  POTD: true,
  CDIP: true,
  DR3: true,
  STON: true,
  FOTB: true,
  TAEV: true,
  GLAS: true,
  PP01: true,
  PTDN: true,
  DR04: true,
  LODT: true,
  TDGS: true,
  CSOC: true,
  PP02: true,
  CRMS: true,
  RGBT: true,
  ANPR: true,
  SOVR: true,
  HA01: true,
  ABPF: true,
  TSHD: true,
  DREV: true,
  STBL: true,
  HA02: true,
  HA03: true,
  STOR: true,
  EXVC: true,
  GENF: true,
  PHSW: true,
  HA04: true,
  HA05: true,
  YMP1: true,
  ORCS: true,
  GAOV: true,
  REDU: true,
  ABYR: true,
  HA06: true,
  BP01: true,
  CBLZ: true,
  HA07: true,
  LTGY: true,
  NUMH: true,
  BP02: true,
  JOTL: true,
  SHSP: true,
  LVAL: true,
  DRLG: true,
  PRIO: true,
  BP03: true,
  DUEA: true,
  // Duelist Packs
  DP1: true,
  DP2: true,
  DP03: true,
  DP04: true,
  DP05: true,
  DP06: true,
  DP07: true,
  DP08: true,
  DP09: true,
  DP10: true,
  DPKB: true,
  DP11: true,
  DPYG: true,
  // Starter Decks
  SDJ: true,
  SDK: true,
  SKE: true,
  SDP: true,
  SDY: true,
  SYE: true,
  YSD: true,
  YSDJ: true,
  YSDS: true,
  '5DS1': true,
  '5DS2': true,
  '5DS3': true,
  YS11: true,
  YS12: true,
  YS13: true,
  YSYR: true,
  YSKR: true,
  YS14: true,
  // Structure decks
  SD1: true,
  SD2: true,
  SD3: true,
  SD4: true,
  SD5: true,
  SD6: true,
  SD7: true,
  SD8: true,
  SD09: true,
  SD10: true,
  SDRL: true,
  SDDE: true,
  SDZW: true,
  SDSC: true,
  SDWS: true,
  SDMM: true,
  SDMA: true,
  SDDL: true,
  SDLS: true,
  SDGU: true,
  SDDC: true,
  SDWA: true,
  SDRE: true,
  SDOK: true,
  SDBE: true,
  SDCR: true,
  SDLI: true,
  // Legendary collections
  LC01: true,
  LC02: true,
  LCGX: true,
  LC03: true,
  LCYW: true,
  LC04: true,
  LCJW: true,
  // Gold series
  GLD1: true,
  GLD2: true,
  GLD3: true,
  GLD4: true,
  GLD5: true,
  PGLD: true,
  // Shonen Jump promos
  JMP: true,
  SJC: true,
  SJCS: true,
  // Manga promos
  YR01: true,
  YR02: true,
  YR03: true,
  YR04: true,
  YR05: true,
  YG01: true,
  YG02: true,
  YG03: true,
  YG04: true,
  YG05: true,
  YG06: true,
  YG07: true,
  YG08: true,
  YG09: true,
  YF01: true,
  YF02: true,
  YF03: true,
  YF04: true,
  YF05: true,
  YF06: true,
  YZ01: true,
  YZ02: true,
  YZ03: true,
  YZ04: true,
  YZ05: true,
  // Game promos
  PCY: true,
  PCK: true,
  PCJ: true,
  TSC: true,
  GX1: true,
  GX02: true,
  GX03: true,
  GX04: true,
  GX05: true,
  NTR: true,
  DOR: true,
  DDS: true,
  SDD: true,
  DBT: true,
  CMC: true,
  FMR: true,
  EDS: true,
  DOD: true,
  ROD: true,
  TFK: true,
  WC4: true,
  WC5: true,
  WC6: true,
  WC07: true,
  WC08: true,
  WC09: true,
  WB01: true,
  // Other promos
  ZTIN: true,
  PRC1: true,
  EM1: true,
  PT1: true,
  PT02: true,
  PT03: true,
  FL1: true,
  DMG: true,
  YMA: true,
  MP1: true,
  MDP2: true,
  MOV: true,
  DPK: true,
  GSE: true,
  UE02: true,
  TKN1: true,
  TKN2: true,
  TKN3: true,
  YCB: true,
  UBP1: true,
  MF01: true,
  MF02: true,
  MF03: true,
  TYL: true,
  SAAS: true,
  SP1: true,
  SP2: true,
  SP02: true,
};
