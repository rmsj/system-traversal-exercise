'use client'

import { useEffect, useState } from 'react'
import {
    getSystemsByParentID,
    getAllInterfaces,
    deleteSystemInterface,
    SystemInterfaceRow
} from '@/lib/supabase'
import SystemInterfaceModal from './SystemInterfaceForm'
import {InterfacesData} from "@/types/supabase";

interface Props {
    currentSystemId: number
}

export default function SystemInterfacesTable({ currentSystemId }: Props) {
    const [systemInterfaces, setSystemInterfaces] = useState<InterfacesData[]>([])
    const [sistemIds, setSystemIds] = useState<number[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editingInterface, setEditingInterface] = useState<SystemInterfaceRow | null>(null)


    const loadChildren = async () => {
        const result = await getAllInterfaces(currentSystemId)
        if (result){
            setSystemInterfaces(result)
            const ids: number[] = [currentSystemId]
            const children = await getSystemsByParentID(currentSystemId)
            ids.push(...children.map(c => c.id))
            setSystemIds(ids)
        }
    }

    useEffect(() => {
        loadChildren()
    }, [currentSystemId])

    const handleDelete = async (sourceId: number, targetId: number) => {
        if (!confirm('Are you sure you want to delete this system interface?')) return
        await deleteSystemInterface(sourceId, targetId)
        loadChildren()
    }

    return (
        <div className="mt-0 overflow-x-auto" style={{ maxHeight: '33vh' }}>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">System Interfaces</h2>
                <button
                    onClick={() => { setEditingInterface(null); setShowModal(true) }}
                    className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700"
                >
                    + Add Interface
                </button>
            </div>

            <table className="w-full border border-gray-400 text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="p-2 border text-gray-600 text-left">System</th>
                    <th className="p-2 border text-gray-600 text-left">Conn Type</th>
                    <th className="p-2 border text-gray-600 text-left">Directional</th>
                    <th className="p-2 border text-gray-600 text-left">Other System</th>
                    <th className="p-2 border text-gray-600">Action</th>
                </tr>
                </thead>
                <tbody>
                {systemInterfaces.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center p-4 text-gray-700">No child systems found.</td>
                    </tr>
                )}
                {systemInterfaces.map((iface) => {
                    const isSource = sistemIds.includes(iface.source_system_id)
                    return (
                        <tr key={iface.source_system_id + "_" + iface.target_system_id } className="hover:bg-gray-50">
                            <td className="pl-2 pt-1 pb-1 border text-gray-700">{isSource ? iface.source.name : iface.target.name}</td>
                            <td className="pl-2 pt-1 pb-1 border text-gray-700">{iface.connection_type}</td>
                            <td className="pl-2 pt-1 pb-1 border text-gray-700">{iface.directional === 1 ? 'Directed' : 'Undirected'}</td>
                            <td className="pl-2 pt-1 pb-1 border text-gray-700">{!isSource ? iface.target.name : iface.source.name}</td>
                            <td className="pl-2 pt-1 pb-1 border text-center space-x-2 text-gray-700">
                                <button
                                    onClick={() => { setEditingInterface(iface); setShowModal(true) }}
                                    className="bg-blue-200 text-blue-600 hover:bg-blue-300 text-xs px-1 py-0.5 cursor-pointer rounded-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(iface.source_system_id, iface.target_system_id)}
                                    className="bg-red-200 text-red-600 hover:bg-red-300 text-xs px-1 py-0.5 cursor-pointer rounded-sm"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>

            <SystemInterfaceModal
                currentSystemId={currentSystemId}
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                editingInterface={editingInterface}
                onSuccess={loadChildren}
            />
        </div>
    )
}