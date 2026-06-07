export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
