export type InterfacesData = {
    source_system_id: number;
    target_system_id: number;
    connection_type: string;
    directional: number;
    source: {
        id: number;
        name: string;
        category: string;
        parent_id: number | null;
    };
    target: {
        id: number;
        name: string;
        category: string;
        parent_id: number | null;
    };
}