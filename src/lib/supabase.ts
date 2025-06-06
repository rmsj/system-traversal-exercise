/**
 * Supabase client configuration
 * Generated by Roo
 */
import { createClient } from '@supabase/supabase-js';
import type {Database} from '@/types/supabase';
import type {InterfacesData} from '@/types/interface';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export type SystemInsert = Database['public']['Tables']['systems']['Insert'];
export type SystemUpdate = Database['public']['Tables']['systems']['Update'];
export type SystemRow = Database['public']['Tables']['systems']['Row'];

export type SystemInterfaceInsert = Database['public']['Tables']['system_interfaces']['Insert'];
export type SystemInterfaceUpdate = Database['public']['Tables']['system_interfaces']['Update'];
export type SystemInterfaceRow = Database['public']['Tables']['system_interfaces']['Row'];

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// getSystemById gets a system by id
export async function getSystemById(id: number): Promise<SystemRow | null> {
    const { data, error } = await supabase
        .from('systems')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Fetch failed:', error.message);
        return null;
    }

    return data;
}

// getDescendents gets all children and grandchildren of a parent system
export async function getDescendents(parentID: number): Promise<SystemRow[]> {
    const data = await getCurrentSystemAndDescendents(parentID);

    if (data.length === 0) {
        return [];
    }

    return data.filter(d => d.id !== parentID);
}

// getCurrentSystemAndDescendents gets the current system, children and grandchildren
export async function getCurrentSystemAndDescendents(systemId: number): Promise<SystemRow[]> {

    const { data, error } = await supabase
        .from('systems')
        .select('*')
        .or(`id.eq.${systemId},parent_id.eq.${systemId}`)
        .order('id', {
            ascending: false,
        })

    if (error) {
        console.error('Fetch all current and children systems failed:', error.message)
        return []
    }
    // get ids for all children
    const ids = []
    ids.push(...data.filter(d => d.parent_id).map(d => d.id))

    // there is nothing more to search
    if (ids.length == 0) {
        return data
    }

    const orConditions = ids.map(id => `parent_id.eq.${id}`).join(',');

    const { data: grandChildren, error: gcError } = await supabase
        .from('systems')
        .select('*')
        .or(orConditions)
        .order('id', { ascending: false });
    if (gcError) {
        console.error('Fetch all grandchildren systems failed:', gcError.message)
        return []
    }


    console.log('DATA', data);
    console.log('grandChildren', grandChildren);

    // deduplicate using Map keyed by ID
    const all = [...data, ...(grandChildren || [])];
    const unique = new Map<number, SystemRow>();
    all.forEach(system => unique.set(system.id, system));

    return Array.from(unique.values());
}

// getAllSystems returns all systems
export async function getAllSystems(): Promise<SystemRow[]> {
    const { data, error } = await supabase
        .from('systems')
        .select('*');

    if (error) {
        console.error('Fetch all failed:', error.message);
        return [];
    }

    return data;
}

// getTopLevelSystemsAndChildren return all top layer systems for the initial state of the diagram and it's children (no grandchildren)
export async function getTopLevelSystemsAndChildren(): Promise<SystemRow[]> {
    const ids = [];
    const topLevelSystems= await getTopLevelSystems();
    ids.push(...topLevelSystems.map(tl => tl.id));

    // there is nothing more to search
    if (ids.length == 0) {
        return topLevelSystems;
    }

    // build OR query string for children
    const orConditions = [
        ...ids.map(id => `parent_id.eq.${id}`)
    ].join(',');

    const { data: children, error } = await supabase
        .from('systems')
        .select('*')
        .or(orConditions)
        .order('id', { ascending: false });

    if (error) {
        console.error('Fetch all top layer systems with children failed:', error.message);
        return [];
    }

    // deduplicate using Map keyed by ID
    const all = [...topLevelSystems, ...(children || [])];
    const unique = new Map<number, SystemRow>();
    all.forEach(system => unique.set(system.id, system));

    return Array.from(unique.values());
}

