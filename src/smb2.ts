export {default as PATCH_REV_0_TO_REV_A} from "./assets/Rev0ToRevA.bps.js";
export {default as PATCH_REV_A_TO_REV_0} from "./assets/RevAToRev0.bps.js";

export const TYPE_REV_0 = Symbol("Rev 0");
export const TYPE_REV_A = Symbol("Rev A");

export const REV_0_CRC = 0x7d3f6f3d;
export const REV_0_NES2_CRC = 0x43507232;
export const REV_A_CRC = 0xe0ca425c;

export interface SMB2Version {
    name: string;
    revision: symbol;
    unheaderedCode: number;
    header: number[];
}

export const REV_0: SMB2Version = {
    name: "Super Mario Bros. 2 (U) (PRG0) [!].nes",
    revision: TYPE_REV_0,
    unheaderedCode: 0x57ac67af,
    header: [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x10, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
};

export const REV_0_NES2: SMB2Version = {
    name: "Super Mario Bros. 2 (USA).nes",
    revision: TYPE_REV_0,
    unheaderedCode: 0x57ac67af,
    header: [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x10, 0x40, 0x08, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x01],
};

export const REV_A: SMB2Version = {
    name: "Super Mario Bros. 2 (USA) (Rev A).nes",
    revision: TYPE_REV_A,
    unheaderedCode: 0xca594ace,
    header: [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x10, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
};

export const VERSIONS: Map<number, SMB2Version> = new Map([
    [REV_0_CRC, REV_0],
    [REV_0_NES2_CRC, REV_0_NES2],
    [REV_A_CRC, REV_A],
]);
