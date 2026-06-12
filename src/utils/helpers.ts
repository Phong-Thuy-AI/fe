export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${timeStr} ${dateStr}`
}

export function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone
  return phone.slice(0, -6).replace(/./g, '*') + phone.slice(-6)
}

export function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: 'Cát Lành', color: 'text-gold-400' }
  if (score >= 60) return { text: 'Tốt', color: 'text-green-400' }
  if (score >= 40) return { text: 'Trung Bình', color: 'text-yellow-400' }
  return { text: 'Cần Cải Thiện', color: 'text-red-400' }
}

export function getVậnTreeIcon(classification: string): string {
  if (!classification) return '🌳'
  const c = classification.toUpperCase()
  if (c.includes('ĐẠI CÁT')) return '🌳🍎'
  if (c.includes('ĐẠI HUNG')) return '🥀'
  if (c.includes('BÁN CÁT') || c.includes('BÁN HUNG')) return '🌿🍂'
  if (c.includes('CÁT')) return '🌳'
  if (c.includes('HUNG')) return '🍂'
  return '🌳'
}

export function getVậnCardClass(classification: string): string {
  if (!classification) return '!border-slate-800/60 bg-slate-900/30'
  const c = classification.toUpperCase()
  if (c.includes('ĐẠI CÁT') || c === 'CÁT') {
    return '!border-l-4 !border-l-green-500 !border-green-500/25 bg-green-950/10 hover:!border-green-500/40 hover:shadow-lg hover:shadow-green-950/20'
  }
  if (c.includes('BÁN CÁT') || c.includes('BÁN HUNG')) {
    return '!border-l-4 !border-l-yellow-500 !border-yellow-500/25 bg-yellow-950/10 hover:!border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-950/20'
  }
  return '!border-l-4 !border-l-red-500 !border-red-500/25 bg-red-950/10 hover:!border-red-500/40 hover:shadow-lg hover:shadow-red-950/20'
}

export function getVậnGlowClass(classification: string): string {
  if (!classification) return 'bg-gold-500/5 shadow-none'
  const c = classification.toUpperCase()
  if (c.includes('ĐẠI CÁT') || c === 'CÁT') {
    return 'bg-green-500/10 shadow-[0_0_50px_rgba(16,185,129,0.15)]'
  }
  if (c.includes('BÁN CÁT') || c.includes('BÁN HUNG')) {
    return 'bg-yellow-500/10 shadow-[0_0_50px_rgba(245,158,11,0.15)]'
  }
  return 'bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.15)]'
}

export function getClassificationClass(classification: string): string {
  if (!classification) return 'bg-slate-800 border-slate-700 text-slate-400'
  const c = classification.toUpperCase()
  if (c.includes('ĐẠI CÁT')) {
    return 'bg-green-500 text-slate-950 border-green-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
  }
  if (c === 'CÁT') {
    return 'bg-green-600 text-white border-green-500 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
  }
  if (c.includes('BÁN CÁT') || c.includes('BÁN HUNG')) {
    return 'bg-yellow-500 text-slate-950 border-yellow-400 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
  }
  if (c.includes('ĐẠI HUNG')) {
    return 'bg-red-600 text-white border-red-500 font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.4)]'
  }
  return 'bg-red-500 text-white border-red-400 font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.2)]'
}


