import {
    getSystemById,
    SystemRow,
} from "@/lib/supabase";
import {useEffect, useState} from "react";
import ChildSystemsTable from "@/components/ChildSystemTable";
import SystemFormModal from '@/components/SystemForm';
import SystemInterfacesTable from "@/components/SystemInterfacesTable";

interface Props {
    currentSystemId: number | null;
    onSystemChange: (newID: number | null) => void;
    onUpdate: () => void;
}

export default function CurrentSystem({currentSystemId, onSystemChange, onUpdate}: Props) {

    const [system, setSystem] = useState<SystemRow | null>(null);
    const [parentSystem, setParentSystem] = useState<SystemRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isNewOpen, setIsNewOpen] = useState(false);

    useEffect(() => {
        if (currentSystemId) {
            getSystemById(currentSystemId).then(sys => {
                setSystem(sys);
                if (sys?.parent_id) {
                    getSystemById(sys.parent_id).then(setParentSystem);
                }
            }).finally(() => setLoading(false));
        }
    }, [currentSystemId]);

    const refreshSystem = async (newID: number) => {
        const idToUse = newID ?? currentSystemId;
        const updated = await getSystemById(idToUse);
        setSystem(updated);
        if (updated?.parent_id) {
            const parent = await getSystemById(updated.parent_id);
            setParentSystem(parent);
        }
        if (idToUse !== currentSystemId) {
            onSystemChange(idToUse);
        }
    }

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-semibold text-gray-900">Current System Details</h1>

                    {!system && <div className="p-4 text-red-600">No System selected</div>}

                    {system && <button
                        onClick={() => setIsEditOpen(true)}
                        className="px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Edit
                    </button>}
                    <button
                        onClick={() => { setIsNewOpen(true); }}
                        className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700"
                    >
                        + Add
                    </button>
                </div>

                {system && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-600">System ID: <span className="text-base font-medium text-gray-900">{system.id}</span></div>

                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Name: <span className="text-base font-medium text-gray-900">{system.name}</span></div>

                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Category: <span className="text-base font-medium text-gray-900">{system.category}</span></div>

                    </div>
                    {system.parent_id && parentSystem && (
                        <div>
                            <div className="text-sm text-gray-500">Parent System: <span className="text-base text-gray-700">{parentSystem.name}</span></div>
                        </div>
                    )}
                </div>}
            </div>

            {system && <div className="bg-white shadow rounded-lg p-6 mb-6">
                <ChildSystemsTable
                    parentSystem={system}
                    onSystemChange={onSystemChange}
                    onUpdate={onUpdate}
                />
            </div>}

            {system && <div className="bg-white shadow rounded-lg p-6 mb-6">
                <SystemInterfacesTable
                    currentSystemId={system.id}
                    onSystemChange={onSystemChange}
                    onUpdate={onUpdate}
                />
            </div>}

            <SystemFormModal
                isOpen={isEditOpen || isNewOpen}
                onClose={() => {
                    setIsEditOpen(false)
                    setIsNewOpen(false)
                }}
                onSuccess={(newID: number) => {
                    setIsEditOpen(false)
                    setIsNewOpen(false)
                    refreshSystem(newID)
                }}
                editingSystem={isNewOpen ? null : system}
                parentSystem={isNewOpen ? null : parentSystem}
            />
        </div>
    );
}
