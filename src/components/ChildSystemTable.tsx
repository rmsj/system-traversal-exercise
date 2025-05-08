'use client'

import { useEffect, useState } from 'react'
import { SystemRow, deleteSystem, getDescendents } from '@/lib/supabase'
import SystemModal from './SystemForm'

interface Props {
    parentSystem: SystemRow
}

export default function ChildSystemsTable({ parentSystem }: Props) {
    const [children, setChildren] = useState<SystemRow[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editingSystem, setEditingSystem] = useState<SystemRow | null>(null)

    const loadChildren = async () => {
        const result = await getDescendents(parentSystem.id)
        setChildren(result)
    }

    useEffect(() => {
        loadChildren()
    }, [parentSystem.id])

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this system?')) return
        await deleteSystem(id)
        loadChildren()
    }

    return (
        <div className="mt-0 overflow-x-auto" style={{ maxHeight: '33vh' }}>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Child Systems</h2>
                <button
                    onClick={() => { setEditingSystem(null); setShowModal(true) }}
                    className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700"
                >
                    + Add Child
                </button>
            </div>

            <table className="w-full border border-gray-400 text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="p-2 border text-gray-600 text-left">Name</th>
                    <th className="p-2 border text-gray-600 text-left">Category</th>
                    <th className="p-2 border text-gray-600">Action</th>
                </tr>
                </thead>
                <tbody>
                {children.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center p-4 text-gray-700">No child systems found.</td>
                    </tr>
                )}
                {children.map((child) => (
                    <tr key={child.id} className="hover:bg-gray-50">
                        <td className="pl-2 pt-1 pb-1 border text-gray-700">{child.name}</td>
                        <td className="pl-2 pt-1 pb-1 border text-gray-700">{child.category}</td>
                        <td className="pl-2 pt-1 pb-1 border text-center space-x-2 text-gray-700">
                            <button
                                onClick={() => { setEditingSystem(child); setShowModal(true) }}
                                className="bg-blue-200 text-blue-600 hover:bg-blue-300 text-xs px-1 py-0.5 cursor-pointer rounded-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(child.id)}
                                className="bg-red-200 text-red-600 hover:bg-red-300 text-xs px-1 py-0.5 cursor-pointer rounded-sm"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>


            <SystemModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                parentSystem={parentSystem}
                editingSystem={editingSystem}
                onSuccess={loadChildren}
            />
        </div>
    )
}