// getAllInterfacesForSystemAndDescendants gets all interfaces between a system and it's descendants'
export async function getAllInterfacesForSystemAndDescendants(systemId : number):Promise<InterfacesData[] | null> {

    const ids = [];
    const children = await getCurrentSystemAndDescendents(systemId);
    ids.push(...children.map(c => c.id));

    // build OR query string for children
    const orConditions = [
        ...ids.map(id => `source_system_id.eq.${id}`),
        ...ids.map(id => `target_system_id.eq.${id}`)
    ].join(',');

    const { data, error } = await supabase
        .from('system_interfaces')
        .select(`
    source_system_id,
    target_system_id,
    connection_type,
    directional,
    source:source_system_id ( id, name, category, parent_id ),
    target:target_system_id ( id, name, category, parent_id )
  `)
        .or(orConditions);

    if (error) {
        console.error('Error fetching interfaces:', error);
        return null;
    }

    // TS is not helping here ...
    return data as unknown as InterfacesData[];
}

// getTopLevelInterfacesAndDescendants gets all top-level interfaces and their descendants
export async function getTopLevelInterfacesAndDescendants(): Promise<InterfacesData[]> {
    const ids = [];
    const topLevelAndChildren= await getTopLevelSystemsAndChildren();
    ids.push(...topLevelAndChildren.map(tl => tl.id));

    if (ids.length == 0) {
        return [];
    }

    // build OR condition for interfaces between top-level systems and their descendants
    const orConditions = [
        ...ids.map(id => `source_system_id.eq.${id}`),
        ...ids.map(id => `target_system_id.eq.${id}`)
    ].join(',');

    const { data, error } = await supabase
        .from('system_interfaces')
        .select(`
      source_system_id,
      target_system_id,
      connection_type,
      directional,
      source:source_system_id ( id, name, category, parent_id ),
      target:target_system_id ( id, name, category, parent_id )
    `)
        .or(orConditions);

    if (error) {
        console.error('Error fetching top-level interfaces:', error);
        return [];
    }

    // TS is not helping here ...
    return data as unknown as InterfacesData[];
}

// return all top layer systems for the initial state of the diagram
async function getTopLevelSystems(): Promise<SystemRow[]> {
    const { data, error } = await supabase
        .from('systems')
        .select('*')
        .is('parent_id', null);

    if (error) {
        console.error('Fetch all top layer systems failed:', error.message);
        return [];
    }

    return data;
}

// TODO: maybe move these CUD functions to a separate file - closer to the components using them...
// TODO: to implement transaction, we might need stored procedures in the database, see https://supabase.com/docs/guides/transactions

export async function insertSystem(data: SystemInsert): Promise<SystemRow> {

    const { data: result, error } = await supabase.rpc('create_system', {
        p_parent_id: data.parent_id,
        p_name: data.name,
        p_category: data.category,
    });

    if (error) {
        console.error('insert system failed:', error.message);
        throw error;
    }

    return result;
}



export async function updateSystem(id: number, updates: SystemUpdate): Promise<SystemRow> {

    const { data, error } = await supabase.rpc('update_system', {
        p_id: id,
        p_name: updates.name,
        p_category: updates.category,
    });

    if (error) {
        console.error('update system failed:', error.message);
        throw error;
    }

    return data;
}

export async function deleteSystem(id: number): Promise<boolean> {
    const { error } = await supabase.rpc('delete_system', {
        p_id: id,
    });

    if (error) {
        console.error('Delete system failed:', error.message);
        throw error;
    }

    return true;
}

export async function insertSystemInterface(data: SystemInterfaceInsert):Promise<SystemInterfaceRow> {
    const { data: result, error } = await supabase.rpc('create_interface', {
        p_source_id: data.source_system_id,
        p_target_id: data.target_system_id,
        p_connection_type: data.connection_type,
        p_directional: data.directional,
    });

    if (error) {
        console.error('Insert system interface failed:', error.message);
        throw error;
    }

    return result;
}

export async function updateSystemInterface(sourceId : number, targetId : number, updates: SystemInterfaceUpdate): Promise<SystemInterfaceRow> {
    const { data, error } = await supabase.rpc('update_interface', {
        p_source_id: sourceId,
        p_target_id: targetId,
        p_connection_type: updates.connection_type,
        p_directional: updates.directional,
    });

    if (error) {
        console.error('update system interface failed:', error.message);
        throw error;
    }

    return data;
}

export async function deleteSystemInterface(sourceId : number, targetId : number): Promise<boolean> {
    const { error } = await supabase.rpc('delete_interface', {
        p_source_id: sourceId,
        p_target_id: targetId
    });

    if (error) {
        console.error('delete system interface failed:', error.message);
        throw error;
    }

    return true;
}