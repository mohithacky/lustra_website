'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Loader2, X, ChevronDown, ChevronRight } from 'lucide-react'

interface FooterData {
  [column: string]: string[]
}

interface FooterEditorProps {
  userId: string
  shopDomain: string
}

const DEFAULT_FOOTER: FooterData = {
  'About': ['Our Story', 'Our Shop', 'Careers', 'Press'],
  'Shop': [],
  'Customer Care': ['FAQs', 'Contact Us', 'Shipping & Returns', 'Warranty'],
}

export default function FooterEditor({ userId, shopDomain }: FooterEditorProps) {
  const router = useRouter()
  const [footerData, setFooterData] = useState<FooterData>(DEFAULT_FOOTER)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedColumns, setExpandedColumns] = useState<string[]>(['About', 'Shop', 'Customer Care'])
  const [newLinkInputs, setNewLinkInputs] = useState<{ [column: string]: string }>({})

  useEffect(() => {
    loadFooterData()
  }, [])

  const loadFooterData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/editor/footer?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.footer && Object.keys(data.footer).length > 0) {
          setFooterData(data.footer)
        }
      }
    } catch (error) {
      console.error('Error loading footer data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveFooterData = async (newData: FooterData) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/editor/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, footer: newData }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving footer:', error)
      alert('Failed to save footer data')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleColumn = (column: string) => {
    setExpandedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  const handleAddLink = async (column: string) => {
    const newLink = newLinkInputs[column]?.trim()
    if (!newLink) return

    const newData = {
      ...footerData,
      [column]: [...(footerData[column] || []), newLink],
    }
    setFooterData(newData)
    setNewLinkInputs(prev => ({ ...prev, [column]: '' }))
    await saveFooterData(newData)
  }

  const handleDeleteLink = async (column: string, linkIndex: number) => {
    const newLinks = [...(footerData[column] || [])]
    newLinks.splice(linkIndex, 1)
    
    const newData = {
      ...footerData,
      [column]: newLinks,
    }
    setFooterData(newData)
    await saveFooterData(newData)
  }

  const handleAddColumn = async () => {
    const columnName = prompt('Enter new column name:')
    if (!columnName?.trim()) return

    const newData = {
      ...footerData,
      [columnName.trim()]: [],
    }
    setFooterData(newData)
    setExpandedColumns(prev => [...prev, columnName.trim()])
    await saveFooterData(newData)
  }

  const handleDeleteColumn = async (column: string) => {
    if (!confirm(`Delete "${column}" column? This cannot be undone.`)) return

    const newData = { ...footerData }
    delete newData[column]
    setFooterData(newData)
    await saveFooterData(newData)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-black">Edit Footer</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage footer links and columns
              </p>
            </div>
          </div>
          <button
            onClick={handleAddColumn}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Column
          </button>
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <div className="fixed top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </div>
        )}

        {/* Footer Columns */}
        <div className="space-y-4">
          {Object.entries(footerData).map(([column, links]) => (
            <div key={column} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Column Header */}
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleColumn(column)}
              >
                <div className="flex items-center gap-3">
                  {expandedColumns.includes(column) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <h3 className="font-semibold text-gray-900">{column}</h3>
                  <span className="text-sm text-gray-500">({links.length} links)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteColumn(column)
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Column Content */}
              {expandedColumns.includes(column) && (
                <div className="p-4">
                  {/* Links List */}
                  <div className="space-y-2 mb-4">
                    {links.map((link, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700">{link}</span>
                        <button
                          onClick={() => handleDeleteLink(column, index)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {links.length === 0 && (
                      <p className="text-gray-400 text-sm italic">No links in this column</p>
                    )}
                  </div>

                  {/* Add Link Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLinkInputs[column] || ''}
                      onChange={(e) => setNewLinkInputs(prev => ({ ...prev, [column]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLink(column)}
                      placeholder="Add new link..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleAddLink(column)}
                      disabled={!newLinkInputs[column]?.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-gray-900 rounded-xl p-8">
          <h3 className="text-white font-semibold mb-6">Footer Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerData).map(([column, links]) => (
              <div key={column}>
                <h4 className="text-white font-medium mb-3">{column}</h4>
                <ul className="space-y-2">
                  {links.map((link, index) => (
                    <li key={index} className="text-gray-400 text-sm hover:text-white cursor-pointer">
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
