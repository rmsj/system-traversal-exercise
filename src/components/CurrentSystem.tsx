import type {Database} from "@/types/supabase";
import {
    getSystemById, getSystemsByParentID,
    insertSystem,
    SystemInsert,
    SystemRow,
    SystemUpdate,
    updateSystem
} from "@/lib/supabase";
import {useEffect, useState} from "react";


export default function CurrentSystem(currentID: number) {

    const [formData, setFormData] = useState<Omit<SystemInsert, 'id'>>({
        name: '',
        category: '',
        parent_id: null,
    })

    const [systemID, setSystemID] = useState(currentID)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            if (systemID !== 0 && systemID !== null && systemID !== undefined) {
                await update(systemID, {
                        name: formData.name,
                        category: formData.category,
                    })
            } else {
                await add(formData as SystemInsert)
            }

            setSuccess(true)
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
        } finally {
            setLoading(false)
        }
    }

    const add = async (data: SystemInsert) => {
        return insertSystem(data);
    };

    const update = async (id: number, updates: SystemUpdate) => {
        return updateSystem(id, updates)
    };

    const getById = async (id: number): Promise<SystemRow | null> => {
        return getSystemById(id)
    }

    const getChildren = async(id: number): Promise<SystemRow[]> => {
        return getSystemsByParentID(id)
    }

    useEffect(() => {
        if (systemID !== 0 && systemID !== null && systemID !== undefined) {
            getById(systemID).then(value => {
                const system = value as SystemRow;
                setSystemID(system.id);
                setFormData(system);
                console.log(value);
            });

            // Get children for the current selected system
            getChildren(systemID).then(value => {
                console.log(value);
            });
        }
    }, [systemID]);

    return (
        <div>
            <h1 className="pl-7 text-2xl font-bold mb-4 text-gray-900 pb-0">Current System</h1>
            <form
                className="max-w-lg mx-auto pt-1 pb-3"
                onSubmit={handleSubmit}
            >
                <div className="grid gap-6 mb-1 md:grid-cols-2">
                    {success && <div
                        className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50"
                        role="alert">
                            <span className="font-medium">Success!</span> System Saved.
                    </div>
                    }
                    {error && <div
                        className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
                        role="alert">
                        <span className="font-medium">Danger!</span> { error }
                    </div>}

                    <div className="mb-2">
                        <label htmlFor="system-name" className="block mb-2 text-sm font-medium text-gray-900">System
                            Name</label>
                        <input type="text" id="system-name"
                               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                               value={formData.name}
                               onChange={handleChange}
                               required/>
                    </div>
                    <div className="mb-5 space-y-2">
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">System
                            Category</label>
                        <select id="countries"
                                onChange={handleChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">

                            <option selected={formData.category === 'Application'}>Application</option>
                            <option selected={formData.category === 'Service'}>Service</option>
                            <option selected={formData.category === 'Microservice'}>Microservice</option>
                            <option selected={formData.category === 'Database'}>Database</option>
                            <option selected={formData.category === 'API'}>API</option>
                            <option selected={formData.category === 'Storage'}>Storage</option>
                            <option selected={formData.category === 'Frontend'}>Frontend</option>
                            <option selected={formData.category === 'Backend'}>Backend</option>
                        </select>
                    </div>
                </div>
                <button type="submit"
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xs w-full sm:w-auto px-5 py-2.5 text-center">
                    {loading ? 'Saving...' : 'Save System'}
                </button>
            </form>
        </div>
)
}
