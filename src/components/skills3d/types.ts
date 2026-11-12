export interface Skill3DNode {
    id: string;
    name: string;
    categories: string[];
    color: string;
    isLead?: boolean;
}

export interface StudioThemeColors {
    isLight: boolean;
    sky: string;
    floor: string;
    floorAccent: string;
    wall: string;
    deskTop: string;
    deskLeg: string;
    chair: string;
    monitorShell: string;
    skin: string;
    shirt: string;
    pants: string;
    textPrimary: string;
}
