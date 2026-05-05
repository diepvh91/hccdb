/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Send, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  ChevronLeft,
  CheckCircle2,
  FileText,
  Video,
  Image as ImageIcon,
  Search,
  MessageSquare,
  User,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse, getChatResponseStream, generateSpeech } from './services/gemini';

// --- Types ---
interface Unit {
  id: number;
  subdomain: string;
  name: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  pdf_url: string;
  training_text: string;
  is_deployed: number;
  created_at: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

// --- Components ---

const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [search, setSearch] = useState('');

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUnits();
    // Cleanup object URLs on unmount
    return () => {
      Object.values(previews).forEach((url: any) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      setUnits(data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      alert("Vui lòng đợi quá trình tải tệp hoàn tất");
      return;
    }

    setIsSaving(true);
    const method = editingUnit?.id ? 'PUT' : 'POST';
    const url = editingUnit?.id ? `/api/units/${editingUnit.id}` : '/api/units';
    
    try {
      const payload = JSON.stringify(editingUnit);
      console.log(`Sending payload size: ${(payload.length / 1024 / 1024).toFixed(2)} MB`);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (res.ok) {
          setIsModalOpen(false);
          setEditingUnit(null);
          setPreviews({});
          fetchUnits();
        } else {
          alert(data.error || "Có lỗi xảy ra khi lưu dữ liệu");
        }
      } else {
        if (res.status === 413) {
          alert("Tệp quá lớn! Máy chủ hoặc hệ thống mạng đã từ chối yêu cầu này. Vui lòng sử dụng tệp nhỏ hơn (dưới 20MB để đảm bảo ổn định).");
        } else {
          alert(`Lỗi hệ thống (${res.status}). Vui lòng thử lại với tệp dung lượng thấp hơn.`);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Không thể kết nối tới máy chủ. Có thể do tệp quá lớn làm gián đoạn kết nối.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'video_url' | 'pdf_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 30MB for better stability
    if (file.size > 30 * 1024 * 1024) {
      alert("Tệp quá lớn. Để đảm bảo lưu trữ thành công, vui lòng chọn tệp dưới 30MB.");
      return;
    }

    setIsUploading(field);

    // Create preview URL for immediate display (local blob URL)
    const objectUrl = URL.createObjectURL(file);
    setPreviews(prev => {
      if (prev[field]) URL.revokeObjectURL(prev[field]);
      return { ...prev, [field]: objectUrl };
    });

    // Read file as base64 and upload to Vercel Blob
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(",")[1]; // Remove "data:...;base64," prefix
        const contentType = file.type;

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: `${field}_${Date.now()}_${file.name}`,
            contentType,
            field,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Lỗi khi tải tệp lên");
          setIsUploading(null);
          return;
        }

        const { url } = await res.json();
        setEditingUnit(prev => ({ ...prev, [field]: url }));
        console.log(`Uploaded ${field}:`, url);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Lỗi khi tải tệp lên. Vui lòng thử lại.");
      } finally {
        setIsUploading(null);
      }
    };
    reader.onerror = () => {
      alert("Lỗi khi đọc tệp");
      setIsUploading(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) {
      await fetch(`/api/units/${id}`, { method: 'DELETE' });
      fetchUnits();
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <h1 className="text-xl font-bold text-slate-800">AI Video Assistant - Admin</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition-colors">
              <ChevronLeft size={18} /> Về trang chính
            </button>
            <button className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors">
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm mb-1">Tổng đơn vị</p>
            <h2 className="text-4xl font-bold text-slate-800">{units.length}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm mb-1">Đã triển khai</p>
            <h2 className="text-4xl font-bold text-slate-800">{units.filter(u => u.is_deployed).length}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-bottom border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Danh sách đơn vị</h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setEditingUnit({}); setIsModalOpen(true); }}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Plus size={18} /> Thêm đơn vị mới
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold">Subdomain</th>
                  <th className="px-6 py-4 font-semibold">Tên đơn vị</th>
                  <th className="px-6 py-4 font-semibold">Tiêu đề</th>
                  <th className="px-6 py-4 font-semibold text-center">Ảnh</th>
                  <th className="px-6 py-4 font-semibold text-center">Video</th>
                  <th className="px-6 py-4 font-semibold text-center">PDF</th>
                  <th className="px-6 py-4 font-semibold">Ngày triển khai</th>
                  <th className="px-6 py-4 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnits.map(unit => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-blue-600 font-medium">{unit.subdomain}</td>
                    <td className="px-6 py-4 text-slate-700">{unit.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{unit.title}</td>
                    <td className="px-6 py-4 text-center">
                      {(unit.image_url && unit.image_url.length > 0) ? <CheckCircle2 className="inline text-green-500" size={18} /> : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(unit.video_url && unit.video_url.length > 0) ? <CheckCircle2 className="inline text-green-500" size={18} /> : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(unit.pdf_url && unit.pdf_url.length > 0) ? <CheckCircle2 className="inline text-green-500" size={18} /> : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {unit.is_deployed ? <span className="text-green-600">Đã triển khai</span> : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingUnit(unit); setIsModalOpen(true); }}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(unit.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Chỉnh sửa */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{editingUnit?.id ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <Square size={20} className="rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Subdomain</label>
                    <input 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={editingUnit?.subdomain || ''}
                      onChange={e => setEditingUnit({...editingUnit, subdomain: e.target.value})}
                      placeholder="ví dụ: motcua"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tên đơn vị</label>
                    <input 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={editingUnit?.name || ''}
                      onChange={e => setEditingUnit({...editingUnit, name: e.target.value})}
                      placeholder="UBND Xã..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tiêu đề hiển thị</label>
                  <input 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={editingUnit?.title || ''}
                    onChange={e => setEditingUnit({...editingUnit, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={!!editingUnit?.is_deployed}
                        onChange={e => setEditingUnit({...editingUnit, is_deployed: e.target.checked ? 1 : 0})}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-slate-600">Đã triển khai</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Mô tả đơn vị</label>
                  <input 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={editingUnit?.description || ''}
                    onChange={e => setEditingUnit({...editingUnit, description: e.target.value})}
                    placeholder="Mô tả ngắn gọn về đơn vị..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ảnh đại diện</label>
                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative ${isUploading === 'image_url' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-400'}`}>
                      <input 
                        type="file" 
                        accept="image/*"
                        disabled={!!isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => handleFileUpload(e, 'image_url')}
                      />
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        {isUploading === 'image_url' ? <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <ImageIcon size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{isUploading === 'image_url' ? 'Đang xử lý ảnh...' : 'Click để chọn ảnh (JPG, PNG)'}</p>
                        <p className="text-xs text-slate-400">{editingUnit?.image_url ? 'Đã có ảnh đại diện' : 'Chưa có ảnh'}</p>
                      </div>
                      {editingUnit?.image_url && !isUploading && <CheckCircle2 className="text-green-500" size={20} />}
                    </div>
                    { (previews.image_url || editingUnit?.image_url) && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={previews.image_url || editingUnit?.image_url} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingUnit(prev => ({ ...prev, image_url: '' }));
                            if (previews.image_url) URL.revokeObjectURL(previews.image_url);
                            setPreviews(prev => ({ ...prev, image_url: '' }));
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-bl-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Video nói (AI)</label>
                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative ${isUploading === 'video_url' ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-blue-400'}`}>
                      <input 
                        type="file" 
                        accept="video/*"
                        disabled={!!isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => handleFileUpload(e, 'video_url')}
                      />
                      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                        {isUploading === 'video_url' ? <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Video size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{isUploading === 'video_url' ? 'Đang xử lý video...' : 'Click để chọn video (MP4, WebM)'}</p>
                        <p className="text-xs text-slate-400">{(previews.video_url || editingUnit?.video_url) ? 'Đã có video AI' : 'Chưa có video'}</p>
                      </div>
                      {(previews.video_url || editingUnit?.video_url) && !isUploading && <CheckCircle2 className="text-green-500" size={20} />}
                    </div>
                    {(previews.video_url || editingUnit?.video_url) && (
                      <div className="space-y-2">
                        <div className="relative aspect-video w-48 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-black">
                          <video src={previews.video_url || editingUnit?.video_url} className="w-full h-full object-contain" controls />
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingUnit(prev => ({ ...prev, video_url: '' }));
                              if (previews.video_url) URL.revokeObjectURL(previews.video_url);
                              setPreviews(prev => ({ ...prev, video_url: '' }));
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-bl-lg hover:bg-red-600 transition-colors z-10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <Video size={14} className="text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-medium">Video đã sẵn sàng</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">File PDF tài liệu</label>
                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative ${isUploading === 'pdf_url' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-400'}`}>
                      <input 
                        type="file" 
                        accept=".pdf"
                        disabled={!!isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => handleFileUpload(e, 'pdf_url')}
                      />
                      <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        {isUploading === 'pdf_url' ? <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <FileText size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{isUploading === 'pdf_url' ? 'Đang xử lý tài liệu...' : 'Click để chọn file PDF'}</p>
                        <p className="text-xs text-slate-400">{(previews.pdf_url || editingUnit?.pdf_url) ? 'Đã có tài liệu PDF' : 'Chưa có file'}</p>
                      </div>
                      {(previews.pdf_url || editingUnit?.pdf_url) && !isUploading && <CheckCircle2 className="text-green-500" size={20} />}
                    </div>
                    {(previews.pdf_url || editingUnit?.pdf_url) && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-emerald-600 shadow-sm">
                          <FileText size={18} />
                        </div>
                        <span className="text-xs text-emerald-800 font-medium flex-1">Tài liệu PDF đã tải lên</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingUnit(prev => ({ ...prev, pdf_url: '' }));
                            if (previews.pdf_url) URL.revokeObjectURL(previews.pdf_url);
                            setPreviews(prev => ({ ...prev, pdf_url: '' }));
                          }}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nội dung huấn luyện AI</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[120px]"
                    value={editingUnit?.training_text || ''}
                    onChange={e => setEditingUnit({...editingUnit, training_text: e.target.value})}
                    placeholder="Nhập các quy tắc, thông tin đặc thù của đơn vị..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving || !!isUploading}
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang lưu...
                      </>
                    ) : 'Lưu đơn vị'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatInterface = ({ unit, isSpeaking, setIsSpeaking, onAdminClick }: { unit: Unit, isSpeaking: boolean, setIsSpeaking: (s: boolean) => void, onAdminClick: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isAiSpeakingRef = useRef(false);
  const currentRequestIdRef = useRef<number>(0);

  useEffect(() => {
    isAiSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    const resumeAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(console.error);
      }
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, []);

  const cleanTextForDisplay = (text: string) => {
    return text
      .replace(/[#*`_~]/g, '') // Remove markdown symbols
      .replace(/[^\p{L}\p{N}\s.,?!:;()\-/"'\n]/gu, '') // Keep letters, numbers, spaces, punctuation, and newlines
      .trim();
  };

  const stripMarkdown = (text: string) => {
    return cleanTextForDisplay(text)
      .replace(/\n+/g, ' ') // Replace newlines with spaces for smoother speaking
      .trim();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Keyboard shortcut for Micro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    // Stop AI speaking if it is
    stopSpeaking();

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'vi-VN';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      startVolumeMeter();
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Automatically send after a short delay to feel natural
      setTimeout(() => handleSend(transcript), 500);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      stopListening();
    };

    recognitionRef.current.onend = () => {
      stopListening();
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    stopVolumeMeter();
  };

  const startVolumeMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(average);
        if (isListening) {
          requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopVolumeMeter = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setVolume(0);
  };

  const processSpeechQueue = async (requestId: number) => {
    if (isProcessingQueueRef.current || speechQueueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    
    while (speechQueueRef.current.length > 0) {
      if (requestId !== currentRequestIdRef.current) break;
      
      const text = speechQueueRef.current.shift();
      if (text) {
        try {
          await speakText(text, requestId);
        } catch (e) {
          console.error("Speech queue error:", e);
        }
      }
    }
    
    isProcessingQueueRef.current = false;
  };

  const speakText = async (text: string, requestId: number) => {
    const cleanText = stripMarkdown(text);
    if (!cleanText || requestId !== currentRequestIdRef.current) return;

    console.log("Speaking text:", cleanText.substring(0, 50) + "...");
    
    // Stop any current speaking (but don't clear queue if it's the same request)
    // Actually, we want to play them in sequence, so we don't call stopSpeaking here
    // stopSpeaking() is called at the start of handleSend

    // Text dài (>250 ký tự) → dùng system TTS để tránh timeout
    if (cleanText.length > 250) {
      console.log("Text dài, dùng system TTS");
      await fallbackToSystemTTS(cleanText);
      return;
    }

    // Text ngắn → dùng Gemini TTS (chất lượng cao)
    try {
      const base64Audio = await generateSpeech(cleanText);

      if (!base64Audio) {
        console.warn("Gemini TTS returned no audio, falling back to system TTS");
        await fallbackToSystemTTS(cleanText);
        return;
      }

      if (requestId !== currentRequestIdRef.current) return;

      console.log("Audio data received, length:", base64Audio.length);
      await playPcmAudio(base64Audio);
    } catch (error) {
      console.error("Gemini TTS failed, falling back to system TTS:", error);
      try {
        await fallbackToSystemTTS(cleanText);
      } catch (e) {
        console.error("System TTS also failed:", e);
      }
    }
  };

  const playPcmAudio = (base64Data: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        if (currentSourceRef.current) {
          try {
            currentSourceRef.current.stop();
          } catch (e) {
            // Ignore
          }
        }

        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create a WAV header for 24kHz Mono 16-bit PCM
        const dataSize = bytes.length;
        const header = new ArrayBuffer(44);
        const view = new DataView(header);
        
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, 24000, true); // Sample Rate
        view.setUint32(28, 24000 * 2, true); // Byte Rate
        view.setUint16(32, 2, true); // Block Align
        view.setUint16(34, 16, true); // Bits per Sample
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        const wavBytes = new Uint8Array(44 + dataSize);
        wavBytes.set(new Uint8Array(header));
        wavBytes.set(bytes, 44);

        let audioBuffer: AudioBuffer;
        try {
          audioBuffer = await ctx.decodeAudioData(wavBytes.buffer);
        } catch (e) {
          console.warn("WAV decoding failed, falling back to raw PCM", e);
          const pcmData = new Int16Array(bytes.buffer.slice(0, bytes.length - (bytes.length % 2)));
          const floatData = new Float32Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 32768.0;
          }
          audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
          audioBuffer.getChannelData(0).set(floatData);
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        if (analyserRef.current) source.connect(analyserRef.current);
        
        source.onended = () => {
          if (currentSourceRef.current === source) {
            setIsSpeaking(false);
            currentSourceRef.current = null;
            resolve();
          }
        };
        
        currentSourceRef.current = source;
        setIsSpeaking(true);
        source.start(0);
      } catch (error) {
        console.error("Error playing PCM audio:", error);
        setIsSpeaking(false);
        reject(error);
      }
    });
  };

  const fallbackToSystemTTS = (text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        console.error("System TTS not supported");
        resolve();
        return;
      }

      console.log("Using system TTS fallback");

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Tìm giọng nữ Việt Nam
      const selectVoice = (allVoices: SpeechSynthesisVoice[]) => {
        const viFemale = allVoices.find(v =>
          (v.lang === 'vi-VN' || v.lang.startsWith('vi')) &&
          (v.name.toLowerCase().includes('female') ||
           v.name.toLowerCase().includes('woman') ||
           v.name.toLowerCase().includes('viet') ||
           v.name.toLowerCase().includes('nữ'))
        );
        if (viFemale) return viFemale;

        const viAny = allVoices.find(v =>
          v.lang === 'vi-VN' || v.lang.startsWith('vi')
        );
        if (viAny) return viAny;

        // Fallback: giọng nào có sẵn
        return allVoices[0] || null;
      };

      const allVoices = window.speechSynthesis!.getVoices();

      if (allVoices.length === 0) {
        // Chưa load xong → đợi event
        const onVoicesChanged = () => {
          window.speechSynthesis!.removeEventListener('voiceschanged', onVoicesChanged);
          const voices = window.speechSynthesis!.getVoices();
          const voice = selectVoice(voices);
          if (voice) {
            utterance.voice = voice;
            console.log("System TTS voice:", voice.name, voice.lang);
          } else {
            console.warn("Không tìm thấy giọng phù hợp, dùng default");
          }
          window.speechSynthesis!.speak(utterance);
        };
        window.speechSynthesis!.addEventListener('voiceschanged', onVoicesChanged);
      } else {
        const voice = selectVoice(allVoices);
        if (voice) {
          utterance.voice = voice;
          console.log("System TTS voice:", voice.name, voice.lang);
        }
        window.speechSynthesis!.speak(utterance);
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
    });
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Ignore
      }
      currentSourceRef.current = null;
    }
    setIsSpeaking(false);
    // Clear queue on stop
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;
  };

  const handleSend = async (overrideInput?: string) => {
    // Ensure textToSend is a string. If overrideInput is a MouseEvent (from onClick={handleSend}), use input.
    const rawText = (typeof overrideInput === 'string' ? overrideInput : input) || '';
    if (!rawText.trim()) return;
    
    const textToSend = cleanTextForDisplay(rawText);
    if (!textToSend) return;

    // Increment request ID to cancel any previous streams/speech
    const requestId = ++currentRequestIdRef.current;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAiThinking(true);
    
    // Stop any current speaking and clear queue
    stopSpeaking();

    // Add an empty AI message that we will fill with stream chunks
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);
    
    let fullAiResponse = '';

    try {
      const stream = getChatResponseStream(textToSend, unit.training_text, unit.pdf_url, unit.name);
      
      setIsAiThinking(false); // Hide thinking indicator once stream starts

      for await (const chunk of stream) {
        // Check if this request is still valid
        if (requestId !== currentRequestIdRef.current) break;

        fullAiResponse += chunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'ai') {
            lastMsg.text = cleanTextForDisplay(fullAiResponse);
          }
          return newMessages;
        });
      }

      // Speak the FULL response at once for seamless audio and consistent voice
      if (requestId === currentRequestIdRef.current && fullAiResponse.trim()) {
        const textToSpeak = stripMarkdown(fullAiResponse);
        if (textToSpeak) {
          speechQueueRef.current.push(textToSpeak);
          processSpeechQueue(requestId);
        }
      }
    } catch (error) {
      if (requestId === currentRequestIdRef.current) {
        console.error("Streaming error:", error);
        fullAiResponse = "Xin lỗi, tôi gặp sự cố khi kết nối. Vui lòng thử lại sau.";
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'ai') {
            lastMsg.text = fullAiResponse;
          }
          return newMessages;
        });
      }
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setIsAiThinking(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-600" />
          <span className="font-bold text-slate-700">Hỏi đáp</span>
        </div>
        <button 
          onClick={onAdminClick}
          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
        >
          <Settings size={14} /> Quản trị
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <MessageSquare size={64} strokeWidth={1} className="opacity-20" />
            <div className="text-center">
              <p className="font-bold text-slate-500">Bắt đầu cuộc trò chuyện</p>
              <p className="text-sm">Nhấn nút micro bên dưới và đặt câu hỏi của bạn</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 py-2"
          >
            <div className="flex items-end gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isListening ? Math.max(4, (volume / 100) * 32 * Math.random() + 4) : 4 
                  }}
                  className="w-1.5 bg-blue-500 rounded-full"
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">Đang lắng nghe...</span>
          </motion.div>
        )}

        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu hỏi hoặc nhấn micro để nói..."
            className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all"
          />
          <button 
            onClick={() => handleSend()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={stopSpeaking}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
              isSpeaking 
                ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!isSpeaking}
          >
            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            {isSpeaking ? 'Dừng nói' : 'Im lặng'}
          </button>
          <button 
            onClick={toggleListening}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
              isListening 
                ? 'bg-red-500 text-white shadow-red-500/20 animate-pulse' 
                : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
            }`}
          >
            <Mic size={20} /> {isListening ? 'Đang nghe...' : 'Nói'}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest">Nhấn <span className="bg-slate-200 px-1 rounded">Space</span> để bật/tắt micro</p>
      </div>
    </div>
  );
};

const UserWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
          <Video size={48} className="mb-2 opacity-20" />
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
          <div className="absolute top-4 left-4">
            <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Bạn
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchUnits = () => {
    setIsLoading(true);
    fetch('/api/units')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Prefer deployed units, otherwise take the first one
          const deployedUnit = data.find((u: Unit) => u.is_deployed === 1);
          setCurrentUnit(deployedUnit || data[0]);
        } else {
          setCurrentUnit(null);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  if (isAdmin) {
    return <AdminDashboard onBack={() => { setIsAdmin(false); fetchUnits(); }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">S</div>
          <p className="text-slate-400 font-medium">Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!currentUnit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md">
          <Settings size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa có dữ liệu đơn vị</h2>
          <p className="text-slate-500 mb-6">Hệ thống hiện chưa có đơn vị nào được khởi tạo. Vui lòng đăng nhập vào quản trị để thêm đơn vị mới.</p>
          <button 
            onClick={() => setIsAdmin(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            Đăng nhập Quản trị
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden font-sans">
      <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 overflow-hidden">
        {/* Left Side: Visuals */}
        <div className="flex flex-col gap-4 md:gap-6 h-full overflow-hidden">
          {/* AI Character View */}
          <div className="flex-1 min-h-0 flex flex-col relative aspect-video bg-slate-200 rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
            <AnimatePresence mode="wait">
              {isSpeaking ? (
                <motion.video 
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={currentUnit.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-woman-smiling-at-the-camera-3132-large.mp4'} 
                  autoPlay 
                  loop 
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <motion.img 
                  key="image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={currentUnit.image_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </AnimatePresence>
            
            <div className="absolute top-4 left-4">
              <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider border border-white/10">
                <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                Trợ lý AI
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
               <div className="p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-0.5">Trạng thái</p>
                  <p className="text-xs text-slate-600 font-medium">{isSpeaking ? 'Đang giải đáp thắc mắc...' : 'Sẵn sàng hỗ trợ bạn'}</p>
               </div>
            </div>
          </div>

          {/* User Webcam View */}
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
            <div className="w-full h-full max-h-full">
               <UserWebcam />
            </div>
          </div>
        </div>

        {/* Right Side: Chat Container */}
        <div className="h-full flex flex-col min-h-0">
          <ChatInterface unit={currentUnit} isSpeaking={isSpeaking} setIsSpeaking={setIsSpeaking} onAdminClick={() => setIsAdmin(true)} />
        </div>
      </main>
    </div>
  );
}
