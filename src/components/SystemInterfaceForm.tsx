'use client'

import { useEffect, useState } from 'react'
import {
    SystemInsert,
    SystemRow,
    SystemUpdate,
    insertSystem,
    updateSystem,
    SystemInterfaceRow,
    SystemInterfaceUpdate, SystemInterfaceInsert, insertSystemInterface, updateSystemInterface
} from '@/lib/supabase'
import {InterfacesData} from "@/types/supabase";

interface Props {
    isOpen: boolean
    onClose: () => void
    editingInterface?: InterfacesData | null
    onSuccess: () => void
}

export default function SystemInterfaceModal({
                                        isOpen,
                                        onClose,
                                        editingInterface = null,
                                        onSuccess,
                                    }: Props) {
    const [formData, setFormData] = useState({ connection_type: '', directional: 1 })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const isEditing = Boolean(editingInterface)

    useEffect(() => {
        if (isOpen && editingInterface) {
            setFormData({ connection_type: editingInterface.connection_type, directional: editingInterface.directional })
        } else {
            setFormData({ connection_type: '', directional: 1 })
        }
    }, [isOpen, editingInterface])

    const validate = () => {
        const { connection_type, directional } = formData
        if (connection_type.length < 2 || connection_type.length > 50) return 'Connection type must be between 2 and 50 characters.'
        if (directional != 1 && directional != 2) return 'Directional must be directed or undirected.'
        return null
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validate()
        if (validationError) {
            setError(validationError)
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            if (isEditing && editingInterface) {
                const updates: SystemInterfaceUpdate = {
                    connection_type: formData.connection_type,
                    directional: formData.directional,
                    source_system_id: editingInterface.source_system_id,
                    target_system_id: editingInterface.target_system_id,
                }
                await updateSystemInterface(editingInterface.source_system_id, editingInterface.target_system_id, updates)
            } else {
                const insert = {
                    connection_type: formData.connection_type,
                    directional: formData.directional,
                    source_system_id: editingInterface?.source_system_id ?? null,
                    target_system_id: editingInterface?.target_system_id ?? null,
                }
                await insertSystemInterface(insert as SystemInterfaceInsert)
            }

            onSuccess()
            onClose()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
            setTimeout(function() { setError(null); }, 5000);
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">{isEditing ? 'Edit System Interface' : 'Add New System Interface'}</h2>

                {success && <div
                    className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50"
                    role="alert">
                    <span className="font-medium">Success!</span> System Interface Saved.
                </div>
                }
                {error && <div
                    className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
                    role="alert">
                    <span className="font-medium">Danger!</span> { error }
                </div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">System Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border text-gray-900 text-sm border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md text-gray-900 border border-gray-300 p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {parentSystem && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Parent System</label>
                            <input
                                type="text"
                                readOnly
                                value={parentSystem.name}
                                className="mt-1 block w-full bg-gray-100 rounded-md border border-gray-300 p-2 text-sm text-gray-700"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
